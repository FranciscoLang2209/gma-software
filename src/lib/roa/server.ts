import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoaParameters, RoaReport } from "./contracts.ts";

export async function queryQuarterlyRoa(supabase: SupabaseClient, parameters: RoaParameters) {
  const { data, error } = await supabase.rpc("quarterly_roa_report_ref", { ...parameters, reference_filters: parameters.reference_filters ?? {} });
  return { data: data as RoaReport | null, error };
}

export function roaFailure(code?: string): { status: number; message: string } {
  if (code === "40001") return { status: 409, message: "Los datos cambiaron. Reiniciá la consulta y revisá las versiones." };
  if (code === "42501") return { status: 403, message: "Acceso no autorizado." };
  if (code === "22023" || code === "22P02") return { status: 400, message: "Filtros o referencia de tasa inválidos." };
  if (code === "57014") return { status: 504, message: "La consulta superó el tiempo disponible. Reintentá o acotá los filtros." };
  return { status: 503, message: "No se pudo consultar o publicar la información ROA." };
}
