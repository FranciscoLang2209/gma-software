import type { RepairInput } from "../../src/lib/data/repair.ts";
export const repairId = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
export function repairFixture(): RepairInput {
  const id = repairId;
  const facts = ["0.1", "0.1", "-0.05", null].map((amountUsd, n) => ({
    id: id(100 + n), scopeId: id(50), accountId: id(1), amountUsd,
    originalCells: { "1": "000123", "2": amountUsd },
    record: { id: id(200 + n), currentAccountId: id(1), references: [{ source: "revenue" as const, namespace: "ACCOUNT", custodianId: id(10), original: "000123" }],
      provenance: { importId: id(60), fileSha256: "a".repeat(64), fileName: "SINTETICO.csv", sheet: "SINTETICO", row: n + 2, userId: id(300) } },
  }));
  return { snapshot: {
    context: { revision: "SINTETICO-revision-1", actorId: id(300),
      accounts: [{ id: id(1), custodianId: id(10) }, { id: id(2), custodianId: id(10) }, { id: id(3), custodianId: id(20) }],
      identifiers: [{ id: id(30), accountId: id(1), reference: structuredClone(facts[0].record.references[0]), evidence: "SINTETICO: literal acreditado" }], aliases: [] },
    scopes: [{ id: id(50), source: "revenue", custodianId: id(10), period: "2026-01-01", activeBatchId: id(60), version: 1, rows: 4, values: 3, totalUsd: "0.15" }], facts,
  }, reviews: [{ factId: id(100), fromAccountId: id(1), toAccountId: id(2), reviewedBy: id(300), evidence: "SINTETICO: revisión explícita; no representa aprobación real" }] };
}
