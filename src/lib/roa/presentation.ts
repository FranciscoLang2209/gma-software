import { parseRoaParameters, type RoaMetrics, type RoaParameters } from "./contracts.ts";
import type { Search } from "../queries/presentation.ts";

export const ROA_FILTERS = { custodio: "Custodio", equipo: "Equipo", comercial: "Comercial", cliente: "Cliente", cuenta: "Cuenta" } as const;
export const ROA_STATUS: Record<RoaMetrics["calculation_status"], string> = {
  calculable: "Calculable · provisional", incomplete: "Cobertura incompleta", zero_aum: "AUM promedio cero",
  negative_aum: "AUM promedio negativo", no_data: "Sin registros incluidos", open_quarter: "Trimestre abierto",
};
export const FEE_STATUS: Record<RoaMetrics["advisory_fee_status"], string> = {
  not_applicable: "No aplicable a este conjunto", verified_reference: "Referencia publicada comparable",
  obsolete: "Referencia obsoleta · requiere revisión", insufficient_coverage: "Ponderación no disponible · revisar AUM y tasas",
};
export function roaScreenParameters(search: Search) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value)) value.forEach(v => params.append(key, v));
    else if (value !== undefined && value !== "") params.set(key, value);
  }
  // La pantalla pide un trimestre explícito; no transforma rangos mensuales.
  if (!params.has("anio") && !params.has("trimestre")) {
    parseRoaParameters(new URLSearchParams([...params, ["anio", "1900"], ["trimestre", "1"]]));
    return { params, parameters: null };
  }
  return { params, parameters: parseRoaParameters(params) };
}
export function roaHref(params: URLSearchParams, changes: Record<string, string | null> = {}) {
  const next = new URLSearchParams(params);
  next.delete("offset"); next.delete("revision");
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) next.delete(key); else next.set(key, value);
  }
  return `/rentabilidad?${next}`;
}
export function roaYearQuarters(parameters: RoaParameters) {
  return [1, 2, 3, 4].map(quarter => ({
    ...parameters, report_quarter: quarter,
    group_by: "account" as const, page_size: 1, page_offset: 0, expected_revision: null,
  }));
}
export type RoaTrendPoint = {
  label: string; quarter: number; total: RoaMetrics | null; advisory: RoaMetrics | null; error: string | null;
};
