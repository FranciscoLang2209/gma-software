"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { Report } from "@/lib/queries/contracts";
import { monthLabel, usd } from "@/lib/queries/presentation";

export function ReportChart({ report, source, distribution = false }: { report: Report; source: "aum" | "revenue"; distribution?: boolean }) {
  const field = source === "aum" ? "aum_usd" : "revenue_usd";
  const label = source === "aum" ? "AUM" : "Revenue";
  // Number solo ubica píxeles; importes, totales y participaciones vienen de SQL y se muestran como texto exacto.
  const data = distribution ? report.rows.map((r) => ({ label: r.label, value: r[field] == null ? null : Number(r[field]) }))
    : report.months.map((m) => ({ label: monthLabel(m.period), value: m[field] == null ? null : Number(m[field]) }));
  const hasValues = data.some((d) => d.value !== null);
  const title = distribution ? `${label} por custodio · página visible` : `Evolución mensual de ${label}`;
  const color = source === "aum" ? "#166456" : "#805018";
  const axes = <><CartesianGrid stroke="#dce3e0" vertical={false} /><XAxis padding={{ left: 12, right: 30 }} dataKey="label" tick={{ fontSize: 12, fill: "#334b43" }} interval="preserveStartEnd" /><YAxis domain={([min, max]: readonly [number, number]) => [Math.min(min, 0), Math.max(max, 0)]} tick={{ fontSize: 12, fill: "#334b43" }} width={76} tickFormatter={(v: number) => new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(v)} /><ReferenceLine y={0} stroke="#455c54" /></>;
  return <section className="panel report-section">
    <h2>{title}</h2><p>{source === "aum" ? "Foto mensual · sin saldos arrastrados" : distribution ? "Suma del rango · ajustes con signo" : "Payout broker de cada mes · flujo en USD"}</p>
    <figure className="report-figure" aria-label={`${title}, USD; valores exactos disponibles a continuación`}>
      {hasValues ? <div className="report-chart" aria-hidden="true"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 260 }}>
        {distribution || source === "revenue" ? <BarChart data={data} accessibilityLayer={false}>{axes}<Bar dataKey="value" fill={color} isAnimationActive={false} /></BarChart>
          : <LineChart data={data} accessibilityLayer={false}>{axes}<Line dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} isAnimationActive={false} /></LineChart>}
      </ResponsiveContainer></div> : <p className="chart-no-values">Sin valores publicados para este gráfico.</p>}
      <figcaption>USD · escalas independientes. N/D indica faltante, nunca cero. {distribution ? "El total filtrado está en la tabla, independiente de esta página." : "La variación de AUM no representa rendimiento."}</figcaption>
    </figure>
    {!distribution && data.some((d) => d.value === null) && <p>Meses faltantes: {data.filter((d) => d.value === null).map((d) => d.label).join(", ")} · N/D</p>}
    {!distribution && <details><summary>Ver meses e importes exactos de {label}</summary><ul className="month-values">{report.months.map((m) => <li key={m.period}><strong>{monthLabel(m.period)}</strong>: {usd(m[field])}{m[field] == null ? " · Faltante" : ""}</li>)}</ul></details>}
  </section>;
}
