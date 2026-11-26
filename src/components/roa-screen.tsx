import { clearReferenceFilters } from "@/lib/queries/references";
import Link from "next/link";
import { Suspense } from "react";
import { Table } from "@radix-ui/themes";
import { requireAccess } from "@/lib/auth/access";
import { queryQuarterlyRoa, roaFailure } from "@/lib/roa/server";
import { queryReport } from "@/lib/queries/server";
import { FEE_STATUS, ROA_STATUS, roaYearQuarters, roaHref, roaScreenParameters, type RoaTrendPoint } from "@/lib/roa/presentation";
import type { RoaParameters, RoaReport } from "@/lib/roa/contracts";
import { dateLabel, exact, monthLabel, percent, usd, usdRounded, type Search } from "@/lib/queries/presentation";
import { EmptyState } from "./empty-state";
import { DataNoticeView } from "./availability-notice";
import { roaNotice } from "@/lib/queries/availability";
import { MetricCard } from "./metric-card";
import { RoaClassification, RoaCoverageFacts, RoaFilters, RoaMetricTable } from "./roa-view";
import { RoaChart } from "./roa-chart";

async function RoaEvolution({ parameters, report, params }: { parameters: RoaParameters; report: RoaReport; params: URLSearchParams }) {
  const { supabase } = await requireAccess();
  const points: RoaTrendPoint[] = await Promise.all(roaYearQuarters(parameters).map(async p => {
    const label = `T${p.report_quarter} ${p.report_year}`;
    try {
      const result = p.report_quarter === report.period.quarter ? { data: report, error: null } : await queryQuarterlyRoa(supabase, p);
      const data = result.error ? null : result.data;
      return { label, quarter: p.report_quarter, total: data?.total ?? null,
        advisory: data?.services.find(m => m.key === "Advisory") ?? null,
        error: result.error || !data ? roaFailure(result.error?.code).message : null };
    } catch { return { label, quarter: p.report_quarter, total: null, advisory: null, error: "Consulta trimestral no disponible." }; }
  }));
  return <section className="panel report-section roa-year" aria-labelledby="roa-evolution-title">
    <div className="roa-section-heading"><div><span className="roa-eyebrow">COMPARACIÓN ANUAL</span><h2 id="roa-evolution-title">Los cuatro trimestres de {parameters.report_year}</h2></div><span className="roa-unit">USD · ROA anualizado</span></div>
    <p>Mismos filtros, T1–T4. Cada trimestre conserva su propia revisión. Cliente y servicio reflejan la clasificación actual.</p>
    <div className="roa-quarter-grid">{points.map(p => <article key={p.label} className={`roa-quarter-card${p.quarter === parameters.report_quarter ? " is-selected" : ""}`}>
      <div className="roa-section-heading"><h3>{p.label}</h3><Link aria-current={p.quarter === parameters.report_quarter ? "page" : undefined} href={roaHref(params, { trimestre: String(p.quarter) }) + "#detalle"}>Ver detalle →</Link></div>
      {p.error ? <p role="alert">{p.error}</p> : <>
        <span className="roa-quarter-value">{percent(p.total?.roa_percent)}</span><span className="roa-quarter-caption">ROA anualizado · total filtrado</span>
        {p.total && <RoaClassification metric={p.total} />}
        <dl><div><dt>AUM promedio</dt><dd>{usd(p.total?.aum_average_usd)}</dd></div><div><dt>Revenue</dt><dd>{usd(p.total?.revenue_quarter_usd)}</dd></div>
          <div><dt>Fee ponderado · Advisory</dt><dd>{percent(p.advisory?.advisory_fee_percent)}</dd></div>
          <div><dt>ROA · Advisory</dt><dd>{percent(p.advisory?.roa_percent)}</dd></div>
          <div><dt>Tasas vinculadas · Advisory</dt><dd>{p.advisory?.advisory_rate_accounts ?? "N/D"} / {p.advisory?.advisory_accounts ?? "N/D"}</dd></div></dl>
      </>}
    </article>)}</div>
    <details className="roa-year-details"><summary>Ver gráficos y tabla comparativa</summary>
    <div className="roa-charts">{(["aum_average_usd", "revenue_quarter_usd", "roa_percent"] as const).map(source => <RoaChart key={source} source={source} points={points} />)}</div>
    <div className="table-scroll" role="region" tabIndex={0} aria-label="Evolución trimestral exacta"><Table.Root className="data-table"><Table.Header><Table.Row>
      {["Trimestre", "AUM promedio · USD", "Revenue · USD", "ROA anualizado", "Fee Advisory ponderado", "ROA Advisory", "Diferencia Advisory · pp", "Estado"].map(s => <Table.ColumnHeaderCell key={s}>{s}</Table.ColumnHeaderCell>)}
    </Table.Row></Table.Header><Table.Body>{points.map(p => <Table.Row key={p.label}><Table.RowHeaderCell>{p.label}</Table.RowHeaderCell>
      <Table.Cell>{usd(p.total?.aum_average_usd)}</Table.Cell><Table.Cell>{usd(p.total?.revenue_quarter_usd)}</Table.Cell><Table.Cell>{exact(p.total?.roa_percent)}{p.total?.roa_percent != null ? " %" : ""}</Table.Cell>
      <Table.Cell>{exact(p.advisory?.advisory_fee_percent)}{p.advisory?.advisory_fee_percent != null ? " %" : ""}</Table.Cell><Table.Cell>{percent(p.advisory?.roa_percent)}</Table.Cell><Table.Cell>{exact(p.advisory?.advisory_difference_pp)}{p.advisory?.advisory_difference_pp != null ? " pp" : ""}</Table.Cell>
      <Table.Cell>{p.error ?? (p.total ? `${ROA_STATUS[p.total.calculation_status]} · ${FEE_STATUS[p.advisory?.advisory_fee_status ?? "not_applicable"]}` : "Consulta sin resultado")}</Table.Cell>
    </Table.Row>)}</Table.Body></Table.Root></div>
    <p>Leé el Fee junto al ROA Advisory de la misma población. Los importes faltantes permanecen N/D.</p></details>
  </section>;
}

