import { UUID } from "../imports/contracts.ts";
import { textSearchKey } from "./normalization.ts";

export type AccountReference = {
  source: "aum" | "revenue" | "fa" | "manual";
  namespace: string;
  custodianId: string | null;
  original: string;
};
export type ReconciliationRecord = {
  id: string;
  references: readonly AccountReference[];
  currentAccountId: string | null;
  name?: string;
  provenance: { importId: string; fileSha256: string; fileName: string; sheet: string; row: number; userId: string };
};
export type ReconciliationContext = {
  revision: string;
  actorId: string;
  accounts: readonly { id: string; custodianId: string; name?: string }[];
  identifiers: readonly { id: string; accountId: string; reference: AccountReference; evidence: string }[];
  aliases: readonly {
    id: string; accountId: string; reference: AccountReference;
    status: "approved" | "pending" | "revoked"; approvedBy: string | null; evidence: string;
  }[];
};
export type ReconciliationProposal = {
  ruleVersion: "account_reconciliation_v1";
  contextRevision: string;
  proposedBy: string;
  original: ReconciliationRecord;
  beforeAccountId: string | null;
  proposedAccountId: string | null;
  status: "matched" | "auto-resolved" | "needs review" | "unmatched" | "conflict";
  rule: "exact_scoped" | "approved_alias" | "review_candidates" | "no_match" | "contradictory_identity";
  reason: string;
  candidates: string[];
  evidence: { kind: "identifier" | "alias"; id: string; accountId: string; reason: string; approvedBy: string | null }[];
};

const present = (value: string) => typeof value === "string" && value.trim().length > 0;
const uuid = (value: string) => typeof value === "string" && UUID.test(value);
const sorted = (values: Iterable<string>) => [...new Set(values)].sort();
const key = (ref: AccountReference) => JSON.stringify([ref.source, ref.namespace, ref.custodianId?.toLowerCase(), ref.original]);

function checkReference(ref: AccountReference) {
  if (!["aum", "revenue", "fa", "manual"].includes(ref.source) || !present(ref.namespace)
    || !present(ref.original) || (ref.custodianId !== null && !uuid(ref.custodianId)))
    throw new Error("Referencia de cuenta inválida; conservar el original para revisión.");
}

