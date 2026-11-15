import { Skeleton } from "@radix-ui/themes";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="loading-state"
    >
      <p>Cargando sección…</p>
      <Skeleton height="40px" width="220px" />
      <Skeleton height="90px" />
      <Skeleton height="260px" />
    </div>
  );
}
