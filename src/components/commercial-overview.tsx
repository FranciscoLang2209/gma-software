import Link from "next/link";
import { Landmark, Layers3 } from "lucide-react";
import type { Report } from "@/lib/queries/contracts";
import { monthLabel, reportHref, usd } from "@/lib/queries/presentation";
import { MetricCard } from "./metric-card";
import { ReportChart } from "./report-chart";

export function CommercialOverview({ report, params }: { report: Report; params: URLSearchParams }) {
  return <>
    <nav className="report-tabs dimension-tabs" aria-label="Rankings y distribución">{[["custodian", "Custodios"], ["team", "Equipos"], ["advisor", "Comerciales"], ["client", "Clientes"], ["account", "Cuentas"], ["service", "Servicios"]].map(([key, label]) => <Link key={key} aria-current={report.group_by === key ? "page" : undefined} href={reportHref("/analisis-comercial", params, { agrupar: key })}>{label}</Link>)}</nav>
    <section className="metric-grid primary-metrics commercial-metrics" aria-label="Totales del análisis comercial">
      <MetricCard title="AUM al cierre" value={usd(report.total.aum_usd)} period={monthLabel(report.period.to)} icon={<Landmark size={18} />} note="Total filtrado de todas las páginas. Incluye sin asignar." />
      <MetricCard title="Revenue del rango" value={usd(report.total.revenue_usd)} period={`${monthLabel(report.period.from)} — ${monthLabel(report.period.to)}`} icon={<Layers3 size={18} />} note="Suma de Payout broker del rango. Incluye sin asignar." />
    </section>
    <p className="summary-disclaimer">Asignación histórica al cierre de cada mes. Revenue de un rango puede corresponder a equipos distintos; cliente y servicio usan la clasificación de la cuenta sin historia modelada.</p>
    <div className="section-heading"><div><p className="eyebrow">DISTRIBUCIÓN COMERCIAL</p><h2>Comparación entre grupos</h2></div><a href="#detalle">Ver ranking e importes exactos</a></div>
    <div className="report-charts"><ReportChart report={report} source="aum" distribution /><ReportChart report={report} source="revenue" distribution /></div>
  </>;
}
