// Sólo SINTÉTICO: Next real y PostgreSQL temporal; Auth/Storage del arnés local.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { HEADERS } from "../src/lib/imports/contracts.ts";
import { csv, revenueRow, xlsx } from "../tests/fixtures/imports/build.ts";

export async function verifyImportQuality({ request, appOrigin, sql, asRole, adminSub, custodian }) {
  const json = async (response, status = 200) => {
    const data = await response.json(); assert.equal(response.status, status, JSON.stringify(data)); return data;
  };
  const post = (path, value) => request(path, true, { method: "POST", headers: { Origin: appOrigin, "Content-Type": "application/json" }, body: JSON.stringify(value) });
  const options = { source: "revenue", period: "2026-01-01", custodianId: custodian.id, custodianCode: custodian.code, sheet: "CSV", numericFormat: "dot", delimiter: "," };
  const staged = async (rows) => {
    const form = new FormData(); form.set("file", new File([csv("revenue", rows)], "SINTETICO-calidad.csv"));
    form.set("requestId", randomUUID()); form.set("options", JSON.stringify(options));
    return (await json(await request("/api/importaciones", true, { method: "POST", headers: { Origin: appOrigin }, body: form }))).id;
  };
  const facts = () => sql("select jsonb_build_array((select count(*) from app_private.aum_current),(select count(*) from app_private.revenue_current));").trim();
  const before = facts();
  const repeated = [revenueRow(" 000WARN ", "0.1", custodian.code), revenueRow(" 000WARN ", "0.1", custodian.code), revenueRow("000WARN", "-0.05", custodian.code)];
  const id = await staged(repeated);
  await json(await post(`/api/importaciones/${id}`, { options }));
  const detail = await json(await request(`/api/importaciones/${id}`, true));
  assert.equal(detail.batch.status, "needs_resolution"); assert.equal(detail.batch.totals.total, "0.15");
  assert.equal(detail.rows.length, 3); assert.equal(detail.rows[0].original_cells["4"], " 000WARN ");
  assert.equal(detail.batch.totals.issues.find(i => i.code === "identifier_format_review").count, 2);
  assert.equal(detail.batch.totals.duplicateRows, 1);
  await json(await post(`/api/importaciones/${id}/gestion`, { operation: "review", input: { complete_scope: true } }), 409);
  assert.equal((await request(`/api/importaciones/${id}`, false)).status, 403);

  const invalid = await staged([revenueRow(" 1E+12 ", "1", custodian.code)]);
  await json(await post(`/api/importaciones/${invalid}`, { options }));
  const failed = await json(await request(`/api/importaciones/${invalid}`, true));
  assert.equal(failed.batch.status, "failed");
  assert.ok(failed.rows[0].errors.some(e => e.code === "identifier_loss" && e.column === "ACCOUNT"));

  // Simula un lote previo sin la nueva versión mediante la RPC, sin alterar filas inmutables.
  const legacy = await staged([revenueRow("000LEGACY", "0.1", custodian.code)]);
  sql(asRole(adminSub, "select public.prepare_import_chunk(:'id',0,:'config'::jsonb,'[]',:'summary'::jsonb)"), [
    "-v", `id=${legacy}`, "-v", `config=${JSON.stringify({ ...options, parserVersion: 1 })}`,
    "-v", 'summary={"rowCount":1,"blockingErrors":0,"total":"0.1","valueCount":1,"errors":[]}',
  ]);
  const rejected = await json(await post(`/api/importaciones/${legacy}`, { options }), 409);
  assert.match(rejected.error, /reglas de validación/);
  const unchanged = await json(await request(`/api/importaciones/${legacy}`, true));
  assert.equal(unchanged.batch.totals.processed, 0); assert.equal(unchanged.rows.length, 0);

  const raw = csv("aum", [["SINTETICO", "123", "R-REF", "1", "1", "2026"]]);
  const references = xlsx([{ name: "CSV", rows: [[...HEADERS.fa], [{ n: "123" }, "R-REF", "", "", "", "", custodian.code]] }]);
  const historyId = randomUUID(), historyOptions = { source: "aum", multiCustodian: true, sheet: "CSV", numericFormat: "dot", delimiter: "," };
  const form = new FormData(); form.set("file", new File([raw], "SINTETICO-calidad.csv"));
  form.set("references", new File([references], "SINTETICO-REF.xlsx")); form.set("requestId", historyId); form.set("options", JSON.stringify(historyOptions));
  await json(await request("/api/importaciones/historicas", true, { method: "POST", headers: { Origin: appOrigin }, body: form }));
  const history = await json(await request(`/api/importaciones/historicas/${historyId}`, true));
  assert.ok(history.upload.manifest.errors.some(e => e.code === "identifier_loss" && e.row === 2 && e.column === "ACC # Addepar"));
  assert.equal(history.upload.options.references.pairs.length, 0);
  await json(await post(`/api/importaciones/historicas/${historyId}`, { operation: "review", input: { confirm_all: true } }), 409);
  assert.equal((await request(`/api/importaciones/historicas/${historyId}?original=1&reference=1`, false)).status, 403);
  const original = await request(`/api/importaciones/historicas/${historyId}?original=1&reference=1`, true);
  assert.equal(original.status, 200); assert.deepEqual(Buffer.from(await original.arrayBuffer()), Buffer.from(references));
  assert.equal(facts(), before, "preparación, fallo y rechazo de versión no alteran publicados");
  console.log("OK calidad de importaciones: literales/avisos, Revenue repetido, REF tipado, versión congelada, originales por rol y publicados intactos.");
}
