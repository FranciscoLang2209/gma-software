import { UUID, validateOptions, validateSourceReview } from "@/lib/imports/contracts";
import { prepareHistorical, referencePairs, type HistoricalOptions } from "@/lib/imports/historical";
import { checkFile, HISTORICAL_LIMITS, readBook, sha256 } from "@/lib/imports/read";
import { boundedBody, importAccess, reply } from "@/lib/imports/server";
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
    const body = await boundedBody(request, 2 * 2 * 1024 * 1024 + 64 * 1024);
    const form = await new Response(body, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("file"), id = String(form.get("requestId"));
    if (!(file instanceof File) || !UUID.test(id)) throw new Error("Archivo o solicitud inválidos.");
    checkFile(file.name, file.size);
    const raw = JSON.parse(String(form.get("options")));
    const multi = raw.multiCustodian === true;
    if (multi && raw.source !== "aum" && raw.source !== "revenue") throw new Error("Elegí AUM o Revenue.");
    const [{ data: available, error: custodianError }, { data: previous, error: previousError }] = await Promise.all([
      supabase.from("admin_custodians").select("id,code").eq("active", true).order("id"),
      supabase.from("admin_import_uploads").select("options").eq("id", id).limit(1),
    ]);
    if (previousError) throw new Error("No se pudo verificar el reintento. Conservá los archivos y la solicitud.");
    // Una recuperación reutiliza el catálogo congelado, aunque después se registren otros custodios.
    const custodians = multi && previous?.[0]?.options.multiCustodian ? previous[0].options.custodians : available;
    if (custodianError || !custodians?.length) throw new Error("Registrá los custodios en Configuración.");
    const validated = validateOptions({ ...raw, source: multi ? raw.source : "aum", period: "1900-01-01",
      ...(multi ? { custodianId: custodians[0].id, custodianCode: custodians[0].code } : {}) });
    if (!custodians.some((c: { id: string; code: string }) => c.id === validated.custodianId && c.code === validated.custodianCode)) throw new Error("Custodio no disponible.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const book = await readBook(bytes, file.name, validated.delimiter, multi ? HISTORICAL_LIMITS : undefined);
    if (!validated.sheet && book.sheets.length !== 1) throw new Error("El libro tiene varias hojas: indicá explícitamente cuál importar. Las restantes se registrarán como excluidas.");
    const options: HistoricalOptions = {
      source: validated.source, custodianId: validated.custodianId, custodianCode: validated.custodianCode,
      sheet: validated.sheet || book.sheets[0].name, numericFormat: validated.numericFormat, delimiter: validated.delimiter,
    };
    let referenceBytes: Uint8Array | undefined;
    if (multi) {
      const excludedRows = raw.excludedRows ?? [];
      if (!Array.isArray(excludedRows) || excludedRows.length > 100 || excludedRows.some((n: unknown) => !Number.isInteger(n)) || typeof (raw.exclusionReason ?? "") !== "string" || (raw.exclusionReason?.length ?? 0) > 2000)
        throw new Error("Revisá filas excluidas y motivo (máximo 100 filas).");
      Object.assign(options, { multiCustodian: true, headerRow: raw.headerRow ?? 0, excludedRows, exclusionReason: raw.exclusionReason ?? "", custodians });
      const sourceReview = validateSourceReview(raw.sourceReview);
      if (sourceReview) options.sourceReview = sourceReview;
      if (options.source === "aum") {
        const references = form.get("references");
        if (!(references instanceof File) || !references.size) throw new Error("Adjuntá bd_REF para determinar los custodios de AUM.");
        checkFile(references.name, references.size);
        referenceBytes = new Uint8Array(await references.arrayBuffer());
        const referenceBook = await readBook(referenceBytes, references.name, validated.delimiter);
        const requestedSheet = raw.referenceSheet ?? raw.references?.sheet ?? "";
        if (!requestedSheet && referenceBook.sheets.length !== 1) throw new Error("Indicá la hoja de REF si tiene varias.");
        const parsed = referencePairs(referenceBook, requestedSheet || referenceBook.sheets[0].name);
        options.references = { fileName: references.name, fileHash: sha256(referenceBytes), fileSize: referenceBytes.length, ...parsed };
      }
    }
    const { manifest } = prepareHistorical(book, options);
    const { data, error } = await supabase.rpc("manage_historical", { target_id: id, operation: "begin", input: {
      file_name: file.name, file_hash: sha256(bytes), file_size: bytes.length, options, manifest,
    } });
    if (error && ["57014", "55P03", "PGRST003"].includes(error.code))
      return reply({ id, retryable: true, error: "La base agotó el tiempo disponible al registrar la carga. Reintentá con los mismos archivos y formulario; se conserva la solicitud para evitar duplicados. No se publicaron datos." }, 503);
    if (error || !data) return reply({ error: "No se registró la carga. Revisá límites (1.024 alcances / 25.000 filas), configuración y solicitud; reintentá con los mismos datos." }, 409);
    const storage = supabase.storage.from("app-papa-imports");
    const path = data.upload.storage_object_path;
    const originals = [{ path, bytes }, ...(referenceBytes && options.references ? [{ path: `${id}/references.${options.references.fileName.split(".").at(-1)!.toLowerCase()}`, bytes: referenceBytes }] : [])];
    for (const original of originals) {
      const uploaded = await storage.upload(original.path, original.bytes, { upsert: false, contentType: "application/octet-stream" });
      if (uploaded.error) {
        const existing = await storage.download(original.path);
        if (existing.error || !existing.data || sha256(new Uint8Array(await existing.data.arrayBuffer())) !== sha256(original.bytes))
          return reply({ id, error: "Carga registrada; original o REF sin confirmar en Storage. Reintentá con la misma solicitud y archivos." }, 502);
      }
    }
    return reply({ id });
  } catch (e) {
    return reply({ error: e instanceof Error ? e.message : "Carga inválida." }, 400);
  }
}
