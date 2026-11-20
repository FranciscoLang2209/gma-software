"use client";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RoaTrendPoint } from "@/lib/roa/presentation";
import { exact, usd } from "@/lib/queries/presentation";

export function RoaChart({ points, source }: { points: RoaTrendPoint[]; source: "aum_average_usd" | "revenue_quarter_usd" | "roa_percent" }) {
  const rate = source === "roa_percent";
  const title = source === "aum_average_usd" ? "AUM promedio trimestral" : source === "revenue_quarter_usd" ? "Revenue trimestral" : "ROA anualizado frente a Fee Advisory";
  const coordinate = (value: string | null | undefined) => value != null && Number.isFinite(Number(value)) ? Number(value) : null;
  // Number solo ubica píxeles. No calcula métricas ni categorías financieras.
  const data = points.map(p => ({ label: p.label, exact: p.total?.[source] ?? null, feeExact: p.total?.advisory_fee_percent ?? null,
    value: coordinate(p.total?.[source]), fee: coordinate(p.total?.advisory_fee_percent) }));
  return <section className="panel report-section chart-card"><h3>{title}</h3>
    {data.some(p => p.value !== null || (rate && p.fee !== null)) ? <div className="report-chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 260 }}><LineChart data={data} accessibilityLayer={false}>
        <CartesianGrid vertical={false} stroke="#e8edf3" /><XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis width={80} tickFormatter={v => rate ? `${exact(String(v))}%` : new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 2 }).format(v)} /><ReferenceLine y={0} stroke="#a5b3c2" />
        <Tooltip content={({ active, payload }) => { const p = payload?.[0]?.payload as typeof data[number] | undefined; return active && p ? <div className="chart-tooltip"><strong>{p.label}</strong><span>{rate ? `${exact(p.exact)}${p.exact === null ? "" : " %"}` : usd(p.exact)}</span>{rate && <span>Fee: {exact(p.feeExact)}{p.feeExact === null ? "" : " %"}</span>}</div> : null; }} />
        <Legend /><Line name={rate ? "ROA · provisional" : title} dataKey="value" stroke="#204c6b" strokeWidth={2} connectNulls={false} isAnimationActive={false} />
        {rate && <Line name="Fee anual Advisory · misma población" dataKey="fee" stroke="#86652c" strokeDasharray="5 3" connectNulls={false} isAnimationActive={false} />}
      </LineChart></ResponsiveContainer>
    </div> : <p>Sin valores calculables para este gráfico.</p>}
    <p>{rate ? "Porcentaje anual · Fee N/D en conjuntos mixtos o sin referencia comparable." : "USD · escala independiente."} N/D interrumpe la serie. Valores exactos y estados en la tabla trimestral.</p>
  </section>;
}
