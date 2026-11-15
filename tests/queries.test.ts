import assert from "node:assert/strict";
import test from "node:test";
import { parse as parseCsv } from "csv-parse/sync";
import { parseReportParameters, reportCsv, type Report } from "../src/lib/queries/contracts.ts";

const parse = (query: string) => parseReportParameters(new URLSearchParams(query));
test("consultas: filtros tipados, mismos parámetros para JSON y CSV", () => {
  const query = "desde=2026-01&hasta=2026-02&custodio=10000000-0000-0000-0000-000000000001&equipo=50000000-0000-0000-0000-000000000001&comercial=30000000-0000-0000-0000-000000000001&cliente=40000000-0000-0000-0000-000000000001&cuenta=20000000-0000-0000-0000-000000000001&servicio=sin_clasificar&agrupar=team&limite=25";
  const json = parse(query), csv = parse(`${query}&formato=csv`);
  assert.deepEqual(json.parameters, csv.parameters);
  assert.equal(csv.format, "csv");
  assert.equal(json.parameters.month_from, "2026-01-01");
  assert.equal(json.parameters.page_size, 25);
  assert.equal(json.parameters.group_by, "team");
});
test("consultas: rechaza parámetros ambiguos, inyección y paginación sin revisión", () => {
  for (const query of [
    "desde=2026-13&hasta=2026-02", "desde=2026-02&hasta=2026-01", "desde=2026-01&hasta=2036-01",
    "desde=2026-01&hasta=2026-02&cuenta=x%27OR%201=1", "desde=2026-01&hasta=2026-02&agrupar=unknown",
    "desde=2026-01&hasta=2026-02&desde=2026-03", "desde=2026-01&hasta=2026-02&role=admin",
    "desde=2026-01&hasta=2026-02&limite=251", "desde=2026-01&hasta=2026-02&limite=0",
    "desde=2026-01&hasta=2026-02&offset=-1", "desde=2026-01&hasta=2026-02&offset=1",
    "desde=2026-01&hasta=2026-02&revision=malformed", "desde=2026-01&hasta=2026-02&servicio=",
    `desde=2026-01&hasta=2026-02&formato=csv-completo&offset=1&revision=${"a".repeat(32)}`,
  ]) assert.throws(() => parse(query), query);
  assert.equal(parse(`desde=2026-01&hasta=2026-02&offset=25&revision=${"a".repeat(32)}`).parameters.page_offset, 25);
  assert.doesNotThrow(() => parse("desde=2026-01&hasta=2035-12"));
  assert.equal(parse("desde=2026-01&hasta=2026-02&formato=csv-completo").format, "csv-completo");
});

test("CSV: exactitud, negativos, faltantes, filtros y fórmulas de texto inertes", () => {
  // Fixture SINTÉTICO de serialización; las cifras y permisos se verifican en PostgreSQL.
  const metrics = {
    key: "sin_asignar", label: '\t=HYPERLINK("SINTETICO")', aum_usd: "100.123456789123456789", revenue_usd: "-0.05",
    aum_rows: 1, aum_values: 1, revenue_rows: 3, revenue_values: 3,
    accounts_with_aum: 1, clients_with_aum: 0, aum_accounts_without_client: 1, accounts_with_revenue: 1,
    aum_missing_accounts: 0, revenue_missing_account_months: 0, aum_accounts_without_advisor: 1,
    revenue_accounts_without_advisor: 1, aum_accounts_without_team: 1, revenue_accounts_without_team: 1,
    aum_without_advisor_usd: "100.123456789123456789", revenue_without_advisor_usd: "-0.05",
  };
  const report: Report = {
    revision: "a".repeat(32), period: { from: "2026-01-01", to: "2026-02-01", aum_closing_month: "2026-02-01" },
    filters: { service: "@SINTETICO", account: null }, attribution: "month_end", coverage_basis: "expected_coverage_unconfirmed",
    total: { ...metrics, key: "total", label: "Total" },
    months: [{ ...metrics, period: "2026-02-01", previous_period: "2026-01-01", aum_change_usd: null,
      aum_change_percent: null, revenue_change_usd: "-1", revenue_change_percent: null }],
    coverage: [{ period: "2026-02-01", custodian_id: "10000000-0000-0000-0000-000000000001", source: "revenue", published: false }],
    group_by: "team", row_count: 251, offset: 250, limit: 250, rows: [metrics],
  };
  const csv = reportCsv(report);
  assert.match(csv, /"100\.123456789123456789","-0\.05"/);
  assert.match(csv, /"'\t=HYPERLINK\(""SINTETICO""\)"/);
  assert.match(csv, /"'@SINTETICO"/);
  assert.match(csv, /"N\/D"/);
  assert.match(csv, /"filas_totales","251"/);
  assert.match(csv, /expected_coverage_unconfirmed/);
  assert.ok(!csv.includes("'-0.05"), "no altera negativos financieros");
  for (const label of ["=1+1", "+1", "-1", "@SINTETICO", "  \u0001=1", "\ttexto", "\rtexto", "\ntexto", "＝1+1", "＋1", "－1", "＠texto", '\",=1\r\n;SINTETICO']) {
    const encoded = reportCsv({ ...report, rows: [{ ...metrics, label }] });
    const records: string[][] = parseCsv(encoded, { bom: true, relax_column_count: true });
    const cells = records.find((r) => r[0] === "fila")!;
    assert.equal(cells[2], label.startsWith('"') ? label : `'${label}`);
    assert.equal(cells[3], metrics.aum_usd);
    assert.equal(cells[4], "-0.05");
    assert.equal(cells.length, records.find((r) => r[0] === "tipo")!.length);
    assert.equal(cells[16], "1", "cuentas sin cliente exportadas");
    assert.equal(cells[19], metrics.aum_without_advisor_usd);
    assert.equal(cells[21], "N/D", "participación ausente no se vuelve cero");
  }
  const zero = parseCsv(reportCsv({ ...report, rows: [{ ...metrics, label: "SINTETICO", aum_usd: "0", revenue_usd: null }] }), { bom: true, relax_column_count: true }).find((r: string[]) => r[0] === "fila");
  assert.ok(zero);
  assert.equal(zero[3], "0"); assert.equal(zero[4], "N/D");
});
