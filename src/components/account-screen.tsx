import { clearReferenceFilters } from "@/lib/queries/references";
import { Select } from "./ui/select";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wallet, Users } from "lucide-react";
import { MetricCard } from "./metric-card";
import { ReferenceClassification } from "./reference-classification";
import { ReportChart } from "./report-chart";
import { CoverageDisclosure } from "./coverage-disclosure";
import { Table } from "@radix-ui/themes";
import { requireAccess } from "@/lib/auth/access";
import { accountParameters, accountHref, type Directory, type AccountDetail, type Provenance } from "@/lib/accounts/contracts";
import { monthLabel, usd, dateLabel, type Search } from "@/lib/queries/presentation";
import { UUID } from "@/lib/imports/contracts";
import { ReportFilters } from "./report-view";

function ProvenanceLink({ item, admin }: { item: Provenance; admin: boolean }) {
  return <span>Importación {admin ? <Link href={`/correspondencias?lote=${item.batch_id}`}>{item.batch_id}</Link> : item.batch_id} · v{item.version} · fila {item.import_row_id}<br />Publicada {dateLabel(item.published_at)} · por {item.published_by}</span>;
}
function Pagination({ count, offset, limit, href, label }: { count: number; offset: number; limit: number; href: (offset: number) => string; label: string }) {
  return <nav className="import-pagination" aria-label={label}>
    {offset > 0 && <Link href={href(Math.max(0, offset - limit))}>Anterior</Link>}
    <span>{count ? `${Math.min(offset + 1, count)}–${Math.min(offset + limit, count)} de ${count}` : "Sin registros"}</span>
    {offset + limit < count && <Link href={href(offset + limit)}>Siguiente</Link>}
  </nav>;
}
function DirectoryTable({ data, params }: { data: Directory; params: URLSearchParams }) {
  return <section className="panel report-section">
    <div className="section-heading directory-heading"><div><p className="eyebrow">DIRECTORIO FILTRADO</p><h2>Directorio de cuentas</h2></div><span className="semantic-badge">{data.row_count} cuentas encontradas</span></div>
    <p>Comercial y equipo son referencias al cierre de {monthLabel(data.report.period.to)}. El Revenue conserva la atribución de cada mes. Incluye cuentas sin datos y desactivadas.</p>
    <div className="table-scroll" role="region" aria-label="Directorio de cuentas" tabIndex={0}>
      <Table.Root className="data-table"><Table.Header><Table.Row>{["Custodio", "Identificador principal", "Cliente", "Comercial al cierre", "Equipo al cierre", "Servicio", "AUM al cierre · USD", "Revenue del rango · USD"].map((h) => <Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>)}</Table.Row></Table.Header>
        <Table.Body>{data.rows.map((a) => <Table.Row key={a.id}>
          <Table.Cell>{a.custodian}</Table.Cell><Table.RowHeaderCell><Link href={accountHref(`/cuentas/${a.id}`, params, { cuenta: a.id })}>{a.identifier}</Link><br /><small className="cell-secondary">{a.identifier_source ? `${a.identifier_source} · ${a.identifier_namespace}` : "Sin identificador externo · UUID"}{!a.active && " · Desactivada"}</small></Table.RowHeaderCell>
          <Table.Cell>{a.client ?? "Sin asignar"}{a.ref_client && <p className="cell-secondary">REF: {a.ref_client} · sin identidad confirmada</p>}</Table.Cell><Table.Cell>{a.advisor ?? "Sin asignar"}{a.ref_advisor && <p className="cell-secondary">REF: {a.ref_advisor} · sin vigencia histórica</p>}</Table.Cell><Table.Cell>{a.team ?? "Sin asignar"}{a.ref_team && <p className="cell-secondary">REF: {a.ref_team}</p>}{a.assignment_changed && <p className="cell-warning">Cambió durante el rango · ver historia</p>}</Table.Cell><Table.Cell>{a.service}</Table.Cell>
          <Table.Cell className="money">{usd(a.aum_usd)}<br /><small>{a.aum_values}/{a.aum_rows} importes</small></Table.Cell><Table.Cell className="money">{usd(a.revenue_usd)}<br /><small>{a.revenue_values}/{a.revenue_rows} importes</small></Table.Cell>
        </Table.Row>)}</Table.Body></Table.Root>
    </div>
    {!data.rows.length && <p role="status">Sin cuentas para estos filtros. La ausencia de una fuente no equivale a cero.</p>}
    <Pagination count={data.row_count} offset={data.offset} limit={data.limit} label="Paginación de cuentas" href={(offset) => accountHref("/cuentas", params, { offset: String(offset), revision: data.revision })} />
    <p>Identificador principal: primera referencia explícita por fuente Revenue, AUM, FA o manual; desempate por namespace, texto e ID. No infiere equivalencias. Orden seleccionado con desempate por UUID.</p>
  </section>;
}
function DetailView({ data, params, admin }: { data: AccountDetail; params: URLSearchParams; admin: boolean }) {
  const a = data.account;
  return <>
    <div className="account-detail-toolbar"><Link className="button-outline" href={accountHref("/cuentas", params, { cuenta: null })}><ArrowLeft size={15} aria-hidden="true" /> Volver al listado con filtros</Link><span className="semantic-badge">{a.active ? "Activa" : "Desactivada"}</span></div>
    <nav className="detail-links" aria-label="Secciones de la cuenta"><a href="#identidad">Identidad</a><a href="#historia">Historia mensual</a><a href="#asignaciones">Vigencias</a><a href="#registros">Revenue y procedencia</a><a href="#cobertura">Cobertura</a></nav>
    <section className="panel report-section account-identity" id="identidad"><p className="eyebrow">CUENTA · {a.custodian}</p><h2>{a.identifier}</h2><p>{a.custodian} · Cliente: {a.client ?? "Sin asignar"} · Servicio: {a.service} · {a.active ? "Activa" : "Desactivada"}</p><p>UUID {a.id}</p>
      <p>Referencia al cierre: {a.advisor ?? "Sin comercial"} / {a.team ?? "Sin equipo"}. {a.assignment_changed && "La asignación cambió durante el rango."}</p>
      {a.ref_snapshot_id && <p>Foto REF, sin vigencia histórica: cliente {a.ref_client ?? "N/D"} · comercial {a.ref_advisor ?? "N/D"} · equipo {a.ref_team ?? "N/D"}. Son etiquetas de origen; no acreditan identidades ni reemplazan la historia.</p>}
      <p>Con los filtros aplicados: AUM al cierre {usd(data.report.total.aum_usd)} · Revenue del rango {usd(data.report.total.revenue_usd)}. Cliente y servicio usan la clasificación de la cuenta, sin historia propia.</p>
      {admin && <p><Link href={`/configuracion?entidad=accounts&editar=${a.id}`}>Editar clasificación o desactivar</Link> · <Link href="/configuracion?entidad=assignments">Administrar asignaciones con revisión histórica</Link></p>}
    </section>
    <section className="panel report-section"><h2>Identificadores por fuente y namespace</h2><p>Se conservan como texto. Cada equivalencia pertenece al custodio {a.custodian}; no se unen cuentas por nombre ni número ambiguo.</p>
      <div className="table-scroll" role="region" aria-label="Identificadores" tabIndex={0}><Table.Root className="data-table"><Table.Header><Table.Row>{["Fuente", "Namespace", "Valor original", "Fila de origen"].map((h) => <Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>)}</Table.Row></Table.Header><Table.Body>{data.identifiers.map((i) => <Table.Row key={`${i.source}/${i.namespace}/${i.value_original}`}><Table.Cell>{i.source}</Table.Cell><Table.Cell>{i.namespace}</Table.Cell><Table.RowHeaderCell>{i.value_original}</Table.RowHeaderCell><Table.Cell>{i.source_row_id ?? "Registro manual"}</Table.Cell></Table.Row>)}</Table.Body></Table.Root></div>
      {!data.identifiers.length && <p>Sin identificadores externos resueltos.</p>}
    </section>
    <section className="metric-grid primary-metrics" aria-label="Cifras filtradas de la cuenta"><MetricCard title="AUM al cierre" value={usd(data.report.total.aum_usd)} period={monthLabel(data.report.period.to)} icon={<Wallet size={18} />} note="Foto del mes de cierre, sin arrastre de saldos." /><MetricCard title="Revenue del rango" value={usd(data.report.total.revenue_usd)} period={`${monthLabel(data.report.period.from)} — ${monthLabel(data.report.period.to)}`} icon={<Users size={18} />} note="Payout broker de los registros incluidos por los filtros." /></section>
    <div className="report-charts"><ReportChart report={data.report} source="aum" /><ReportChart report={data.report} source="revenue" /></div>
    <section className="panel report-section" id="historia"><h2>Historia mensual y atribución del Revenue</h2><p>Meses del rango seleccionado. AUM es la foto de cada mes; no se suman fotos. Cada fila indica la asignación al cierre de ese mes, incluso cuando queda fuera del filtro de equipo o comercial.</p>
      <div className="table-scroll" role="region" aria-label="Historia mensual de la cuenta" tabIndex={0}><Table.Root className="data-table"><Table.Header><Table.Row>{["Mes", "Comercial", "Equipo", "AUM · USD", "Revenue · USD", "Cobertura", "Filtro"].map((h) => <Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>)}</Table.Row></Table.Header><Table.Body>{data.months.map((m) => <Table.Row key={m.period}><Table.RowHeaderCell>{monthLabel(m.period)}</Table.RowHeaderCell><Table.Cell>{m.advisor ?? "Sin asignar"}</Table.Cell><Table.Cell>{m.team ?? "Sin asignar"}</Table.Cell><Table.Cell align="right" className="money">{usd(m.aum_usd)}</Table.Cell><Table.Cell align="right" className="money">{usd(m.revenue_usd)}</Table.Cell><Table.Cell>AUM {m.aum_values}/{m.aum_rows} · Revenue {m.revenue_values}/{m.revenue_rows} importes</Table.Cell><Table.Cell>{m.matches_filters ? "Incluido en cifras filtradas" : "Contexto · fuera del filtro"}</Table.Cell></Table.Row>)}</Table.Body></Table.Root></div>
      <details><summary>Procedencia de las fotos AUM del rango</summary><ul>{data.aum.map((item) => <li key={item.period}>{monthLabel(item.period)} · {usd(item.amount_usd)} · <ProvenanceLink item={item} admin={admin} /></li>)}</ul>{!data.aum.length && <p>No hay fotos publicadas en el rango.</p>}</details>
    </section>
    <section className="panel report-section" id="asignaciones"><h2>Asignaciones y membresías con vigencia</h2><p>Desde inclusiva, hasta exclusiva. Sin cobertura fechada queda sin asignar. Una referencia actual no acredita historia anterior. Los FA publicados se corrigen por importación versionada.</p>
      <ul>{data.assignments.map((x) => <li key={x.id}>{x.advisor ?? "Sin comercial acreditado"} · {x.valid_from} → {x.valid_to ?? "Sin fin"} · {x.source}{x.batch_id && <> · Importación {admin ? <Link href={`/correspondencias?lote=${x.batch_id}`}>{x.batch_id}</Link> : x.batch_id}</>}{x.source_row_id && <> · fila {x.source_row_id}</>}</li>)}</ul>
      {!data.assignments.length && <p>Sin asignaciones acreditadas.</p>}
      <h3>Membresías de los comerciales de esta cuenta</h3><ul>{data.memberships.map((x) => <li key={x.id}>{x.advisor} / {x.team} · {x.valid_from} → {x.valid_to ?? "Sin fin"}</li>)}</ul>
    </section>
    <section className="panel report-section" id="registros"><h2>Registros de Revenue publicados</h2><p>Registros del rango y de los filtros históricos. Repeticiones legítimas conservadas. {admin ? "Las columnas originales se muestran como texto inerte." : "Los originales y archivos fuente están reservados al administrador."} Las correcciones financieras se realizan por importación versionada.</p>
      <div className="table-scroll" role="region" aria-label="Registros Revenue paginados" tabIndex={0}><Table.Root className="data-table"><Table.Header><Table.Row>{["Mes", "Payout broker · USD", "Procedencia", ...(admin ? ["Originales"] : [])].map((h) => <Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>)}</Table.Row></Table.Header><Table.Body>{data.records.map((r) => <Table.Row key={r.id}><Table.RowHeaderCell>{monthLabel(r.period)}</Table.RowHeaderCell><Table.Cell align="right" className="money">{usd(r.amount_usd)}</Table.Cell><Table.Cell><ProvenanceLink item={r} admin={admin} /></Table.Cell>{admin && <Table.Cell>{r.original && <details><summary>Ver columnas originales</summary><p>{r.original.file} · {r.original.sheet} · fila {r.original.row}</p><dl>{Object.entries(r.original.cells).map(([key, value]) => <div key={key}><dt>{r.original?.headers?.find((h) => String(h.position) === key)?.original ?? key}</dt><dd>{value ?? "N/D"}</dd></div>)}</dl></details>}</Table.Cell>}</Table.Row>)}</Table.Body></Table.Root></div>
      <Pagination count={data.record_count} offset={data.offset} limit={data.limit} label="Paginación de registros Revenue" href={(offset) => accountHref(`/cuentas/${a.id}`, params, { offset: String(offset), revision: data.revision }) + "#registros"} />
    </section>
  </>;
}
export async function AccountScreen({ search, id }: { search: Search; id?: string }) {
  const { supabase, role } = await requireAccess();
  if (id && !UUID.test(id)) notFound();
  let parsed;
  try { parsed = accountParameters(id ? { ...search, cuenta: id } : search); }
  catch (error) { return <section className="panel report-section" role="alert"><h2>Revisá los filtros</h2><p>{error instanceof Error ? error.message : "Filtros inválidos."}</p><Link href={id ? `/cuentas/${id}` : "/cuentas"}>Reiniciar consulta</Link></section>; }
  const { params, parameters: p } = parsed;
  const path = id ? `/cuentas/${id}` : "/cuentas";
  const result = await Promise.resolve(id ? supabase.rpc("account_detail_ref", { reference_filters: p.reference_filters ?? {}, target_id: id, month_from: p.month_from, month_to: p.month_to,
    team: p.team, advisor: p.advisor, custodian: p.custodian, client: p.client, service_filter: p.service_filter, page_size: p.page_size, page_offset: p.page_offset, expected_revision: p.expected_revision }) : supabase.rpc("account_directory_ref", { ...p, reference_filters: p.reference_filters ?? {} })).catch(() => ({ data: null, error: { code: "" } }));
  if (result.error) return <section className="panel report-section" role="alert"><h2>Consulta no disponible</h2><p>{result.error.code === "40001" ? "Los datos cambiaron. Reiniciá la consulta para ver una única revisión." : ["22023", "22P02"].includes(result.error.code) ? "Selección de filtros inválida. Reiniciá la selección REF." : "No se pudo consultar la información. Reintentá más tarde."}</p><Link href={accountHref(path, params, ["40001", "22023", "22P02"].includes(result.error.code) ? clearReferenceFilters() : {})}>Reiniciar consulta{["40001", "22023", "22P02"].includes(result.error.code) && " · limpiar selección REF"}</Link></section>;
  if (id && !result.data) notFound();
  const data = result.data as Directory | AccountDetail;
  return <>
    <ReportFilters params={params} report={data.report} path={path} accountId={id} compact>
      {id && <><input type="hidden" name="buscar" value={params.get("buscar") ?? ""} /><input type="hidden" name="orden" value={params.get("orden") ?? "identifier"} /></>}
      {!id && <><label>Buscar identificador o cliente<input type="search" name="buscar" maxLength={200} defaultValue={params.get("buscar") ?? ""} placeholder="Ej.: 000123" /></label><label>Orden<Select name="orden" defaultValue={params.get("orden") ?? "identifier"}><option value="identifier">Identificador · ascendente</option><option value="client">Cliente · ascendente</option><option value="aum">AUM · descendente</option><option value="revenue">Revenue · descendente</option></Select></label></>}
      <label>Filas por página<Select name="limite" defaultValue={String(p.page_size)}>{[...new Set([10, 25, 50, 100, p.page_size])].sort((a,b) => a-b).map((n) => <option key={n}>{n}</option>)}</Select></label>
    </ReportFilters>
    {id ? <DetailView data={data as AccountDetail} params={params} admin={role === "admin"} /> : <DirectoryTable data={data as Directory} params={params} />}
    <ReferenceClassification report={data.report} params={params} />
    {!id && <p className="section-note">La cobertura siguiente usa el rango y los filtros de entidades. La búsqueda textual acota el directorio; orden y paginación organizan sus filas.</p>}
    <CoverageDisclosure report={data.report} consultedAt={new Date().toISOString()} />
  </>;
}
