import { IMPORT_VALIDATION_VERSION, ImportValidationVersionError, LIMITS, UUID, requireCurrentValidation, validateOptions } from "@/lib/imports/contracts";
import { HISTORICAL_LIMITS, readBook, sha256 } from "@/lib/imports/read";
import { prepare } from "@/lib/imports/validate";
import { prepareHistorical, reportSummary } from "@/lib/imports/historical";
import { boundedBody, importAccess, reply } from "@/lib/imports/server";
import type { SupabaseClient } from "@supabase/supabase-js";
export const runtime = "nodejs";
const fields =
  "id,source,period,custodian_id,status,file_name_original,file_sha256,file_size_bytes,storage_object_path,parsing_conventions,totals,errors,row_count,blocking_error_count,preparation_only,created_at,upload_id";
async function getBatch(supabase: SupabaseClient, id: string) {
  const result = await supabase
    .from("admin_import_batches")
    .select(fields)
    .eq("id", id)
    .single();
  if (result.error || !result.data)
    throw new Error("Preparación no disponible.");
  return result.data;
}
async function getBook(
  supabase: SupabaseClient,
  batch: Awaited<ReturnType<typeof getBatch>>,
) {
  const download = await supabase.storage
    .from("app-papa-imports")
    .download(batch.storage_object_path);
  if (download.error || !download.data)
    throw new Error(
      "Archivo no disponible en Storage. Si la carga falló, reintentala con el original y la misma solicitud.",
    );
  if (download.data.size > LIMITS.bytes)
    throw new Error("Archivo supera 2 MiB.");
  const bytes = new Uint8Array(await download.data.arrayBuffer());
  if (sha256(bytes) !== batch.file_sha256)
    throw new Error("La huella del archivo no coincide. No se procesó.");
  return readBook(
    bytes,
    batch.file_name_original,
    batch.parsing_conventions.options.delimiter,
    batch.upload_id ? HISTORICAL_LIMITS : undefined,
  );
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  const { id } = await params;
  if (!UUID.test(id)) return reply({ error: "Identificador inválido." }, 400);
  try {
    const batch = await getBatch(supabase, id);
    const url = new URL(request.url),
      page = Number(url.searchParams.get("page") ?? 0);
    if (!Number.isInteger(page) || page < 0 || page > 5000)
      return reply({ error: "Página inválida." }, 400);
    let rowsQuery = supabase
      .from("admin_import_rows")
      .select(
        "sheet_name,row_number,original_cells,cell_metadata,status,errors",
        { count: "exact" },
      )
      .eq("batch_id", id)
      .order("row_number")
      .range(page * 25, page * 25 + 24);
    if (url.searchParams.get("errors") === "1")
      rowsQuery = rowsQuery.eq("status", "error");
    const [rows, repeats] = await Promise.all([
      rowsQuery,
      supabase
        .from("admin_import_batches")
        .select("id,source,period,status", { count: "exact" })
        .eq("file_sha256", batch.file_sha256)
        .neq("id", id)
        .limit(10),
    ]);
    if (rows.error || repeats.error)
      return reply({ error: "No se pudo consultar la preparación." }, 502);
    let sheets: string[] = batch.totals.sheets ?? [],
      readError: string | null = null;
    if (batch.status === "uploaded") {
      try {
        sheets = (await getBook(supabase, batch)).sheets.map((s) => s.name);
      } catch (e) {
        readError = (e as Error).message;
      }
    }
    return reply({
      batch,
      rows: rows.data,
      rowMatches: rows.count,
      page,
      sheets,
      readError,
      repeats: repeats.data,
      repeatCount: repeats.count,
    });
  } catch {
    return reply(
      { error: "Preparación no disponible o conexión fallida." },
      502,
    );
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  const { id } = await params;
  if (!UUID.test(id)) return reply({ error: "Identificador inválido." }, 400);
  let input;
  try {
    input = JSON.parse((await boundedBody(request, 8192)).toString("utf8"));
  } catch {
    return reply({ error: "Solicitud inválida." }, 400);
  }
  try {
    const batch = await getBatch(supabase, id);
    if (!["uploaded", "validating"].includes(batch.status))
      return reply({ done: true, processed: batch.totals.processed ?? 0 });
    const options = validateOptions(input.options);
    const uploaded = validateOptions(batch.parsing_conventions.options);
    if (
      options.source !== batch.source ||
      options.period !== batch.period ||
      options.custodianId !== batch.custodian_id ||
      options.custodianCode !== uploaded.custodianCode ||
      options.delimiter !== uploaded.delimiter
    )
      return reply(
        {
          error:
            "El alcance y delimitador están fijados al cargar. Creá otra preparación para cambiarlos.",
        },
        400,
      );
    if (batch.upload_id && (options.sheet !== uploaded.sheet || options.numericFormat !== uploaded.numericFormat))
      return reply({ error: "Hoja y formato históricos están fijados. Retomá desde la carga histórica." }, 409);
    const configuration = { ...options, parserVersion: batch.upload_id ? 2 : 1, validationVersion: IMPORT_VALIDATION_VERSION };
    const existing = batch.parsing_conventions.configuration;
    if (
      existing &&
      Object.entries(configuration).some(([k, v]) => existing[k] !== v)
    )
      return reply(
        {
          error:
            "La configuración o las reglas de validación cambiaron. Conservá esta preparación y creá otra para usar las reglas actuales.",
        },
        409,
      );
    const cursor = Number(batch.totals.processed ?? 0);
    let report;
    let book;
    try {
      book = await getBook(supabase, batch);
      if (batch.upload_id) {
        const { data: upload, error } = await supabase.from("admin_import_uploads").select("options,manifest").eq("id", batch.upload_id).single();
        if (error || !upload) throw new Error("Operación histórica no disponible.");
        requireCurrentValidation(upload.manifest);
        const parentOptions = validateOptions({ ...upload.options, period: batch.period, custodianId: batch.custodian_id, custodianCode: uploaded.custodianCode });
        if (JSON.stringify(options) !== JSON.stringify(parentOptions)) throw new Error("La configuración histórica está congelada.");
        if (upload.options.references) {
          const reference = upload.options.references;
          const path = `${batch.upload_id}/references.${reference.fileName.split(".").at(-1).toLowerCase()}`;
          const original = await supabase.storage.from("app-papa-imports").download(path);
          if (original.error || !original.data || original.data.size !== reference.fileSize || sha256(new Uint8Array(await original.data.arrayBuffer())) !== reference.fileHash)
            throw new Error("REF original no disponible o diferente del revisado.");
        }
        const history = prepareHistorical(book, upload.options);
        report = history.partitions.find((p) => p.period === batch.period && p.custodianId === batch.custodian_id)?.report;
        if (!report) throw new Error("El período ya no coincide con el manifiesto.");
      } else report = prepare(book, options);
    } catch (e) {
      if (e instanceof ImportValidationVersionError) return reply({ error: e.message }, 409);
      // El original ya fue analizado al crear el manifiesto; una indisponibilidad no invalida sus hijos.
      if (batch.upload_id)
        return reply({ error: "No se confirmó el bloque histórico. Verificá o reponé el original desde la carga y reintentá; se conservaron los cursores." }, 502);
      if (cursor)
        return reply(
          {
            error:
              "La lectura ya no coincide con el proceso iniciado. Conservá esta preparación y creá otra.",
          },
          409,
        );
      const summary = {
        rowCount: 0,
        blockingErrors: 1,
        total: null,
        valueCount: 0,
        errors: [{ code: "read_error", message: (e as Error).message }],
        sheets: [],
        warnings: [],
      };
      const save = await supabase.rpc("prepare_import_chunk", {
        target_id: id,
        expected_cursor: 0,
        configuration,
        chunk: [],
        summary,
      });
      if (save.error)
        return reply(
          { error: "No se pudo registrar el error de lectura; reintentá." },
          502,
        );
      return reply({ done: true, processed: 0 });
    }
    const chunk = [];
    let bytes = 0;
    for (const row of report.rows.slice(cursor, cursor + LIMITS.chunk)) {
      const size = Buffer.byteLength(JSON.stringify(row));
      if (chunk.length && bytes + size > LIMITS.chunkBytes) break;
      chunk.push(row);
      bytes += size;
    }
    const summary = reportSummary(report, book);
    const { data: processed, error } = await supabase.rpc(
      "prepare_import_chunk",
      { target_id: id, expected_cursor: cursor, configuration, chunk, summary },
    );
    if (error)
      return reply(
        {
          error:
            "No se confirmó el lote. Reintentá; el cursor evita duplicar filas.",
        },
        502,
      );
    return reply({ processed, done: processed >= report.rows.length });
  } catch {
    return reply(
      {
        error:
          "No se pudo procesar la preparación. Revisá configuración y conexión.",
      },
      400,
    );
  }
}
