import Link from "next/link";
import { DatePicker } from "./ui/date-picker";
import { requireAccess } from "@/lib/auth/access";
import { loadScreen } from "@/lib/queries/screen";
import { type Search, reportHref } from "@/lib/queries/presentation";
import { EmptyState } from "./empty-state";
import { ReferenceClassification } from "./reference-classification";
import { CommercialOverview } from "./commercial-overview";
import { CoverageDisclosure } from "./coverage-disclosure";
import { SummaryActions, SummaryOverview } from "./summary-overview";
import { ReportDataStatus, ReportFilters, ReportTable } from "./report-view";

export async function ReportScreen({ search, commercial = false }: { search: Search; commercial?: boolean }) {
  const { supabase } = await requireAccess();
  const result = await loadScreen(supabase, search, commercial);
  const path = commercial ? "/analisis-comercial" : "/";
  if ("error" in result) return <section className="panel report-section" role="alert">
    <h2>{result.kind === "filters" ? "Revisá los filtros" : result.kind === "timeout" ? "La consulta tardó demasiado" : "Consulta no disponible"}</h2><p>{result.error}</p>
    {result.params && <form action={path} className="import-form">
      {[...result.params].filter(([key]) => !["desde", "hasta", "offset", "revision"].includes(key)).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
      <label>Desde · mes<DatePicker type="month" name="desde" required min="1900-01" max="9998-12" defaultValue={result.params.get("desde")!} /></label>
      <label>Hasta · cierre AUM<DatePicker type="month" name="hasta" required min="1900-01" max="9998-12" defaultValue={result.params.get("hasta")!} /></label>
      <button type="submit">Consultar rango</button>
    </form>}
    <Link href={result.params ? reportHref(path, result.params, commercial ? { agrupar: result.params.get("agrupar") ?? "custodian" } : {}) : path}>Reiniciar consulta</Link>
  </section>;
  const { report, params, consultedAt } = result;
  const t = report.total;
  return <>
    <SummaryActions report={report} params={params} commercial={commercial} />
    <ReportFilters params={params} report={report} path={path} commercial={commercial} compact />
    <ReportDataStatus report={report} params={params} path={path} />
    {!t.aum_rows && !t.revenue_rows && <EmptyState title="Sin datos publicados para estos filtros">Los meses faltantes conservan N/D. Cambiá el rango o limpiá los filtros; una ausencia no equivale a cero.</EmptyState>}
    {!commercial && <SummaryOverview report={report} params={params} />}
    {commercial && <CommercialOverview report={report} params={params} />}
    <ReferenceClassification report={report} params={params} />
    <ReportTable report={report} params={params} path={path} />
    <CoverageDisclosure report={report} consultedAt={consultedAt}><div className="export-definition"><h3>Exportación y definiciones</h3><p>El CSV completo incluye todas las filas del desglose, totales, series, filtros, definiciones y cobertura de esta revisión. Hasta 10.000 filas; si se supera, acotá los filtros. CSV UTF-8 separado por comas, punto decimal. Importá decimales extensos como texto en Excel.</p><p>Comparaciones N/D si falta base, cambia la población o faltan importes; porcentaje N/D con base cero. No se arrastran saldos anteriores.</p></div></CoverageDisclosure>
  </>;
}
