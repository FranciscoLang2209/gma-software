import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { loadScreen } from "@/lib/queries/screen";
import { type Search, reportHref } from "@/lib/queries/presentation";
import { EmptyState } from "./empty-state";
import { CommercialOverview } from "./commercial-overview";
import { CoverageDisclosure } from "./coverage-disclosure";
import { SummaryActions, SummaryOverview } from "./summary-overview";
import { ReportFilters, ReportTable } from "./report-view";

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
    <SummaryActions report={report} params={params} commercial={commercial} />
    <ReportFilters params={params} report={report} path={path} commercial={commercial} compact />
    {!t.aum_rows && !t.revenue_rows && <EmptyState title="Sin datos publicados para estos filtros">Los meses faltantes conservan N/D. Cambiá el rango o limpiá los filtros; una ausencia no equivale a cero.</EmptyState>}
    {!commercial && <SummaryOverview report={report} params={params} />}
    {commercial && <CommercialOverview report={report} params={params} />}
    <ReportTable report={report} params={params} path={path} />
    <CoverageDisclosure report={report} consultedAt={consultedAt}><div className="export-definition"><h3>Exportación y definiciones</h3><p>El CSV completo incluye todas las filas del desglose, totales, series, filtros, definiciones y cobertura de esta revisión. Hasta 10.000 filas; si se supera, acotá los filtros. CSV UTF-8 separado por comas, punto decimal. Importá decimales extensos como texto en Excel.</p><p>Comparaciones N/D si falta base, cambia la población o faltan importes; porcentaje N/D con base cero. No se arrastran saldos anteriores.</p></div></CoverageDisclosure>
  </>;
}
