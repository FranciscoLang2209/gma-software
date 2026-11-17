"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CommissionGroup } from "@/lib/commissions/dashboard";
import { usd } from "@/lib/queries/presentation";
export function CommissionChart({ rows, history = false }: { rows: CommissionGroup[]; history?: boolean }) {
  const points = rows.flatMap((row, index) => {
    const previous = rows[index - 1];
    const quarterIndex = (value: string) => Number(value.slice(0, 4)) * 4 + Math.floor((Number(value.slice(5, 7)) - 1) / 3);
    const gap = previous?.quarter && row.quarter && quarterIndex(row.quarter) - quarterIndex(previous.quarter) > 1;
    return gap ? [{ ...row, quarter: null, comparable_expected: null, actual: null }, row] : [row];
  });
  const data = points.map(row => ({ ...row, label: row.quarter ? `${row.quarter.slice(0, 4)} T${Math.floor((Number(row.quarter.slice(5, 7)) - 1) / 3) + 1}` : "Sin snapshot",
    // Number sólo posiciona píxeles. Tooltips y tablas conservan los textos SQL exactos.
    expectedPixel: row.comparable_expected == null ? null : Number(row.comparable_expected),
    actualPixel: row.actual == null ? null : Number(row.actual) }));
  const usable = data.some(row => row.expectedPixel != null || row.actualPixel != null);
  const content = <><CartesianGrid stroke="#e8edf3" vertical={false} /><XAxis padding={{ left: 12, right: 30 }} dataKey="label" tick={{ fontSize: 11 }} /><YAxis width={70} tick={{ fontSize: 11 }} tickFormatter={(v: number) => new Intl.NumberFormat("es-AR", { notation: "compact" }).format(v)} />
    <Tooltip content={({ active, payload }) => { const row = payload?.[0]?.payload as (typeof data)[number] | undefined; return active && row ? <div className="chart-tooltip"><strong>{row.label}</strong><p>Esperado comparable: {usd(row.comparable_expected)}</p><p>Cobro real comparable: {usd(row.actual)}</p></div> : null; }} /></>;
  return <section className="panel report-section chart-card"><h2>{history ? "Evolución histórica comparable" : "Esperado vs. real por trimestre"}</h2><p>Esperado comparable · azul / Real conciliado · verde</p>
    {usable && (!history || data.length > 1) ? <div className="report-chart" aria-hidden="true"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 260 }}>
      {history ? <LineChart data={data} accessibilityLayer={false}>{content}<Line dataKey="expectedPixel" stroke="#204c6b" connectNulls={false} isAnimationActive={false} /><Line dataKey="actualPixel" stroke="#47816b" connectNulls={false} isAnimationActive={false} /></LineChart>
        : <BarChart data={data} accessibilityLayer={false}>{content}<Bar dataKey="expectedPixel" fill="#204c6b" maxBarSize={32} isAnimationActive={false} /><Bar dataKey="actualPixel" fill="#47816b" maxBarSize={32} isAnimationActive={false} /></BarChart>}
    </ResponsiveContainer></div> : <p className="chart-no-values">{history ? "Se requieren al menos dos trimestres con comparaciones confiables." : "Todavía no hay importes conciliados para graficar."}</p>}
    <p>USD · Sólo pares conciliados de la misma base. Sin arrastrar snapshots ni completar trimestres ausentes. Valores exactos en la tabla trimestral.</p>
  </section>;
}
