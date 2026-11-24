import { createHash } from "node:crypto";
import { UUID } from "../imports/contracts.ts";
import { decimal, sumDecimals } from "../imports/decimal.ts";
import { isImportPeriod } from "./normalization.ts";
import { reconcileAccounts, type ReconciliationContext, type ReconciliationRecord } from "./reconciliation.ts";

export type RepairScope = {
  id: string; source: "aum" | "revenue"; period: string; custodianId: string;
  activeBatchId: string; version: number; rows: number; values: number; totalUsd: string | null;
};
export type RepairFact = {
  id: string; scopeId: string; accountId: string; amountUsd: string | null;
  originalCells: Record<string, string | null>; record: ReconciliationRecord;
};
export type RepairReview = { factId: string; fromAccountId: string; toAccountId: string; reviewedBy: string; evidence: string };
export type RepairSnapshot = { context: ReconciliationContext; scopes: RepairScope[]; facts: RepairFact[] };
export type RepairInput = { snapshot: RepairSnapshot; reviews: RepairReview[] };

// Orden estable de objetos para huellas; arrays conservan el orden del documento.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
export const repairHash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
const uuid = (s: string) => typeof s === "string" && UUID.test(s) && s === s.toLowerCase();
const amount = (s: string | null) => {
  if (s === null) return null;
  if (typeof s !== "string" || !/^-?\d+(\.\d+)?$/.test(s)) throw new Error("Importe no canónico; no se interpreta un formato ambiguo.");
  return decimal(s, "dot", true);
};
function metrics(facts: RepairFact[]) {
  const values = facts.flatMap(f => f.amountUsd === null ? [] : [amount(f.amountUsd)!]);
  return { rows: facts.length, values: values.length, totalUsd: sumDecimals(values), accounts: new Set(facts.map(f => f.accountId)).size };
}

