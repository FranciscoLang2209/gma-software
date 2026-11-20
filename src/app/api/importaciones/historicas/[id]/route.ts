import { LIMITS, UUID } from "@/lib/imports/contracts";
import { sha256 } from "@/lib/imports/read";
import { boundedBody, importAccess, privateHeaders, reply } from "@/lib/imports/server";
import { prepareHistoricalBlocks } from "@/lib/imports/historical-preparation";
export const runtime = "nodejs";
async function manage(request: Request, params: Promise<{ id: string }>) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  const { id } = await params;
  if (!UUID.test(id)) return reply({ error: "Identificador inválido." }, 400);
  if (request.method === "GET" && new URL(request.url).searchParams.get("original") === "1") {
    const { data: upload, error } = await supabase.from("admin_import_uploads").select("storage_object_path,file_hash,file_size,options").eq("id", id).single();
    if (error || !upload) return reply({ error: "Original no disponible." }, 404);
    const reference = new URL(request.url).searchParams.get("reference") === "1" ? upload.options.references : null;
    if (new URL(request.url).searchParams.get("reference") === "1" && !reference) return reply({ error: "REF no disponible." }, 404);
    const path = reference ? `${id}/references.${reference.fileName.split(".").at(-1).toLowerCase()}` : upload.storage_object_path;
    const expectedSize = reference?.fileSize ?? upload.file_size, expectedHash = reference?.fileHash ?? upload.file_hash;
    const download = await supabase.storage.from("app-papa-imports").download(path);
    if (download.error || !download.data || download.data.size > LIMITS.bytes || download.data.size !== expectedSize)
      return reply({ error: "Original sin confirmar en Storage. Reintentá la carga con los mismos bytes." }, 502);
    const bytes = new Uint8Array(await download.data.arrayBuffer());
    if (sha256(bytes) !== expectedHash) return reply({ error: "La huella del original no coincide." }, 409);
    return new Response(bytes, { headers: { ...privateHeaders, "Content-Type": "application/octet-stream", "Content-Disposition": 'attachment; filename="original"' } });
  }
  let operation = "inspect", input = {};
  if (request.method === "POST") {
    try {
      const body = JSON.parse((await boundedBody(request, 8192)).toString("utf8"));
      if (!["prepare", "resolve", "review", "publish"].includes(body.operation) || !body.input || typeof body.input !== "object" || Array.isArray(body.input)) throw new Error();
      operation = body.operation; input = body.input;
    } catch { return reply({ error: "Solicitud inválida." }, 400); }
  }
  if (operation === "prepare") {
    try { return reply(await prepareHistoricalBlocks(supabase, id)); }
    catch (error) { return reply({ error: error instanceof Error ? error.message : "Preparación sin confirmar. Conservá esta carga y reintentá." }, 502); }
  }
  if (operation === "resolve") {
    const selected = input as { child_id?: string; evidence?: string; confirm_exact?: boolean };
    if (!UUID.test(selected.child_id ?? "") || selected.confirm_exact !== true || typeof selected.evidence !== "string" || selected.evidence.trim().length < 10 || selected.evidence.length > 2000)
      return reply({ error: "Confirmá la identidad exacta por custodio e indicá evidencia (10 a 2.000 caracteres)." }, 400);
    const { data, error } = await supabase.rpc("resolve_historical_accounts", { target_id: id, child_id: selected.child_id, evidence: selected.evidence });
    if (error) return reply({ error: "No se confirmó el bloque de correspondencias. Conservá esta carga y revisá el estado antes de reintentar; no se publicaron datos." }, error.code === "42501" ? 403 : 409);
    return reply(data);
  }
  if (operation !== "inspect") {
    const { data: upload, error: sourceError } = await supabase.from("admin_import_uploads").select("storage_object_path,file_hash,file_size,options").eq("id", id).single();
    if (sourceError || !upload) return reply({ error: "Original no disponible." }, 502);
    const sources = [{ path: upload.storage_object_path, hash: upload.file_hash, size: upload.file_size },
      ...(upload.options.references ? [{ path: `${id}/references.${upload.options.references.fileName.split(".").at(-1).toLowerCase()}`, hash: upload.options.references.fileHash, size: upload.options.references.fileSize }] : [])];
    for (const source of sources) {
      const result = await supabase.storage.from("app-papa-imports").download(source.path);
      if (result.error || !result.data || result.data.size !== source.size || sha256(new Uint8Array(await result.data.arrayBuffer())) !== source.hash)
        return reply({ error: "Original o REF sin confirmar. Recuperá la carga antes de revisar/publicar." }, 502);
    }
  }
  const { data, error } = await supabase.rpc("manage_historical", { target_id: id, operation, input });
  if (error) return reply({ error: error.message?.includes("Active version changed")
    ? "Cambió una versión activa. Volvé a conciliar los períodos y revisá toda la carga."
    : "Operación sin confirmar: revisá errores, correspondencias, todos los meses completos y reemplazos. Recargá el estado antes de reintentar. No hubo publicación parcial." }, error.code === "42501" ? 403 : 409);
  return reply(data);
}
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return manage(request, params); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return manage(request, params); }
