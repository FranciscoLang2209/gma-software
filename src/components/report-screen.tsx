import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { loadScreen } from "@/lib/queries/screen";
import { type Search, exportHref, reportHref } from "@/lib/queries/presentation";
import { EmptyState } from "./empty-state";
import { ReportChart } from "./report-chart";
import { SummaryActions, SummaryOverview } from "./summary-overview";
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
  const t = report.total;
  return <>
    {!commercial && <SummaryActions report={report} params={params} />}
    <ReportFilters params={params} report={report} path={path} commercial={commercial} compact={!commercial} />
    {commercial && <section className="panel report-section" aria-label="Exportación del informe">
      <a href={exportHref(params, report)}>Descargar {commercial ? "tabla comercial" : "resumen filtrado"} · CSV completo</a>
      <p className="section-note">Incluye todas las filas del desglose, totales, series, período, filtros, definiciones y cobertura de esta revisión. Hasta 10.000 filas; si se supera, acotá los filtros. CSV UTF-8 separado por comas, punto decimal. Para conservar decimales extensos, importá las columnas como texto en Excel.</p>
    </section>}
    {!t.aum_rows && !t.revenue_rows && <EmptyState title="Sin datos publicados para estos filtros">Los meses faltantes conservan N/D. Cambiá el rango o limpiá los filtros; una ausencia no equivale a cero.</EmptyState>}
    {!commercial && <SummaryOverview report={report} params={params} />}
    {commercial && <>
      <nav className="report-tabs" aria-label="Rankings y distribución">{[["custodian", "Custodios"], ["team", "Equipos"], ["advisor", "Comerciales"], ["client", "Clientes"]].map(([key, label]) => <Link key={key} aria-current={report.group_by === key ? "page" : undefined} href={reportHref(path, params, { agrupar: key })}>{label}</Link>)}</nav>
      <p className="section-note">Asignación histórica al cierre de cada mes. Revenue de un rango puede corresponder a equipos distintos; cliente y servicio usan la clasificación de la cuenta sin historia modelada.</p>
      {report.group_by === "custodian" && <div className="report-charts"><ReportChart report={report} source="aum" distribution /><ReportChart report={report} source="revenue" distribution /></div>}
    </>}
    <ReportTable report={report} params={params} path={path} />
    {commercial ? <ReportCoverage report={report} consultedAt={consultedAt} /> : <details className="panel coverage-disclosure" id="cobertura"><summary><span>Cobertura y trazabilidad</span><span>Fuentes, faltantes y actualización</span></summary><ReportCoverage report={report} consultedAt={consultedAt} anchor={false} /><div className="export-definition"><h3>Exportación y definiciones</h3><p>El CSV completo incluye todas las filas del desglose, totales, series, filtros, definiciones y cobertura de esta revisión. Hasta 10.000 filas; si se supera, acotá los filtros. CSV UTF-8 separado por comas, punto decimal. Importá decimales extensos como texto en Excel.</p><p>Comparaciones N/D si falta base, cambia la población o faltan importes; porcentaje N/D con base cero. No se arrastran saldos anteriores.</p></div></details>}
  </>;
}
