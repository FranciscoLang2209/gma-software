"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@radix-ui/themes";
import type { CommissionRow } from "@/lib/commissions/dashboard";
import { BASES } from "@/lib/commissions/dashboard";
import { usd } from "@/lib/queries/presentation";

type Candidate = { id: string; label: string };
export function CommissionReview({ row, candidates }: { row: CommissionRow; candidates: Candidate[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [retry, setRetry] = useState<{ body: string; id: string } | null>(null);
  const original = row.classification_input ?? {};
  async function submit(form: FormData) {
    setBusy(true); setMessage("");
    const operation = row.obligation_id ? "reconcile" : "receipt";
    const reason = String(form.get("reason") ?? "");
    const input = row.obligation_id ? {
      previous_id: row.reconciliation_id ?? null, expected_id: row.expected_id,
      receipt_ids: form.getAll("receipt_ids"), review_complete: form.get("review_complete") === "on", reason,
    } : { ...Object.fromEntries(form.entries()), previous_id: row.classification_id,
      received_confirmed: form.get("received_confirmed") === "on", reason };
    const body = JSON.stringify({ operation, target_id: row.obligation_id ?? row.entry_id, input });
    const id = retry?.body === body ? retry.id : crypto.randomUUID();
    setRetry({ body, id });
    try {
      const response = await fetch("/api/comisiones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...JSON.parse(body), request_id: id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se guardó la revisión.");
      setMessage("Revisión registrada con auditoría. Datos actualizados."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar. Reintentá la misma revisión."); }
    finally { setBusy(false); }
  }
  const selected = (row.reconciliation_input?.receipt_ids ?? []) as string[];
  return <section className="panel report-section"><h2>{row.obligation_id ? "Revisar correspondencias" : "Clasificar movimiento y beneficiario"}</h2>
    <p>La revisión conserva actor, motivo y versiones previas. Cambiar una base o clasificación exige conciliar nuevamente.</p>
    <form action={submit} className="commission-review-form">
      {row.obligation_id ? <>
        <p>Esperado: {usd(row.verified ? row.expected_quarterly : null)} · {row.owner ?? "Sin beneficiario"} · {BASES[row.basis ?? ""] ?? "Sin base"}</p>
        <fieldset disabled={busy}><legend>Movimientos comparables revisados</legend>
          {candidates.length ? candidates.map(candidate => <label key={candidate.id} className="commission-check"><input type="checkbox" name="receipt_ids" value={candidate.id} defaultChecked={selected.includes(candidate.id)} />{candidate.label}</label>) : <p>Sin movimientos clasificados compatibles disponibles. Clasificá Revenue antes de vincularlo.</p>}
        </fieldset>
        <label className="commission-check"><input type="checkbox" name="review_complete" required disabled={busy} />Confirmo que revisé el conjunto completo. Sin movimientos, quedará sin cobro comparable; no implica deuda.</label>
      </> : <>
        <div className="commission-fields">
          {[["quarter", "Inicio del trimestre devengado (AAAA-MM-DD)"], ["broker", "Broker"], ["owner", "Owner Name payout acreditado"], ["fee_type", "Fee type"], ["amount", "Importe USD (decimal con punto)"], ["source_value", "Valor original literal de la métrica"]].map(([key, label]) => <label key={key}>{label}<input name={key} required defaultValue={String(original[key] ?? (key === "quarter" ? row.quarter : row[key] ?? ""))} disabled={busy} /></label>)}
          <label>Base económica<select name="basis" defaultValue={row.basis ?? ""} required disabled={busy}><option value="">Seleccionar</option>{Object.entries(BASES).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
          <label>Métrica Revenue<select name="metric" defaultValue={String(original.metric ?? "")} required disabled={busy}><option value="">Seleccionar</option>{["Payout broker", "GROSS", "TOTAL", "Payout Medina", "NET Payout REP"].map(key => <option key={key}>{key}</option>)}</select></label>
        </div>
        {[["evidence", "Evidencia de cobranza, beneficiario y equivalencia económica"], ["period_evidence", "Evidencia del trimestre devengado"], ["normalization_evidence", "Convención de normalización de importes"]].map(([key, label]) => <label key={key}>{label}<textarea name={key} defaultValue={String(original[key] ?? "")} required maxLength={8000} disabled={busy} /></label>)}
        <label className="commission-check"><input type="checkbox" name="received_confirmed" required disabled={busy} />Confirmo la cobranza y la evidencia. PAGO OK por sí solo no la acredita.</label>
      </>}
      <label>Motivo de esta revisión<textarea name="reason" required maxLength={8000} disabled={busy} /></label>
      <Button type="submit" disabled={busy}>{busy ? "Guardando revisión…" : "Guardar revisión auditada"}</Button>
      <p role="status" aria-live="polite">{message}</p>
    </form>
  </section>;
}
