import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { queryReport } from "./server.ts";
import { screenParameters, type Search } from "./presentation.ts";

export async function loadScreen(supabase: SupabaseClient, search: Search, commercial: boolean) {
  let parsed;
  try { parsed = screenParameters(search, commercial); }
  catch (error) { return { error: error instanceof Error ? error.message : "Filtros inválidos.", kind: "filters" } as const; }
  try {
    const { data, error } = await queryReport(supabase, parsed.parameters);
    if (error?.code === "40001") return { error: "Los datos cambiaron. Reiniciá la consulta para ver una única revisión.", kind: "revision", params: parsed.params } as const;
    if (error || !data) return { error: "No se pudo consultar la información publicada. Reintentá más tarde.", kind: "query", params: parsed.params } as const;
    return { report: data, params: parsed.params, consultedAt: new Date().toISOString() } as const;
  } catch { return { error: "No se pudo consultar la información publicada. Reintentá más tarde.", kind: "query", params: parsed.params } as const; }
}
