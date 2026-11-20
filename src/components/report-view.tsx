import { DatePicker } from "./ui/date-picker";
import { Select } from "./ui/select";
import type { ReactNode } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button, Table } from "@radix-ui/themes";
import type { Report, Metrics } from "@/lib/queries/contracts";
import { DIMENSIONS, ENTITY_FILTERS, dateLabel, exact, percent, monthLabel, reportHref, reportWarnings, usd } from "@/lib/queries/presentation";

export function ReportDataStatus({ report, params, path }: { report: Report; params: URLSearchParams; path: string }) {
  const warnings = reportWarnings(report);
  if (!warnings.length) return null;
  const lastAum = report.months.findLast((m) => (m.aum_rows ?? 0) > 0);
  const previousClosing = lastAum && lastAum.period < report.period.to;
  return <section className="panel report-section" aria-labelledby="data-status-title">
    <h2 id="data-status-title">Datos disponibles y pendientes</h2>
    <ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
    <div className="report-actions">
      {previousClosing && <Link href={reportHref(path, params, { hasta: lastAum.period.slice(0, 7), agrupar: report.group_by })}>Ver cierre con registros de AUM: {monthLabel(lastAum.period)}</Link>}
      <a href="#cobertura">Revisar cobertura por mes y custodio</a>
    </div>
    {previousClosing && <p>El enlace cambia el mes Hasta y también el rango de Revenue. Los filtros de entidades se conservan.</p>}
  </section>;
}

