const statuses: Record<string, { label: string; tone: string }> = {
  uploaded: { label: "Original registrado", tone: "neutral" },
  validating: { label: "Validando", tone: "info" },
  needs_resolution: { label: "Pendiente de resolución", tone: "warning" },
  ready: { label: "Lista para publicar", tone: "info" },
  published: { label: "Publicada · consultar vigencia", tone: "positive" },
  superseded: { label: "Reemplazada · historia conservada", tone: "neutral" },
  failed: { label: "Errores bloqueantes", tone: "negative" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const state = statuses[status];
  return <span className={`status-badge status-${state?.tone ?? "neutral"}`}>{label ?? state?.label ?? "Revisar estado"}</span>;
}
