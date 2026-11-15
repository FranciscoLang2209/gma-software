// Circuito SINTÉTICO por HTTP de Next y PostgreSQL real; Auth/transporte/bytes Storage son locales.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { parse } from "csv-parse/sync";
import { HEADERS } from "../src/lib/imports/contracts.ts";

export async function verifyImportWorkflow({ request, appOrigin, sql, asRole, adminSub, sub }) {
  const json = async (response, status = 200) => {
    const data = await response.json(); assert.equal(response.status, status, JSON.stringify(data)); return data;
  };
  const post = (path, data, admin = true) => request(path, admin, { method: "POST", headers: { Origin: appOrigin, "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const model = async (entity, input, target_id = null) => {
    const preview = await json(await post("/api/modelo", { operation: "preview", entity, target_id, input, reason: "Circuito integral SINTETICO" }));
    const saved = await json(await post("/api/modelo", { operation: "save", review_id: preview.review_id }));
    return saved.id;
  };
  const custodians = [];
  for (const code of ["SYN-E2E-A", "SYN-E2E-B"]) custodians.push({ id: await model("custodians", { code, name: `Custodio ${code}`, active: true }), code });
  const teams = [];
  for (const name of ["Equipo SINTETICO enero", "\t=EQUIPO_SINTETICO_FEBRERO"]) teams.push(await model("teams", { name, active: true }));
  const csv = (source, rows) => Buffer.from([HEADERS[source], ...rows.map((r) => HEADERS[source].map((h) => r[h] ?? ""))].map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(",")).join("\r\n"));
  const upload = async (source, period, custodian, rows, requestId = randomUUID()) => {
    const options = { source, period, custodianId: custodian.id, custodianCode: custodian.code, sheet: "CSV", numericFormat: "dot", delimiter: "," };
    const form = new FormData(); form.set("file", new File([csv(source, rows)], "SINTETICO-integral.csv")); form.set("requestId", requestId); form.set("options", JSON.stringify(options));
    const uploaded = await json(await request("/api/importaciones", true, { method: "POST", headers: { Origin: appOrigin }, body: form }));
    let done = false;
    for (let attempt = 0; attempt < 25 && !done; attempt++) done = (await json(await post(`/api/importaciones/${uploaded.id}`, { options }))).done;
    assert.ok(done, "preparación finaliza");
    return uploaded.id;
  };
  const inspect = async (id) => json(await request(`/api/importaciones/${id}/gestion`, true));
  const manage = (id, operation, input) => post(`/api/importaciones/${id}/gestion`, { operation, input });
  const resolve = async (id, accounts = {}, advisor = null) => {
    const detail = await inspect(id);
    for (let page = 0; page * 25 < detail.batch.rows; page++) {
      const { rows } = page ? await json(await request(`/api/importaciones/${id}/gestion?page=${page}`, true)) : detail;
      for (const row of rows) {
        const reference = row.cells.ACCOUNT ?? row.cells["Holding Account Number"];
        const resolution = await json(await manage(id, "resolve", { row_id: row.id, custodian_id: detail.batch.custodian_id,
          account_id: accounts[reference] ?? null, ...(advisor ? { new_advisor: advisor } : {}), evidence: "Equivalencia acreditada SINTETICA, sin inferir por nombre" }));
        accounts[reference] = resolution.account_id;
      }
    }
    return accounts;
  };
  const review = async (id, extra = {}) => {
    const detail = await inspect(id);
    const result = await json(await manage(id, "review", { complete_scope: true, period: detail.batch.period, custodian_id: detail.batch.custodian_id, expected_active_id: detail.comparison.active?.id ?? null, ...extra }));
    if (detail.batch.source !== "fa") assert.equal(result.comparison.file.total, result.comparison.candidate.total, "archivo y candidata concilian exactamente");
    return result.token;
  };
  const publish = async (id, extra = {}) => {
    const token = await review(id, extra); await json(await manage(id, "publish", { token })); return token;
  };
  const range = "desde=2028-01&hasta=2028-02";
  const report = async (extra = "") => json(await request(`/api/consultas?${range}${extra}`));
  const aum = (month, value, account = "000123") => ({ "Top Level Holding Account": "Cliente SINTETICO privado", "Holding Account Number": account, "Account Number bd_REV": `REV-${account}`, "Value (USD)": value, mes: month, año: "2028" });
  const revenue = (month, value, custodian = custodians[0], account = "000123") => ({ CUSTODIO: custodian.code, MES: month, AÑO: "2028", ACCOUNT: account, NAME: "SECRETO SINTETICO DE ARCHIVO", "Payout broker": value });

  const fa = await upload("fa", "2028-01-01", custodians[0], [{ "ACC # Addepar": "000AD", ACCOUNT: "000123", "Owner Name payout": "Conservar SINTETICO", Broker: "Comercial SINTETICO integral", Grupo: "Referencia SINTETICA", "OLD Owner Name payout": "No acredita historia", Client: "Cliente SINTETICO privado" }]);
  const accounts = await resolve(fa, {}, "Comercial SINTETICO integral");
  await publish(fa, { commercial_column: "Broker", valid_from: "2028-01-01", valid_to: "2028-03-01" });
  const advisor = (await inspect(fa)).rows[0].resolution.advisor_id;
  await model("memberships", { advisor_id: advisor, group_id: teams[0], valid_from: "2028-01-01", valid_to: "2028-02-01", evidence: "Vigencia SINTETICA explícita" });
  await model("memberships", { advisor_id: advisor, group_id: teams[1], valid_from: "2028-02-01", valid_to: "2028-03-01", evidence: "Cambio SINTETICO sin reatribuir enero" });
  assert.equal((await report(`&cuenta=${accounts["000123"]}`)).total.revenue_usd, null);

  let originalRevenue;
  for (const [month, amount, payouts] of [["01", "100", ["2", "3", "5"]], ["02", "120", ["12"]]]) {
    const aid = await upload("aum", `2028-${month}-01`, custodians[0], [aum(month, amount)]);
    await resolve(aid, accounts); await publish(aid);
    const rid = await upload("revenue", `2028-${month}-01`, custodians[0], payouts.map((p) => revenue(month, p)));
    await resolve(rid, accounts); await publish(rid); if (month === "01") originalRevenue = rid;
  }
  const account = accounts["000123"];
  const financial = await report(`&cuenta=${account}`);
  assert.equal(financial.total.aum_usd, "120"); assert.equal(financial.total.revenue_usd, "22");
  const ranking = await report(`&cuenta=${account}&agrupar=team`);
  assert.equal(ranking.rows.find((r) => r.key === teams[0]).revenue_usd, "10");
  assert.equal(ranking.rows.find((r) => r.key === teams[1]).revenue_usd, "12");
  const detail = await (await request(`/cuentas/${account}?${range}`)).text();
  assert.ok(detail.includes("USD 120") && detail.includes("USD 22") && detail.includes("000123"));
  assert.ok(!detail.includes("SECRETO SINTETICO DE ARCHIVO"));
  for (const path of ["/", "/analisis-comercial"]) {
    const html = await (await request(`${path}?${range}&cuenta=${account}&agrupar=team`)).text();
    assert.ok(html.includes("USD 120") && html.includes("USD 22") && html.includes("CSV completo"));
  }
  const response = await request(`/api/consultas?${range}&cuenta=${account}&agrupar=team&formato=csv-completo&revision=${ranking.revision}`);
  assert.equal(response.status, 200);
  const records = parse(await response.text(), { bom: true, relax_column_count: true });
  assert.deepEqual(records.find((r) => r[0] === "total").slice(3, 5), ["120", "22"]);
  assert.ok(records.some((r) => r[0] === "fila" && r[2] === "'\t=EQUIPO_SINTETICO_FEBRERO"));
  assert.ok(records.some((r) => r[0] === "filtro" && r[2] === account));

  const retryRequest = randomUUID();
  const january = ["2", "3", "5"].map((p) => revenue("01", p));
  const repeated = await upload("revenue", "2028-01-01", custodians[0], january, retryRequest);
  assert.equal(await upload("revenue", "2028-01-01", custodians[0], january, retryRequest), repeated, "misma solicitud no crea otro lote");
  await resolve(repeated, accounts); assert.equal((await inspect(repeated)).comparison.same_file, true);
  const retryToken = await publish(repeated); await json(await manage(repeated, "publish", { token: retryToken }));
  assert.equal(await upload("revenue", "2028-01-01", custodians[0], january, retryRequest), repeated, "retry después de publicar conserva lote y hechos");
  assert.equal((await report(`&cuenta=${account}`)).total.revenue_usd, "22");
  assert.equal((await inspect(originalRevenue)).batch.status, "superseded");

  const other = await upload("revenue", "2028-01-01", custodians[1], [revenue("01", "9", custodians[1])]);
  const otherAccounts = await resolve(other); await publish(other);
  assert.notEqual(otherAccounts["000123"], account, "mismo número en otro custodio no se fusiona");
  const before = await report(`&custodio=${custodians[1].id}`);
  const correction = await upload("revenue", "2028-01-01", custodians[0], [revenue("01", "11")]);
  await resolve(correction, accounts); await publish(correction);
  assert.deepEqual((await report(`&custodio=${custodians[1].id}`)).total, before.total);
  assert.equal((await report(`&cuenta=${account}`)).total.revenue_usd, "23");
  assert.equal((await inspect(repeated)).batch.status, "superseded");
  assert.equal((await request(`/api/fuentes/${repeated}`, true)).status, 200, "fuente anterior conservada");
  assert.equal((await request(`/api/consultas?${range}&formato=csv-completo&revision=${ranking.revision}`)).status, 409);
  const prior = await report();
  const invalid = await upload("aum", "2028-02-01", custodians[0], [aum("02", "=1+1")]);
  assert.equal((await inspect(invalid)).batch.status, "failed");
  assert.equal((await manage(invalid, "review", {})).status, 409);
  assert.deepEqual((await report()).total, prior.total);
  for (const operation of ["resolve", "review", "publish"])
    assert.equal((await post(`/api/importaciones/${correction}/gestion`, { operation, input: {} }, false)).status, 403);
  assert.equal((await request(`/api/fuentes/${correction}`)).status, 403);
  assert.equal((await post("/api/modelo", { operation: "preview", entity: "teams", input: { name: "DENEGADO" }, reason: "SINTETICO" }, false)).status, 403);
  assert.equal((await fetch(`${appOrigin}/api/consultas?${range}&formato=csv-completo`)).status, 401);
  assert.equal(sql(asRole(sub, "select count(*) from storage.objects where bucket_id='app-papa-imports'")).trim(), "0", "RLS real oculta archivos al lector");
  assert.throws(() => sql(asRole(sub, `update app_private.user_profiles set role='admin' where id='${sub}'`)), /permission denied/);

  // Más de una página SQL: ceros, ajustes, ausencias y sin clasificar por el mismo circuito de carga.
  const onlyAum = await upload("aum", "2028-01-01", custodians[1], [aum("01", "5", "00SOLO-AUM")]);
  await resolve(onlyAum); await publish(onlyAum);
  const manyRows = Array.from({ length: 251 }, (_, i) => revenue("02", i === 0 ? "0" : i === 1 ? "-0.05" : "0.01", custodians[1], `00M${i}`));
  const many = await upload("revenue", "2028-02-01", custodians[1], manyRows);
  await resolve(many); await publish(many);
  const largeReport = await report(`&custodio=${custodians[1].id}&limite=1`);
  assert.equal(largeReport.row_count, 253); assert.equal(largeReport.rows.length, 1);
  assert.equal(largeReport.total.aum_usd, null); assert.equal(largeReport.total.revenue_usd, "11.44");
  const download = await request(`/api/consultas?${range}&custodio=${custodians[1].id}&formato=csv-completo&revision=${largeReport.revision}`);
  assert.equal(download.status, 200); assert.equal(download.headers.get("x-next-offset"), "");
  const largeCsv = parse(await download.text(), { bom: true, relax_column_count: true });
  const rows = largeCsv.filter((r) => r[0] === "fila");
  assert.equal(rows.length, 253); assert.equal(new Set(rows.map((r) => r[1])).size, 253);
  assert.deepEqual(largeCsv.find((r) => r[0] === "total").slice(3, 5), ["N/D", "11.44"]);
  assert.equal(rows.filter((r) => r[4] === "N/D").length, 1);
  assert.equal(rows.filter((r) => r[4] === "0").length, 1);
  assert.ok(rows.some((r) => r[4] === "-0.05"));
  assert.equal(sql(asRole(adminSub, `select count(*) from public.admin_revenue_entries where batch_id='${repeated}'`)).trim(), "3", "versión anterior conserva todas sus filas");
  console.log("OK integral SINTÉTICO: FA con vigencias, cargas CSV por Next, conciliación/publicación de dos meses, 120/22 en resumen/ranking/cuenta/exportación, retry/reimportación, corrección aislada/historia, archivo inválido, roles/RLS y CSV completo de 253 cuentas con faltantes/negativos.");
}
