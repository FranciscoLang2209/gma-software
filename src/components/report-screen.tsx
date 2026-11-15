import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { loadScreen } from "@/lib/queries/screen";
import { type Search, exact, exportHref, monthLabel, reportHref, usd } from "@/lib/queries/presentation";
import { EmptyState } from "./empty-state";
import { ReportChart } from "./report-chart";
import { ReportCoverage, ReportFilters, ReportTable } from "./report-view";

export async function ReportScreen({ search, commercial = false }: { search: Search; commercial?: boolean }) {
  const { supabase } = await requireAccess();
  const result = await loadScreen(supabase, search, commercial);
  const path = commercial ? "/analisis-comercial" : "/";
  if ("error" in result) return <section className="panel report-section" role="alert">
    <h2>{result.kind === "filters" ? "Revisá los filtros" : "Consulta no disponible"}</h2><p>{result.error}</p>
    <Link href={result.params ? reportHref(path, result.params, commercial ? { agrupar: result.params.get("agrupar") ?? "custodian" } : {}) : path}>Reiniciar consulta</Link>
  </section>;
  const { report, params, consultedAt } = result;
  const t = report.total, last = report.months.at(-1);
  const closing = monthLabel(report.period.to), range = `${monthLabel(report.period.from)}–${closing}`;
  const comparison = last ? `${closing} vs. ${monthLabel(last.previous_period)}` : "N/D";
  const change = (value: string | null | undefined, percent: string | null | undefined) => `${usd(value)} · ${percent == null ? "N/D" : `${exact(percent)} %`}`;
  const metrics = [
    { title: "AUM al cierre", value: usd(t.aum_usd), period: closing, note: `${comparison}: ${change(last?.aum_change_usd, last?.aum_change_percent)}` },
    { title: "Revenue del rango", value: usd(t.revenue_usd), period: range, note: "Comparación del acumulado: N/D · se compara el flujo mensual por separado." },
    { title: "Variación mensual de AUM", value: change(last?.aum_change_usd, last?.aum_change_percent), period: comparison, note: "Cambio de la foto mensual; no es rendimiento." },
    { title: "Variación mensual de Revenue", value: change(last?.revenue_change_usd, last?.revenue_change_percent), period: comparison, note: "Compara el flujo del mes de cierre, no el acumulado del rango." },
    { title: "Cuentas con AUM", value: String(t.accounts_with_aum), period: closing, note: "Con registro presente, incluso cero o importe ausente. Comparación: N/D, sin regla de actividad." },
    { title: "Clientes con AUM", value: String(t.clients_with_aum), period: closing, note: `Clientes distintos conocidos; ${t.aum_accounts_without_client} cuentas sin cliente. Comparación: N/D.` },
    { title: "Cuentas con Revenue", value: String(t.accounts_with_revenue), period: range, note: "Con registros en el rango. Comparación: N/D; no equivale a cuentas activas." },
  ];
  return <>
    <ReportFilters params={params} report={report} path={path} commercial={commercial} />
    <section className="panel report-section" aria-label="Exportación del informe">
      <a href={exportHref(params, report)}>Descargar {commercial ? "tabla comercial" : "resumen filtrado"} · CSV completo</a>
      <p className="section-note">Incluye todas las filas del desglose, totales, series, período, filtros, definiciones y cobertura de esta revisión. Hasta 10.000 filas; si se supera, acotá los filtros. CSV UTF-8 separado por comas, punto decimal. Para conservar decimales extensos, importá las columnas como texto en Excel.</p>
    </section>
    {!t.aum_rows && !t.revenue_rows && <EmptyState title="Sin datos publicados para estos filtros">Los meses faltantes conservan N/D. Cambiá el rango o limpiá los filtros; una ausencia no equivale a cero.</EmptyState>}
    {!commercial && <>
      <section className="metric-grid report-metrics" aria-label="Indicadores del negocio">{metrics.map((m) => <article key={m.title} className="metric-card">
        <h2>{m.title}</h2><p>{m.period}</p><p className="metric-value">{m.value}</p><p>{m.note}</p><Link href="#detalle">Ver cifras y cobertura</Link>
      </article>)}</section>
      <p className="section-note">Importes conocidos, sujetos a la cobertura informada. Comparaciones N/D si falta base, cambia la población o faltan importes; porcentaje N/D con base cero.</p>
      <div className="report-charts"><ReportChart report={report} source="aum" /><ReportChart report={report} source="revenue" /></div>
    </>}
    {commercial && <>
      <nav className="report-tabs" aria-label="Rankings y distribución">{[["custodian", "Custodios"], ["team", "Equipos"], ["advisor", "Comerciales"], ["client", "Clientes"]].map(([key, label]) => <Link key={key} aria-current={report.group_by === key ? "page" : undefined} href={reportHref(path, params, { agrupar: key })}>{label}</Link>)}</nav>
      <p className="section-note">Asignación histórica al cierre de cada mes. Revenue de un rango puede corresponder a equipos distintos; cliente y servicio usan la clasificación de la cuenta sin historia modelada.</p>
      {report.group_by === "custodian" && <div className="report-charts"><ReportChart report={report} source="aum" distribution /><ReportChart report={report} source="revenue" distribution /></div>}
    </>}
    <ReportTable report={report} params={params} path={path} />
    <ReportCoverage report={report} consultedAt={consultedAt} />
  </>;
}