// Propuestas únicamente: no crea aliases, no cambia FK ni procesa importes.
export function reconcileAccounts(records: readonly ReconciliationRecord[], context: ReconciliationContext): ReconciliationProposal[] {
  if (!present(context.revision) || !uuid(context.actorId)) throw new Error("Se requiere revisión del catálogo y autor de la propuesta.");
  const accounts = new Map<string, ReconciliationContext["accounts"][number]>();
  for (const account of context.accounts) {
    if (!uuid(account.id) || !uuid(account.custodianId) || accounts.has(account.id.toLowerCase()))
      throw new Error("Catálogo de cuentas inválido o duplicado.");
    accounts.set(account.id.toLowerCase(), account);
  }
  const index = new Map<string, ReconciliationProposal["evidence"]>();
  const searchIndex = new Map<string, ReconciliationContext["identifiers"][number][]>();
  const knownIds = new Set<string>();
  for (const [kind, entries] of [["identifier", context.identifiers], ["alias", context.aliases]] as const) {
    for (const entry of entries) {
      checkReference(entry.reference);
      const account = accounts.get(entry.accountId.toLowerCase());
      if (!uuid(entry.id) || knownIds.has(`${kind}/${entry.id.toLowerCase()}`) || !account
        || entry.reference.custodianId?.toLowerCase() !== account.custodianId.toLowerCase())
        throw new Error("Equivalencia inválida, huérfana o de otro custodio.");
      knownIds.add(`${kind}/${entry.id.toLowerCase()}`);
      if ("status" in entry) {
        if (!["approved", "pending", "revoked"].includes(entry.status)) throw new Error("Estado de equivalencia inválido.");
        if (entry.status !== "approved") continue;
        if (!entry.approvedBy || !uuid(entry.approvedBy)) throw new Error("Alias sin autor de aprobación.");
      }
      if (!present(entry.evidence)) throw new Error("Equivalencia sin evidencia.");
      const k = key(entry.reference);
      index.set(k, [...(index.get(k) ?? []), { kind, id: entry.id.toLowerCase(), accountId: entry.accountId.toLowerCase(),
        reason: entry.evidence, approvedBy: "approvedBy" in entry ? entry.approvedBy?.toLowerCase() ?? null : null }]);
    }
  }
  const searchKey = (ref: AccountReference) => JSON.stringify([ref.source, ref.namespace, textSearchKey(ref.original)]);
  for (const entry of context.identifiers) {
    const k = searchKey(entry.reference);
    searchIndex.set(k, [...(searchIndex.get(k) ?? []), entry]);
  }
  const recordIds = new Set<string>();
  return records.map(record => {
    const p = record.provenance;
    if (!uuid(record.id) || recordIds.has(record.id.toLowerCase())
      || (record.currentAccountId !== null && !uuid(record.currentAccountId))
      || !uuid(p.importId) || !uuid(p.userId) || !/^[a-f0-9]{64}$/.test(p.fileSha256)
      || !present(p.fileName) || !present(p.sheet) || !Number.isSafeInteger(p.row) || p.row < 1)
      throw new Error("Registro o procedencia inválidos; no se generaron propuestas aplicables.");
    recordIds.add(record.id.toLowerCase());
    record.references.forEach(checkReference);
    const evidence = [...new Map(record.references.flatMap(ref => index.get(key(ref)) ?? [])
      .map(item => [`${item.kind}/${item.id}`, item])).values()]
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
    const candidates = sorted(evidence.map(item => item.accountId));
    const previous = record.currentAccountId?.toLowerCase() ?? null;
    const base = { ruleVersion: "account_reconciliation_v1" as const, contextRevision: context.revision,
      proposedBy: context.actorId.toLowerCase(),
      original: structuredClone(record), beforeAccountId: record.currentAccountId,
      proposedAccountId: null, evidence, candidates };
    if (candidates.length > 1 || (previous !== null && (!accounts.has(previous)
      || candidates.some(id => id !== previous)
      || record.references.some(ref => ref.custodianId !== null
        && ref.custodianId.toLowerCase() !== accounts.get(previous)?.custodianId.toLowerCase())))
      || new Set(record.references.map(ref => ref.custodianId?.toLowerCase()).filter(Boolean)).size > 1)
      return { ...base, status: "conflict", rule: "contradictory_identity", reason: "Destinos, relación previa o custodios contradictorios; requiere revisión." };
    // Toda referencia aportada debe tener respaldo; una coincidencia no aprueba las demás.
    if (candidates.length === 1 && record.references.every(ref => index.has(key(ref)))) {
      const alias = evidence.some(item => item.kind === "alias");
      return { ...base, proposedAccountId: candidates[0], status: alias ? "auto-resolved" : "matched",
        rule: alias ? "approved_alias" : "exact_scoped",
        reason: alias ? "Todas las referencias respaldadas; se reutiliza una equivalencia aprobada." : "Coincidencia literal acreditada por fuente, namespace y custodio." };
    }
    // Espacios/caso y nombres son sugerencias; nunca pasan al índice de resolución.
    for (const ref of record.references) {
      for (const entry of searchIndex.get(searchKey(ref)) ?? []) {
        const other = entry.reference;
        if (ref.source === other.source && ref.namespace === other.namespace
          && (ref.custodianId === null || ref.custodianId.toLowerCase() === other.custodianId?.toLowerCase())
          && textSearchKey(ref.original) === textSearchKey(other.original)) candidates.push(entry.accountId.toLowerCase());
      }
    }
    if (record.name && textSearchKey(record.name)) for (const account of context.accounts) {
      if (account.name && textSearchKey(account.name) === textSearchKey(record.name)
        && record.references.some(ref => ref.custodianId?.toLowerCase() === account.custodianId.toLowerCase())) candidates.push(account.id.toLowerCase());
    }
    const suggestions = sorted(candidates);
    const review = suggestions.length > 0 || record.references.some(ref => ref.custodianId === null);
    return { ...base, candidates: suggestions, status: review ? "needs review" : "unmatched",
      rule: review ? "review_candidates" : "no_match",
      reason: review ? "Referencia incompleta o similitud solo orientativa; no acredita una relación." : "No existe una coincidencia acreditada en este catálogo." };
  });
}
