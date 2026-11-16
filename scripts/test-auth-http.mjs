// Proveedor HTTP SINTÉTICO: prueba el cableado Next/SSR, no reemplaza Supabase real.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServerClient } from "@supabase/ssr";
import { readFileSync } from "node:fs";

const users = new Map();
const revoked = new Set();
let storageReads = 0;
let passwordRequests = 0;
let managementCalls = 0, modelCalls = 0;
let reportCalls = 0, reportFailure = null, lastReportParameters;
let exportFailure = null, exportRowCount = 300;
let loginToken;
const importBatches = new Map(),
  importRows = new Map(),
  importFiles = new Map();
const syntheticCustodian = {
  id: "10000000-0000-0000-0000-000000000001",
  code: "SYN-A",
  name: "Custodio SINTETICO",
};
const body = async (req) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
};

const id = "60000000-0000-0000-0000-000000000001";
const backend = createServer(async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = users.get(token);
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/auth/v1/token?grant_type=password" || req.url === "/auth/v1/verify") {
    const payload = JSON.parse(await body(req));
    if (req.url.includes("grant_type=password")) {
      passwordRequests++;
      if (payload.email !== "synthetic@example.invalid" || payload.password !== "SYNTHETIC_PASSWORD_123") {
        res.writeHead(400);
        return res.end(JSON.stringify({ message: "Invalid credentials", code: "invalid_credentials" }));
      }
    } else if (payload.type !== "invite" || payload.token_hash !== "SYNTHETIC_INVITATION_HASH_12345") {
      res.writeHead(403);
      return res.end(JSON.stringify({ message: "Expired synthetic invitation", code: "otp_expired" }));
    }
    return res.end(
      JSON.stringify({
        access_token: loginToken,
        refresh_token: "SYNTHETIC_REFRESH",
        expires_in: 3600,
        token_type: "bearer",
        user: users.get(loginToken),
      }),
    );
  }
  if (req.url === "/auth/v1/user") {
    if (!user || revoked.has(token)) {
      res.writeHead(401);
      return res.end(
        JSON.stringify({
          message: "Invalid synthetic session",
          code: "bad_jwt",
        }),
      );
    }
    return res.end(JSON.stringify(user));
  }
  if (req.url === "/auth/v1/logout?scope=local") {
    revoked.add(token);
    res.writeHead(204);
    return res.end();
  }
  if (req.url === "/rest/v1/rpc/current_access")
    return res.end(JSON.stringify(user?.app_role ?? null));
  const url = new URL(req.url, "http://synthetic.invalid");
  if (url.pathname === "/rest/v1/rpc/manage_model") {
    const p = JSON.parse(await body(req));
    modelCalls++;
    if (p.operation === "list") return res.end(JSON.stringify({ rows: [], row_count: 0, offset: 0, limit: 25 }));
    assert.equal(user?.app_role, "admin");
    return res.end(JSON.stringify({ review_id: id, ...p }));
  }
  if (["/rest/v1/rpc/aggregate_report", "/rest/v1/rpc/account_directory"].includes(url.pathname)) {
    assert.ok(["admin", "reader"].includes(user?.app_role));
    if (url.pathname.endsWith("/aggregate_report")) reportCalls++;
    const p = JSON.parse(await body(req));
    lastReportParameters = p;
    if (reportFailure) {
      res.writeHead(400);
      return res.end(JSON.stringify({ code: reportFailure, message: "SYNTHETIC PRIVATE DATABASE ERROR" }));
    }
    if (p.page_offset > 0 && ["40001", "42501", "XX000"].includes(exportFailure)) {
      res.writeHead(400);
      return res.end(JSON.stringify({ code: exportFailure, message: "SYNTHETIC PRIVATE EXPORT ERROR" }));
    }
    const metrics = {
      key: "total", label: "Total", aum_usd: "120", revenue_usd: "22", aum_rows: 1, aum_values: 1,
      revenue_rows: 4, revenue_values: 4, accounts_with_aum: 1, clients_with_aum: 1,
      accounts_with_revenue: 1, aum_accounts_without_client: 0, aum_missing_accounts: 0,
      revenue_missing_account_months: 0, aum_accounts_without_advisor: 0, revenue_accounts_without_advisor: 0,
      aum_accounts_without_team: 0, revenue_accounts_without_team: 0,
      aum_without_advisor_usd: null, revenue_without_advisor_usd: null,
    };
    const report = {
      revision: p.page_offset > 0 && exportFailure === "revision" ? "b".repeat(32) : "a".repeat(32), period: { from: p.month_from, to: p.month_to, aum_closing_month: p.month_to },
      filters: { custodian: p.custodian, team: p.team, advisor: p.advisor, client: p.client, account: p.account, service: p.service_filter },
      attribution: "month_end", coverage_basis: "expected_coverage_unconfirmed", total: metrics,
      months: [{ ...metrics, period: p.month_to, previous_period: p.month_from, aum_change_usd: "20", aum_change_percent: "20", revenue_change_usd: "2", revenue_change_percent: "20" }],
      coverage: [], group_by: p.group_by, row_count: exportRowCount, offset: p.page_offset, limit: p.page_size,
      rows: p.page_size === 250 ? Array.from({ length: exportFailure === "short" ? 1 : Math.max(0, Math.min(p.page_size, exportRowCount - p.page_offset)) }, (_, i) => ({ ...metrics, key: `synthetic-${p.page_offset + i}`, label: "=SINTETICO" })) : [{ ...metrics, key: "synthetic-row", label: "=SINTETICO" }],
    };
    return res.end(JSON.stringify(url.pathname.endsWith("/account_directory") ? { revision: "a".repeat(32), rows: [], row_count: 0, offset: 0, limit: 25, report } : report));
  }
  if (url.pathname === "/rest/v1/admin_custodians")
    return res.end(
      JSON.stringify(
        url.searchParams.has("id")
          ? syntheticCustodian
          : user?.app_role === "admin"
            ? [syntheticCustodian]
            : [],
      ),
    );
  if (["/rest/v1/admin_accounts", "/rest/v1/admin_commercial_advisors", "/rest/v1/admin_account_identifiers"].includes(url.pathname)) {
    assert.equal(user?.app_role, "admin");
    return res.end("[]");
  }
  if (url.pathname === "/rest/v1/rpc/manage_import") {
    assert.equal(user?.app_role, "admin");
    managementCalls++;
    const input = JSON.parse(await body(req));
    if (input.input.synthetic_stale) {
      res.writeHead(400);
      return res.end(JSON.stringify({ code: "P0001", message: "Active version changed; review again" }));
    }
    return res.end(JSON.stringify({ synthetic: true, ...input }));
  }
  if (url.pathname === "/rest/v1/admin_import_batches") {
    assert.equal(user?.app_role, "admin");
    let list = [...importBatches.values()];
    const eq = url.searchParams.get("id"),
      hash = url.searchParams.get("file_sha256");
    if (eq?.startsWith("eq."))
      return res.end(JSON.stringify(importBatches.get(eq.slice(3))));
    if (hash)
      list = list.filter(
        (b) => b.file_sha256 === hash.slice(3) && b.id !== eq?.slice(4),
      );
    res.setHeader("Content-Range", `0-${list.length - 1}/${list.length}`);
    return res.end(JSON.stringify(list));
  }
  if (url.pathname === "/rest/v1/admin_import_rows") {
    assert.equal(user?.app_role, "admin");
    let rows = importRows.get(url.searchParams.get("batch_id")?.slice(3)) ?? [];
    if (url.searchParams.get("status") === "eq.error")
      rows = rows.filter((r) => r.status === "error");
    const start = Number(url.searchParams.get("offset") ?? 0),
      count = rows.length;
    res.setHeader(
      "Content-Range",
      `${start}-${Math.min(start + 24, count - 1)}/${count}`,
    );
    return res.end(JSON.stringify(rows.slice(start, start + 25)));
  }
  if (url.pathname === "/rest/v1/rpc/begin_import") {
    assert.equal(user?.app_role, "admin");
    const p = JSON.parse(await body(req));
    const batch = {
      id: p.request_id,
      source: p.source_type,
      period: p.target_period,
      custodian_id: p.custodian,
      status: "uploaded",
      file_name_original: p.file_name,
      file_sha256: p.file_hash,
      file_size_bytes: p.file_size,
      parsing_conventions: p.conventions,
      totals: {},
      errors: [],
      row_count: 0,
      blocking_error_count: 0,
      storage_object_path: `${p.request_id}/original.csv`,
      preparation_only: true,
    };
    if (!importBatches.has(batch.id)) importBatches.set(batch.id, batch);
    return res.end(JSON.stringify(batch.id));
  }
  if (url.pathname === "/rest/v1/rpc/prepare_import_chunk") {
    assert.equal(user?.app_role, "admin");
    const p = JSON.parse(await body(req)),
      b = importBatches.get(p.target_id),
      rows = importRows.get(p.target_id) ?? [];
    if (rows.length === p.expected_cursor) {
      rows.push(...p.chunk);
      importRows.set(p.target_id, rows);
      b.totals = { ...p.summary, processed: rows.length };
      b.row_count = p.summary.rowCount;
      b.errors = p.summary.errors;
      b.blocking_error_count = p.summary.blockingErrors;
      b.parsing_conventions.configuration = p.configuration;
      b.status =
        rows.length < b.row_count
          ? "validating"
          : b.blocking_error_count
            ? "failed"
            : "needs_resolution";
    }
    return res.end(JSON.stringify(rows.length));
  }
  if (
    url.pathname.startsWith("/storage/v1/object/") &&
    url.pathname.includes("/original.csv")
  ) {
    assert.equal(user?.app_role, "admin");
    const key = url.pathname.split("app-papa-imports/")[1];
    if (req.method === "POST") {
      importFiles.set(key, await body(req));
      return res.end(JSON.stringify({ Key: key }));
    }
    const file = importFiles.get(key);
    if (!file) {
      res.writeHead(404);
      return res.end("{}");
    }
    res.setHeader("Content-Type", "application/octet-stream");
    return res.end(file);
  }
  if (req.url === "/rest/v1/rpc/source_file") {
    assert.equal(user?.app_role, "admin");
    return res.end(
      JSON.stringify([
        { bucket: "app-papa-imports", object_path: "synthetic.xlsx" },
      ]),
    );
  }
  if (req.url?.startsWith("/storage/v1/object/")) {
    storageReads++;
    assert.equal(user?.app_role, "admin");
    res.setHeader("Content-Type", "application/octet-stream");
    return res.end("FUENTE SINTETICA");
  }
  // Refresco con token expirado/inválido debe fallar y limpiar cookies.
  if (req.url?.startsWith("/auth/v1/token")) {
    res.writeHead(400);
    return res.end(
      JSON.stringify({
        message: "Synthetic refresh expired",
        code: "refresh_token_not_found",
      }),
    );
  }
  res.writeHead(404);
  res.end("{}");
});
backend.listen(0, "127.0.0.1");
await once(backend, "listening");
const backendUrl = `http://127.0.0.1:${backend.address().port}`;
const key = "sb_publishable_SYNTHETIC";
const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const appPort = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
let output = "";
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "-p",
    String(appPort),
    "-H",
    "127.0.0.1",
  ],
  {
    env: {
      ...process.env,
      SUPABASE_URL: backendUrl,
      SUPABASE_PUBLISHABLE_KEY: key,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
app.stdout.on("data", (data) => {
  output += data;
});
app.stderr.on("data", (data) => {
  output += data;
});
const origin = `http://127.0.0.1:${appPort}`;
const request = (path, cookie) =>
  fetch(origin + path, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
  });
async function cookieFor(role, expired = false) {
  const sub = `00000000-0000-0000-0000-${role === "admin" ? "000000000001" : role === "reader" ? "000000000002" : "000000000003"}`;
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub, aud: "authenticated", role: "authenticated", exp: now + 3600, iat: now, session_id: sub, user_metadata: { role: "admin" } })}.${Buffer.from("synthetic").toString("base64url")}`;
  if (role === "admin") loginToken = token;
  users.set(token, {
    id: sub,
    aud: "authenticated",
    role: "authenticated",
    email: "synthetic@example.invalid",
    created_at: new Date().toISOString(),
    app_role: role,
  });
  const jar = new Map();
  const client = createServerClient(backendUrl, key, {
    cookies: {
      getAll: () => [],
      setAll(values) {
        values.forEach(({ name, value }) => jar.set(name, value));
      },
    },
  });
  const { error } = await client.auth.setSession({
    access_token: token,
    refresh_token: "SYNTHETIC_REFRESH",
  });
  assert.equal(error, null);
  if (expired === true) revoked.add(token);
  if (expired === "refresh") {
    for (const [name, value] of jar) {
      const session = JSON.parse(
        Buffer.from(value.slice(7), "base64url").toString(),
      );
      const parts = session.access_token.split(".");
      const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      parts[1] = encode({ ...claims, exp: now - 60 });
      session.access_token = parts.join(".");
      session.expires_at = now - 60;
      jar.set(
        name,
        "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
      );
    }
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}
try {
  let ready = false;
  for (let n = 0; n < 100; n++) {
    try {
      if ((await request("/ingresar")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, "Next production server did not start");
  for (const path of [
    "/",
    "/cuentas",
    "/analisis-comercial",
    "/importaciones",
    "/correspondencias",
    "/configuracion",
  ]) {
    const response = await request(path);
    assert.equal(response.status, 307, path);
    assert.match(
      response.headers.get("location"),
      /\/ingresar\?estado=sesion$/,
    );
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  assert.equal((await request(`/api/fuentes/${id}`)).status, 401);
  const reader = await cookieFor("reader");
  const admin = await cookieFor("admin");
  const loginHtml = await (await request("/ingresar")).text();
  const loginActions = [
    ...loginHtml.matchAll(/name="\$ACTION_ID_([^"]+)"/g),
  ].map((match) => match[1]);
  assert.equal(loginActions.length, 1);
  assert.match(loginHtml, /Ingresá a tu espacio/);
  assert.match(loginHtml, /Ingresar \| gma-software/);
  assert.ok(!loginHtml.includes("Solicitar código"));
  async function postAction(path, action, fields, requestOrigin = origin) {
    const form = new FormData();
    form.set(`$ACTION_ID_${action}`, "");
    for (const [name, value] of Object.entries(fields)) form.set(name, value);
    return fetch(origin + path, {
      method: "POST",
      headers: { Origin: requestOrigin },
      body: form,
      redirect: "manual",
    });
  }
  const invalidLogin = await postAction("/ingresar", loginActions[0], { email: "bad", password: "" });
  assert.match(invalidLogin.headers.get("location"), /estado=datos/);
  assert.equal(passwordRequests, 0);
  for (const email of ["synthetic@example.invalid", "unknown@example.invalid"]) {
    const deniedLogin = await postAction("/ingresar", loginActions[0], { email, password: "WRONG_SYNTHETIC_PASSWORD" });
    assert.match(deniedLogin.headers.get("location"), /estado=error/);
    assert.ok(!deniedLogin.headers.get("set-cookie"));
  }
  const verified = await postAction("/ingresar", loginActions[0], {
    email: "synthetic@example.invalid", password: "SYNTHETIC_PASSWORD_123",
  });
  assert.equal(verified.status, 303);
  assert.ok(verified.headers.get("set-cookie"));
  const invitation = await (
    await request("/invitacion?token_hash=SYNTHETIC_INVITATION_HASH_12345")
  ).text();
  const inviteAction = invitation.match(/name="\$ACTION_ID_([^"]+)"/)[1];
  const accepted = await postAction("/invitacion", inviteAction, {
    token_hash: "SYNTHETIC_INVITATION_HASH_12345",
  });
  assert.equal(accepted.status, 303);
  assert.ok(accepted.headers.get("set-cookie"));
  const denied = await postAction(
    "/ingresar",
    loginActions[0],
    { email: "synthetic@example.invalid", password: "SYNTHETIC_PASSWORD_123" },
    "https://attacker.invalid",
  );
  assert.ok(denied.status >= 400);
  assert.equal(passwordRequests, 3, "Next bloquea Server Action desde otro origen");
  for (const cookie of [reader, admin]) {
    for (const path of ["/", "/cuentas", "/analisis-comercial", "/configuracion"]) {
      const response = await request(path, cookie);
      assert.equal(response.status, 200, path);
      assert.match(response.headers.get("cache-control"), /no-store/);
      const html = await response.text();
      assert.ok(!html.includes("sb_publishable_SYNTHETIC"));
      assert.ok(!html.includes("SYNTHETIC_REFRESH"));
    }
  }
  for (const path of ["/importaciones", "/correspondencias"]) {
    const response = await request(path, reader);
    assert.equal(response.status, 307, path);
    assert.match(response.headers.get("location"), /\/sin-acceso$/);
    assert.equal((await request(path, admin)).status, 200);
  }
  assert.equal((await request(`/api/fuentes/${id}`, reader)).status, 403);
  assert.equal(storageReads, 0, "lector no llega a Storage");
  const download = await request(`/api/fuentes/${id}`, admin);
  assert.equal(download.status, 200);
  assert.equal(await download.text(), "FUENTE SINTETICA");
  assert.equal(storageReads, 1);
  assert.match(download.headers.get("cache-control"), /no-store/);
  // Preparación HTTP SINTÉTICA: contratos de red; los permisos/locks se prueban en PostgreSQL aparte.
  const importsPost = (path, cookie, payload, requestOrigin = origin) =>
    fetch(origin + path, {
      method: "POST",
      headers: {
        Cookie: cookie ?? "",
        Origin: requestOrigin,
        ...(payload instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
      },
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
  const modelBefore = modelCalls;
  const modelChange = { operation: "preview", entity: "clients", target_id: null, input: { name: "Cliente SINTETICO" }, reason: "Alta SINTETICA" };
  for (const [cookie, status] of [[null, 401], [reader, 403]]) {
    assert.equal((await importsPost("/api/modelo", cookie, modelChange)).status, status);
    assert.equal((await importsPost("/api/modelo", cookie, { operation: "save", review_id: id })).status, status);
  }
  assert.equal(modelCalls, modelBefore, "lector/anónimo no llegan a RPC de edición");
  assert.equal((await importsPost("/api/modelo", admin, modelChange, "https://attacker.invalid")).status, 403);
  assert.equal((await importsPost("/api/modelo", admin, { ...modelChange, reason: "x" })).status, 400);
  assert.equal((await importsPost("/api/modelo", admin, { ...modelChange, input: { name: "x".repeat(17000) } })).status, 400);
  assert.equal(modelCalls, modelBefore);
  const modelPreview = await importsPost("/api/modelo", admin, modelChange);
  assert.equal(modelPreview.status, 200); assert.match(modelPreview.headers.get("cache-control"), /no-store/);
  assert.equal((await modelPreview.json()).operation, "preview");
  assert.equal((await importsPost("/api/modelo", admin, { operation: "save", review_id: id })).status, 200);
  console.log("OK HTTP modelo: catálogo lector, edición directa denegada, preview/save admin, UUID/motivo, tamaño, origen y no-store.");
  for (const [cookie, expected] of [
    [null, 401],
    [reader, 403],
  ]) {
    assert.equal(
      (await importsPost("/api/importaciones", cookie, {})).status,
      expected,
    );
    assert.equal(
      (await importsPost(`/api/importaciones/${id}`, cookie, {})).status,
      expected,
    );
    assert.equal(
      (await request(`/api/importaciones/${id}`, cookie)).status,
      expected,
    );
  }
  const reportQuery = "desde=2026-01&hasta=2026-02&custodio=" + syntheticCustodian.id + "&equipo=50000000-0000-0000-0000-000000000001&comercial=30000000-0000-0000-0000-000000000001&cliente=40000000-0000-0000-0000-000000000001&cuenta=20000000-0000-0000-0000-000000000001&servicio=sin_clasificar&agrupar=team&limite=25";
  const callsBeforeUnauthorizedReport = reportCalls;
  const forbiddenReport = await cookieFor("forbidden");
  for (const [cookie, status] of [[undefined, 401], [forbiddenReport, 403]]) {
    assert.equal((await request(`/api/consultas?${reportQuery}`, cookie)).status, status);
  }
  assert.equal(reportCalls, callsBeforeUnauthorizedReport, "no autorizados no llegan a consultas");
  for (const cookie of [reader, admin]) {
    const jsonResponse = await request(`/api/consultas?${reportQuery}`, cookie);
    assert.equal(jsonResponse.status, 200);
    assert.match(jsonResponse.headers.get("cache-control"), /private.*no-store/);
    const jsonReport = await jsonResponse.json(), jsonParameters = lastReportParameters;
    assert.equal(jsonReport.total.aum_usd, "120");
    assert.equal(jsonReport.total.revenue_usd, "22");
    assert.equal(jsonParameters.month_from, "2026-01-01");
    assert.equal(jsonParameters.team, "50000000-0000-0000-0000-000000000001");
    assert.equal(jsonParameters.page_size, 25);
    const csvResponse = await request(`/api/consultas?${reportQuery}&formato=csv`, cookie);
    assert.equal(csvResponse.status, 200);
    assert.deepEqual(lastReportParameters, jsonParameters, "CSV y JSON usan exactamente la misma RPC y filtros");
    assert.match(csvResponse.headers.get("content-type"), /text\/csv/);
    assert.equal(csvResponse.headers.get("x-next-offset"), "25");
    assert.equal(csvResponse.headers.get("x-report-revision"), jsonReport.revision);
    const csvText = await csvResponse.text();
    assert.match(csvText, /"120","22"/);
    assert.match(csvText, /"'=SINTETICO"/);
    assert.match(csvText, /sin_clasificar/);
  }
  const callsBeforeInvalidReport = reportCalls;
  for (const extra of ["&unknown=true", "&desde=2026-03", "&offset=25"]) {
    assert.equal((await request(`/api/consultas?${reportQuery}${extra}`, reader)).status, 400);
  }
  assert.equal(reportCalls, callsBeforeInvalidReport);
  assert.equal((await request(`/api/consultas?${reportQuery}&offset=25&revision=${"a".repeat(32)}`, reader)).status, 200);
  for (const [code, status] of [["40001", 409], ["42501", 403], ["XX000", 503]]) {
    reportFailure = code;
    const failed = await request(`/api/consultas?${reportQuery}`, reader);
    assert.equal(failed.status, status);
    assert.ok(!(await failed.text()).includes("SYNTHETIC PRIVATE DATABASE ERROR"));
  }
  reportFailure = null;
  for (const cookie of [reader, admin]) {
    const calls = reportCalls;
    const response = await request(`/api/consultas?${reportQuery}&formato=csv-completo&revision=${"a".repeat(32)}`, cookie);
    assert.equal(response.status, 200);
    assert.equal(reportCalls - calls, 2);
    assert.equal(response.headers.get("x-report-scope"), "complete");
    assert.equal(response.headers.get("x-next-offset"), "");
    const csv = await response.text();
    assert.equal(csv.match(/^"fila",/gm).length, 300);
    assert.equal(csv.match(/^"total",/gm).length, 1);
    assert.ok(csv.includes('"synthetic-299"'));
    assert.equal(lastReportParameters.page_offset, 250);
    assert.equal(lastReportParameters.expected_revision, "a".repeat(32));
    assert.equal(lastReportParameters.team, "50000000-0000-0000-0000-000000000001");
  }
  for (const [failure, status] of [["40001", 409], ["42501", 403], ["XX000", 503], ["revision", 409], ["short", 503]]) {
    exportFailure = failure;
    const response = await request(`/api/consultas?${reportQuery}&formato=csv-completo`, reader);
    assert.equal(response.status, status);
    assert.equal(response.headers.has("content-disposition"), false, "no entrega descarga parcial");
    assert.ok(!(await response.text()).includes("SYNTHETIC PRIVATE EXPORT ERROR"));
  }
  exportFailure = null; exportRowCount = 10001;
  assert.equal((await request(`/api/consultas?${reportQuery}&formato=csv-completo`, reader)).status, 422);
  exportRowCount = 300;
  for (const [cookie, status] of [[undefined, 401], [forbiddenReport, 403]])
    assert.equal((await request(`/api/consultas?${reportQuery}&formato=csv-completo`, cookie)).status, status);
  console.log("OK HTTP consultas: filtros/RPC idénticos JSON/CSV, total, página/revisión, texto inerte, roles y errores privados.");
  const managementPath = `/api/importaciones/${id}/gestion`;
  for (const [cookie, expected] of [[null, 401], [reader, 403]]) {
    assert.equal((await request(managementPath, cookie)).status, expected);
    for (const operation of ["resolve", "review", "publish"]) {
      assert.equal((await importsPost(managementPath, cookie, { operation, input: {} })).status, expected);
    }
  }
  assert.equal(managementCalls, 0, "no autorizados no llegan a la RPC de gestión");
  assert.equal((await importsPost(managementPath, admin, { operation: "publish", input: {} }, "https://attacker.invalid")).status, 403);
  assert.equal((await importsPost(managementPath, admin, { operation: "unknown", input: {} })).status, 400);
  assert.equal((await importsPost(managementPath, admin, { operation: "review", input: "bad" })).status, 400);
  assert.equal((await importsPost(managementPath, admin, { operation: "review", input: { oversized: "x".repeat(17000) } })).status, 400);
  const inspectionResponse = await request(managementPath + "?page=2", admin);
  assert.equal(inspectionResponse.status, 200);
  assert.match(inspectionResponse.headers.get("cache-control"), /no-store/);
  assert.deepEqual(await inspectionResponse.json(), { synthetic: true, target_id: id, operation: "inspect", input: { page: 2 } });
  for (const operation of ["resolve", "review", "publish"]) {
    const response = await importsPost(managementPath, admin, { operation, input: { token: "SINTETICO" } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { synthetic: true, target_id: id, operation, input: { token: "SINTETICO" } });
  }
  const staleResponse = await importsPost(managementPath, admin, { operation: "publish", input: { synthetic_stale: true } });
  assert.equal(staleResponse.status, 409);
  assert.match((await staleResponse.json()).error, /Cambió la versión activa/);
  console.log("OK: HTTP gestión admin, despacho inspect/resolve/review/publish, límites, revisión obsoleta, permisos y origen (contratos sintéticos).");
  assert.equal(importFiles.size, 0, "no autorizados no suben archivos");
  assert.equal(
    (
      await importsPost(
        "/api/importaciones",
        admin,
        {},
        "https://attacker.invalid",
      )
    ).status,
    403,
  );
  const importId = "70000000-0000-0000-0000-000000000001";
  const importOptions = {
    source: "revenue",
    period: "2026-01-01",
    custodianId: syntheticCustodian.id,
    custodianCode: "SYN-A",
    sheet: "",
    numericFormat: "dot",
    delimiter: ",",
  };
  const uploadForm = () => {
    const f = new FormData();
    f.set("requestId", importId);
    f.set("options", JSON.stringify(importOptions));
    f.set(
      "file",
      new File(
        [
          readFileSync(
            new URL("../tests/fixtures/imports/revenue.csv", import.meta.url),
          ),
        ],
        "SINTETICO.csv",
      ),
    );
    return f;
  };
  const uploaded = await importsPost("/api/importaciones", admin, uploadForm());
  assert.equal(uploaded.status, 200, await uploaded.clone().text());
  assert.equal((await uploaded.json()).id, importId);
  assert.equal(
    (await importsPost("/api/importaciones", admin, uploadForm())).status,
    200,
  );
  assert.equal(importBatches.size, 1, "reintento carga no crea otro lote");
  let inspection = await request(`/api/importaciones/${importId}`, admin);
  assert.match(inspection.headers.get("cache-control"), /no-store/);
  assert.deepEqual((await inspection.json()).sheets, ["CSV"]);
  let processed = await importsPost(`/api/importaciones/${importId}`, admin, {
    options: { ...importOptions, sheet: "CSV" },
  });
  assert.equal(processed.status, 200);
  assert.equal((await processed.json()).done, true);
  inspection = await request(`/api/importaciones/${importId}`, admin);
  const preview = await inspection.json();
  assert.equal(preview.rows.length, 3);
  assert.equal(preview.batch.totals.total, "0.15");
  assert.equal(preview.batch.totals.duplicateRows, 1);
  assert.equal(preview.rows[0].cell_metadata.account, "00077");
  assert.equal(preview.batch.status, "needs_resolution");
  processed = await importsPost(`/api/importaciones/${importId}`, admin, {
    options: { ...importOptions, sheet: "CSV" },
  });
  assert.equal((await processed.json()).processed, 3);
  assert.equal(importRows.get(importId).length, 3);
  assert.equal(
    (await request(`/api/importaciones/${importId}`, reader)).status,
    403,
  );
  assert.equal(
    (await importsPost(`/api/importaciones/${importId}`, reader, {})).status,
    403,
  );
  assert.equal(
    (
      await importsPost(
        `/api/importaciones/${importId}`,
        admin,
        {},
        "https://attacker.invalid",
      )
    ).status,
    403,
  );
  const dashboard = await (await request("/", admin)).text();
  assert.ok(
    !dashboard.includes("00077"),
    "cuenta preparada ausente del dashboard",
  );
  console.log(
    "OK: HTTP preparación admin, original privado, parsing, preview, retry, lector/anónimo y origen.",
  );
  // Dos peticiones distintas: interrumpir después de 250 filas y reanudar desde el cursor persistido.
  const longId = "70000000-0000-0000-0000-000000000002";
  const sample = readFileSync(
    new URL("../tests/fixtures/imports/revenue.csv", import.meta.url),
    "utf8",
  ).split("\r\n");
  const longForm = uploadForm();
  longForm.set("requestId", longId);
  longForm.set(
    "file",
    new File(
      [[sample[0], ...Array(251).fill(sample[1])].join("\r\n")],
      "SINTETICO-lotes.csv",
    ),
  );
  assert.equal(
    (await importsPost("/api/importaciones", admin, longForm)).status,
    200,
  );
  let step = await importsPost(`/api/importaciones/${longId}`, admin, {
    options: { ...importOptions, sheet: "CSV" },
  });
  assert.deepEqual(await step.json(), { processed: 250, done: false });
  assert.equal(importBatches.get(longId).status, "validating");
  assert.equal(
    (
      await importsPost(`/api/importaciones/${longId}`, admin, {
        options: { ...importOptions, sheet: "CSV", numericFormat: "comma" },
      })
    ).status,
    409,
  );
  step = await importsPost(`/api/importaciones/${longId}`, admin, {
    options: { ...importOptions, sheet: "CSV" },
  });
  assert.deepEqual(await step.json(), { processed: 251, done: true });
  const final = await (
    await request(`/api/importaciones/${longId}?page=10`, admin)
  ).json();
  assert.equal(final.batch.totals.total, "25.1");
  assert.equal(final.rows.length, 1);
  assert.equal(final.rowMatches, 251);
  const oversized = uploadForm();
  oversized.set(
    "file",
    new File([new Uint8Array(2097153)], "SINTETICO-grande.csv"),
  );
  assert.equal(
    (await importsPost("/api/importaciones", admin, oversized)).status,
    400,
  );
  const unsupported = uploadForm();
  unsupported.set("file", new File(["SINTETICO"], "SINTETICO.xls"));
  const unsupportedResult = await importsPost(
    "/api/importaciones",
    admin,
    unsupported,
  );
  assert.equal(unsupportedResult.status, 400);
  assert.match((await unsupportedResult.json()).error, /Excel/);
  console.log(
    "OK: HTTP 251 filas en dos lotes, cursor reanudado, configuración fija, paginación y límites.",
  );
  // Logout por Server Action: invocación HTTP del formulario real, con protección de origen de Next.
  const html = await (await request("/", admin)).text();
  const action = html.match(/name="\$ACTION_ID_([^"]+)"/);
  assert.ok(action, "formulario de logout");
  const form = new FormData();
  form.set(`$ACTION_ID_${action[1]}`, "");
  const logout = await fetch(origin + "/", {
    method: "POST",
    headers: { Cookie: admin, Origin: origin },
    body: form,
    redirect: "manual",
  });
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get("location"), /\/ingresar\?estado=salida$/);
  assert.ok(logout.headers.get("set-cookie"), "logout borra cookies");
  assert.equal(
    (await request(`/api/fuentes/${id}`, admin)).status,
    401,
    "cookie anterior no recupera fuentes después del logout",
  );
  const expired = await cookieFor("reader", "refresh");
  const expiredResponse = await request("/cuentas", expired);
  assert.equal(expiredResponse.status, 307);
  assert.match(expiredResponse.headers.get("location"), /estado=sesion/);
  assert.ok(
    expiredResponse.headers.get("set-cookie"),
    "refresco vencido limpia cookies",
  );
  const invalid = await cookieFor("reader", true);
  assert.equal((await request("/cuentas", invalid)).status, 307);
  assert.equal((await request(`/api/fuentes/${id}`, invalid)).status, 401);
  assert.equal((await request(`/api/consultas?${reportQuery}`, invalid)).status, 401);
  console.log(
    "OK HTTP SINTÉTICO: anónimo/lector/admin, rutas directas, contraseña sin alta, invitación heredada, CSRF, API de fuentes, no-store, logout y sesión inválida.",
  );
} catch (error) {
  console.error(output);
  throw error;
} finally {
  app.kill("SIGTERM");
  await once(app, "exit");
  backend.closeAllConnections();
  backend.close();
}
