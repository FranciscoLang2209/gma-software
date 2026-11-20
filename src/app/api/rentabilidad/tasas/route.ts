import { boundedBody, importAccess, reply } from "@/lib/imports/server";
import { parseRoaRatePublication } from "@/lib/roa/contracts";
import { roaFailure } from "@/lib/roa/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const access = await importAccess(request).catch(() => null);
  if (!access) return reply({ error: "No se pudo verificar el acceso." }, 503);
  if (access instanceof Response) return access;
  let input;
  try { input = parseRoaRatePublication(JSON.parse((await boundedBody(request, 65536)).toString("utf8"))); }
  catch { return reply({ error: "Publicación inválida. Revisá UUID, versión anterior y evidencia de comparabilidad." }, 400); }
  try {
    const { data, error } = await access.rpc("publish_roa_rate", input);
    if (error || !data) {
      const failure = roaFailure(error?.code);
      return reply({ error: failure.message }, failure.status);
    }
    return reply(data);
  } catch { return reply({ error: "No se pudo publicar la referencia Advisory." }, 503); }
}
