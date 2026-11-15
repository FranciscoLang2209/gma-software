import { boundedBody, importAccess, reply } from "@/lib/imports/server";
import { parseModelRequest } from "@/lib/model/contracts";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  let parameters;
  try { parameters = parseModelRequest(JSON.parse((await boundedBody(request, 16384)).toString("utf8"))); }
  catch { return reply({ error: "Solicitud inválida. Revisá los campos y el motivo (3 a 2000 caracteres)." }, 400); }
  try {
    const { data, error } = await supabase.rpc("manage_model", parameters);
    if (!error) return reply(data);
    if (error.code === "42501") return reply({ error: "Solo administradores modifican el modelo." }, 403);
    const message = error.code === "40001" ? "Cambió el modelo o venció la revisión. Recargá y revisá el efecto nuevamente." :
      error.code === "23P01" || error.message?.includes("overlaps") ? "Las vigencias se superponen. Revisá las fechas; hasta es exclusiva. Los FA publicados se corrigen por importación versionada." :
      ["23503", "P0002", "23514", "22P02", "22007", "22008", "23502", "22023", "23505"].includes(error.code) ? "Revisá referencias activas, campos obligatorios, fechas y códigos únicos." :
      "No se confirmó el cambio. Recargá para verificar el estado antes de reintentar.";
    return reply({ error: message }, 409);
  } catch { return reply({ error: "No se pudo verificar el cambio. Recargá antes de reintentar." }, 503); }
}
