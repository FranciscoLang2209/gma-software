"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Table } from "@radix-ui/themes";
import { Select } from "./ui/select";
import type { prepareHistorical, HistoricalOptions } from "@/lib/imports/historical";
import type { PreparedRow } from "@/lib/imports/contracts";

type Manifest = ReturnType<typeof prepareHistorical>["manifest"];
type Detail = {
  upload: { id: string; file_name: string; status: string; options: HistoricalOptions; manifest: Manifest; review: { token: string } | null };
  children: { id: string; period: string; version: number; custodian_id: string; status: string; processed: number; rows: number; errors: number;
    comparison: { active: { id: string; version: number; rows: number; total: string | null } | null;
      candidate: { rows: number; total: string | null }; same_file: boolean; row_changes: { added: number; removed: number } } }[];
};
const states: Record<string, string> = { preparing: "Preparación", uploaded: "Original registrado", validating: "Validando", needs_resolution: "Correspondencias pendientes", ready: "Revisada", failed: "Errores bloqueantes", published: "Publicada", superseded: "Reemplazada" };
async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "No se pudo completar la operación.");
  return data;
}
export function HistoricalImport({ custodians, initialId = "" }: { custodians: { id: string; code: string; name: string }[]; initialId?: string }) {
  const [source, setSource] = useState<"aum" | "revenue">("aum");
  const [multiple, setMultiple] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [recent, setRecent] = useState<{ id: string; file_name: string; status: string }[]>([]);
  const [openId, setOpenId] = useState(initialId);
  const [busy, setBusy] = useState(false), [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestId = useRef<string | null>(null), paused = useRef(false), inFlight = useRef(false);
  useEffect(() => () => { paused.current = true; }, []);
  const url = (id: string) => `/api/importaciones/historicas/${id}`;
  async function load(id: string) {
    const data: Detail = await api(url(id)); setDetail(data); setOpenId(id); return data;
  }
  async function run(work: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try { await work(); } catch (e) { setError((e as Error).message); }
    finally { inFlight.current = false; setBusy(false); setProcessing(false); }
  }
  async function upload(event: FormEvent<HTMLFormElement>, restore = false) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await run(async () => {
      if (restore && detail) {
        form.set("requestId", detail.upload.id);
        form.set("options", JSON.stringify(detail.upload.options));
      } else {
        const custodian = custodians.find((c) => c.id === form.get("custodian"));
        if (!multiple && !custodian) throw new Error("Elegí un custodio.");
        requestId.current ??= crypto.randomUUID();
        form.set("requestId", requestId.current);
        form.set("options", JSON.stringify({ source, custodianId: custodian?.id, custodianCode: custodian?.code,
          ...(multiple ? { multiCustodian: true, headerRow: Number(form.get("headerRow") || 0), referenceSheet: form.get("referenceSheet"),
            excludedRows: String(form.get("excludedRows") || "").split(",").filter((n) => n.trim()).map(Number), exclusionReason: form.get("exclusionReason") } : {}),
          sheet: form.get("sheet"), numericFormat: form.get("numericFormat"), delimiter: form.get("delimiter") }));
      }
      const data = await api("/api/importaciones/historicas", { method: "POST", body: form });
      requestId.current = null; await load(data.id);
    });
  }
  async function process() {
    if (!detail) return;
    await run(async () => {
      setProcessing(true); paused.current = false;
      let state = await load(detail.upload.id);
      for (const child of state.children) {
        if (!["uploaded", "validating"].includes(child.status)) continue;
        let done = false;
        while (!done && !paused.current) {
          const result = await api(`/api/importaciones/${child.id}`, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ options: { source: state.upload.options.source, sheet: state.upload.options.sheet,
              numericFormat: state.upload.options.numericFormat, delimiter: state.upload.options.delimiter,
              period: child.period, custodianId: child.custodian_id,
              custodianCode: state.upload.manifest.partitions.find((p) => p.period === child.period && p.custodianId === child.custodian_id)?.custodianCode ?? state.upload.options.custodianCode } }) });
          done = result.done;
          state = { ...state, children: state.children.map((c) => c.id === child.id ? { ...c, processed: result.processed,
            status: done ? (state.upload.manifest.partitions.find((p) => p.period === c.period && p.custodianId === c.custodian_id)?.summary.blockingErrors ? "failed" : "needs_resolution") : "validating" } : c) };
          setDetail(state);
        }
        if (paused.current) break;
      }
      await load(state.upload.id);
      setNotice(paused.current ? "Pausa confirmada. Podés retomar desde los cursores guardados." : "Validación finalizada. Resolvé y conciliá cada período antes de revisar la carga completa.");
    });
  }
  async function manage(operation: string, input: object) {
    if (!detail) return;
    await api(url(detail.upload.id), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, input }) });
    await load(detail.upload.id);
  }
  async function downloadErrors() {
    if (!detail) return;
    const errors: unknown[] = [...detail.upload.manifest.errors, ...detail.upload.manifest.unroutable];
    for (const child of detail.children) {
      if (!child.errors && !detail.upload.manifest.partitions.find((p) => p.period === child.period && p.custodianId === child.custodian_id)?.summary.blockingErrors) continue;
      let page = 0, count = 1;
      while (page * 25 < count) {
        const result = await api(`/api/importaciones/${child.id}?page=${page}&errors=1`);
        errors.push(...result.batch.errors, ...result.rows.map((r: PreparedRow) => ({ period: child.period, ...r })));
        count = result.rowMatches; page++;
      }
    }
    const href = URL.createObjectURL(new Blob([JSON.stringify(errors, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = href; link.download = `errores-historicos-${detail.upload.id}.json`; link.click(); URL.revokeObjectURL(href);
  }
  const manifest = detail?.upload.manifest;
  const totalRows = manifest?.partitions.reduce((n, p) => n + p.summary.rowCount, 0) ?? 0;
  const processed = detail?.children.reduce((n, c) => n + c.processed, 0) ?? 0;
  const blocked = !!manifest && (manifest.errors.length > 0 || manifest.unroutable.length > 0 || manifest.partitions.some((p) => p.summary.blockingErrors > 0));
  const canReview = !!detail?.children.length && detail.children.every((c) => c.status === "ready") && !blocked;
  return <section className="panel import-panel">
    <h2>Importación histórica de AUM y Revenue</h2>
    <p>Archivo → Análisis → Períodos detectados → Validación → Correspondencias → Comparación → Publicación → Resultado.</p>
    <p>Cargá el archivo completo con todos sus custodios y meses. Para AUM adjuntá también REF: se verifica el par de números de cuenta y se toma su Broker. Revenue usa CUSTODIO de cada fila. No se crean asignaciones comerciales ni se rellenan meses ausentes.</p>
    <p>Hasta 2 MiB por archivo, 25.000 filas de hoja (incluye encabezados), 32 MiB descomprimidos y 1.024 alcances mes/custodio. Máximo 5.000 filas por alcance. Cada archivo financiero se revisa y publica como una unidad.</p>
    {!custodians.length && <p role="alert">Primero registrá los custodios en <Link href="/configuracion?entidad=custodians">Configuración</Link>.</p>}
    <form className="import-form" onSubmit={(e) => void upload(e)} onChange={() => { requestId.current = null; }}>
      <label>Fuente<Select name="source" value={source} disabled={busy} onChange={(e) => { requestId.current = null; setSource(e.target.value as "aum" | "revenue"); if (e.target.value === "revenue") setMultiple(true); }}><option value="aum">AUM</option><option value="revenue">Revenue (REV)</option></Select></label>
      <label><input type="checkbox" checked={multiple} disabled={busy || source === "revenue"} onChange={(e) => setMultiple(e.target.checked)} /> El archivo contiene varios custodios</label>
      {!multiple && <label>Custodio<Select name="custodian" required disabled={busy}><option value="">Elegí custodio</option>{custodians.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</Select></label>}
      <label>Hoja XLSX (vacío si hay una sola)<input name="sheet" maxLength={100} disabled={busy} /></label>
      {multiple && <label>Fila de encabezados (vacío para detectar)<input type="number" min="1" max="100" name="headerRow" disabled={busy} /></label>}
      {multiple && source === "aum" && <>
        <label>Archivo REF de correspondencias<input type="file" name="references" accept=".xlsx,.csv" required disabled={busy} /></label>
        <label>Hoja REF (vacío si hay una sola)<input name="referenceSheet" maxLength={100} disabled={busy} /></label>
      </>}
      {multiple && <details><summary>Anotaciones o subtotales que no son datos</summary>
        <p>Primero analizá el archivo. Si hay anotaciones sin cuenta, período ni importe, podés volver a cargarlo indicando sus filas y el motivo. No se permite excluir movimientos o fotos financieras.</p>
        <label>Filas a excluir, separadas por coma<input name="excludedRows" maxLength={1000} placeholder="Ej.: 200, 201" disabled={busy} /></label>
        <label>Motivo de exclusión<textarea name="exclusionReason" maxLength={2000} disabled={busy} /></label>
      </details>}
      <label>Formato de importes<Select name="numericFormat" defaultValue="undefined" disabled={busy}><option value="undefined">Sin definir</option><option value="dot">1,234.56 — punto decimal</option><option value="comma">1.234,56 — coma decimal</option></Select></label>
      <label>Delimitador CSV<Select name="delimiter" defaultValue="," disabled={busy}><option value=",">Coma</option><option value=";">Punto y coma</option><option value={"\t"}>Tabulación</option></Select></label>
      <label>Original XLSX sin macros o CSV UTF-8<input name="file" type="file" accept=".xlsx,.csv" required disabled={busy} /></label>
      {multiple && source === "aum" && <label><input type="checkbox" required disabled={busy} /> Revisé REF: Broker identifica al custodio y los pares ACC # Addepar / ACCOUNT corresponden a las referencias de AUM. No autorizo asignaciones comerciales históricas con este archivo.</label>}
      <Button disabled={busy || !custodians.length}>Analizar y guardar original</Button>
    </form>
    <form className="import-form" onSubmit={(e) => { e.preventDefault(); void run(async () => { await load(openId); }); }}>
      <label>Retomar carga por UUID<input value={openId} onChange={(e) => setOpenId(e.target.value)} list="historical-uploads" required disabled={busy} /><datalist id="historical-uploads">{recent.map((u) => <option key={u.id} value={u.id}>{u.file_name} · {states[u.status] ?? u.status}</option>)}</datalist></label>
      <Button disabled={busy || !openId}>Abrir carga</Button>
      <Button type="button" variant="soft" disabled={busy} onClick={() => void run(async () => { setRecent((await api("/api/importaciones/historicas")).uploads); })}>Consultar cargas recientes</Button>
    </form>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {detail && manifest && <>
      <h3>{detail.upload.file_name} · {states[detail.upload.status]}</h3>
      <p>Operación: {detail.upload.id}. Original único privado, particiones y versiones vinculadas. Conservá este UUID para retomar.</p>
      <p><a href={`${url(detail.upload.id)}?original=1`}>Descargar original privado</a></p>
      {detail.upload.options.references && <p>REF conservado: {detail.upload.options.references.fileName} · {detail.upload.options.references.pairs.length} pares · <a href={`${url(detail.upload.id)}?original=1&reference=1`}>Descargar REF privado</a>. Sólo se usa para identidad y custodio; no se aplican Grupo ni Owner al pasado.</p>}
      {detail.upload.status === "preparing" && <details><summary>Recuperar una carga cuyo original no llegó a Storage</summary>
        <form className="import-form" onSubmit={(e) => void upload(e, true)}>
          <p>Seleccioná exactamente el mismo archivo. Se verifican nombre, bytes, configuración y manifiesto; se conserva esta operación y sus cursores.</p>
          <label>Original pendiente<input type="file" name="file" accept=".xlsx,.csv" required disabled={busy} /></label>
          {detail.upload.options.references && <label>El mismo REF<input type="file" name="references" accept=".xlsx,.csv" required disabled={busy} /></label>}
          <Button disabled={busy}>Verificar / reponer original</Button>
        </form>
      </details>}
      <p>Hoja incluida: {manifest.sheet}. Encabezados en fila {manifest.headerRow ?? 1}. Filas excluidas con motivo: {manifest.excludedRows?.length ?? 0}. Hojas excluidas: {manifest.excludedSheets.join(", ") || "ninguna"}. Filas vacías: {manifest.blankRows}. Filas sin alcance válido: {manifest.unroutable.length}.</p>
      {manifest.errors.map((e, i) => <p role="alert" key={i}>{e.message}</p>)}
      {!!manifest.unroutable.length && <details open><summary>Filas sin mes/custodio válido ({manifest.unroutable.length})</summary>
        <ul>{[...new Set(manifest.unroutable.map((r) => r.errors[0].message))].slice(0, 50).map((message) => <li key={message}>{message}</li>)}</ul>
        <p>Primeras filas: {manifest.unroutable.slice(0, 25).map((r) => r.row).join(", ")}. Descargá los errores para revisar el detalle. Si falta un custodio, registralo en Configuración y volvé a analizar los mismos originales.</p>
      </details>}
      {blocked && <p role="alert">Hay errores bloqueantes. Ningún período de este archivo se podrá publicar; corregí el original y creá otra carga.</p>}
      <p role="status">Preparación persistida: {processed} / {totalRows} filas · {detail.children.length} alcances mes/custodio detectados.</p>
      <progress value={processed} max={Math.max(totalRows, 1)} aria-label="Filas preparadas" />
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Períodos y comparación histórica">
        <Table.Root className="data-table"><Table.Header><Table.Row>{["Año / mes", "Custodio", "Cuentas", "Importe USD (archivo)", "Errores", "Duplicados de cuenta", "Progreso", "Estado / versión", "Versión activa / USD", "Comparación / correspondencias"].map((h) => <Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>)}</Table.Row></Table.Header>
          <Table.Body>{detail.children.map((child) => {
            const p = manifest.partitions.find((p) => p.period === child.period && (p.custodianId ?? detail.upload.options.custodianId) === child.custodian_id)!;
            return <Table.Row key={child.id}><Table.Cell>{child.period.slice(0, 7)}</Table.Cell><Table.Cell>{p.custodianCode ?? detail.upload.options.custodianCode}</Table.Cell><Table.Cell>{p.summary.distinctAccounts}</Table.Cell><Table.Cell>{p.summary.total ?? "N/D"}</Table.Cell><Table.Cell>{p.summary.blockingErrors}</Table.Cell><Table.Cell>{p.summary.duplicateAccounts}</Table.Cell><Table.Cell>{child.processed} / {p.summary.rowCount}</Table.Cell><Table.Cell>{states[child.status]} · v{child.version}</Table.Cell><Table.Cell>{child.comparison.active ? `v${child.comparison.active.version} · ${child.comparison.active.total ?? "N/D"}` : "Sin versión publicada"}{child.comparison.same_file && " · Mismo archivo"}</Table.Cell><Table.Cell><Link href={`/correspondencias?lote=${child.id}`}>Resolver y conciliar</Link><p>{child.comparison.row_changes.added} agregadas / {child.comparison.row_changes.removed} retiradas. Candidata: {child.comparison.candidate.total ?? "N/D"} USD.</p></Table.Cell></Table.Row>;
          })}</Table.Body>
        </Table.Root>
      </div>
      <div className="pagination-controls">
        <Button disabled={busy || !detail.children.some((c) => ["uploaded", "validating"].includes(c.status))} onClick={() => void process()}>Validar / retomar bloques</Button>
        {processing && <Button variant="soft" onClick={() => { paused.current = true; }}>Pausar al confirmar bloque</Button>}
        <Button variant="soft" disabled={busy} onClick={() => void run(async () => { await load(detail.upload.id); })}>Recargar estado</Button>
        <Button variant="soft" disabled={busy} onClick={() => void run(downloadErrors)}>Descargar errores JSON</Button>
      </div>
      {detail.upload.status !== "published" && <form className="import-form" onSubmit={(e) => { e.preventDefault(); void run(async () => { await manage("review", { confirm_all: true }); setNotice("Carga completa revisada. Confirmá la publicación conjunta."); }); }}>
        <label><input type="checkbox" required disabled={busy || !canReview} /> Confirmo todos los alcances mensuales completos de cada custodio; revisé los períodos, correspondencias, omisiones y cada reemplazo. Un archivo parcial debe completarse antes de reemplazar una foto existente.</label>
        <Button disabled={busy || !canReview}>Revisar toda la carga</Button>
      </form>}
      {detail.upload.status === "ready" && <form className="import-form publish-confirmation" key={detail.upload.review?.token} onSubmit={(e) => { e.preventDefault(); void run(async () => { await manage("publish", { token: detail.upload.review?.token }); setNotice("Publicación conjunta confirmada. Las versiones anteriores se conservaron."); }); }}>
        <label><input type="checkbox" required disabled={busy} /> Autorizo publicar todos los períodos y reemplazar únicamente las versiones activas indicadas en esta comparación.</label>
        <Button disabled={busy}>Publicar carga completa</Button>
      </form>}
      {detail.upload.status === "published" && <p role="status">Resultado: {detail.children.length} alcances publicados conjuntamente, {totalRows} filas conservadas con su procedencia. {detail.children.filter((c) => c.status === "superseded").length} períodos fueron reemplazados posteriormente; esta carga no se reactiva al reintentar. El AUM de un rango sigue siendo el cierre de su último mes.</p>}
    </>}
  </section>;
}
