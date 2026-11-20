// Integración exclusivamente SINTÉTICA; nunca usa el Excel privado.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MASTER_HEADERS } from "../src/lib/imports/master.ts";
import { xlsx } from "../tests/fixtures/imports/build.ts";
export async function verifyMaster({ request, appOrigin, sql, interruptStorage }) {
  const endpoint = "/api/importaciones/master";
  const headers = [...MASTER_HEADERS.slice(0, 9), "Balance", ...MASTER_HEADERS.slice(9)];
  const bytes = xlsx([{ name: "SINTETICO", rows: [["SINTETICO"], headers,
    ["SINTETICO", "000001", "", "", "SINTETICO", "SINTETICO", "Advisory", { n: "50" }, "SINTETICO", { n: "100000.12345" }, "", "", "", ""],
    ["SINTETICO", "000002", "", "", "SINTETICO", "SINTETICO", "Advisory", "POR REVISAR", "SINTETICO", { n: "100" }, "", "", "", ""]] }]);
  const form = () => { const f = new FormData(); f.set("file", new File([bytes], "SINTETICO-master.xlsx")); return f; };
  const upload = (admin = true, origin = appOrigin) => request(endpoint, admin, { method: "POST", headers: { Origin: origin }, body: form() });
  const post = (data, admin = true) => request(endpoint, admin, { method: "POST", headers: { Origin: appOrigin, "Content-Type": "application/json" }, body: JSON.stringify(data) });
  assert.equal((await upload(false)).status, 403);
  assert.equal((await upload(true, "https://synthetic.invalid")).status, 403);
  interruptStorage(); assert.equal((await upload()).status, 503);
  const uploaded = await upload(); assert.equal(uploaded.status, 200); const load = await uploaded.json();
  assert.equal(load.master.rows.length, 2); assert.equal(load.master.rows[0].annualRate, "0.005");
  assert.equal(load.master.rows[1].annualRate, null);
  assert.equal((await request(`${endpoint}?id=${load.id}`, false)).status, 403);
  const original = await request(`${endpoint}?id=${load.id}`, true); assert.equal(original.status, 200);
  assert.deepEqual(Buffer.from(await original.arrayBuffer()), Buffer.from(bytes));
  const reopened = await post({ id: load.id, request_id: randomUUID(), operation: "preview" });
  assert.equal(reopened.status, 200); assert.equal((await reopened.json()).master.hash, load.master.hash);
  sql("update app_private.accounts set service='Advisory' where id='20000000-0000-0000-0000-000000000001'");
  const review = { quarter: "2025-10-01", cutoff: "2025-09-30", evidence: "SINTETICO revisión de identidad, base bruta y tasa anual comparable para Q4", identity_confirmed: true,
    brokers: { SINTETICO: "10000000-0000-0000-0000-000000000001" }, accounts: { 3: "20000000-0000-0000-0000-000000000001" }, selected: [3] };
  const preview = await post({ id: load.id, request_id: randomUUID(), operation: "preview", review });
  assert.equal(preview.status, 200); const data = await preview.json(); assert.equal(data.ready, 1);
  const command = { id: load.id, request_id: randomUUID(), operation: "publish", review: { ...review, revision: data.revision } };
  const published = await post(command); assert.equal(published.status, 200); assert.equal((await published.json()).published, 1);
  assert.equal((await post(command)).status, 200);
  assert.equal((await post(command, false)).status, 403);
  assert.equal((await post({ ...command, request_id: randomUUID() })).status, 409);
  console.log("OK Master HTTP: XLSX → Storage privado → revisión → PostgreSQL → fee publicado; pendientes, original, retry, origen y roles.");
}
