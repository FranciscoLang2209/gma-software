import Link from "next/link";
import { Button, Table } from "@radix-ui/themes";
import type { Metadata } from "next";
import { requireAccess } from "@/lib/auth/access";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { CommissionChart } from "@/components/commission-chart";
import { CommissionReview } from "@/components/commission-review";
import { BASES, COMMISSION_STATUSES, VIEWS, commissionFilters, commissionHref, commissionSort, type CommissionDashboard, type CommissionRow, type CommissionGroup } from "@/lib/commissions/dashboard";
import { exact, usd, percent, type Search } from "@/lib/queries/presentation";
export const metadata: Metadata = { title: "Comisiones" };
const fields = [["year", "Año"], ["quarter", "Trimestre (1–4)"], ["broker", "Broker"], ["owner", "Owner Name payout"], ["account_id", "Cuenta (UUID)"], ["fee_type", "Fee type"], ["min_absolute_variance", "Diferencia absoluta mínima USD"], ["min_absolute_percentage", "Diferencia porcentual mínima"]] as const;
const money = new Set(["balance", "expected", "comparable_expected", "actual", "variance", "expected_quarterly", "actual_received"]);
const groups = [["owner", "Beneficiario"], ["basis", "Base"], ["accounts", "Cuentas"], ["balance", "Balance total aplicable"], ["expected", "Comisión esperada USD"], ["actual", "Cobro real conciliado USD"], ["variance", "Diferencia USD"], ["pending", "Casos pendientes"]];
const accounts = [["quarter", "Trimestre"], ["broker", "Broker"], ["account", "ACCOUNT"], ["holder", "Titular"], ["owner", "Owner Name payout"], ["cutoff", "Corte"], ["basis", "Base"], ["balance", "Balance USD"], ["annual_rate", "Adv Fee / Retro (tasa anual)"], ["expected_quarterly", "Expected quarterly payout USD"], ["actual_received", "Actual payout USD"], ["variance", "Diferencia USD"], ["status", "Estado"]];
const queue = [["quarter", "Trimestre"], ["account", "ACCOUNT"], ["owner", "Beneficiario"], ["basis", "Base"], ["status", "Estado"], ["expected_quarterly", "Esperado USD"], ["actual_received", "Cobro clasificado USD"], ["variance", "Diferencia USD"], ["source_file", "Archivo"], ["evidence", "Evidencia / referencia"]];
const quarterly = [["quarter", "Trimestre"], ["basis", "Base"], ["expected", "Esperado verificado USD"], ["comparable_expected", "Esperado comparable USD"], ["actual", "Real comparable USD"], ["variance", "Diferencia USD"], ["variance_percentage", "Diferencia %"], ["pending", "Pendientes"]];
function display(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (key === "expected_quarterly" && row.verified !== true) return "N/D · Base sin verificar";
  if (key === "status") return COMMISSION_STATUSES[String(value)] ?? "Sin clasificar";
  if (key === "basis") return BASES[String(value)] ?? "Sin base clasificada";
  if (key === "variance_percentage") return percent(value as string | null);
  if (money.has(key)) return usd(value as string | null);
  if (key === "annual_rate") return value == null ? "N/D" : `${row.annual_rate_original ?? "Original N/D"} · ${exact(String(value))} (proporción anual)`;
  return value == null ? "N/D" : String(value);
}
export default async function CommissionsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireAccess(true);
  const params = await searchParams;
  const view = typeof params.vista === "string" && Object.hasOwn(VIEWS, params.vista) ? params.vista : "resumen";
  const { data, error } = await supabase.rpc("commission_dashboard", { filters: commissionFilters(params) });
  const report = data as CommissionDashboard | null;
  const ownersWithVariance = new Set(report?.rows.filter(row => row.status === "variance").map(row => JSON.stringify([row.owner, row.basis])));
  const columns = view === "representantes" ? groups : view === "cuentas" ? accounts : view === "conciliaciones" ? queue : quarterly;
  const selected = report?.rows.find(row => (row.obligation_id ?? row.entry_id) === params.detalle);
  const rawRows = !report ? [] : view === "representantes" ? report.owners : view === "resumen" ? report.quarters : report.rows;
  const sort = typeof params.sort === "string" && columns.some(([key]) => key === params.sort) ? params.sort : columns[0][0];
  const sorted = commissionSort(rawRows as (CommissionRow | CommissionGroup)[], sort, params.direction === "desc");
  const requested = typeof params.page === "string" && /^\d{1,6}$/.test(params.page) ? Number(params.page) : 1;
  const page = Math.max(1, Math.min(requested, Math.ceil(sorted.length / 25)));
  const rows = sorted.slice((page - 1) * 25, page * 25);
  function href(changes: Record<string, string | null>) { return commissionHref(params, changes); }
  const evidence = selected?.receipt_evidence as { id: string; entry_id: string; evidence: string }[] | undefined;
  const available = report?.rows.filter(row => row.classification_id && selected &&
    ["account_id", "custodian_id", "quarter", "broker", "owner", "fee_type", "basis"].every(key => row[key] === selected[key])) ?? [];
  const candidates = [...(evidence ?? []).map(item => ({ id: item.id, label: `Vínculo revisado · ${item.entry_id} · ${item.evidence}` })),
    ...available.map(row => ({ id: row.classification_id!, label: `${row.account ?? row.account_id} · ${usd(row.actual_received)} · ${row.source_file ?? "Revenue"} · fila ${row.source_row ?? "N/D"}` }))];
  return <>
    <PageHeader eyebrow="CONTROL TRIMESTRAL · USD" title="Comisiones" description="Expectativas verificadas, cobros comparables y diferencias con trazabilidad por cuenta y beneficiario." />
    <nav className="report-tabs dimension-tabs" aria-label="Vistas de comisiones">{Object.entries(VIEWS).map(([key, label]) => <Link key={key} href={href({ vista: key, page: null, sort: null, detalle: null })} aria-current={key === view ? "page" : undefined}>{label}</Link>)}</nav>
    <section className="panel report-filters compact-filters"><form className="import-form">
      <input type="hidden" name="vista" value={view} />
      {fields.map(([key, label]) => <label key={key}>{label}<input name={key} defaultValue={typeof params[key] === "string" ? params[key] : ""} inputMode={key === "year" || key === "quarter" ? "numeric" : "text"} /></label>)}
      <label>Base<select name="basis" defaultValue={typeof params.basis === "string" ? params.basis : ""}><option value="">Todas (separadas)</option>{Object.entries(BASES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Estado<select name="status" defaultValue={typeof params.status === "string" ? params.status : ""}><option value="">Todos</option>{Object.entries(COMMISSION_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <div className="report-actions"><Button type="submit">Aplicar filtros</Button><Link href={`/comisiones?vista=${view}`}>Limpiar</Link></div>
    </form><p>Filtros conservados en URL. Owner es la referencia literal del archivo, no una identidad inferida por nombre.</p></section>
    {error || !report ? <section className="panel report-section" role="alert"><h2>No se pudo consultar Comisiones</h2><p>Revisá los filtros y la disponibilidad del motor. Si el conjunto supera 10.000 registros, acotá año o trimestre.</p><Link href={href({})}>Reintentar consulta</Link></section> : <>
      <section className="panel report-section"><div className="report-actions"><strong>Cobertura: {report.row_count} registros observados</strong><Link href={commissionHref(params, { formato: "csv", revision: report.revision, vista: view }, "/api/comisiones")}>Exportar {VIEWS[view].toLowerCase()} · CSV completo</Link></div>
        <p>Datos revisados de administración. Ausente = N/D. Cobertura referida al conjunto filtrado; no acredita que se recibió toda la información esperada. Sin cobro comparable no implica deuda.</p>
        <p>Esperado: Balance × tasa anual / 4, únicamente con evidencia aplicable al trimestre. Real y diferencias: sólo pares conciliados. Bruto, neto y payout se mantienen separados.</p>
      </section>
      {report.row_count === 0 && <section className="panel report-section"><h2>Sin registros para estos filtros</h2><p>Los importes aparecerán al registrar snapshots revisados y clasificar Revenue. No se generan expectativas para períodos sin evidencia.</p><Link href="/importaciones">Ir a importaciones</Link></section>}
      {view === "resumen" && report.summary.map(group => <section key={group.basis ?? "unclassified"} aria-label={BASES[group.basis ?? ""] ?? "Sin base clasificada"}>
        <h2>{BASES[group.basis ?? ""] ?? "Sin base clasificada"}</h2>
        <div className="metric-grid commission-metrics">
          <MetricCard title="Total esperado trimestral" value={usd(group.expected)} period="Suma de trimestres filtrados" note={`${group.verified} bases verificadas · importes conocidos`} primary />
          <MetricCard title="Cobrado real comparable" value={usd(group.actual)} period="Pares conciliados" note={`Esperado comparable: ${usd(group.comparable_expected)}`} />
          <MetricCard title="Diferencia USD" value={usd(group.variance)} period="Real − esperado comparable" note="Excluye bases y cobros pendientes" />
          <MetricCard title="Diferencia porcentual" value={percent(group.variance_percentage)} period="Sobre esperado comparable" note="N/D si falta base o es cero" />
          <MetricCard title="Cuentas conciliadas" value={String(group.reconciled_accounts)} period="Cuentas distintas" note={`${group.comparable} comparaciones · ${group.accounts} cuentas observadas`} />
          <MetricCard title="Casos pendientes" value={String(group.pending)} period="Revisión o cobertura faltante" note="Incluye sin esperado y sin cobro comparable" />
        </div>
        <div className="commission-charts"><CommissionChart rows={report.quarters.filter(row => row.basis === group.basis)} /><CommissionChart rows={report.quarters.filter(row => row.basis === group.basis && row.comparable > 0)} history /></div>
      </section>)}
      <section className="panel report-section"><h2>{view === "resumen" ? "Resumen trimestral exacto" : VIEWS[view]}</h2>
        {view === "representantes" && <p>Balance aplicable sólo con una foto y una fila por cuenta. Varias fechas o componentes: N/D para evitar sumar saldos repetidos. La comisión sí suma componentes revisados.</p>}
        {view === "cuentas" && <p>Histórico limitado a snapshots existentes con corte explícito. Sin extrapolar saldos ni tasas. Seleccioná una cuenta para filtrar su histórico.</p>}
        {view === "conciliaciones" && <p>Bandeja completa, incluidas conciliaciones resueltas. Filtrá por estado para revisar pendientes o diferencias. Abrí un caso para consultar evidencia y registrar la revisión.</p>}
        <div className="table-scroll commission-table" tabIndex={0} role="region" aria-label={VIEWS[view]}><Table.Root variant="surface"><Table.Header><Table.Row>
          {columns.map(([key, label]) => <Table.ColumnHeaderCell key={key} aria-sort={sort === key ? params.direction === "desc" ? "descending" : "ascending" : "none"}><Link href={href({ sort: key, direction: sort === key && params.direction !== "desc" ? "desc" : "asc", page: null })}>{label}{sort === key ? params.direction === "desc" ? " ↓" : " ↑" : ""}</Link></Table.ColumnHeaderCell>)}
          <Table.ColumnHeaderCell>{view === "representantes" ? "Estado / Detalle" : "Detalle"}</Table.ColumnHeaderCell>
        </Table.Row></Table.Header><Table.Body>{rows.map((row, i) => <Table.Row key={"obligation_id" in row ? row.obligation_id ?? row.entry_id ?? i : `${row.owner}-${row.quarter}-${row.basis}`}>
          {columns.map(([key]) => <Table.Cell key={key}>{display(row as unknown as Record<string, unknown>, key)}</Table.Cell>)}
          <Table.Cell>{view === "representantes" ? row.owner ? <Link href={href({ vista: "cuentas", owner: row.owner, basis: row.basis, page: null, sort: null, detalle: null })}>{(row as CommissionGroup).pending ? "Revisión pendiente" : ownersWithVariance.has(JSON.stringify([row.owner, row.basis])) ? "Conciliada con diferencias" : "Conciliada"} · Abrir beneficiario</Link> : "Sin beneficiario resuelto"
            : "account_id" in row ? <><Link href={href({ vista: "conciliaciones", detalle: row.obligation_id ?? row.entry_id ?? null })}>Revisar caso</Link><br /><Link href={href({ vista: "cuentas", account_id: row.account_id, page: null, detalle: null })}>Histórico de cuenta</Link></> : row.quarter ? <Link href={href({ vista: "cuentas", year: row.quarter.slice(0, 4), quarter: String(Math.floor((Number(row.quarter.slice(5, 7)) - 1) / 3) + 1), sort: null, page: null })}>Ver cuentas del trimestre</Link> : "N/D"}</Table.Cell>
        </Table.Row>)}</Table.Body></Table.Root></div>
        <nav className="report-actions commission-pagination" aria-label="Paginación de comisiones"><span>{sorted.length ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, sorted.length)} de ${sorted.length}` : "0 registros"}</span>{page > 1 && <Link href={href({ page: String(page - 1) })}>Anterior</Link>}{page * 25 < sorted.length && <Link href={href({ page: String(page + 1) })}>Siguiente</Link>}</nav>
      </section>
      {selected && view === "conciliaciones" && <>
        <section className="panel report-section commission-evidence"><h2>Evidencia del caso · {selected.account ?? selected.account_id}</h2><p>{selected.source_file ?? "Archivo N/D"} · {selected.source_sheet ?? "Hoja N/D"} · fila {selected.source_row ?? "N/D"}</p>
          <p>Beneficiario: {selected.owner ?? "Sin resolver"} · Corte: {selected.cutoff ?? "N/D"} · {COMMISSION_STATUSES[selected.status]}</p>
          <p>Referencia de caso: {selected.obligation_id ?? selected.entry_id}</p>
          <details><summary>Ver procedencia, revisión y referencias completas</summary><pre>{JSON.stringify(selected, null, 2)}</pre></details>
        </section>
        <CommissionReview key={`${selected.expected_id}-${selected.classification_id}-${selected.reconciliation_id}`} row={selected} candidates={candidates.filter((item, index) => candidates.findIndex(other => other.id === item.id) === index)} />
      </>}
    </>}
  </>;
}
