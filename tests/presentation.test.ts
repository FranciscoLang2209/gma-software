import assert from "node:assert/strict";
import test from "node:test";
import { dateLabel, exact, exportHref, percent, ratePercent, reportHref, reportWarnings, screenParameters, usd, usdRounded } from "../src/lib/queries/presentation.ts";
import type { Report } from "../src/lib/queries/contracts.ts";

test("presentación: redondeo visual a dos decimales, negativos, cero y ausencia", () => {
  assert.equal(exact("100.123456789123456789"), "100,12");
  assert.equal(exact("-1234567.05"), "-1.234.567,05");
  assert.equal(exact("0"), "0");
  assert.equal(exact("20.0000000000000000"), "20");
  assert.equal(percent("54.5454545454545455"), "54,55 %");
  assert.equal(percent("-0.005"), "-0,01 %");
  assert.equal(percent("99.999"), "100 %");
  assert.equal(percent("-0.004"), "0 %");
  assert.equal(exact(null), "N/D");
  assert.equal(exact("999.995"), "1.000");
  assert.equal(exact("9007199254740993.015"), "9.007.199.254.740.993,02");
  assert.equal(exact("-0.004"), "0");
});
test("indicadores: redondeo decimal a centavos sin modificar la entrada", () => {
  const original = "1234567.556789123456789123"; // SINTÉTICO
  assert.equal(usdRounded(original), "USD 1.234.567,56");
  assert.equal(usd(original), "USD 1.234.567,56");
  assert.equal(usdRounded("999.995"), "USD 1.000,00");
  assert.equal(usdRounded("-0.005"), "USD -0,01");
  assert.equal(usdRounded("-0.004"), "USD 0,00");
  assert.equal(usdRounded("9007199254740993.015"), "USD 9.007.199.254.740.993,02");
  assert.equal(usdRounded("0"), "USD 0,00");
  assert.equal(usdRounded(null), "N/D");
  assert.equal(usdRounded(undefined), "N/D");
});

test("avisos: separan ausencia, cero, importe desconocido y clasificación pendiente", () => {
  const report: Pick<Report, "total" | "period" | "coverage"> = {
    period: { from: "2026-01-01", to: "2026-09-01", aum_closing_month: "2026-09-01" },
    coverage: [],
    total: {
      key: "total", label: "SINTÉTICO", aum_usd: "0", revenue_usd: "0",
      aum_rows: 1, aum_values: 1, revenue_rows: 1, revenue_values: 1,
      accounts_with_aum: 1, clients_with_aum: 1, aum_accounts_without_client: 0, accounts_with_revenue: 1,
      aum_missing_accounts: 0, revenue_missing_account_months: 0,
      aum_accounts_without_advisor: 0, revenue_accounts_without_advisor: 0,
      aum_accounts_without_team: 0, revenue_accounts_without_team: 0,
      aum_without_advisor_usd: null, revenue_without_advisor_usd: null,
    },
  };
  assert.deepEqual(reportWarnings(report), [], "cero publicado y conocido no es ausencia");
  const missing = { ...report, total: { ...report.total, aum_rows: 0, aum_values: 0, aum_usd: null, revenue_rows: 2, revenue_values: 1 } };
  assert.match(reportWarnings(missing).join(" "), /Sin registros de AUM al cierre de 09\/2026/);
  assert.match(reportWarnings(missing).join(" "), /1 registros sin Payout broker/);
  assert.ok(!reportWarnings(missing).join(" ").includes("Sin registros de Revenue"));
  const unassigned = { ...report, total: { ...report.total, aum_accounts_without_client: 1, revenue_accounts_without_advisor: 1, revenue_accounts_without_team: 1 } };
  assert.match(reportWarnings(unassigned).join(" "), /clientes pendiente/);
  assert.match(reportWarnings(unassigned).join(" "), /Vincular cuentas entre fuentes no acredita un comercial/);
  assert.match(reportWarnings(unassigned).join(" "), /Sin equipo/);
  const partial = { ...report, coverage: [{ period: "2026-09-01", source: "aum" as const, custodian_id: "SINTETICO", published: false }], total: { ...report.total, aum_missing_accounts: 2, aum_values: 0, revenue_rows: 0, revenue_values: 0 } };
  assert.match(reportWarnings(partial).join(" "), /2 cuentas del universo observado sin foto/);
  assert.match(reportWarnings(partial).join(" "), /1 registros sin importe/);
  assert.match(reportWarnings(partial).join(" "), /Sin registros de Revenue/);
  assert.match(reportWarnings(partial).join(" "), /sin publicación de AUM o Revenue/);
});
test("pantallas: parámetros compartidos, rango explícito y validación del contrato", () => {
  const now = new Date("2026-03-01T01:00:00Z");
  assert.equal(screenParameters({}, false, now).parameters.month_from, "2026-02-01");
  assert.equal(screenParameters({ desde: "2026-01" }, true).parameters.month_to, "2026-01-01");
  for (const bad of [{ cuenta: "Nombre privado" }, { desde: ["2026-01", "2026-02"] }, { formato: "csv" }])
    assert.throws(() => screenParameters(bad, true));
});
test("enlaces: conservan filtros por ID y reinician paginación al cambiar población", () => {
  const id = "20000000-0000-0000-0000-000000000001";
  const params = new URLSearchParams(`desde=2026-01&hasta=2026-02&cuenta=${id}&agrupar=account&offset=25&revision=${"a".repeat(32)}`);
  const href = reportHref("/analisis-comercial", params, { agrupar: "team" });
  assert.ok(href.includes(`cuenta=${id}`));
  assert.ok(href.includes("agrupar=team"));
  assert.ok(!href.includes("revision") && !href.includes("offset"));
  const download = exportHref(params, { group_by: "team", revision: "b".repeat(32) } as Parameters<typeof exportHref>[1]);
  const parsed = new URL(download, "http://synthetic.invalid").searchParams;
  assert.equal(parsed.get("cuenta"), id); assert.equal(parsed.get("desde"), "2026-01");
  assert.equal(parsed.get("hasta"), "2026-02"); assert.equal(parsed.get("revision"), "b".repeat(32));
  assert.equal(parsed.get("formato"), "csv-completo"); assert.equal(parsed.get("agrupar"), "team");
  assert.equal(parsed.has("offset"), false); assert.equal(parsed.has("limite"), false);
});

test("tasas anuales se muestran como porcentaje sin ocultar el fee por redondear la proporción", () => {
  assert.equal(ratePercent("0.005"), "0,5 %");
  assert.equal(ratePercent("0.00251234"), "0,25 %");
  assert.equal(ratePercent("0"), "0 %");
  assert.equal(ratePercent(null), "N/D");
});

test("fecha: hora Buenos Aires estable en 24 horas para servidor y navegador", () => {
  assert.equal(dateLabel("2026-11-25T20:00:00Z"), "25/11/26, 17:00");
  assert.equal(dateLabel("2026-11-25T03:00:00Z"), "25/11/26, 00:00");
});
