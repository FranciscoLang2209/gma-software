// Recorrido SINTÉTICO: PostgreSQL temporal real + Auth/HTTP simulado. Nunca conecta destinos remotos.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createServerClient } from "@supabase/ssr";
import { verifyCommissions } from "./test-commissions-http.mjs";
import { verifyImportWorkflow } from "./test-import-workflow.mjs";

const root = mkdtempSync(join(tmpdir(), "app-papa-dashboard-"));
const bin = execFileSync("pg_config", ["--bindir"], { encoding: "utf8" }).trim();
const env = { ...process.env, PGHOST: root, PGPORT: "55438", PGDATABASE: "app_papa_dashboard_synthetic", PGUSER: process.env.USER };
for (const key of ["PGSERVICE", "PGOPTIONS", "PGHOSTADDR", "PGPASSWORD"]) delete env[key];
const pg = (command, args, input) => execFileSync(join(bin, command), args, { env, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
const sql = (input, variables = []) => pg("psql", ["-X", "-A", "-t", "-q", "-v", "ON_ERROR_STOP=1", ...variables], input);
let app, backend, gate, cookieValues, adminCookies, appOrigin, failure = false;
const files = new Map();
let failNextStorageWrite = false, failNextHistoryRegistration = false;
const asRole = (actor, statement) => `begin; set local request.jwt.claim.sub='${actor}'; set local request.jwt.claims='{"session_id":"${actor}"}'; set local role authenticated; ${statement}; commit;`;
const stopped = new Promise((resolve) => { process.once("SIGINT", resolve); process.once("SIGTERM", resolve); });
const sub = "00000000-0000-0000-0000-000000000002";
const encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600, session_id: sub })}.c3ludGhldGlj`;
const user = { id: sub, aud: "authenticated", role: "authenticated", email: "reader@synthetic.invalid", created_at: new Date().toISOString() };
const adminSub = "00000000-0000-0000-0000-000000000001";
const adminToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: adminSub, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600, session_id: adminSub })}.c3ludGhldGlj`;
const signatures = {
  aggregate_report: "month_from date,month_to date,custodian uuid,team uuid,advisor uuid,client uuid,account uuid,service_filter text,group_by text,page_size integer,page_offset integer,expected_revision text",
  account_directory: "month_from date,month_to date,custodian uuid,team uuid,advisor uuid,client uuid,account uuid,service_filter text,search_text text,sort_by text,page_size integer,page_offset integer,expected_revision text",
  account_detail: "target_id uuid,month_from date,month_to date,team uuid,advisor uuid,page_size integer,page_offset integer,expected_revision text,custodian uuid,client uuid,service_filter text",
  manage_model: "operation text,entity text,target_id uuid,input jsonb,reason text,review_id uuid,page_offset integer",
  begin_import: "request_id uuid,source_type text,target_period date,custodian uuid,file_name text,file_hash text,file_size integer,conventions jsonb",
  prepare_import_chunk: "target_id uuid,expected_cursor integer,configuration jsonb,chunk jsonb,summary jsonb",
  manage_import: "target_id uuid,operation text,input jsonb",
  manage_historical: "target_id uuid,operation text,input jsonb",
  source_file: "target_id uuid",
  commission_report: "filters jsonb",
  commission_dashboard: "filters jsonb",
  manage_commission: "request_id uuid,operation text,target_id uuid,input jsonb",
};
const query = (rpc, actor) => `begin; set local request.jwt.claim.sub='${actor}'; set local request.jwt.claims='{"session_id":"${actor}"}'; set local role authenticated;
select ${rpc === "source_file" ? "(select coalesce(jsonb_agg(f),'[]') from public.source_file(p.target_id) f)" : `to_jsonb(public.${rpc}(${signatures[rpc].split(",").map((f) => `p.${f.split(" ")[0]}`).join(",")}))`}
from jsonb_to_record(:'payload'::jsonb) as p(${signatures[rpc]}); commit;`;
let appOutput = "";
async function cleanup() {
  if (app && app.exitCode === null && app.signalCode === null) {
    const exited = once(app, "exit"); app.kill("SIGTERM"); await exited;
  }
  app = null;
  for (const server of [backend, gate]) if (server?.listening) { server.closeAllConnections(); await new Promise((r) => server.close(r)); }
  try { pg("pg_ctl", ["-D", join(root, "data"), "-m", "immediate", "stop"]); } catch {}
  rmSync(root, { recursive: true, force: true });
}
try {
  pg("initdb", ["-D", join(root, "data"), "--auth-local=trust", "--auth-host=reject", "--no-locale", "-E", "UTF8"]);
  pg("pg_ctl", ["-D", join(root, "data"), "-l", join(root, "postgres.log"), "-o", `-k ${root} -c listen_addresses='' -c port=55438`, "-w", "start"]);
  pg("createdb", [env.PGDATABASE]);
  pg("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", "tests/database/bootstrap.sql"]);
  for (const migration of readdirSync("supabase/migrations").filter((p) => p.endsWith(".sql")).sort())
    pg("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", `supabase/migrations/${migration}`]);
  pg("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", "tests/database/query-fixture.sql", "-c", "commit"]);
  backend = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (["/fixture-login", "/fixture-login-admin"].includes(req.url)) {
      res.writeHead(302, { "Set-Cookie": (req.url.endsWith("-admin") ? adminCookies : cookieValues).map(({ name, value }) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`), Location: `${appOrigin}/?desde=2026-01&hasta=2026-02` });
      return res.end();
    }
    if (req.url === "/auth/v1/token?grant_type=password") {
      const chunks = []; for await (const c of req) chunks.push(c);
      const input = JSON.parse(Buffer.concat(chunks));
      assert.equal(input.email, "admin@synthetic.invalid"); assert.equal(input.password, "SYNTHETIC_PASSWORD_123");
      return res.end(JSON.stringify({ access_token: adminToken, refresh_token: "SYNTHETIC", expires_in: 3600, token_type: "bearer", user: { ...user, id: adminSub, email: "admin@synthetic.invalid" } }));
    }
    const isAdmin = req.headers.authorization === `Bearer ${adminToken}`;
    if (!isAdmin && req.headers.authorization !== `Bearer ${token}`) { res.writeHead(401); return res.end('{}'); }
    const actor = isAdmin ? adminSub : sub;
    if (req.url === "/auth/v1/user") return res.end(JSON.stringify({ ...user, id: actor }));
    if (req.url === "/rest/v1/rpc/current_access") return res.end(sql(asRole(actor, "select to_json(public.current_access())")).trim());
    const url = new URL(req.url, "http://synthetic.invalid");
    if (["/rest/v1/admin_custodians", "/rest/v1/admin_import_batches", "/rest/v1/admin_import_rows", "/rest/v1/admin_import_uploads"].includes(url.pathname)) {
      const view = url.pathname.split("/").at(-1);
      const id = url.searchParams.get("id")?.replace(/^eq\./, "") ?? "";
      const batch = url.searchParams.get("batch_id")?.replace(/^eq\./, "") ?? "";
      try {
        const result = JSON.parse(sql(asRole(actor, `select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.${view} t where (:'id'='' or t.id::text=:'id')${view === "admin_import_rows" ? " and (:'batch'='' or t.batch_id::text=:'batch')" : ""}`), ["-v", `id=${id}`, "-v", `batch=${batch}`]).trim());
        return res.end(JSON.stringify(req.headers.accept?.includes("vnd.pgrst.object") ? result[0] : result));
      } catch { res.writeHead(403); return res.end('{"code":"42501"}'); }
    }
    if (url.pathname.startsWith("/storage/v1/object/")) {
      const path = decodeURIComponent(url.pathname.split("app-papa-imports/")[1]);
      try {
        if (req.method === "POST") {
          const chunks = []; for await (const c of req) chunks.push(c);
          if (failNextStorageWrite) { failNextStorageWrite = false; res.writeHead(503); return res.end('{"error":"SYNTHETIC STORAGE INTERRUPTION"}'); }
          if (files.has(path)) { res.writeHead(409); return res.end('{"error":"Duplicate"}'); }
          sql(asRole(actor, "insert into storage.objects(bucket_id,name) values('app-papa-imports',:'path')"), ["-v", `path=${path}`]);
          files.set(path, Buffer.concat(chunks)); return res.end(JSON.stringify({ Key: path }));
        }
        const allowed = sql(asRole(actor, "select count(*) from storage.objects where bucket_id='app-papa-imports' and name=:'path'"), ["-v", `path=${path}`]).trim();
        if (allowed !== "1" || !files.has(path)) throw new Error("not available");
        res.setHeader("Content-Type", "application/octet-stream"); return res.end(files.get(path));
      } catch { res.writeHead(403); return res.end('{"code":"42501"}'); }
    }
    const rpc = req.url.split("/").at(-1);
    if (Object.hasOwn(signatures, rpc)) {
      const chunks = []; for await (const c of req) chunks.push(c);
      if (failure) { res.writeHead(503); return res.end('{"message":"SYNTHETIC PRIVATE FAILURE"}'); }
      try {
        const defaults = rpc === "manage_model" ? { entity: null, target_id: null, input: {}, reason: null, review_id: null, page_offset: 0 } : {};
        const payload = { ...defaults, ...JSON.parse(Buffer.concat(chunks)) };
        if (rpc === "manage_historical" && payload.operation === "begin" && failNextHistoryRegistration) {
          failNextHistoryRegistration = false; res.writeHead(500);
          return res.end(JSON.stringify({ code: "57014", message: "SYNTHETIC PRIVATE SQL TIMEOUT" }));
        }
        const result = sql(query(rpc, actor), ["-v", `payload=${JSON.stringify(payload)}`]).trim();
        return res.end(result);
      }
      catch (error) { res.writeHead(400); return res.end(JSON.stringify({ code: /changed;|changed; restart|Model changed/i.test(error.stderr ?? "") ? "40001" : /permission denied|administrator required/i.test(error.stderr ?? "") ? "42501" : "22023", message: "SYNTHETIC QUERY REJECTED" })); }
    }
    res.writeHead(404); res.end('{}');
  });
  backend.listen(0, "127.0.0.1"); await once(backend, "listening");
  const backendUrl = `http://127.0.0.1:${backend.address().port}`;
  const key = "sb_publishable_SYNTHETIC";
  const client = createServerClient(backendUrl, key, { cookies: { getAll: () => [], setAll: (values) => { cookieValues = values; } } });
  const { error } = await client.auth.setSession({ access_token: token, refresh_token: "SYNTHETIC" }); assert.equal(error, null);
  const adminClient = createServerClient(backendUrl, key, { cookies: { getAll: () => [], setAll: (values) => { adminCookies = values; } } });
  assert.equal((await adminClient.auth.setSession({ access_token: adminToken, refresh_token: "SYNTHETIC" })).error, null);
  const probe = createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
  const port = probe.address().port; await new Promise((r) => probe.close(r)); appOrigin = `http://127.0.0.1:${port}`;
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    env: { ...process.env, SUPABASE_URL: backendUrl, SUPABASE_PUBLISHABLE_KEY: key }, stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout.on("data", (v) => { appOutput += v; }); app.stderr.on("data", (v) => { appOutput += v; });
  const request = (path, admin = false, init = {}) => fetch(appOrigin + path, { ...init, headers: { Cookie: (admin ? adminCookies : cookieValues).map(({ name, value }) => `${name}=${value}`).join("; "), ...init.headers }, redirect: "manual" });
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) { try { await fetch(appOrigin + "/ingresar"); ready = true; break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  assert.ok(ready, appOutput);
  const login = await (await fetch(`${appOrigin}/ingresar`)).text();
  const actions = [...login.matchAll(/name="\$ACTION_ID_([^"]+)"/g)].map((m) => m[1]);
  assert.equal(actions.length, 1);
  const loginForm = new FormData(); loginForm.set(`$ACTION_ID_${actions[0]}`, "");
  loginForm.set("email", "admin@synthetic.invalid"); loginForm.set("password", "SYNTHETIC_PASSWORD_123");
  const loginResponse = await fetch(`${appOrigin}/ingresar`, { method: "POST", headers: { Origin: appOrigin }, body: loginForm, redirect: "manual" });
  assert.equal(loginResponse.status, 303); assert.equal(loginResponse.headers.get("location"), "/");
  adminCookies = loginResponse.headers.getSetCookie().map((cookie) => {
    const pair = cookie.split(";")[0], separator = pair.indexOf("=");
    return { name: pair.slice(0, separator), value: pair.slice(separator + 1) };
  });
  assert.ok(adminCookies.length > 0, "login emite cookies SSR usadas en todo el circuito admin");
  const base = "desde=2026-01&hasta=2026-02";
  const account = "20000000-0000-0000-0000-000000000001";
  const report = await (await request(`/api/consultas?${base}&cuenta=${account}`)).json();
  assert.equal(report.total.aum_usd, "120"); assert.equal(report.total.revenue_usd, "22");
  assert.equal(report.months[1].aum_change_percent, "20.0000000000000000");
  for (const path of [`/?${base}&cuenta=${account}`, `/analisis-comercial?${base}&agrupar=team`, `/analisis-comercial?${base}&agrupar=client`, `/analisis-comercial?${base}&agrupar=advisor`]) {
    const response = await request(path); assert.equal(response.status, 200);
    const html = await response.text(); assert.ok(html.includes("USD 120"), path);
    assert.ok(html.includes(path.startsWith("/?") ? "USD 22" : "USD 38"), path);
    assert.ok(html.includes("Cobertura y actualización") && !html.includes("SYNTHETIC PRIVATE FAILURE"));
  }
  const page = await (await request(`/api/consultas?${base}&agrupar=team&limite=1`)).json();
  assert.equal(page.total.aum_usd, "119"); assert.equal(page.total.revenue_usd, "38");
  assert.equal(page.rows[0].aum_usd, "120"); assert.equal(page.rows[0].revenue_usd, "12");
  assert.equal(page.rows[0].aum_share_percent, null);
  const missing = await (await request(`/api/consultas?desde=2026-01&hasta=2026-05`)).json();
  assert.equal(missing.months[2].aum_usd, null); assert.equal(missing.months[3].revenue_usd, null);
  assert.equal(missing.total.aum_usd, "100.123456789123456789");
  const empty = await (await request(`/?desde=2027-01&hasta=2027-02`)).text(); assert.ok(empty.includes("Sin datos publicados para estos filtros"));
  const invalid = await (await request(`/?desde=2026-13`)).text(); assert.ok(invalid.includes("Revisá los filtros"));
  const accounts = await (await request(`/cuentas?${base}&buscar=0001`)).text();
  assert.ok(accounts.includes("0001") && accounts.includes("USD 22") && accounts.includes("Cambió durante el rango"));
  const readerDetail = await (await request(`/cuentas/${account}?${base}&limite=2`)).text();
  assert.ok(readerDetail.includes("Historia mensual") && readerDetail.includes("Equipo SINTETICO 1") && readerDetail.includes("Equipo SINTETICO 2"));
  assert.ok(readerDetail.includes("Siguiente") && !readerDetail.includes("SECRETO SINTETICO") && !readerDetail.includes("SINTETICO.csv"));
  const adminDetail = await (await request(`/cuentas/${account}?${base}`, true)).text();
  assert.ok(adminDetail.includes("SECRETO SINTETICO") && adminDetail.includes("SINTETICO.csv"));
  const oldTeam = await (await request(`/cuentas/${account}?${base}&equipo=50000000-0000-0000-0000-000000000001`)).text();
  assert.ok(oldTeam.includes("USD 10") && oldTeam.includes("Contexto · fuera del filtro"));
  for (const admin of [false, true]) {
    const catalog = await (await request("/configuracion?entidad=memberships", admin)).text();
    assert.ok(catalog.includes("Equipo SINTETICO 1"));
    assert.equal(catalog.includes("Revisar efecto antes de guardar"), admin);
  }
  const postModel = (data, admin = true) => fetch(`${appOrigin}/api/modelo`, { method: "POST", headers: { Cookie: (admin ? adminCookies : cookieValues).map(({ name, value }) => `${name}=${value}`).join("; "), Origin: appOrigin, "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const create = { operation: "preview", entity: "teams", input: { name: "Equipo SINTETICO nuevo", active: true }, reason: "Alta SINTETICA de integración" };
  assert.equal((await postModel(create, false)).status, 403);
  const previewResponse = await postModel(create); assert.equal(previewResponse.status, 200);
  const preview = await previewResponse.json(); assert.equal(preview.changes.length, 0);
  assert.equal((await postModel({ operation: "save", review_id: preview.review_id })).status, 200);
  const savedCatalog = await (await request("/configuracion?entidad=teams", true)).text();
  assert.ok(savedCatalog.includes("Equipo SINTETICO nuevo") && savedCatalog.includes("Alta SINTETICA de integración"));
  await verifyCommissions({ request, appOrigin, sql });
  await verifyImportWorkflow({ request, appOrigin, sql, asRole, adminSub, sub, interruptStorage: () => { failNextStorageWrite = true; }, interruptHistory: () => { failNextHistoryRegistration = true; } });
  failure = true;
  const failed = await (await request(`/?${base}`)).text(); assert.ok(failed.includes("Consulta no disponible") && !failed.includes("SYNTHETIC PRIVATE FAILURE")); failure = false;
  assert.ok(!appOutput.includes("Error:"), appOutput);
  console.log("OK: Next → RPC → PostgreSQL → HTML/API; 120/22, global119/38, ranking, cuentas, ceros, historia, originales por rol, administración revisada, auditoría, faltantes y errores.");
  if (process.argv.includes("--serve")) {
    // Este control pertenece solo al arnés local, nunca a la aplicación ni al build.
    gate = createServer((req, res) => { failure = req.url === "/error"; res.end(failure ? "SINTÉTICO: error activado" : "SINTÉTICO: consulta restaurada"); });
    gate.listen(0, "127.0.0.1"); await once(gate, "listening");
    console.log(`Fixture SINTÉTICO de navegador: ${backendUrl}/fixture-login`);
    console.log(`Fixture administrador SINTÉTICO: ${backendUrl}/fixture-login-admin`);
    console.log(`Control de fallo SINTÉTICO: http://127.0.0.1:${gate.address().port}/error (cualquier otra ruta restaura)`);
    await stopped;
  }
} finally { await cleanup(); console.log("Clúster y servidores sintéticos eliminados."); }
