import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, Landmark, Layers3, Users, Wallet, Info } from "lucide-react";
import type { Report } from "@/lib/queries/contracts";
import { exact, exportHref, monthLabel, reportHref, usd } from "@/lib/queries/presentation";
import { MetricCard } from "./metric-card";
import { ReportChart } from "./report-chart";

export function SummaryActions({ report, params }: { report: Report; params: URLSearchParams }) {
  return <div className="summary-toolbar">
    <div><span className="semantic-badge">Datos publicados</span><span className="toolbar-period">{monthLabel(report.period.from)} — {monthLabel(report.period.to)} · USD</span></div>
    <a className="button-outline" href={exportHref(params, report)}><ArrowDownToLine size={16} aria-hidden="true" /> Exportar resumen · CSV</a>
  </div>;
}

export function SummaryOverview({ report, params }: { report: Report; params: URLSearchParams }) {
  const t = report.total, last = report.months.at(-1);
  const closing = monthLabel(report.period.to), range = `${monthLabel(report.period.from)} — ${closing}`;
  const comparison = last ? `${closing} vs. ${monthLabel(last.previous_period)}` : "Comparación N/D";
  const change = (amount: string | null | undefined, percentage: string | null | undefined) => <>
    <strong>{usd(amount)}</strong><span className="change-percent">{percentage == null ? "N/D" : `${exact(percentage)} %`}</span>
  </>;
  return <>
    <section className="metric-grid primary-metrics" aria-label="Indicadores principales">
      <MetricCard primary title="AUM al cierre" value={usd(t.aum_usd)} period={`Foto mensual · ${closing}`} icon={<Landmark size={20} />} note={<><span>{comparison}</span><div>{change(last?.aum_change_usd, last?.aum_change_percent)}</div></>} />
      <MetricCard primary title="Revenue del rango" value={usd(t.revenue_usd)} period={`Acumulado · ${range}`} icon={<Layers3 size={20} />} note={<><span>SUM(Payout broker) · USD</span><div>Comparación del acumulado: N/D</div></>} />
    </section>
    <section className="metric-grid secondary-metrics" aria-label="Cuentas, clientes y variación mensual">
      <MetricCard title="Cuentas con AUM" value={String(t.accounts_with_aum)} period={`Al cierre · ${closing}`} icon={<Wallet size={17} />} note="Con registro, incluso cero o importe ausente. Sin comparación de actividad." />
      <MetricCard title="Clientes con AUM" value={String(t.clients_with_aum)} period={`Conocidos · ${closing}`} icon={<Users size={17} />} note={`${t.aum_accounts_without_client} cuentas sin cliente. Comparación N/D.`} />
      <MetricCard title="Cuentas con Revenue" value={String(t.accounts_with_revenue)} period={range} icon={<Wallet size={17} />} note="Con registros en el rango; no equivale a cuentas activas. Comparación N/D." />
      <MetricCard title="Variación mensual de Revenue" value={usd(last?.revenue_change_usd)} period={comparison} note={<>{last?.revenue_change_percent == null ? "N/D" : `${exact(last.revenue_change_percent)} %`} · Compara el flujo mensual, no el acumulado.</>} />
    </section>
    <p className="summary-disclaimer"><Info size={15} aria-hidden="true" /><span>Importes conocidos, sujetos a cobertura. La variación mensual de AUM no es rendimiento. Revenue no es ganancia neta. <a href="#cobertura">Revisar cobertura</a></span></p>
    <div className="section-heading"><div><p className="eyebrow">EVOLUCIÓN DEL NEGOCIO</p><h2>Historia mensual</h2></div><span>USD · escalas independientes</span></div>
    <div className="report-charts"><ReportChart report={report} source="aum" /><ReportChart report={report} source="revenue" /></div>
    <section className="panel summary-explore" aria-label="Distribución del negocio">
      <div><span className="metric-icon"><Landmark size={20} aria-hidden="true" /></span><div><h2>Distribución del negocio</h2><p>Explorá custodios, equipos y comerciales con el mismo período y filtros.</p></div></div>
      <Link className="button-outline" href={reportHref("/analisis-comercial", params, { agrupar: "custodian" })}>Análisis por custodio <ArrowUpRight size={16} aria-hidden="true" /></Link>
    </section>
    {report.group_by === "custodian" && <div className="report-charts"><ReportChart report={report} source="aum" distribution /><ReportChart report={report} source="revenue" distribution /></div>}
  </>;
}
