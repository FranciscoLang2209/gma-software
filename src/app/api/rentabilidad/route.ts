import { getAccess } from "@/lib/auth/access";
import { reply } from "@/lib/imports/server";
import { parseRoaParameters } from "@/lib/roa/contracts";
import { queryQuarterlyRoa, roaFailure } from "@/lib/roa/server";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const access = await getAccess().catch(() => null);
  if (!access || access.status === "unavailable") return reply({ error: "No se pudo verificar el acceso." }, 503);
  if (access.status !== "authorized") return reply({ error: "Acceso no autorizado." }, access.status === "anonymous" ? 401 : 403);
  let parameters;
  try { parameters = parseRoaParameters(new URL(request.url).searchParams); }
  catch (error) { return reply({ error: error instanceof Error ? error.message : "Filtros inválidos." }, 400); }
  try {
    const { data, error } = await queryQuarterlyRoa(access.supabase, parameters);
    if (error || !data) {
      const failure = roaFailure(error?.code);
      return reply({ error: failure.message }, failure.status);
    }
    return reply(data);
  } catch { return reply({ error: "No se pudo consultar la información ROA." }, 503); }
}
