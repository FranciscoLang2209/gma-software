import { UUID, validateOptions } from "@/lib/imports/contracts";
import { prepareHistorical } from "@/lib/imports/historical";
import { checkFile, readBook, sha256 } from "@/lib/imports/read";
import { boundedBody, importAccess, reply, uploadLimit } from "@/lib/imports/server";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  const { data, error } = await supabase.from("admin_import_uploads")
    .select("id,file_name,status,created_at").order("created_at", { ascending: false }).limit(50);
  return error ? reply({ error: "No se pudo consultar el historial." }, 502) : reply({ uploads: data });
}

export async function POST(request: Request) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  try {
    const body = await boundedBody(request, uploadLimit);
    const form = await new Response(body, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("file"), id = String(form.get("requestId"));
    if (!(file instanceof File) || !UUID.test(id)) throw new Error("Archivo o solicitud inválidos.");
    checkFile(file.name, file.size);
    const validated = validateOptions({ ...JSON.parse(String(form.get("options"))), source: "aum", period: "1900-01-01" });
    const { data: custodian, error: custodianError } = await supabase.from("admin_custodians").select("id,code").eq("id", validated.custodianId).single();
    if (custodianError || custodian?.code !== validated.custodianCode) throw new Error("Custodio no disponible.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const book = await readBook(bytes, file.name, validated.delimiter);
    if (!validated.sheet && book.sheets.length !== 1) throw new Error("El libro tiene varias hojas: indicá explícitamente cuál importar. Las restantes se registrarán como excluidas.");
    const options = {
      source: validated.source, custodianId: validated.custodianId, custodianCode: validated.custodianCode,
      sheet: validated.sheet || book.sheets[0].name, numericFormat: validated.numericFormat, delimiter: validated.delimiter,
    };
    const { manifest } = prepareHistorical(book, options);
    const { data, error } = await supabase.rpc("manage_historical", { target_id: id, operation: "begin", input: {
      file_name: file.name, file_hash: sha256(bytes), file_size: bytes.length, options, manifest,
    } });
    if (error || !data) return reply({ error: "No se registró la carga. Revisá límites (120 períodos / 5.000 filas), configuración y solicitud; reintentá con los mismos datos." }, 409);
    const storage = supabase.storage.from("app-papa-imports");
    const path = data.upload.storage_object_path;
    const uploaded = await storage.upload(path, bytes, { upsert: false, contentType: "application/octet-stream" });
    if (uploaded.error) {
      const existing = await storage.download(path);
      if (existing.error || !existing.data || sha256(new Uint8Array(await existing.data.arrayBuffer())) !== sha256(bytes))
        return reply({ id, error: "Carga registrada; original sin confirmar en Storage. Reintentá con la misma solicitud y archivo." }, 502);
    }
    return reply({ id });
  } catch (e) {
    return reply({ error: e instanceof Error ? e.message : "Carga inválida." }, 400);
  }
}
