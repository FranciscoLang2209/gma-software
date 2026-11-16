"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartNoAxesCombined } from "lucide-react";
import type { Report } from "@/lib/queries/contracts";
import { DIMENSIONS, monthLabel, usd } from "@/lib/queries/presentation";

export function ReportChart({ report, source, distribution = false }: { report: Report; source: "aum" | "revenue"; distribution?: boolean }) {
  const field = source === "aum" ? "aum_usd" : "revenue_usd";
  const label = source === "aum" ? "AUM" : "Revenue";
  // Number solo ubica píxeles; importes, totales y participaciones vienen de SQL y se muestran como texto exacto.
  const data = distribution ? report.rows.slice(0, 8).map((r) => ({ label: r.label, exact: r[field], value: r[field] == null ? null : Number(r[field]) }))
    : report.months.map((m) => ({ label: monthLabel(m.period), exact: m[field], value: m[field] == null ? null : Number(m[field]) }));
  const hasValues = data.some((d) => d.value !== null);
  const title = distribution ? `${label} por ${DIMENSIONS[report.group_by].toLowerCase()} · página visible` : `Evolución mensual de ${label}`;
  const color = source === "aum" ? "#204c6b" : "#557d8b";
  const axes = <><CartesianGrid stroke="#e8edf3" vertical={false} /><XAxis padding={{ left: 12, right: 30 }} dataKey="label" tick={{ fontSize: 12, fill: "#65758a" }} interval="preserveStartEnd" /><YAxis domain={([min, max]: readonly [number, number]) => [Math.min(min, 0), Math.max(max, 0)]} tick={{ fontSize: 12, fill: "#65758a" }} width={76} tickFormatter={(v: number) => new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(v)} /><ReferenceLine y={0} stroke="#a5b3c2" /></>;
  const distributionAxes = <><CartesianGrid stroke="#e8edf3" horizontal={false} /><XAxis type="number" domain={([min, max]: readonly [number, number]) => [Math.min(min, 0), Math.max(max, 0)]} tick={{ fontSize: 10, fill: "#65758a" }} tickFormatter={(v: number) => new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(v)} /><YAxis type="category" dataKey="label" width={105} tick={{ fontSize: 10, fill: "#65758a" }} tickFormatter={(v: string) => v.length > 16 ? `${v.slice(0, 15)}…` : v} /><ReferenceLine x={0} stroke="#a5b3c2" /></>;
  const tooltip = <Tooltip content={({ active, payload }) => {
    const point = payload?.[0]?.payload as (typeof data)[number] | undefined;
    return active && point ? <div className="chart-tooltip"><span>{point.label} · {label}</span><strong>{usd(point.exact)}</strong></div> : null;
  }} />;
  return <section className="panel report-section chart-card">
    <h2>{title}</h2><p>{source === "aum" ? "Foto mensual · sin saldos arrastrados" : distribution ? "Suma del rango · ajustes con signo" : "Payout broker de cada mes · flujo en USD"}</p>
    <figure className="report-figure" aria-label={`${title}, USD; valores exactos disponibles a continuación`}>
      {hasValues ? <div className="report-chart" aria-hidden="true"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 260 }}>
        {distribution || source === "revenue" ? <BarChart data={data} layout={distribution ? "vertical" : "horizontal"} accessibilityLayer={false}>{distribution ? distributionAxes : axes}{tooltip}<Bar dataKey="value" maxBarSize={36} radius={[3, 3, 0, 0]} fill={color} isAnimationActive={false} /></BarChart>
          : <LineChart data={data} accessibilityLayer={false}>{axes}{tooltip}<Line dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} isAnimationActive={false} /></LineChart>}
      </ResponsiveContainer></div> : <div className="chart-no-values"><ChartNoAxesCombined size={28} aria-hidden="true" /><strong>Sin valores publicados</strong><span>Los datos de este gráfico aparecerán al publicar la fuente correspondiente.</span></div>}
      <figcaption>USD · escalas independientes. N/D indica faltante, nunca cero. {distribution ? "Hasta 8 grupos de la página visible, en el orden del desglose (AUM o UUID según dimensión). No es un ranking por Revenue. Todos los grupos e importes exactos están en la tabla; el total filtrado incluye todas las páginas." : "La variación de AUM no representa rendimiento."}</figcaption>
    </figure>
    {!distribution && data.some((d) => d.value === null) && <p>Meses faltantes: {data.filter((d) => d.value === null).map((d) => d.label).join(", ")} · N/D</p>}
    {!distribution && <details><summary>Ver meses e importes exactos de {label}</summary><ul className="month-values">{report.months.map((m) => <li key={m.period}><strong>{monthLabel(m.period)}</strong>: {usd(m[field])}{m[field] == null ? " · Faltante" : ""}</li>)}</ul></details>}
  </section>;
}
