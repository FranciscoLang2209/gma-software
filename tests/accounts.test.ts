import assert from "node:assert/strict";
import test from "node:test";
import { accountParameters, accountHref } from "../src/lib/accounts/contracts.ts";
import { parseModelRequest } from "../src/lib/model/contracts.ts";
test("cuentas: búsqueda textual con ceros, filtros y revisión de página", () => {
  const id = "20000000-0000-0000-0000-000000000001";
  const parsed = accountParameters({ desde: "2026-01", hasta: "2026-02", buscar: "000123", orden: "revenue", equipo: id });
  assert.equal(parsed.parameters.search_text, "000123");
  assert.equal(parsed.parameters.team, id);
  assert.equal(parsed.parameters.sort_by, "revenue");
  const href = accountHref(`/cuentas/${id}`, new URLSearchParams(parsed.params.toString()+`&offset=25&revision=${"a".repeat(32)}`));
  assert.ok(href.includes("buscar=000123") && href.includes(`equipo=${id}`));
  assert.ok(!href.includes("offset") && !href.includes("revision"));
  for (const invalid of [{ buscar: ["0", "1"] }, { orden: "sql" }, { buscar: "a".repeat(201) }, { offset: "25" }, { agrupar: "team" }])
    assert.throws(() => accountParameters(invalid));
});
test("administración: solo entrada explícita de revisión o token de guardado", () => {
  const review_id = "10000000-0000-0000-0000-000000000001";
  assert.deepEqual(parseModelRequest({ operation: "save", review_id }), { operation: "save", review_id });
  assert.equal(parseModelRequest({ operation: "preview", entity: "clients", input: { name: "SINTETICO" }, reason: " Alta explícita " }).reason, "Alta explícita");
  for (const invalid of [{ operation: "delete" }, { operation: "preview", entity: "__proto__", reason: "SINTETICO", input: {} },
    { operation: "save", review_id, input: { name: "forged" } }, { operation: "preview", entity: "clients", input: [], reason: "SINTETICO" }])
    assert.throws(() => parseModelRequest(invalid));
});
