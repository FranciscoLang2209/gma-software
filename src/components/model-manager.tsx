"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, History, PencilLine, ShieldCheck } from "lucide-react";
import { Button, Table } from "@radix-ui/themes";
import { ENTITIES, type Entity, type Catalog, type ModelRow, type Preview } from "@/lib/model/contracts";
import { dateLabel, monthLabel, usd } from "@/lib/queries/presentation";

const labels: Record<string, string> = { id: "UUID", name: "Nombre", code: "Código", active: "Estado", account_id: "Cuenta", custodian_id: "Custodio", client_id: "Cliente", service: "Servicio", advisor_id: "Comercial", group_id: "Equipo", valid_from: "Desde inclusiva", valid_to: "Hasta exclusiva", is_primary: "Principal" };
const references = { account_id: "accounts", custodian_id: "custodians", client_id: "clients", advisor_id: "advisors", group_id: "teams" } as const;
export function ModelManager({ entity, catalog, admin, editingId }: { entity: Entity; catalog: Catalog; admin: boolean; editingId?: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const row = catalog.selected ?? catalog.rows.find((r) => r.id === editingId);
  const temporal = entity === "assignments" || entity === "memberships";
  const columns = entity === "assignments" ? ["id", "account_id", "advisor_id", "valid_from", "valid_to"] : entity === "memberships" ? ["id", "advisor_id", "group_id", "valid_from", "valid_to"] : entity === "accounts" ? ["id", "custodian_id", "client_id", "service", "active"] : entity === "custodians" ? ["id", "name", "code", "active"] : ["id", "name", "active"];
  const labelValue = (key: string, value: unknown) => {
    if (value == null) return "N/D";
    if (key === "active") return value ? "Activo" : "Desactivado";
    const optionKey = references[key as keyof typeof references];
    const label = optionKey && catalog.options?.[optionKey]?.find((o) => o.id === value)?.label;
    return label ? `${label} · ${value}` : String(value);
  };
  async function call(parameters: unknown) {
    const response = await fetch("/api/modelo", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parameters) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "No se pudo confirmar el cambio.");
    return data;
  }
  async function run(work: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try { await work(); } catch (e) { setPreview(null); setError(e instanceof Error ? e.message : "No se pudo confirmar el cambio."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { reason, ...input } = Object.fromEntries(form) as Record<string, string | boolean | null>;
    for (const key of ["valid_to", "client_id"]) if (key in input && input[key] === "") input[key] = null;
    if ("active" in input) input.active = input.active === "true";
    void run(async () => { setPreview(await call({ operation: "preview", entity, target_id: row?.id ?? null, input, reason })); });
  }
  const field = (key: string, required = true) => <label key={key}>{labels[key] ?? key}<input name={key} required={required} defaultValue={String(row?.[key as keyof ModelRow] ?? "")} maxLength={key.endsWith("_id") ? 36 : 200}
    type={key.startsWith("valid_") ? "date" : "text"} list={key in references ? `options-${references[key as keyof typeof references]}` : undefined} placeholder={key.endsWith("_id") ? "UUID · elegí una referencia" : undefined} /></label>;
  return <div className="model-workspace">
    <aside className="model-sidebar"><p className="eyebrow">CATÁLOGOS Y VIGENCIAS</p><nav className="report-tabs model-nav" aria-label="Entidades del modelo">{Object.entries(ENTITIES).map(([key, label]) => <Link key={key} aria-current={entity === key ? "page" : undefined} href={`/configuracion?entidad=${key}`}>{label}</Link>)}</nav><div className="model-role"><ShieldCheck size={16} aria-hidden="true" /><p>{admin ? "Administrador · cambios con revisión previa" : "Lector · consulta de catálogos"}</p></div></aside>
    <div className="model-content">
    <section className="panel report-section"><div className="section-heading"><div><p className="eyebrow">MODELO DEL NEGOCIO</p><h2><BookOpen size={18} aria-hidden="true" /> {ENTITIES[entity]}</h2></div><span className="semantic-badge">{catalog.row_count} registros</span></div><p>Las entidades se desactivan; se conserva su historia. Las bajas no reasignan cifras históricas. Desde inclusiva y hasta exclusiva en todas las vigencias.</p>
      <div className="table-scroll" role="region" aria-label={`Catálogo de ${ENTITIES[entity]}`} tabIndex={0}><Table.Root className="data-table"><Table.Header><Table.Row>{columns.map((c) => <Table.ColumnHeaderCell key={c}>{labels[c]}</Table.ColumnHeaderCell>)}{admin && <Table.ColumnHeaderCell>Acción</Table.ColumnHeaderCell>}</Table.Row></Table.Header><Table.Body>{catalog.rows.map((r) => <Table.Row key={r.id}>{columns.map((c) => <Table.Cell key={c}>{labelValue(c, r[c as keyof ModelRow])}</Table.Cell>)}{admin && <Table.Cell><Link href={`/configuracion?entidad=${entity}&editar=${r.id}&offset=${catalog.offset}`}>Editar</Link></Table.Cell>}</Table.Row>)}</Table.Body></Table.Root></div>
      {!catalog.rows.length && <p>Sin registros.</p>}
      <nav className="import-pagination" aria-label="Paginación de catálogo y auditoría">{catalog.offset > 0 && <Link href={`/configuracion?entidad=${entity}&offset=${Math.max(0,catalog.offset-25)}`}>Anterior</Link>}<span>{catalog.row_count} entidades · página {catalog.offset / 25 + 1}</span>{catalog.offset + 25 < Math.max(catalog.row_count, catalog.audit_count ?? 0) && <Link href={`/configuracion?entidad=${entity}&offset=${catalog.offset+25}`}>Siguiente</Link>}</nav>
    </section>
    {admin && <section className="panel report-section model-editor"><div className="section-heading"><div><p className="eyebrow">CAMBIO REVISADO</p><h2><PencilLine size={18} aria-hidden="true" /> {row ? "Editar registro" : "Crear registro"}</h2></div><span className="semantic-badge">Solo administrador</span></div><p>Completá los datos y el motivo. Revisá el efecto antes de confirmar el guardado.</p>
      {editingId && !row ? <p role="alert">No se encontró el registro. Recargá el catálogo.</p> : entity === "accounts" && !row ? <p>Las cuentas se crean al resolver importaciones; elegí una cuenta existente para clasificarla o desactivarla.</p> : <>
        {row && <p>UUID {row.id} · <Link href={`/configuracion?entidad=${entity}`}>Terminar edición</Link></p>}
        <form ref={formRef} className="import-form" onSubmit={review} onChange={() => { setPreview(null); setNotice(""); }}>
          {temporal ? <>{entity === "assignments" && field("account_id")}{field("advisor_id")}{entity === "memberships" && field("group_id")}{field("valid_from")}{field("valid_to", false)}<label>Evidencia o referencia<input name="evidence" required minLength={3} maxLength={2000} /></label></> : entity === "accounts" ? <>{field("client_id", false)}{field("service")}</> : <>{field("name")}{entity === "custodians" && field("code")}</>}
          {!temporal && <label>Estado<select name="active" defaultValue={row?.active === false ? "false" : "true"}><option value="true">Activo</option><option value="false">Desactivado</option></select></label>}
          <label>Motivo del cambio<textarea name="reason" required minLength={3} maxLength={2000} /></label>
          <div className="report-actions"><Button disabled={busy} type="submit">{busy ? "Procesando…" : "Revisar efecto antes de guardar"}</Button></div>
        </form>
        {Object.entries(catalog.options ?? {}).map(([key, options]) => <datalist id={`options-${key}`} key={key}>{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</datalist>)}
        <p className="section-note">Referencias: opciones activas hasta 250 por tipo; también podés pegar el UUID del catálogo. No se crea una relación nueva con una entidad desactivada. Para cerrar una vigencia, editá hasta; para cambiar de equipo/comercial, cerrá la anterior y creá la siguiente.</p>
      </>}
      {error && <p role="alert" className="feedback feedback-error">{error}</p>}{notice && <p role="status" className="feedback feedback-success">{notice}</p>}
      {preview && <div className="model-preview"><h3>Efecto sobre la atribución histórica</h3><p>{preview.changes.length} cuenta-meses afectados. Los importes financieros se conservan; cambia su atribución. Motivo: {preview.reason}</p>
        <details open><summary>Cambio de registro</summary><div className="model-compare">{[["Antes", preview.before], ["Después", preview.after]].map(([title, record]) => <div key={String(title)}><h3>{String(title)}</h3>{record ? <dl>{[...columns.filter((c) => c !== "id"), ...(temporal ? ["evidence"] : [])].map((key) => <div key={key}><dt>{labels[key] ?? "Evidencia o referencia"}</dt><dd>{labelValue(key, (record as ModelRow)[key as keyof ModelRow])}</dd></div>)}</dl> : <p>Registro nuevo</p>}</div>)}</div></details>
        {!!preview.changes.length && <div className="table-scroll" role="region" aria-label="Efecto histórico antes de guardar" tabIndex={0}><Table.Root className="data-table"><Table.Header><Table.Row>{["Cuenta", "Mes", "Antes · comercial / equipo / cliente / servicio", "Después · comercial / equipo / cliente / servicio", "AUM · USD", "Revenue · USD"].map((h) => <Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>)}</Table.Row></Table.Header><Table.Body>{preview.changes.map(({ before: b, after: a }) => <Table.Row key={b.account_id+b.period}><Table.RowHeaderCell>{b.account_id}</Table.RowHeaderCell><Table.Cell>{monthLabel(b.period)}</Table.Cell><Table.Cell>{b.advisor ?? "Sin comercial"} / {b.team ?? "Sin equipo"} / {b.client ?? "Sin cliente"} / {b.service}</Table.Cell><Table.Cell>{a.advisor ?? "Sin comercial"} / {a.team ?? "Sin equipo"} / {a.client ?? "Sin cliente"} / {a.service}</Table.Cell><Table.Cell>{usd(b.aum_usd)}</Table.Cell><Table.Cell>{usd(b.revenue_usd)}</Table.Cell></Table.Row>)}</Table.Body></Table.Root></div>}
        {!preview.changes.length && <p>Sin cambios de atribución en los meses con datos publicados. El cambio puede afectar períodos futuros.</p>}
        <Button disabled={busy} onClick={() => void run(async () => { await call({ operation: "save", review_id: preview.review_id }); setPreview(null); if (!row) formRef.current?.reset(); setNotice("Cambio guardado con autor, fecha, motivo y valores anteriores. Los importes no se modificaron."); router.refresh(); })}>Confirmar y guardar cambio revisado</Button>
      </div>}
    </section>}
    {admin && <details className="panel audit-disclosure"><summary><History size={17} aria-hidden="true" /> Auditoría del catálogo</summary><section className="report-section"><h2>Auditoría del catálogo</h2><p>Historial paginado con el catálogo. Las operaciones previas a esta etapa pueden no tener motivo manual; las importaciones conservan su propia procedencia.</p><ul>{catalog.audit?.map((e) => <li key={e.id}>{dateLabel(e.occurred_at)} · {e.actor_id} · {e.action} · {e.entity_id}<p>{e.reason ?? "Operación anterior o de importación: consultar procedencia"}</p><details><summary>Qué cambió</summary><pre>{JSON.stringify({ antes: e.before_data, después: e.after_data },null,2)}</pre></details></li>)}</ul></section></details>}
    </div>
  </div>;
}
