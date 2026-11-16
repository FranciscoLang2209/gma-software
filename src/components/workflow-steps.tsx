const stages = ["Archivo privado", "Validación", "Correspondencias", "Conciliación", "Publicación"];

export function WorkflowSteps({ status }: { status?: string }) {
  const current = ({ uploaded: 1, validating: 1, failed: 1, needs_resolution: 2, ready: 3, published: 4, superseded: 4 } as Record<string, number>)[status ?? ""] ?? (status ? -1 : 0);
  return <nav className="workflow" aria-label="Etapas de la importación"><ol>{stages.map((label, index) => <li key={label} aria-current={current === index ? "step" : undefined}>
    <span aria-hidden="true">{index + 1}</span><span>{label}</span>
  </li>)}</ol><p>Preparar y resolver no modifica datos publicados. La publicación requiere revisión y confirmación explícitas.</p></nav>;
}
