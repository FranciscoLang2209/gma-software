import assert from "node:assert/strict";
import { test } from "node:test";
import { reconcileAccounts, type AccountReference, type ReconciliationRecord, type ReconciliationContext } from "../src/lib/data/reconciliation.ts";

// Catálogo y procedencia exclusivamente sintéticos.
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const ref = (original = "000123", custodianId: string | null = id(10), source: AccountReference["source"] = "revenue", namespace = "ACCOUNT"): AccountReference => ({ original, custodianId, source, namespace });
const record = (reference = ref(), n = 100): ReconciliationRecord => ({
  id: id(n), references: [reference], currentAccountId: null,
  provenance: { importId: id(200), fileSha256: "a".repeat(64), fileName: "SINTETICO.csv", sheet: "SINTETICO", row: n, userId: id(300) },
});
const context = (): ReconciliationContext => ({
  revision: "synthetic-revision-1",
  actorId: id(400),
  accounts: [{ id: id(1), custodianId: id(10), name: "Cliente SINTÉTICO" }, { id: id(2), custodianId: id(20), name: "Cliente SINTÉTICO" }, { id: id(3), custodianId: id(10) }],
  identifiers: [{ id: id(30), accountId: id(1), reference: ref(), evidence: "SINTETICO: referencia acreditada" }, { id: id(31), accountId: id(2), reference: ref("000123", id(20)), evidence: "SINTETICO: otro custodio" }],
  aliases: [],
});
const run = (r = record(), c = context()) => reconcileAccounts([r], c)[0];

test("exacta: UUID canónico, custodio/source/namespace y ceros son parte de la identidad", () => {
  const result = run();
  assert.equal(result.status, "matched");
  assert.equal(result.proposedAccountId, id(1));
  assert.equal(result.rule, "exact_scoped");
  assert.equal(result.evidence[0].id, id(30));
  assert.equal(run(record(ref("000123", id(20)))).proposedAccountId, id(2));
  assert.equal(run(record(ref("123"))).status, "unmatched");
  assert.equal(run(record(ref("000123", id(10), "aum"))).status, "unmatched");
  assert.equal(run(record(ref("000123", id(10), "revenue", "OTHER"))).status, "unmatched");
});

test("alias aprobado: evidencia/autor obligatorios, pendientes y revocados no resuelven", () => {
  const c = context();
  c.aliases = [{ id: id(40), accountId: id(1), reference: ref("X-01"), status: "approved", approvedBy: id(300), evidence: "SINTETICO: equivalencia revisada" }];
  const result = run(record(ref("X-01")), c);
  assert.equal(result.status, "auto-resolved");
  assert.equal(result.rule, "approved_alias");
  assert.equal(result.proposedAccountId, id(1));
  assert.equal(result.evidence[0].approvedBy, id(300));
  for (const status of ["pending", "revoked"] as const) {
    const copy = structuredClone(c); copy.aliases = copy.aliases.map(a => ({ ...a, status }));
    assert.equal(run(record(ref("X-01")), copy).status, "unmatched");
  }
  for (const patch of [{ approvedBy: null }, { evidence: " " }]) {
    const copy = structuredClone(c); copy.aliases = copy.aliases.map(a => ({ ...a, ...patch }));
    assert.throws(() => run(record(ref("X-01")), copy));
  }
});

test("normalizar espacios/caso o nombres solo sugiere; custodio ausente nunca resuelve", () => {
  const whitespace = run(record(ref(" 000123 ")));
  assert.equal(whitespace.status, "needs review");
  assert.equal(whitespace.proposedAccountId, null);
  assert.deepEqual(whitespace.candidates, [id(1)]);
  const missingCustodian = run(record(ref("000123", null)));
  assert.equal(missingCustodian.status, "needs review");
  assert.equal(missingCustodian.proposedAccountId, null);
  assert.deepEqual(missingCustodian.candidates, [id(1), id(2)]);
  const named = run({ ...record(ref("UNKNOWN")), name: " cliente  SINTÉTICO " });
  assert.equal(named.status, "needs review");
  assert.equal(named.proposedAccountId, null);
  assert.deepEqual(named.candidates, [id(1)]);
  assert.equal(run(record(ref("000\u200b123"))).status, "unmatched");
});

