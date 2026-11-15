"use client";
import { useRef, useState, type FormEvent } from "react";
import { Button, Table } from "@radix-ui/themes";

type Batch = { id: string; source: string; period: string; custodian_id: string; status: string; file_name_original: string };
type Alias = { account_id: string | null; source: string; namespace: string; value_original: string; custodian_id: string | null; evidence: string | null };
type Comparison = {
  source: string; period: string; custodian_id: string;
  file: { rows: number; values: number | null; total: string | null };
  candidate: { rows: number; values: number; total: string | null; unassigned_rows: number; unassigned_accounts: number; unassigned_total: string | null };
  active: { id: string; version: number; rows: number; values: number | null; total: string | null } | null;
  same_file: boolean;
  row_changes: { added: number; removed: number };
};
type Inspection = {
  batch: { id: string; source: string; period: string; custodian_id: string; status: string; rows: number; blocking_errors: number; errors: { message?: string }[]; filename: string; review: { token: string; commercial_column: string | null; valid_from: string | null; valid_to: string | null } | null };
  rows: { id: string; sheet: string; row: number; status: string; errors: { message?: string }[]; cells: Record<string, string | null>; originals: Record<string, string | null>; resolution: { account_id: string; custodian_id: string; advisor_id: string | null; evidence: string } | null; matches: { namespace: string; original: string; account_id: string; custodian_id: string; evidence: string }[] }[];
  comparison: Comparison;
  page: number;
};
const labels: Record<string, string> = { uploaded: "Original registrado", validating: "Validando", needs_resolution: "Pendiente de resolución", ready: "Lista para publicar", published: "Publicada y activa", superseded: "Reemplazada; historia conservada", failed: "Errores bloqueantes" };
export function ImportResolution({ batches, custodians, accounts, advisors, aliases, initialId }: {
  batches: Batch[]; custodians: { id: string; code: string; name: string }[];
  accounts: { id: string; custodian_id: string }[]; advisors: { id: string; name: string }[]; aliases: Alias[]; initialId: string;
}) {
  const [id, setId] = useState(initialId);
  const [detail, setDetail] = useState<Inspection | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const code = (custodian: string) => custodians.find((c) => c.id === custodian)?.code ?? custodian;
  async function api(target: string, operation?: string, input?: Record<string, unknown>, page = 0) {
    const response = await fetch(`/api/importaciones/${target}/gestion?page=${page}`, operation ? {
      method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, input }),
    } : { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "No se pudo consultar la importación.");
    return data;
  }
  async function run(work: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try { await work(); } catch (e) { setError((e as Error).message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function reload(target = detail?.batch.id ?? id, page = detail?.page ?? 0) {
    const data: Inspection = await api(target, undefined, undefined, page);
    setDetail(data);
  }
  async function resolve(event: FormEvent<HTMLFormElement>, rowId: string) {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(event.currentTarget));
    await run(async () => {
      await api(detail!.batch.id, "resolve", { ...input, row_id: rowId });
      await reload(); setNotice("Correspondencia guardada con evidencia. No se publicaron datos.");
    });
  }
  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      await api(detail!.batch.id, "review", { ...Object.fromEntries(form), complete_scope: form.has("complete_scope"), expected_active_id: detail!.comparison.active?.id ?? null });
      await reload(); setNotice("Conciliación guardada. Revisá la comparación antes de publicar.");
    });
  }
  const editable = detail?.batch.status === "needs_resolution" && !detail.batch.blocking_errors;
  return <>
    <section className="panel import-panel">
      <h2>Elegir importación</h2>
      <form className="import-form" onSubmit={(e) => { e.preventDefault(); void run(() => reload(id, 0)); }}>
        <label>Importación reciente o UUID
          <input list="batch-options" value={id} onChange={(e) => { setId(e.target.value); setDetail(null); }} required disabled={busy} />
          <datalist id="batch-options">{batches.map((b) => <option key={b.id} value={b.id}>{b.source.toUpperCase()} · {b.period} · {code(b.custodian_id)} · {b.file_name_original}</option>)}</datalist>
        </label>
        <Button disabled={busy || !id}>Abrir correspondencias</Button>
      </form>
      <p>No se relacionan nombres ni números de namespaces distintos. FA muestra el par ACC # Addepar / ACCOUNT como evidencia; cada enlace entre fuentes requiere elegir expresamente la misma cuenta UUID.</p>
      <details><summary>Correspondencias acreditadas recientes (hasta 200)</summary>
        {aliases.map((a, i) => <p key={i}>{a.source} / {a.namespace} / {a.value_original} · {code(a.custodian_id ?? "Sin custodio")} → <code>{a.account_id}</code> · {a.evidence}</p>)}
        <p>La lista es orientativa: podés ingresar un UUID de cuenta fuera de estas sugerencias. La base valida custodio y conflictos al resolver.</p>
      </details>
      <datalist id="account-options">{accounts.map((a) => <option key={a.id} value={a.id}>{code(a.custodian_id)}</option>)}</datalist>
      <datalist id="advisor-options">{advisors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</datalist>
    </section>
    {error && <p role="alert" className="import-error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {detail && <section className="panel import-panel" aria-busy={busy}>
      <h2>{detail.batch.filename} · {labels[detail.batch.status] ?? detail.batch.status}</h2>
      <p>{detail.batch.source.toUpperCase()} · {detail.batch.period} · Custodio declarado: {code(detail.batch.custodian_id)} · {detail.batch.rows} filas · {detail.batch.blocking_errors} errores bloqueantes.</p>
      <a href={`/api/fuentes/${detail.batch.id}`}>Descargar original privado</a>
      {detail.batch.errors.map((e, i) => <p key={i}>{e.message ?? JSON.stringify(e)}</p>)}
      {["uploaded", "validating", "failed"].includes(detail.batch.status) && <p>La publicación está bloqueada. <a href="/importaciones">Completá la preparación o cargá un archivo corregido.</a> Un vacío no confirma cero y no puede reemplazar datos en este MVP.</p>}
      <h3>Valores originales, destino y evidencia</h3>
      {detail.rows.map((r) => <article className="panel import-panel resolution-row" key={r.id}>
        <h4>{r.sheet} / fila {r.row}</h4>
        <dl>{Object.entries(r.cells).map(([h, value]) => <div key={h}><dt>{h}</dt><dd>{value ?? "Ausente"}</dd></div>)}</dl>
        {r.errors.map((e, i) => <p key={i} role="status">{e.message ?? JSON.stringify(e)}</p>)}
        {r.resolution ? <p>Destino: <code>{r.resolution.account_id}</code> · Custodio {code(r.resolution.custodian_id)} · Comercial {r.resolution.advisor_id ?? "Sin asignar"} · Evidencia: {r.resolution.evidence}</p> : <p>Pendiente: sin cuenta UUID acreditada{detail.batch.source === "fa" ? "; FA no informa custodio" : ""}.</p>}
        {r.matches.length > 0 && <details open><summary>Coincidencias exactas acreditadas; revisar posibles conflictos</summary>{r.matches.map((m, i) => <p key={i}>{m.namespace}: {m.original} · Custodio {code(m.custodian_id)} → <code>{m.account_id}</code> · {m.evidence}</p>)}</details>}
        <details><summary>Todas las celdas originales por posición</summary><pre>{JSON.stringify(r.originals, null, 2)}</pre></details>
        {editable && <form className="import-form" key={`${r.id}-${r.resolution?.account_id ?? "pending"}-${r.resolution?.advisor_id ?? ""}`} onSubmit={(e) => void resolve(e, r.id)}>
          <label>Custodio confirmado para esta fila<select name="custodian_id" required defaultValue={r.resolution?.custodian_id ?? ""} disabled={busy}><option value="">Elegir explícitamente</option>{custodians.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</select></label>
          <label>Cuenta destino UUID (vacío crea una cuenta nueva)<input name="account_id" list="account-options" defaultValue={r.resolution?.account_id ?? ""} disabled={busy} /></label>
          {detail.batch.source === "fa" && <>
            <label>Comercial UUID (vacío conserva sin asignar)<input name="advisor_id" list="advisor-options" defaultValue={r.resolution?.advisor_id ?? ""} disabled={busy} /></label>
            <label>O crear comercial nuevo; no se fusiona por nombre<input name="new_advisor" maxLength={200} disabled={busy} /></label>
          </>}
          <label>Evidencia de identidad, custodio y comercial<textarea name="evidence" required maxLength={2000} defaultValue={r.resolution?.evidence ?? ""} disabled={busy} /></label>
          <Button disabled={busy}>Resolver fila con evidencia</Button>
        </form>}
      </article>)}
      <div className="import-pagination">
        <Button variant="soft" disabled={busy || detail.page === 0} onClick={() => void run(() => reload(detail.batch.id, detail.page - 1))}>Anterior</Button>
        <span>Página {detail.page + 1} · {detail.batch.rows} filas</span>
        <Button variant="soft" disabled={busy || (detail.page + 1) * 25 >= detail.batch.rows} onClick={() => void run(() => reload(detail.batch.id, detail.page + 1))}>Siguiente</Button>
      </div>
      {["needs_resolution", "ready"].includes(detail.batch.status) && <form className="import-form" onSubmit={(e) => void review(e)} key={`${detail.batch.id}-${detail.batch.review?.token ?? "pending"}`}>
        <h3>Revisar alcance completo</h3>
        <label>Mes<input type="month" name="month_display" value={detail.batch.period.slice(0, 7)} readOnly /></label>
        <input type="hidden" name="period" value={detail.batch.period} />
        <input type="hidden" name="custodian_id" value={detail.batch.custodian_id} />
        <p>Reemplazo exclusivo de {detail.batch.source.toUpperCase()}, {detail.batch.period}, custodio {code(detail.batch.custodian_id)}. Los demás custodios conservan sus datos.</p>
        {detail.batch.source === "fa" && <>
          <label>Columna confirmada como comercial<select name="commercial_column" required defaultValue={detail.batch.review?.commercial_column ?? ""} disabled={busy || detail.batch.status === "ready"}><option value="">Pendiente de confirmación</option><option>Owner Name payout</option><option>Broker</option></select></label>
          {detail.batch.status === "ready" && <input type="hidden" name="commercial_column" value={detail.batch.review?.commercial_column ?? ""} />}
          <label>Vigencia desde (inclusive)<input type="date" name="valid_from" required defaultValue={detail.batch.review?.valid_from ?? ""} readOnly={detail.batch.status === "ready"} disabled={busy} /></label>
          <label>Vigencia hasta (exclusiva; vacío sin fin)<input type="date" name="valid_to" defaultValue={detail.batch.review?.valid_to ?? ""} readOnly={detail.batch.status === "ready"} disabled={busy} /></label>
          <p>AUM y Revenue se atribuyen según la asignación vigente al último día del mes. Meses anteriores a esta vigencia quedan sin asignar. OLD Owner se conserva como referencia, sin crear historia. Confirmar una fecha pasada es una decisión explícita para ese intervalo.</p>
        </>}
        <label><input type="checkbox" name="complete_scope" required disabled={busy} /> Confirmo que revisé el archivo completo para este mes y custodio, incluidas omisiones y el alcance del reemplazo.</label>
        <Button disabled={busy || !!detail.batch.blocking_errors}>Conciliar y dejar lista</Button>
      </form>}
      <h3>Conciliación por período y custodio</h3>
      <p>{detail.comparison.source.toUpperCase()} · {detail.comparison.period} · {code(detail.comparison.custodian_id)}. Importes exactos en USD. FA no tiene total monetario.</p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Comparación de publicación">
        <Table.Root className="data-table"><Table.Header><Table.Row><Table.ColumnHeaderCell>Versión</Table.ColumnHeaderCell><Table.ColumnHeaderCell align="right">Filas</Table.ColumnHeaderCell><Table.ColumnHeaderCell align="right">Valores</Table.ColumnHeaderCell><Table.ColumnHeaderCell align="right">Total USD</Table.ColumnHeaderCell></Table.Row></Table.Header>
          <Table.Body>{[{ label: "Archivo", value: detail.comparison.file }, { label: "Candidata conciliada", value: detail.comparison.candidate }, { label: "Activa antes de publicar", value: detail.comparison.active }].map(({ label, value: v }) => { return <Table.Row key={String(label)}><Table.Cell>{String(label)}</Table.Cell><Table.Cell align="right">{v?.rows ?? "N/D"}</Table.Cell><Table.Cell align="right">{v?.values ?? "N/D"}</Table.Cell><Table.Cell align="right">{v?.total ?? "N/D"}</Table.Cell></Table.Row>; })}</Table.Body>
        </Table.Root>
      </div>
      <p>Comparación de filas por contenido conservando multiplicidad: {detail.comparison.row_changes.added} nuevas, {detail.comparison.row_changes.removed} retiradas del alcance activo. La versión anterior se conserva.</p>
      <p>Sin asignación comercial al cierre: {detail.comparison.candidate.unassigned_accounts} cuentas / {detail.comparison.candidate.unassigned_rows} filas · USD {detail.comparison.candidate.unassigned_total ?? "N/D"}. Permanecen en el total global. Antes de conciliar, la candidata todavía no tiene hechos.</p>
      {detail.comparison.same_file && <p role="status">Mismo archivo que la versión activa. Publicarlo como otra versión reemplaza el alcance; no agrega sus filas a la versión anterior.</p>}
      {detail.batch.status === "ready" && <form className="import-form" onSubmit={(e) => { e.preventDefault(); void run(async () => { await api(detail.batch.id, "publish", { token: detail.batch.review?.token }); await reload(); setNotice("Publicación confirmada. La versión anterior y su auditoría se conservan."); }); }}>
        <label><input type="checkbox" required disabled={busy} /> Revisé esta comparación y autorizo publicar{detail.comparison.active ? " y reemplazar exclusivamente la versión activa de este alcance" : " este alcance"}.</label>
        <Button disabled={busy}>Publicar versión revisada</Button>
      </form>}
      <Button variant="soft" disabled={busy} onClick={() => void run(() => reload())}>Recargar estado y conciliación</Button>
    </section>}
  </>;
}