export async function RoaScreen({ search }: { search: Search }) {
  const { supabase, role } = await requireAccess();
  let parsed;
  try { parsed = roaScreenParameters(search); }
  catch (error) { return <><RoaFilters params={new URLSearchParams()} /><section className="panel report-section" role="alert"><h2>Revisá los filtros</h2><p>{error instanceof Error ? error.message : "Filtros inválidos."}</p><Link href="/rentabilidad">Reiniciar consulta</Link></section></>; }
  const { parameters, params } = parsed;
  if (!parameters) return <><RoaFilters params={params} /><EmptyState title="Elegí un año y trimestre">Consultá únicamente datos publicados. No se transforma un rango mensual en un trimestre implícito.</EmptyState></>;
  let report: RoaReport | null = null;
  let failure = "No se pudo consultar la información ROA. Reintentá más tarde.";
  try {
    const result = await queryQuarterlyRoa(supabase, parameters);
    if (result.error || !result.data) failure = roaFailure(result.error?.code).message;
    else report = result.data;
  } catch { /* El transporte nunca expone errores privados en la pantalla. */ }
  if (!report) return <><RoaFilters params={params} /><section className="panel report-section" role="alert"><h2>Consulta ROA no disponible</h2><p>{failure}</p><Link href={roaHref(params)}>Reintentar con estos filtros</Link><Link href={roaHref(params, clearReferenceFilters())}>Reiniciar consulta · limpiar selección REF</Link></section></>;
  // Solo reutiliza etiquetas públicas; ninguna métrica ROA proviene del reporte de cierre.
  const options = await queryReport(supabase, {
    reference_filters: parameters.reference_filters,
    month_from: report.period.from, month_to: report.period.to,
    custodian: parameters.custodian, team: parameters.team, advisor: parameters.advisor,
    client: parameters.client, account: parameters.account,
    group_by: "account", page_size: 1, page_offset: 0, expected_revision: null,
    service_filter: parameters.service_filter === "sin_clasificar" ? null : parameters.service_filter,
  }).then(result => result.error ? undefined : result.data).catch(() => undefined);
  const t = report.total, period = `T${report.period.quarter} ${report.period.year}`;
  const page = (offset: number) => roaHref(params, { offset: String(offset), limite: String(report.limit), revision: report.revision }) + "#detalle";
  return <>
    <RoaFilters params={params} options={options?.options} references={report.reference_options} />
    {!options && <p role="status">No se pudieron cargar las opciones de entidades. Los resultados ROA conservan los filtros seleccionados; reintentá para cambiar entidades.</p>}
    <Suspense fallback={<section className="panel report-section" role="status">Cargando los cuatro trimestres…</section>}><RoaEvolution parameters={parameters} report={report} params={params} /></Suspense>
    <section className="panel report-section roa-methodology" aria-labelledby="roa-basis-title"><h2 id="roa-basis-title">{period} · cálculo provisional sobre cobertura observada</h2>
      <RoaClassification metric={t} /><details><summary>Metodología y límites del cálculo</summary>
      <p>El universo esperado no está confirmado. Payout broker y su periodización MES/AÑO están pendientes de validación económica para ambos servicios. Este cálculo no acredita un ROA de negocio certificado.</p>
      <p>ROA anualizado = Revenue trimestral × 4 / AUM promedio × 100. AUM promedio = suma de tres fotos mensuales / 3. No representa rendimiento de cartera ni ganancia neta.</p>
      <p>Comercial y equipo se atribuyen al cierre de cada mes; cliente y servicio son actuales, sin historia. No se imputan ceros ni saldos anteriores.</p>
      {!report.period.closed && <p>Trimestre abierto: el ROA y la clasificación permanecen N/D.</p>}
      <p>Bajo: menos de 0,40%; OK: 0,40%–0,60% inclusive; Muy bien: más de 0,60%. Categorías calculadas en servidor antes del redondeo.</p></details>
    </section>
    <DataNoticeView notice={roaNotice(report)} availability={report.availability} params={params} path="/rentabilidad" admin={role === "admin"} />
    <div className="metric-grid roa-metrics">
      <MetricCard title="AUM promedio" value={usdRounded(t.aum_average_usd)} period={period} note="Tres fotos / 3. N/D si falta una base requerida." primary />
      <MetricCard title="Revenue trimestral" value={usdRounded(t.revenue_quarter_usd)} period={period} note="SUM(Payout broker) · importe conocido, puede ser parcial." />
      <MetricCard title="ROA anualizado" value={percent(t.roa_percent)} period={period} note={<RoaClassification metric={t} />} />
    </div>
    <section className="panel report-section"><h2>Comparación Advisory Fee</h2><p>Referencia anual ponderada por AUM de la misma población y trimestre. Diferencia ROA menos Fee, en puntos porcentuales. No es conciliación de comisiones.</p>
      <p>Las tasas se vinculan por cuenta y trimestre. Una tasa publicada puede estar asociada aunque falte AUM para ponderarla. Los conjuntos mixtos se comparan por servicio, sin mezclar el ROA total con el Fee Advisory.</p>
      <RoaMetricTable rows={report.services} />
    </section>
    <section className="panel report-section" id="detalle"><h2>Desglose trimestral</h2><p>Orden estable por clave. Total sobre todas las páginas; nunca promedio de ratios. Importes exactos; Revenue conocido puede ser parcial.</p>
      <RoaMetricTable rows={[{ ...t, label: "Total filtrado · todas las páginas" }, ...report.rows]} params={params} report={report} />
      {report.offset >= report.row_count && report.row_count > 0 && <p>Página sin filas. Volvé a la primera página.</p>}
      <nav className="import-pagination" aria-label="Paginación ROA">{report.offset > 0 && <Link href={page(Math.max(0, report.offset - report.limit))}>Anterior</Link>}<span>{report.row_count} grupos · {report.rows.length ? `desde ${report.offset + 1}` : "sin filas en esta página"}</span>{report.offset + report.limit < report.row_count && <Link href={page(report.offset + report.limit)}>Siguiente</Link>}</nav>
    </section>
    <section className="panel report-section" id="meses"><h2>Tres meses del conjunto filtrado</h2><p>{params.has("cuenta") ? "Cuenta seleccionada: fotos y flujos mensuales." : "Seleccioná una cuenta en el desglose para revisar sus tres fotos."} Subtotales conocidos; no acreditan completitud.</p>
      <ul>{report.months.map(m => <li key={m.period}><strong>{monthLabel(m.period)}</strong>: AUM {usd(m.aum_known_usd)}; Revenue {usd(m.revenue_known_usd)}. Sin AUM/Revenue: {m.missing_aum_account_months}/{m.missing_revenue_account_months} cuenta-meses.</li>)}</ul>
    </section>
    <section className="panel report-section" id="cobertura"><h2>Cobertura y actualización</h2><RoaCoverageFacts metric={t} />
      <p>Sin clasificar antes del filtro de servicio: {report.service_coverage_before_filter.unclassified_accounts}/{report.service_coverage_before_filter.accounts} cuentas; suma de fotos {usd(report.service_coverage_before_filter.unclassified_aum_month_sum_usd)}, Revenue {usd(report.service_coverage_before_filter.unclassified_revenue_usd)}.</p>
      <p>Publicación del alcance: {report.published_at ? dateLabel(report.published_at) : "N/D"}. Revisión: <code>{report.revision}</code>.</p>
      <details><summary>Publicaciones por mes y custodio</summary><ul>{report.coverage.map(c => <li key={`${c.period}-${c.custodian_id}-${c.source}`}>{monthLabel(c.period)} · custodio {c.custodian_id} · {c.source === "aum" ? "AUM" : "Revenue"}: {c.published ? "Publicada · completitud sin confirmar" : "Faltante · no equivale a cero"}</li>)}</ul>{!report.coverage.length && <p>Sin observaciones de custodios esperados.</p>}</details>
      <p>CSV no disponible para este informe. Las tablas muestran los importes exactos y la cobertura del conjunto consultado.</p>
    </section>
  </>;
}
