import { parseReportParameters, type Report } from "./contracts.ts";

export const FILTERS = ["desde", "hasta", "custodio", "equipo", "comercial", "cliente", "cuenta", "servicio"] as const;
export const DIMENSIONS = { custodian: "Custodio", team: "Equipo", advisor: "Comercial", client: "Cliente", account: "Cuenta", service: "Servicio" } as const;
export const ENTITY_FILTERS = { custodio: "Custodio", equipo: "Equipo", comercial: "Comercial", cliente: "Cliente", cuenta: "Cuenta", servicio: "Servicio" } as const;
export type Search = Record<string, string | string[] | undefined>;

export function screenParameters(search: Search, commercial: boolean, now = new Date()) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (value !== undefined && value !== "") params.set(key, value);
  }
  const current = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit" }).format(now);
  if (!params.has("desde")) params.set("desde", params.get("hasta") ?? current);
  if (!params.has("hasta")) params.set("hasta", params.get("desde")!);
  if (!params.has("agrupar")) params.set("agrupar", commercial ? "custodian" : "account");
  if (!params.has("limite")) params.set("limite", "25");
  if (params.has("formato")) throw new Error("Usá la API para elegir formato de exportación.");
  return { params, parameters: parseReportParameters(params).parameters };
}

export function reportHref(path: string, params: URLSearchParams, changes: Record<string, string | null> = {}) {
  const next = new URLSearchParams();
  for (const key of FILTERS) if (params.has(key)) next.set(key, params.get(key)!);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) next.delete(key); else next.set(key, value);
  }
  return `${path}?${next}`;
}

export function exportHref(params: URLSearchParams, report: Report) {
  return reportHref("/api/consultas", params, { formato: "csv-completo", agrupar: report.group_by, revision: report.revision });
}

// Formato exacto: agrupa texto decimal; no redondea ni convierte importes a Number.
export function exact(value: string | null | undefined) {
  if (value == null) return "N/D";
  const [integer, rawFraction] = value.split(".");
  const fraction = rawFraction?.replace(/0+$/, "");
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (fraction ? `,${fraction}` : "");
}
export function usd(value: string | null | undefined) {
  return value == null ? "N/D" : `USD ${exact(value)}`;
}

// Redondeo decimal de presentación; los cálculos y el detalle conservan el original.
function rounded(value: string) {
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  let cents = BigInt(whole + fraction.padEnd(2, "0").slice(0, 2));
  if ((fraction[2] ?? "0") >= "5") cents += 1n;
  const digits = cents.toString().padStart(3, "0");
  return `${value.startsWith("-") && cents ? "-" : ""}${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export function usdRounded(value: string | null | undefined) {
  if (value == null) return "N/D";
  const [whole, fraction] = rounded(value).split(".");
  return `USD ${exact(whole)},${fraction}`;
}

export function reportWarnings(report: Pick<Report, "total" | "coverage" | "period">) {
  const t = report.total, warnings: string[] = [];
  if (!t.aum_rows) warnings.push(`Sin registros de AUM al cierre de ${monthLabel(report.period.to)}. N/D no significa saldo cero.`);
  else if (t.aum_missing_accounts) warnings.push(`AUM al cierre: ${t.aum_missing_accounts} cuentas del universo observado sin foto mensual; el total incluye sólo los importes conocidos.`);
  if (!t.revenue_rows) warnings.push("Sin registros de Revenue en el rango seleccionado. N/D no significa ingresos cero.");
  if (t.aum_rows > t.aum_values) warnings.push(`AUM: ${t.aum_rows - t.aum_values} registros sin importe; la suma conocida es parcial.`);
  if (t.revenue_rows > t.revenue_values) warnings.push(`Revenue: ${t.revenue_rows - t.revenue_values} registros sin Payout broker; la suma conocida es parcial.`);
  if (report.coverage.some((c) => !c.published)) warnings.push("Hay meses o custodios observados sin publicación de AUM o Revenue. Revisá la cobertura por fuente; la completitud esperada aún no está confirmada.");
  if (t.aum_accounts_without_client) warnings.push(`Clasificación de clientes pendiente: ${t.aum_accounts_without_client} cuentas con AUM al cierre no tienen cliente vinculado.`);
  if (t.aum_accounts_without_advisor || t.revenue_accounts_without_advisor) warnings.push(`Sin asignación comercial al cierre de sus meses: ${t.aum_accounts_without_advisor} cuentas AUM y ${t.revenue_accounts_without_advisor} cuentas Revenue. Vincular cuentas entre fuentes no acredita un comercial ni su vigencia.`);
  if (t.aum_accounts_without_team || t.revenue_accounts_without_team) warnings.push(`Sin equipo al cierre de sus meses: ${t.aum_accounts_without_team} cuentas AUM y ${t.revenue_accounts_without_team} cuentas Revenue. Los importes sin asignar permanecen en los totales.`);
  return warnings;
}
export function monthLabel(value: string) {
  return `${value.slice(5, 7)}/${value.slice(0, 4)}`;
}
export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

// Solo redondeo de presentación; el porcentaje exacto sigue disponible en el detalle.
export function percent(value: string | null | undefined) {
  if (value == null) return "N/D";
  return `${exact(rounded(value))} %`;
}
