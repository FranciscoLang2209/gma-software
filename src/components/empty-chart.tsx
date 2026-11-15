"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer } from "recharts";

export function EmptyChart() {
  return (
    <figure
      className="chart-figure"
      aria-label="Evolución mensual de AUM en USD: datos no disponibles"
    >
      <div className="chart-area" aria-hidden="true">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 640, height: 220 }}
        >
          <LineChart
            data={[]}
            margin={{ top: 16, bottom: 16, left: 8, right: 8 }}
            accessibilityLayer={false}
          >
            <CartesianGrid
              stroke="#e0e5e4"
              vertical={false}
              horizontalPoints={[24, 80, 136, 192]}
            />
            <Line dataKey="aum" stroke="#166456" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-empty">
          <strong>Sin serie disponible</strong>
          <span>Los meses aparecerán cuando haya datos publicados.</span>
        </div>
      </div>
      <figcaption>
        Foto al cierre de cada mes · Sin saldos arrastrados
      </figcaption>
    </figure>
  );
}
