import type { ReactNode } from "react";

export function MetricCard({ title, value, period, note, icon, primary = false }: {
  title: string; value: string; period: string; note: ReactNode; icon?: ReactNode; primary?: boolean;
}) {
  return <article className={`metric-card${primary ? " metric-primary" : ""}`}>
    <div className="metric-heading"><h2>{title}</h2>{icon && <span className="metric-icon" aria-hidden="true">{icon}</span>}</div>
    <p className="metric-period">{period}</p>
    <p className="metric-value">{value}</p>
    <div className="metric-note">{note}</div>
  </article>;
}
