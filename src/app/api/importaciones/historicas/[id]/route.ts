import { LIMITS, UUID } from "@/lib/imports/contracts";
import { sha256 } from "@/lib/imports/read";
import { boundedBody, importAccess, privateHeaders, reply } from "@/lib/imports/server";
export const runtime = "nodejs";
async function manage(request: Request, params: Promise<{ id: string }>) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  const { id } = await params;
  if (!UUID.test(id)) return reply({ error: "Identificador inválido." }, 400);
  if (request.method === "GET" && new URL(request.url).searchParams.get("original") === "1") {
    const { data: upload, error } = await supabase.from("admin_import_uploads").select("storage_object_path,file_hash,file_size").eq("id", id).single();
    if (error || !upload) return reply({ error: "Original no disponible." }, 404);
    const download = await supabase.storage.from("app-papa-imports").download(upload.storage_object_path);
    if (download.error || !download.data || download.data.size > LIMITS.bytes || download.data.size !== upload.file_size)
      return reply({ error: "Original sin confirmar en Storage. Reintentá la carga con los mismos bytes." }, 502);
    const bytes = new Uint8Array(await download.data.arrayBuffer());
    if (sha256(bytes) !== upload.file_hash) return reply({ error: "La huella del original no coincide." }, 409);
    return new Response(bytes, { headers: { ...privateHeaders, "Content-Type": "application/octet-stream", "Content-Disposition": 'attachment; filename="original"' } });
  }
  let operation = "inspect", input = {};
  if (request.method === "POST") {
    try {
      const body = JSON.parse((await boundedBody(request, 8192)).toString("utf8"));
      if (!["review", "publish"].includes(body.operation) || !body.input || typeof body.input !== "object") throw new Error();
      operation = body.operation; input = body.input;
    } catch { return reply({ error: "Solicitud inválida." }, 400); }
  }
  const { data, error } = await supabase.rpc("manage_historical", { target_id: id, operation, input });
  if (error) return reply({ error: error.message?.includes("Active version changed")
    ? "Cambió una versión activa. Volvé a conciliar los períodos y revisá toda la carga."
    : "Operación sin confirmar: revisá errores, correspondencias, todos los meses completos y reemplazos. Recargá el estado antes de reintentar. No hubo publicación parcial." }, error.code === "42501" ? 403 : 409);
  return reply(data);
}
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return manage(request, params); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return manage(request, params); }
