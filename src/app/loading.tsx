import { Skeleton } from "@radix-ui/themes";

export default function Loading() {
  return <div role="status" aria-live="polite" aria-busy="true" className="loading-state">
    <span className="field-label">Cargando información…</span>
    <Skeleton height="70px" />
    <div className="metric-grid primary-metrics"><Skeleton height="190px" /><Skeleton height="190px" /></div>
    <div className="report-charts"><Skeleton height="300px" /><Skeleton height="300px" /></div>
  </div>;
}
