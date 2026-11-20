import test from "node:test";
import assert from "node:assert/strict";
import { roaYearQuarters, roaHref, roaScreenParameters, ROA_STATUS, FEE_STATUS } from "../src/lib/roa/presentation.ts";

const account = "20000000-0000-0000-0000-000000000001";
test("Pantalla ROA: trimestre explícito y filtros conservados al llegar desde otra vista", () => {
  assert.equal(roaScreenParameters({}).parameters, null);
  assert.equal(roaScreenParameters({ cuenta: account, servicio: "Advisory" }).parameters, null);
  const selected = roaScreenParameters({ anio: "2026", trimestre: "1", cuenta: account, servicio: "Advisory", equipo: account });
  assert.equal(selected.parameters?.team, account);
  assert.equal(selected.parameters?.account, account);
  for (const search of [{ desde: "2026-01" }, { anio: "2026" }, { anio: ["2025", "2026"], trimestre: "1" }, { cuenta: "bad" }, { servicio: "desconocido" }])
    assert.throws(() => roaScreenParameters(search));
});
test("Pantalla ROA: páginas fijan revisión y reinicio conserva todos los filtros", () => {
  const params = new URLSearchParams(`anio=2026&trimestre=1&cuenta=${account}&servicio=Advisory&agrupar=team&offset=25&revision=${"a".repeat(32)}`);
  const restarted = new URL(roaHref(params), "https://synthetic.invalid").searchParams;
  assert.equal(restarted.get("cuenta"), account);
  assert.equal(restarted.get("agrupar"), "team");
  assert.equal(restarted.has("offset"), false);
  assert.equal(restarted.has("revision"), false);
  const next = new URL(roaHref(params, { offset: "50", revision: "b".repeat(32) }), "https://synthetic.invalid").searchParams;
  assert.equal(next.get("revision"), "b".repeat(32));
  assert.equal(next.get("offset"), "50");
  assert.equal(params.get("offset"), "25");
});
test("Pantalla ROA: comparación T1–T4 del mismo año, conserva AND y descarta página/revisión ajenas", () => {
  const p = roaScreenParameters({ anio: "2026", trimestre: "1", cuenta: account, servicio: "Advisory", offset: "25", revision: "a".repeat(32) }).parameters!;
  const previous = roaYearQuarters(p);
  assert.deepEqual(previous.map(q => [q.report_year, q.report_quarter]), [[2026, 1], [2026, 2], [2026, 3], [2026, 4]]);
  assert.ok(previous.every(q => q.account === account && q.service_filter === "Advisory" && q.expected_revision === null && q.page_offset === 0 && q.page_size === 1));
  assert.deepEqual(roaYearQuarters({ ...p, report_year: 1900 }).map(q => q.report_year), [1900, 1900, 1900, 1900]);
  for (const quarter of [1, 2, 3, 4]) assert.deepEqual(roaYearQuarters({ ...p, report_quarter: quarter }).map(q => q.report_quarter), [1, 2, 3, 4]);
  assert.equal(ROA_STATUS.open_quarter, "Trimestre abierto");
  assert.match(FEE_STATUS.obsolete, /obsoleta/);
});
