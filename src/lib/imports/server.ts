import "server-only";
import { getAccess } from "../auth/access.ts";
import { LIMITS } from "./contracts.ts";
export const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: privateHeaders });
export async function importAccess(request: Request) {
  const access = await getAccess().catch(() => null);
  if (!access || access.status === "unavailable")
    return reply({ error: "No se pudo verificar el acceso." }, 503);
  if (access.status !== "authorized")
    return reply(
      { error: "Acceso no autorizado." },
      access.status === "anonymous" ? 401 : 403,
    );
  if (access.role !== "admin")
    return reply(
      { error: "Solo administradores realizan esta operación." },
      403,
    );
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.slice(0, -1);
  const origin = `${protocol}://${request.headers.get("host")}`;
  if (request.method !== "GET" && request.headers.get("origin") !== origin)
    return reply({ error: "Origen no autorizado." }, 403);
  return access.supabase;
}
export async function boundedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Falta el contenido de la solicitud.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new Error("La solicitud supera el tamaño permitido.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export const uploadLimit = LIMITS.bytes + 64 * 1024;
