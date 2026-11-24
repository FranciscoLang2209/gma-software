import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IMPORT_VALIDATION_VERSION, LIMITS, requireCurrentValidation, validateOptions } from "./contracts";
import { prepareHistorical, reportSummary } from "./historical";
import { HISTORICAL_LIMITS, readBook, sha256 } from "./read";

// Reutilizar la lectura sólo dentro de esta petición; sin cachear originales entre peticiones.
export async function prepareHistoricalBlocks(supabase: SupabaseClient, id: string) {
  const { data: upload, error: uploadError } = await supabase.from("admin_import_uploads")
    .select("options,manifest,storage_object_path,file_hash,file_size,file_name,status").eq("id", id).single();
  if (uploadError || !upload || upload.status !== "preparing") throw new Error("Preparación histórica no disponible.");
  const { data: children, error: childrenError } = await supabase.from("admin_import_batches")
    .select("id,period,custodian_id,parsing_conventions,totals").eq("upload_id", id)
    .in("status", ["uploaded", "validating"]).order("period").order("custodian_id").limit(5);
  if (childrenError || !children) throw new Error("No se pudieron consultar los cursores.");
  if (!children.length) return { children: [], done: true };
  requireCurrentValidation(upload.manifest);
  const storage = supabase.storage.from("app-papa-imports");
  const original = await storage.download(upload.storage_object_path);
  if (original.error || !original.data || original.data.size !== upload.file_size || original.data.size > LIMITS.bytes)
    throw new Error("Original sin confirmar. Conservá la carga y reintentá.");
  const bytes = new Uint8Array(await original.data.arrayBuffer());
  if (sha256(bytes) !== upload.file_hash) throw new Error("La huella del original no coincide.");
  if (upload.options.references) {
    const ref = upload.options.references;
    const downloaded = await storage.download(`${id}/references.${ref.fileName.split(".").at(-1).toLowerCase()}`);
    if (downloaded.error || !downloaded.data || downloaded.data.size !== ref.fileSize
      || sha256(new Uint8Array(await downloaded.data.arrayBuffer())) !== ref.fileHash)
      throw new Error("REF original sin confirmar. Conservá la carga y reintentá.");
  }
  const book = await readBook(bytes, upload.file_name, upload.options.delimiter, HISTORICAL_LIMITS);
  const history = prepareHistorical(book, upload.options);
  const results = [];
  for (const child of children) {
    const options = validateOptions(child.parsing_conventions.options);
    const parentOptions = validateOptions({ ...upload.options, period: child.period, custodianId: child.custodian_id, custodianCode: options.custodianCode });
    if (JSON.stringify(options) !== JSON.stringify(parentOptions)) throw new Error("La configuración histórica está congelada.");
    const configuration = { ...options, parserVersion: 2, validationVersion: IMPORT_VALIDATION_VERSION };
    const existing = child.parsing_conventions.configuration;
    if (existing && Object.entries(configuration).some(([key, value]) => existing[key] !== value))
      throw new Error("La configuración histórica está congelada.");
    const report = history.partitions.find((p) => p.period === child.period && p.custodianId === child.custodian_id)?.report;
    if (!report) throw new Error("El alcance no coincide con el manifiesto.");
    const cursor = Number(child.totals.processed ?? 0), chunk = [];
    let size = 0;
    for (const row of report.rows.slice(cursor, cursor + LIMITS.chunk)) {
      const rowSize = Buffer.byteLength(JSON.stringify(row));
      if (chunk.length && size + rowSize > LIMITS.chunkBytes) break;
      chunk.push(row); size += rowSize;
    }
    const { data: processed, error } = await supabase.rpc("prepare_import_chunk", {
      target_id: child.id, expected_cursor: cursor, configuration, chunk, summary: reportSummary(report, book),
    });
    if (error || typeof processed !== "number") throw new Error("No se confirmó el bloque. Los cursores guardados permiten retomarlo sin duplicar filas.");
    const done = processed >= report.rows.length;
    results.push({ id: child.id, processed, status: done ? (report.blockingErrors ? "failed" : "needs_resolution") : "validating" });
  }
  return { children: results, done: false };
}
