"use client";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RoaTrendPoint } from "@/lib/roa/presentation";
import { exact, usd } from "@/lib/queries/presentation";

export function RoaChart({ points, source }: { points: RoaTrendPoint[]; source: "aum_average_usd" | "revenue_quarter_usd" | "roa_percent" }) {
  const rate = source === "roa_percent";
  const title = source === "aum_average_usd" ? "AUM promedio trimestral" : source === "revenue_quarter_usd" ? "Revenue trimestral" : "ROA anualizado por servicio";
  const coordinate = (value: string | null | undefined) => value != null && Number.isFinite(Number(value)) ? Number(value) : null;
  // Number solo ubica píxeles. No calcula métricas ni categorías financieras.
  const data = points.map(p => ({ label: p.label, exact: p.total?.[source] ?? null, feeExact: p.advisory?.advisory_fee_percent ?? null,
    value: coordinate(p.total?.[source]), advisoryExact: p.advisory?.roa_percent ?? null, advisory: coordinate(p.advisory?.roa_percent), fee: coordinate(p.advisory?.advisory_fee_percent) }));
  return <section className="panel report-section chart-card"><h3>{title}</h3>
    {data.some(p => p.value !== null || (rate && (p.fee !== null || p.advisory !== null))) ? <div className="report-chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 260 }}><LineChart data={data} accessibilityLayer={false}>
        <CartesianGrid vertical={false} stroke="#e8edf3" /><XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis width={80} tickFormatter={v => rate ? `${exact(String(v))}%` : new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 2 }).format(v)} /><ReferenceLine y={0} stroke="#a5b3c2" />
        <Tooltip content={({ active, payload }) => { const p = payload?.[0]?.payload as typeof data[number] | undefined; return active && p ? <div className="chart-tooltip"><strong>{p.label}</strong><span>{rate ? `${exact(p.exact)}${p.exact === null ? "" : " %"}` : usd(p.exact)}</span>{rate && <span>ROA Advisory: {exact(p.advisoryExact)}{p.advisoryExact === null ? "" : " %"}</span>}{rate && <span>Fee: {exact(p.feeExact)}{p.feeExact === null ? "" : " %"}</span>}</div> : null; }} />
        <Legend />{rate && <Line name="ROA Advisory · provisional" dataKey="advisory" stroke="#477e69" connectNulls={false} isAnimationActive={false} />}<Line name={rate ? "ROA total · provisional" : title} dataKey="value" stroke="#204c6b" strokeWidth={2} connectNulls={false} isAnimationActive={false} />
        {rate && <Line name="Fee anual Advisory" dataKey="fee" stroke="#86652c" strokeDasharray="5 3" connectNulls={false} isAnimationActive={false} />}
      </LineChart></ResponsiveContainer>
    </div> : <p>{points.some(p=>p.error)?"Hay consultas trimestrales que fallaron. Revisá los errores de cada trimestre; no se reemplazaron por ceros.":"No hay valores calculables con estos filtros. Revisá en la tabla si faltan registros, cobertura o una base válida; N/D no equivale a cero."}</p>}
    <p>{rate ? "Porcentaje anual · Fee y ROA Advisory corresponden al subconjunto Advisory." : "USD · escala independiente."} N/D interrumpe la serie. Valores exactos y estados en la tabla trimestral.</p>
  </section>;
}
