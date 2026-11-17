import assert from "node:assert/strict";
import test from "node:test";
import { commissionCsv, commissionFilters, commissionHref, compareDecimal, commissionSort, type CommissionDashboard, type CommissionRow } from "../src/lib/commissions/dashboard.ts";

test("comisiones: orden exacto más allá de Number, negativos y ausencias al final", () => {
  assert.equal(compareDecimal("9007199254740993.123456789", "9007199254740993.123456788"), 1);
  assert.equal(compareDecimal("-0.1", "-0.01"), -1);
  assert.equal(compareDecimal("1.000", "1"), 0);
  const rows = [{ variance: "-0.01" }, { variance: null }, { variance: "-0.1" }, { variance: "0" }];
  assert.deepEqual(commissionSort(rows, "variance", true).map(r => r.variance), ["0", "-0.01", "-0.1", null]);
  assert.equal(rows[0].variance, "-0.01");
});
test("comisiones: filtros y enlaces conservan identidad literal; cambian página explícitamente", () => {
  const params = { owner: "=Dueño + Sintético", vista: "cuentas", page: "5", secret: "excluir", year: "2026", broker: ["ambiguo"] };
  assert.deepEqual(commissionFilters(params), { year: "2026", owner: params.owner });
  const href = commissionHref(params, { vista: "representantes", page: null });
  assert.ok(href.includes("year=2026") && !href.includes("page=") && !href.includes("secret="));
  assert.equal(new URL(href, "http://localhost").searchParams.get("owner"), params.owner);
});
test("comisiones: CSV completo por vista, precisión, N/D, trazabilidad e injection", () => {
  const row = { account: "000001", owner: " \t=HYPERLINK(\"x\")", holder: "@SUM(1)", balance: "9007199254740993.123456789", expected_quarterly: "999.666", verified: false,
    actual_received: "-0.0000000001", variance: "-2.34567890123456789", status: "variance", source_file: "+archivo.xlsx", source_row: "2", evidence: "línea\ncon coma, y comillas \"", receipt_evidence: [{ id: "referencia" }] } as unknown as CommissionRow;
  const report = { revision: "rev", rows: [row], owners: [{ owner: row.owner }], quarters: [{ quarter: "2026-01-01" }] } as unknown as CommissionDashboard;
  for (const view of ["cuentas", "representantes", "resumen", "conciliaciones"]) {
    const csv = commissionCsv(report, view, { owner: row.owner! });
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes('"000001"') && csv.includes('"9007199254740993.123456789"'));
    assert.ok(csv.includes('"-2.34567890123456789"') && csv.includes('"N/D"'));
    assert.ok(csv.includes('"\' \t=HYPERLINK(') && csv.includes('"\'@SUM(1)"') && csv.includes('"\'+archivo.xlsx"'));
    assert.ok(!csv.includes('999.666'));
    assert.ok(csv.includes('receipt_evidence') && csv.includes('referencia'));
  }
});
