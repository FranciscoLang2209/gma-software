import { randomUUID } from "node:crypto";
import { boundedBody, importAccess, privateHeaders, reply, uploadLimit } from "@/lib/imports/server";
import { prepareMaster } from "@/lib/imports/master";
import { UUID, type NumericFormat } from "@/lib/imports/contracts";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  const id = new URL(request.url).searchParams.get("id");
  if (!UUID.test(id ?? "")) return reply({ error: "UUID inválido." }, 400);
  const { data, error } = await supabase.storage.from("app-papa-imports").download(`master/${id}/original.xlsx`);
  if (error || !data) return reply({ error: "Original no disponible." }, 404);
  return new Response(data, { headers: { ...privateHeaders, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="master-owners.xlsx"' } });
}
export async function POST(request: Request) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  try {
    const body = await boundedBody(request, uploadLimit);
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      const form = await new Request(request.url, { method: "POST", headers: { "content-type": request.headers.get("content-type")! }, body }).formData();
      const file = form.get("file");
      if (!(file instanceof File)) return reply({ error: "Elegí el Master Owners XLSX." }, 400);
      const bytes = Buffer.from(await file.arrayBuffer());
      const master = await prepareMaster(bytes, file.name, String(form.get("sheet") ?? ""), String(form.get("numericFormat") ?? "undefined") as NumericFormat);
      const id = randomUUID(), path = `master/${id}`;
      const original = await supabase.storage.from("app-papa-imports").upload(`${path}/original.xlsx`, bytes, { upsert: false, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      if (original.error) return reply({ error: "No se guardó el original privado. Reintentá la carga." }, 503);
      const manifest = await supabase.storage.from("app-papa-imports").upload(`${path}/manifest.json`, JSON.stringify(master), { upsert: false, contentType: "application/json" });
      if (manifest.error) return reply({ error: "No se guardó la preparación; ninguna tasa fue publicada. Reintentá la carga." }, 503);
      return reply({ id, master });
    }
    const { id, request_id, operation, review } = JSON.parse(body.toString("utf8"));
    if (!UUID.test(id ?? "") || !UUID.test(request_id ?? "") || !["preview", "publish"].includes(operation)) return reply({ error: "Operación inválida." }, 400);
    const path = `master/${id}`;
    const { data, error } = await supabase.storage.from("app-papa-imports").download(`${path}/manifest.json`);
    if (error || !data) return reply({ error: "Preparación no disponible. Revisá el UUID de carga." }, 404);
    const master = JSON.parse(await data.text());
    if (operation === "preview" && !review) return reply({ id, master });
    const result = await supabase.rpc("import_master", { request_id, operation, input: { master, storage_path: `${path}/original.xlsx`, review } });
    if (result.error) return reply({ error: result.error.code === "40001" ? "Las tasas cambiaron. Volvé a conciliar antes de publicar." : "No se guardó la revisión. Revisá cuentas, selección, trimestre y evidencia; no se publicó parcialmente." }, 409);
    return reply(result.data);
  } catch (error) {
    return reply({ error: error instanceof Error && /^(Fila |Se esperan|Elegí|Master Owners|El Master|Formato |Celdas |El archivo|Libro |La hoja|El libro)/.test(error.message) ? error.message : "Solicitud inválida o servicio no disponible. Ninguna tasa fue publicada parcialmente." }, 400);
  }
}
