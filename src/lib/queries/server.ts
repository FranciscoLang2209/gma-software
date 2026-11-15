import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Report, ReportParameters } from "./contracts.ts";

// Siempre con el cliente SSR del usuario; la misma RPC decide filtros, vigencias y permisos.
export async function queryReport(supabase: SupabaseClient, parameters: ReportParameters) {
  const { data, error } = await supabase.rpc("aggregate_report", parameters);
  return { data: data as Report | null, error };
}