test("varias referencias: consenso, alias cruzado explícito e incompletitud sin crear equivalencias", () => {
  const c = context();
  c.aliases = [{ id: id(40), accountId: id(1), reference: ref("A-001", id(10), "aum", "Holding Account Number"), status: "approved", approvedBy: id(300), evidence: "SINTETICO: par REF aprobado" }];
  const r = { ...record(), references: [ref(), c.aliases[0].reference] };
  assert.equal(run(r, c).status, "auto-resolved");
  assert.equal(run(r, c).proposedAccountId, id(1));
  const partial = run({ ...r, references: [...r.references, ref("UNKNOWN")] }, c);
  assert.equal(partial.status, "needs review");
  assert.equal(partial.proposedAccountId, null);
  assert.equal(run({ ...r, references: [] }, c).status, "unmatched");
});

test("conflictos: no ocultar contradicción por prioridad, ni reasignar relación existente", () => {
  const c = context();
  c.aliases = [{ id: id(40), accountId: id(3), reference: ref(), status: "approved", approvedBy: id(300), evidence: "SINTETICO: contradictoria" }];
  const conflict = run(record(), c);
  assert.equal(conflict.status, "conflict");
  assert.equal(conflict.proposedAccountId, null);
  assert.deepEqual(conflict.candidates, [id(1), id(3)]);
  assert.equal(run({ ...record(), currentAccountId: id(3) }).status, "conflict");
  assert.equal(run({ ...record(), currentAccountId: id(999) }).status, "conflict");
  assert.equal(run({ ...record(ref("UNKNOWN")), currentAccountId: id(2) }).status, "conflict");
  assert.equal(run({ ...record(), references: [ref(), ref("000123", id(20))] }).status, "conflict");
  assert.equal(run({ ...record(), currentAccountId: id(1) }).status, "matched");
});

test("catálogo huérfano, custodio falso o evidencia incompleta: abortar sin propuestas parciales", () => {
  for (const patch of [{ accountId: id(999) }, { accountId: id(2) }, { evidence: "" }]) {
    const c = context(); c.identifiers = c.identifiers.map((entry, n) => n ? entry : { ...entry, ...patch });
    assert.throws(() => run(record(), c));
  }
  assert.throws(() => run(record(), { ...context(), revision: "" }));
  assert.throws(() => run(record(), { ...context(), actorId: "" }));
  assert.throws(() => run(record(), { ...context(), accounts: [...context().accounts, context().accounts[0]] }));
  const bad = record(ref(), 101); bad.provenance.row = 0;
  assert.throws(() => reconcileAccounts([record(), bad], context()));
  assert.throws(() => reconcileAccounts([record(), record()], context()));
});

test("idempotencia, evidencia estable y reversibilidad de propuestas sin mutar entradas", () => {
  const c = context();
  const records = [record(), record(ref(), 101)];
  const before = structuredClone({ records, c });
  const first = reconcileAccounts(records, c);
  assert.deepEqual(reconcileAccounts(records, c), first);
  assert.deepEqual(reconcileAccounts(records, { ...c, identifiers: [...c.identifiers].reverse(), accounts: [...c.accounts].reverse() }), first);
  assert.deepEqual({ records, c }, before);
  assert.equal(first.length, 2); // Dos Revenue idénticos en filas distintas siguen siendo dos.
  assert.notEqual(first[0].original.provenance.row, first[1].original.provenance.row);
  assert.equal(first[0].beforeAccountId, null);
  assert.equal(first[0].contextRevision, c.revision);
  assert.equal(first[0].proposedBy, id(400));
  first[0].original.references = [];
  assert.deepEqual(records, before.records);
  // Descartar la propuesta conserva la relación original; no hubo escritura que revertir.
  assert.deepEqual(records.map(r => r.currentAccountId), [null, null]);
});