export function ReportFilters({ params, report, path, commercial = false, children, accountId, compact = false }: { params: URLSearchParams; report: Report; path: string; commercial?: boolean; children?: ReactNode; accountId?: string; compact?: boolean }) {
  const entityField = (key: string, label: string) => {
    if (key === "cuenta" && accountId) return <input key={key} type="hidden" name="cuenta" value={accountId} />;
    const options = report.options?.[key] ?? [], selected = params.get(key) ?? "";
    return <label key={key}>{label}<Select name={key} defaultValue={selected}>
      <option value="">Todos · incluye sin asignar</option>
      {selected && !options.some((o) => o.id === selected) && <option value={selected}>{selected}</option>}
      {options.map((o) => <option value={o.id} key={o.id}>{o.label}</option>)}
    </Select></label>;
  };
  return <section className={`panel report-filters${compact ? " compact-filters" : ""}`} aria-label="Filtros compartidos">
    <form action={path} className="import-form">
      <label>Desde · mes<DatePicker type="month" name="desde" required min="1900-01" max="9998-12" defaultValue={params.get("desde")!} /></label>
      <label>Hasta · cierre AUM<DatePicker type="month" name="hasta" required min="1900-01" max="9998-12" defaultValue={params.get("hasta")!} /></label>
      {Object.entries(ENTITY_FILTERS).filter(([key]) => !compact || key === "custodio").map(([key, label]) => entityField(key, label))}
      {compact && <details className="advanced-filters" open={Object.keys(ENTITY_FILTERS).some((key) => key !== "custodio" && params.has(key))}>
        <summary><SlidersHorizontal size={15} aria-hidden="true" /> Más filtros{Object.keys(ENTITY_FILTERS).some((key) => key !== "custodio" && params.has(key)) ? " · activos" : ""}</summary>
        <div className="advanced-fields">{Object.entries(ENTITY_FILTERS).filter(([key]) => key !== "custodio").map(([key, label]) => entityField(key, label))}</div>
      </details>}
      {commercial && <label>Desglose<Select name="agrupar" defaultValue={report.group_by}>
        {Object.entries(DIMENSIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </Select></label>}
      {children}
      <div className="report-actions"><Button type="submit" highContrast>Aplicar filtros</Button><Link href={path}>Limpiar filtros</Link></div>
    </form>
    <p className="section-note">Rango inclusivo · hasta 120 meses. Opciones observadas bajo estos filtros, hasta 100 por selector; limpiá para ampliar. AUM usa el cierre de {monthLabel(report.period.to)}; Revenue suma el rango.</p>
    <nav className="report-actions" aria-label="Vistas del informe">
      <Link href={reportHref("/", params)}>Ver resumen filtrado</Link>
      <Link href={reportHref("/analisis-comercial", params)}>Ver análisis comercial filtrado</Link>
      <Link href={reportHref("/cuentas", params)}>Ver cuentas filtradas</Link>
    </nav>
  </section>;
}

export function ReportCoverage({ report, consultedAt, anchor = true }: { report: Report; consultedAt: string; anchor?: boolean }) {
  const t = report.total;
  const custodians = new Map((report.options?.custodio ?? []).map((o) => [o.id, o.label]));
  return <section className="panel report-section" id={anchor ? "cobertura" : undefined}>
    <h2>Cobertura y actualización</h2>
    <p>Última publicación del alcance: <strong>{report.published_at ? dateLabel(report.published_at) : "N/D"}</strong>. Consulta: {dateLabel(consultedAt)} · hora de Buenos Aires.</p>
    <p>Universo observado en el rango y mes anterior. La cobertura esperada todavía no está confirmada; una publicación no acredita completitud.</p>
    <div className="coverage-facts">
      <p>AUM al cierre: {t.aum_values}/{t.aum_rows} filas con importe; {t.aum_missing_accounts} cuentas sin foto.</p>
      <p>Revenue del rango: {t.revenue_values}/{t.revenue_rows} filas con importe; {t.revenue_missing_account_months} cuenta-meses sin registros.</p>
      <p>Sin comercial: {t.aum_accounts_without_advisor} cuentas AUM, {t.revenue_accounts_without_advisor} cuentas Revenue. Subtotales: {usd(t.aum_without_advisor_usd)} AUM / {usd(t.revenue_without_advisor_usd)} Revenue.</p>
      <p>Sin equipo: {t.aum_accounts_without_team} cuentas AUM, {t.revenue_accounts_without_team} cuentas Revenue. Sin cliente: {t.aum_accounts_without_client} cuentas AUM.</p>
    </div>
    <p>FA: cobertura contractual N/D. Se aplica la vigencia al cierre de cada mes; las cuentas sin asignación permanecen en los totales.</p>
    <details><summary>Ver cobertura por fuente, mes y custodio</summary>
      <div className="table-scroll" role="region" aria-label="Cobertura mensual" tabIndex={0}>
        <Table.Root className="data-table"><Table.Header><Table.Row>
          <Table.ColumnHeaderCell>Mes</Table.ColumnHeaderCell><Table.ColumnHeaderCell>Custodio</Table.ColumnHeaderCell><Table.ColumnHeaderCell>Fuente</Table.ColumnHeaderCell><Table.ColumnHeaderCell>Publicación</Table.ColumnHeaderCell>
        </Table.Row></Table.Header><Table.Body>{report.coverage.map((c) => <Table.Row key={`${c.period}-${c.custodian_id}-${c.source}`}>
          <Table.RowHeaderCell>{monthLabel(c.period)}</Table.RowHeaderCell><Table.Cell>{custodians.get(c.custodian_id) ?? c.custodian_id}</Table.Cell><Table.Cell>{c.source === "aum" ? "AUM" : "Revenue"}</Table.Cell><Table.Cell>{c.published ? "Publicada · completitud sin confirmar" : "Faltante · no equivale a cero"}</Table.Cell>
        </Table.Row>)}</Table.Body></Table.Root>
      </div>
      {!report.coverage.length && <p>Sin observaciones para determinar custodios esperados.</p>}
      <h3>Observaciones por mes</h3>
      <ul>{report.months.map((m) => <li key={m.period}>{monthLabel(m.period)}: AUM {m.aum_values ?? 0}/{m.aum_rows ?? 0} importes; {m.aum_missing_accounts ?? 0} cuentas sin foto. Revenue {m.revenue_values ?? 0}/{m.revenue_rows ?? 0} importes; {m.revenue_missing_account_months ?? 0} cuenta-meses sin registro. Sin comercial: {m.aum_accounts_without_advisor ?? 0} cuentas AUM / {m.revenue_accounts_without_advisor ?? 0} Revenue. Sin equipo: {m.aum_accounts_without_team ?? 0} AUM / {m.revenue_accounts_without_team ?? 0} Revenue.</li>)}</ul>
    </details>
  </section>;
}

const dimensionFilter = { custodian: "custodio", team: "equipo", advisor: "comercial", client: "cliente", account: "cuenta", service: "servicio" };
export function ReportTable({ report, params, path }: { report: Report; params: URLSearchParams; path: string }) {
  const metricCells = (m: Metrics) => <>
    <Table.Cell align="right" className="money">{usd(m.aum_usd)}</Table.Cell>
    <Table.Cell align="right" className="money">{usd(m.revenue_usd)}</Table.Cell>
    <Table.Cell align="right">{m.aum_share_percent == null ? "N/D" : <abbr tabIndex={0} title={`${exact(m.aum_share_percent)} % exacto`}>{percent(m.aum_share_percent)}</abbr>}</Table.Cell>
    <Table.Cell align="right">{m.revenue_share_percent == null ? "N/D" : <abbr tabIndex={0} title={`${exact(m.revenue_share_percent)} % exacto`}>{percent(m.revenue_share_percent)}</abbr>}</Table.Cell>
  </>;
  const page = (offset: number) => reportHref(path, params, { agrupar: report.group_by, offset: String(offset), limite: String(report.limit), revision: report.revision });
  return <section className="panel report-section" id="detalle">
    <h2>{report.group_by === "account" ? "Detalle por cuenta" : `Distribución y ranking por ${DIMENSIONS[report.group_by].toLowerCase()}`}</h2>
    <p>AUM al cierre de {monthLabel(report.period.to)} · Revenue {monthLabel(report.period.from)}–{monthLabel(report.period.to)}. {report.group_by === "account" ? "Orden por UUID." : "Orden descendente por AUM; desempate por ID. Incluye sin asignar."}</p>
    <p>Participación sobre importes conocidos del conjunto completo filtrado, por fuente. N/D ante ajustes negativos, importes ausentes o total no positivo. Los faltantes de cobertura siguen visibles. Los conteos distintos no son aditivos entre grupos.</p>
    <div className="table-scroll" role="region" aria-label="Cifras exactas y participaciones, desplazamiento horizontal" tabIndex={0}>
      <Table.Root className="data-table"><Table.Header><Table.Row>
        <Table.ColumnHeaderCell>{DIMENSIONS[report.group_by]}</Table.ColumnHeaderCell>
        <Table.ColumnHeaderCell align="right">AUM al cierre · USD</Table.ColumnHeaderCell><Table.ColumnHeaderCell align="right">Revenue del rango · USD</Table.ColumnHeaderCell>
        <Table.ColumnHeaderCell align="right">Participación AUM</Table.ColumnHeaderCell><Table.ColumnHeaderCell align="right">Participación Revenue</Table.ColumnHeaderCell><Table.ColumnHeaderCell>Detalle</Table.ColumnHeaderCell>
      </Table.Row></Table.Header><Table.Body>
        <Table.Row className="report-total"><Table.RowHeaderCell>Total filtrado · todas las páginas</Table.RowHeaderCell>{metricCells(report.total)}<Table.Cell>Fuente: consulta agregada</Table.Cell></Table.Row>
        {report.rows.map((row) => <Table.Row key={row.key}>
          <Table.RowHeaderCell>{row.key === "sin_asignar" ? row.label : <Link href={(report.group_by === "account" ? reportHref(`/cuentas/${row.key}`, params, { cuenta: row.key }) : reportHref("/analisis-comercial", params, { agrupar: "account", [dimensionFilter[report.group_by]]: row.key })) + (report.group_by === "account" ? "" : "#detalle")}>{row.label}</Link>}</Table.RowHeaderCell>
          {metricCells(row)}<Table.Cell><details><summary>Ver cobertura de {row.label}</summary><p>AUM: {row.aum_values}/{row.aum_rows} importes, {row.aum_missing_accounts} cuentas sin foto. Revenue: {row.revenue_values}/{row.revenue_rows} importes, {row.revenue_missing_account_months} cuenta-meses sin registro.</p><p>Cuentas con AUM: {row.accounts_with_aum}; clientes con AUM: {row.clients_with_aum}; cuentas con Revenue: {row.accounts_with_revenue}. Sin comercial: {row.aum_accounts_without_advisor} AUM / {row.revenue_accounts_without_advisor} Revenue.</p><p>Participación exacta: AUM {exact(row.aum_share_percent)}{row.aum_share_percent == null ? "" : " %"}; Revenue {exact(row.revenue_share_percent)}{row.revenue_share_percent == null ? "" : " %"}.</p></details></Table.Cell>
        </Table.Row>)}
      </Table.Body></Table.Root>
    </div>
    <nav className="import-pagination" aria-label="Paginación del desglose">
      {report.offset > 0 && <Link href={page(Math.max(0, report.offset - report.limit)) + "#detalle"}>Anterior</Link>}
      <span>{report.row_count ? `${Math.min(report.offset + 1, report.row_count)}–${Math.min(report.offset + report.limit, report.row_count)} de ${report.row_count}` : "Sin filas de desglose"}</span>
      {report.offset + report.limit < report.row_count && <Link href={page(report.offset + report.limit) + "#detalle"}>Siguiente</Link>}
    </nav>
  </section>;
}
