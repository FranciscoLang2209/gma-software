"use client";
import { useRef, useState, type FormEvent } from "react";
import { Button, Table } from "@radix-ui/themes";
import type { MasterFile } from "@/lib/imports/master";
import { exact, usd, ratePercent } from "@/lib/queries/presentation";
import { Select } from "./ui/select";

type Preview = { revision: string; ready: number; published: number; snapshot_rows: number; rows: { row: number; account_id: string | null; service: string | null; problem: string | null; selected: boolean; previous_rate: string | null }[] };
type Custodian = { id: string; code: string; name: string };
const endpoint = "/api/importaciones/master";
export function MasterImport({ custodians }: { custodians: Custodian[] }) {
  const [load, setLoad] = useState<{ id: string; master: MasterFile } | null>(null), [openId, setOpenId] = useState("");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [brokers, setBrokers] = useState<Record<string, string>>({}), [accounts, setAccounts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<number[]>([]), [preview, setPreview] = useState<Preview | null>(null), [published, setPublished] = useState(false);
  const retry = useRef<{ body: string; id: string } | null>(null);
  async function api(body: FormData | object) {
    const multipart = body instanceof FormData;
    const response = await fetch(endpoint, { method: "POST", headers: multipart ? undefined : { "Content-Type": "application/json" }, body: multipart ? body : JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "No se completó la operación.");
    return result;
  }
  async function run(task: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await task(); } catch (e) { setMessage(e instanceof Error ? e.message : "Operación no disponible."); } finally { setBusy(false); }
  }
  function loaded(result: { id: string; master: MasterFile }) {
    setLoad(result); setOpenId(result.id); setBrokers({}); setAccounts({}); setSelected([]); setPreview(null); setPublished(false);
    setMessage("Original privado guardado. Conservá el UUID para retomar la preparación.");
  }
  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter), operation = form.get("publish") === "yes" ? "publish" : "preview";
    await run(async () => {
      const evidence = String(form.get("evidence") ?? "");
      const config = { quarter: form.get("quarter"), cutoff: form.get("cutoff"), evidence, brokers, accounts, selected,
        identity_confirmed: form.get("identity") === "on", numeric_accounts_confirmed: form.get("numeric") === "on",
        revision: operation === "publish" ? preview?.revision : undefined };
      const body = JSON.stringify({ id: load!.id, operation, review: config });
      const requestId = retry.current?.body === body ? retry.current.id : crypto.randomUUID();
      retry.current = { body, id: requestId };
      const result = await api({ ...JSON.parse(body), request_id: requestId }) as Preview;
      setPreview(result);
      if (operation === "publish") { setPublished(true); setMessage(`Snapshot conservado: ${result.snapshot_rows} filas. Fees publicados: ${result.published}; las demás filas quedan pendientes. No se modificaron AUM ni Revenue.`); }
      else setMessage(`Conciliación: ${result.ready} tasas seleccionadas listas. Revisá los pendientes antes de publicar.`);
    });
  }
  return <section className="panel report-section"><h2>Master Owners · Advisory fee</h2>
    <p>Adv Fee / Retro se interpreta en puntos básicos anuales: 50 = 0,50 %. El archivo es un snapshot independiente; no reemplaza AUM, REF ni asignaciones comerciales. Las condiciones textuales se conservan pendientes.</p>
    <form className="import-form" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void run(async () => loaded(await api(form))); }}>
      <label>Master Owners XLSX<input type="file" name="file" accept=".xlsx" required disabled={busy} /></label>
      <label>Hoja (vacío si hay una sola)<input name="sheet" disabled={busy} /></label>
      <label>Importes guardados como texto<Select name="numericFormat" defaultValue="undefined" disabled={busy}><option value="undefined">Sin definir</option><option value="dot">1,234.56 — punto decimal</option><option value="comma">1.234,56 — coma decimal</option></Select></label>
      <Button disabled={busy}>Analizar y guardar original</Button>
    </form>
    <form className="import-form" onSubmit={e => { e.preventDefault(); void run(async () => loaded(await api({ id: openId, request_id: crypto.randomUUID(), operation: "preview" }))); }}>
      <label>Retomar preparación por UUID<input value={openId} onChange={e => setOpenId(e.target.value)} required disabled={busy} /></label><Button disabled={busy}>Abrir preparación</Button>
    </form>
    <p role="status" aria-live="polite">{message}</p>
    {load && <form className="import-form master-review-form" onSubmit={e => void review(e)} onChange={() => { setPreview(null); }}>
      <p>Archivo: {load.master.file} · hoja {load.master.sheet} · {load.master.rows.length} cuentas · {load.master.subtotalRows.length} subtotales conservados en el original. UUID: {load.id}.</p>
      <p><a href={`${endpoint}?id=${load.id}`}>Descargar original privado</a></p>
      <fieldset disabled={busy}><legend>Alcance y evidencia</legend>
        <label>Inicio del trimestre de vigencia (AAAA-MM-DD)<input type="date" name="quarter" required disabled={published} /></label>
        <label>Corte del Balance<input type="date" name="cutoff" required disabled={published} defaultValue="2026-09-30" /></label>
        <p>El corte 30/09/2026 está confirmado para esta muestra. No acredita automáticamente un trimestre ni tasas pasadas.</p>
        {load.master.brokers.map(broker => <label key={broker}>Custodio de Broker «{broker || "vacío"}»<Select disabled={published} value={brokers[broker] ?? ""} onChange={e => { setBrokers({ ...brokers, [broker]: e.target.value }); setPreview(null); }}><option value="">Pendiente de correspondencia</option>{custodians.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</Select></label>)}
        <label><input type="checkbox" name="identity" required disabled={published} /> Confirmo que ACCOUNT corresponde al identificador exacto ACCOUNT de Revenue dentro del custodio elegido. Los UUID manuales cuentan con evidencia individual en el motivo.</label>
        <label><input type="checkbox" name="numeric" disabled={published} /> Confirmo las cuentas numéricas tal como están escritas, sin agregar ceros.</label>
        <label>Evidencia de correspondencias, trimestre, tasa anual, elegibilidad, base bruta y comparabilidad con ROA<textarea name="evidence" required disabled={published} minLength={10} maxLength={8000} /></label>
        <p>Al seleccionar una fila confirmás que su tasa aplica al trimestre completo y que Balance × tasa anual /4 corresponde a su base bruta. No se infiere elegibilidad por Status o Fee type. Cada cuenta admite una tasa seleccionada; componentes múltiples requieren revisión separada.</p>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Revisión de Master Owners"><Table.Root className="data-table"><Table.Header><Table.Row>{["Publicar fee", "Fila", "Broker / cuenta", "Owner / Fee type / Status", "Balance USD", "Tasa anual (pb)", "Cuenta UUID (opcional)", "Resultado de conciliación"].map(h => <Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>)}</Table.Row></Table.Header>
          <Table.Body>{load.master.rows.map(r => { const check = preview?.rows.find(p => p.row === r.row); return <Table.Row key={r.row}>
            <Table.Cell><input type="checkbox" aria-label={`Publicar fee fila ${r.row}`} checked={selected.includes(r.row)} disabled={published || !!r.issue} onChange={e => setSelected(e.target.checked ? [...selected, r.row] : selected.filter(n => n !== r.row))} /></Table.Cell>
            <Table.Cell>{r.row}</Table.Cell><Table.Cell>{r.cells.Broker}<br />{r.account}{r.numericAccount && " · numérica"}</Table.Cell>
            <Table.Cell>{r.cells["Owner Name payout"]}<br />{r.cells["Fee type"]} · {r.cells.Status}</Table.Cell>
            <Table.Cell>{usd(r.balance)}</Table.Cell><Table.Cell>{r.annualRate === null ? r.cells["Adv Fee / Retro"] ?? "N/D" : exact(r.rateBasisPoints)}</Table.Cell>
            <Table.Cell><input aria-label={`UUID cuenta fila ${r.row}`} disabled={published} value={accounts[r.row] ?? ""} onChange={e => setAccounts({ ...accounts, [r.row]: e.target.value })} /></Table.Cell>
            <Table.Cell>{check?.problem ?? r.issue ?? (check ? `Lista · ${check.account_id}` : "Conciliar para resolver cuenta")}{check?.previous_rate != null && <p>Fee vigente a reemplazar: {ratePercent(check.previous_rate)}</p>}</Table.Cell>
          </Table.Row>; })}</Table.Body></Table.Root></div>
        <Button type="submit" name="publish" value="no" disabled={published}>Conciliar selección</Button>
      </fieldset>
      {preview && !published && <div className="publish-confirmation">
        <p>Se conservarán {load.master.rows.length} filas; {preview.ready} tasas se publicarán para el trimestre indicado. Las tasas seleccionadas reemplazan sus versiones vigentes, conservando historia; las cuentas omitidas no se borran.</p>
        <Button type="button" variant="soft" disabled={busy} onClick={() => { setSelected(preview.rows.filter(r => !r.problem).map(r => r.row)); setPreview(null); }}>Seleccionar todas las tasas conciliadas (requiere volver a conciliar)</Button>
        <Button type="submit" name="publish" value="yes" disabled={busy || preview.ready !== selected.length}>Confirmar publicación de snapshot y tasas seleccionadas</Button>
      </div>}
    </form>}
  </section>;
}