// Proyecta una corrección relacional; no escribe ni autoriza su aplicación.
export function planRepair(input: RepairInput) {
  const { snapshot, reviews } = input;
  const { context, scopes, facts } = snapshot;
  const proposals = reconcileAccounts(facts.map(f => f.record), context);
  const accounts = new Map(context.accounts.map(a => [a.id.toLowerCase(), a]));
  const scopeMap = new Map<string, RepairScope>();
  const scopeKeys = new Set<string>();
  for (const scope of scopes) {
    const k = JSON.stringify([scope.source, scope.period, scope.custodianId]);
    if (!uuid(scope.id) || !uuid(scope.custodianId) || !uuid(scope.activeBatchId)
      || !["aum", "revenue"].includes(scope.source) || !isImportPeriod(scope.period)
      || !Number.isSafeInteger(scope.version) || scope.version < 1 || scopeMap.has(scope.id) || scopeKeys.has(k))
      throw new Error("Alcance inválido o duplicado.");
    scopeMap.set(scope.id, scope); scopeKeys.add(k);
  }
  const factIds = new Set<string>(), coordinates = new Set<string>();
  for (const fact of facts) {
    const scope = scopeMap.get(fact.scopeId), account = accounts.get(fact.accountId);
    const coordinate = JSON.stringify([fact.scopeId, fact.record.provenance.sheet, fact.record.provenance.row]);
    if (!uuid(fact.id) || factIds.has(fact.id) || !scope || !account
      || account.custodianId.toLowerCase() !== scope.custodianId || fact.record.currentAccountId !== fact.accountId
      || fact.record.provenance.importId !== scope.activeBatchId || coordinates.has(coordinate)
      || !fact.originalCells || typeof fact.originalCells !== "object" || Array.isArray(fact.originalCells)
      || Object.values(fact.originalCells).some(v => v !== null && typeof v !== "string"))
      throw new Error("Hecho, relación o procedencia incoherentes con la foto activa.");
    amount(fact.amountUsd);
    factIds.add(fact.id); coordinates.add(coordinate);
  }
  // La foto debe contener el alcance completo y cuadrar contra su control publicado.
  for (const scope of scopes) {
    const m = metrics(facts.filter(f => f.scopeId === scope.id));
    if (!m.rows || m.rows !== scope.rows || m.values !== scope.values || m.totalUsd !== amount(scope.totalUsd))
      throw new Error("Snapshot incompleto o distinto de los controles del alcance.");
  }
  const selected = new Map<string, RepairReview>();
  for (const review of reviews) {
    const fact = facts.find(f => f.id === review.factId), target = accounts.get(review.toAccountId);
    if (selected.has(review.factId) || !fact || review.fromAccountId !== fact.accountId || !target
      || !uuid(review.reviewedBy) || typeof review.evidence !== "string" || review.evidence.trim().length < 10
      || target.custodianId.toLowerCase() !== scopeMap.get(fact.scopeId)!.custodianId)
      throw new Error("Revisión inválida, obsoleta, repetida o de otro custodio.");
    selected.set(review.factId, review);
  }
  const changes = facts.flatMap(fact => {
    const review = selected.get(fact.id);
    return review && review.toAccountId !== fact.accountId ? [{ factId: fact.id, scopeId: fact.scopeId,
      recordId: fact.record.id, beforeAccountId: fact.accountId, afterAccountId: review.toAccountId,
      rule: "explicit_relational_review" as const, evidence: review.evidence, reviewedBy: review.reviewedBy }] : [];
  });
  const projected = structuredClone(facts);
  for (const fact of projected) {
    const review = selected.get(fact.id);
    if (review) { fact.accountId = review.toAccountId; fact.record.currentAccountId = review.toAccountId; }
  }
  const blockers: { code: string; ids: string[] }[] = [];
  for (let i = 0; i < proposals.length; i++) {
    if (!selected.has(facts[i].id) && !["matched", "auto-resolved"].includes(proposals[i].status))
      blockers.push({ code: "unresolved_identity", ids: [facts[i].id] });
  }
  const aumKeys = new Map<string, string[]>();
  for (const fact of projected) {
    const scope = scopeMap.get(fact.scopeId)!;
    if (scope.source !== "aum") continue;
    const k = JSON.stringify([scope.period, fact.accountId]);
    aumKeys.set(k, [...(aumKeys.get(k) ?? []), fact.id]);
  }
  for (const ids of aumKeys.values()) if (ids.length > 1) blockers.push({ code: "aum_account_month_collision", ids });
  const comparisons = scopes.map(scope => {
    const before = metrics(facts.filter(f => f.scopeId === scope.id));
    const after = metrics(projected.filter(f => f.scopeId === scope.id));
    const conserved = before.rows === after.rows && before.values === after.values && before.totalUsd === after.totalUsd;
    if (!conserved) blockers.push({ code: "financial_invariance_failed", ids: [scope.id] });
    return { scope: structuredClone(scope), before, after, conserved };
  });
  const changedScopes = new Set(changes.map(c => c.scopeId));
  const replacements = scopes.filter(s => changedScopes.has(s.id)).map(scope => ({
    scopeId: scope.id, expectedActiveBatchId: scope.activeBatchId, expectedVersion: scope.version,
    rows: projected.filter(f => f.scopeId === scope.id),
  }));
  const manifest = { version: "relational_repair_dry_run_v1", mode: "dry-run", executable: false,
    contextRevision: context.revision, proposedBy: context.actorId, snapshotHash: repairHash(snapshot),
    status: blockers.length ? "blocked" : changes.length ? "reviewable" : "no_changes",
    changes, blockers, comparisons, proposals, replacements,
    requirements: changes.length ? ["owner_approval", "verified_private_backup", "fresh_snapshot_under_lock", "versioned_publication_adapter"] : [] };
  return { manifest, manifestHash: repairHash(manifest), backup: structuredClone(snapshot),
    rollback: { executable: false, expectedProjectedHash: repairHash(projected),
      restore: scopes.filter(s => changedScopes.has(s.id)).map(scope => ({ scope: structuredClone(scope), rows: structuredClone(facts.filter(f => f.scopeId === scope.id)) })) } };
}

export function verifyRepairSnapshot(expectedHash: string, current: RepairSnapshot) {
  if (repairHash(current) !== expectedHash) throw new Error("La foto cambió; generar y revisar otro dry-run.");
}
