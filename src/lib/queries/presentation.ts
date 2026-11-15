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
export function monthLabel(value: string) {
  return `${value.slice(5, 7)}/${value.slice(0, 4)}`;
}
export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

// Solo redondeo de presentación; el porcentaje exacto sigue disponible en el detalle.
export function percent(value: string | null | undefined) {
  if (value == null) return "N/D";
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  let cents = BigInt(whole + fraction.padEnd(2, "0").slice(0, 2));
  if ((fraction[2] ?? "0") >= "5") cents += 1n;
  const digits = cents.toString().padStart(3, "0");
  return `${exact(`${value.startsWith("-") && cents ? "-" : ""}${digits.slice(0, -2)}.${digits.slice(-2)}`)} %`;
}
