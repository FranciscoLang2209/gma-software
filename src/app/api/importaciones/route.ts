import { checkFile, sha256 } from "@/lib/imports/read";
import { UUID, validateOptions } from "@/lib/imports/contracts";
import {
  boundedBody,
  importAccess,
  reply,
  uploadLimit,
} from "@/lib/imports/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  let form: FormData;
  try {
    const bytes = await boundedBody(request, uploadLimit);
    form = await new Response(bytes, {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    return reply(
      { error: "Carga inválida o demasiado grande. Máximo 2 MiB por archivo." },
      400,
    );
  }
  const file = form.get("file"),
    requestId = String(form.get("requestId"));
  let options;
  try {
    if (!(file instanceof File) || !UUID.test(requestId))
      throw new Error("Archivo o solicitud inválidos.");
    checkFile(file.name, file.size);
    options = validateOptions(JSON.parse(String(form.get("options"))));
  } catch (e) {
    return reply({ error: (e as Error).message }, 400);
  }
  if (!(file instanceof File))
    return reply({ error: "Falta el archivo." }, 400);
  const { data: custodian, error: custodianError } = await supabase
    .from("admin_custodians")
    .select("id,code")
    .eq("id", options.custodianId)
    .single();
  if (custodianError || !custodian || custodian.code !== options.custodianCode)
    return reply({ error: "Custodio no disponible; recargá la página." }, 400);
  const bytes = Buffer.from(await file.arrayBuffer()),
    hash = sha256(bytes);
  const { data: id, error } = await supabase.rpc("begin_import", {
    request_id: requestId,
    source_type: options.source,
    target_period: options.period,
    custodian: options.custodianId,
    file_name: file.name,
    file_hash: hash,
    file_size: bytes.length,
    conventions: { options },
  });
  if (error || !id)
    return reply(
      {
        error:
          "No se pudo registrar la preparación. Reintentá con los mismos datos.",
      },
      502,
    );
  const { data: batch, error: batchError } = await supabase
    .from("admin_import_batches")
    .select("storage_object_path")
    .eq("id", id)
    .single();
  if (batchError || !batch)
    return reply(
      {
        id,
        error:
          "Preparación registrada; no se pudo localizar su archivo. Reintentá la carga.",
      },
      502,
    );
  const storage = supabase.storage.from("app-papa-imports");
  const upload = await storage.upload(batch.storage_object_path, bytes, {
    upsert: false,
    contentType: "application/octet-stream",
  });
  if (upload.error) {
    const existing = await storage.download(batch.storage_object_path);
    if (
      existing.error ||
      !existing.data ||
      sha256(new Uint8Array(await existing.data.arrayBuffer())) !== hash
    )
      return reply(
        {
          id,
          error:
            "Preparación registrada, pero el archivo no está confirmado en Storage. Reintentá esta misma carga.",
        },
        502,
      );
  }
  return reply({ id });
}
