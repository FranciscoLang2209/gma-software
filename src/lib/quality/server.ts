import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QualityFilters,QualityReport } from "./contracts.ts";
export async function queryQuality(supabase:SupabaseClient,filters:QualityFilters) {
 const { data,error }=await supabase.rpc("quality_report",{filters});
 return {data:data as QualityReport|null,error};
}
export function qualityFailure(code?:string) {
 if (code==="40001") return {status:409,message:"Cambió el diagnóstico. Reiniciá la consulta o generá otra vista previa antes de continuar."};
 if (code==="42501") return {status:403,message:"Solo administradores habilitados acceden a Calidad de datos."};
 if (code==="57014") return {status:504,message:"La consulta superó el tiempo disponible. Elegí un período o custodio más acotado."};
 return {status:503,message:"No se pudo consultar Calidad de datos. Reintentá; no se sustituyeron datos por ceros."};
}
