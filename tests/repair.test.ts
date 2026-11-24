import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, writeFileSync, readFileSync, statSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { planRepair, repairHash, verifyRepairSnapshot } from "../src/lib/data/repair.ts";
import { repairFixture, repairId as id } from "./fixtures/repair.ts";

test("dry-run: identifica fila exacta, conserva decimal/null/negativos y Revenue idéntico", () => {
  const input = repairFixture(), before = structuredClone(input);
  const plan = planRepair(input);
  assert.deepEqual(input, before);
  assert.equal(plan.manifest.status, "reviewable");
  assert.equal(plan.manifest.executable, false);
  assert.deepEqual(plan.manifest.changes.map(c => [c.factId, c.beforeAccountId, c.afterAccountId]), [[id(100), id(1), id(2)]]);
  assert.equal(plan.manifest.replacements[0].expectedActiveBatchId, id(60));
  assert.equal(plan.manifest.replacements[0].rows.length, 4);
  assert.deepEqual(plan.manifest.replacements[0].rows.map(f => f.amountUsd), ["0.1", "0.1", "-0.05", null]);
  assert.deepEqual(plan.manifest.comparisons[0].before, { rows: 4, values: 3, totalUsd: "0.15", accounts: 1 });
  assert.deepEqual(plan.manifest.comparisons[0].after, { rows: 4, values: 3, totalUsd: "0.15", accounts: 2 });
  assert.equal(plan.manifest.comparisons[0].conserved, true);
  assert.deepEqual(plan.manifest.replacements[0].rows.map(f => f.originalCells), input.snapshot.facts.map(f => f.originalCells));
  assert.equal(plan.manifest.proposals[0].proposedAccountId, id(1)); // El override es revisión explícita separada.
});

test("sin revisiones no inventa cambios; candidato por espacios bloquea el lote sin aplicar parcialmente", () => {
  const input = repairFixture(); input.reviews = [];
  assert.equal(planRepair(input).manifest.status, "no_changes");
  input.snapshot.facts[0].record.references[0].original = "000123 ";
  const plan = planRepair(input);
  assert.equal(plan.manifest.status, "blocked");
  assert.equal(plan.manifest.proposals[0].status, "needs review");
  assert.equal(plan.manifest.changes.length, 0);
  assert.equal(plan.manifest.blockers[0].code, "unresolved_identity");
});

test("AUM: colisión proyectada cuenta/mes bloquea sin sumar snapshots", () => {
  const input = repairFixture();
  input.snapshot.scopes[0] = { ...input.snapshot.scopes[0], source: "aum", rows: 2, values: 2, totalUsd: "0.2" };
  input.snapshot.facts = input.snapshot.facts.slice(0, 2);
  input.reviews = input.snapshot.facts.map(f => ({ ...input.reviews[0], factId: f.id }));
  const plan = planRepair(input);
  assert.equal(plan.manifest.status, "blocked");
  assert.ok(plan.manifest.blockers.some(b => b.code === "aum_account_month_collision" && b.ids.length === 2));
  assert.equal(plan.manifest.replacements[0].rows.length, 2);
});

test("rechaza snapshot parcial, importes ambiguos, controles falsos y filas repetidas por coordenada", () => {
  for (const mutate of [
    (v: ReturnType<typeof repairFixture>) => { v.snapshot.facts.pop(); },
    (v: ReturnType<typeof repairFixture>) => { v.snapshot.facts[0].amountUsd = "1,234"; },
    (v: ReturnType<typeof repairFixture>) => { v.snapshot.scopes[0].totalUsd = "999"; },
    (v: ReturnType<typeof repairFixture>) => { v.snapshot.facts[1].record.provenance.row = 2; },
    (v: ReturnType<typeof repairFixture>) => { v.snapshot.facts[0].record.provenance.importId = id(999); },
  ]) { const input = repairFixture(); mutate(input); assert.throws(() => planRepair(input)); }
});

test("ausencia no equivale a cero; fotos AUM en meses distintos permanecen separadas", () => {
  const missing = repairFixture(); missing.reviews = [];
  missing.snapshot.facts.forEach(f => { f.amountUsd = null; });
  missing.snapshot.scopes[0].values = 0; missing.snapshot.scopes[0].totalUsd = null;
  assert.equal(planRepair(missing).manifest.comparisons[0].after.totalUsd, null);
  missing.snapshot.scopes[0].totalUsd = "0";
  assert.throws(() => planRepair(missing));
  const monthly = repairFixture(); monthly.reviews = [];
  monthly.snapshot.facts = monthly.snapshot.facts.slice(0, 1);
  monthly.snapshot.scopes[0] = { ...monthly.snapshot.scopes[0], source: "aum", rows: 1, values: 1, totalUsd: "0.1" };
  monthly.snapshot.scopes.push({ ...monthly.snapshot.scopes[0], id: id(51), period: "2026-02-01", activeBatchId: id(61) });
  const second = structuredClone(monthly.snapshot.facts[0]);
  second.id = id(101); second.scopeId = id(51); second.record.id = id(201); second.record.provenance.importId = id(61);
  monthly.snapshot.facts.push(second);
  const plan = planRepair(monthly);
  assert.equal(plan.manifest.status, "no_changes");
  assert.equal(plan.manifest.comparisons.length, 2);
  assert.ok(plan.manifest.comparisons.every(c => c.after.totalUsd === "0.1"));
});

test("revisiones obsoletas, sin evidencia, duplicadas o a otro custodio no se aceptan", () => {
  for (const patch of [{ fromAccountId: id(2) }, { toAccountId: id(3) }, { toAccountId: id(999) }, { reviewedBy: "" }, { evidence: "" }, { factId: id(999) }]) {
    const input = repairFixture(); Object.assign(input.reviews[0], patch);
    assert.throws(() => planRepair(input));
  }
  const duplicate = repairFixture(); duplicate.reviews.push(duplicate.reviews[0]);
  assert.throws(() => planRepair(duplicate));
});

test("huella/idempotencia y ensayo local de restauración: mismos originales y relaciones, sin borrar historia", () => {
  const input = repairFixture(), plan = planRepair(input);
  assert.deepEqual(planRepair(input), plan);
  verifyRepairSnapshot(plan.manifest.snapshotHash, input.snapshot);
  const stale = structuredClone(input.snapshot); stale.context.revision = "otra";
  assert.throws(() => verifyRepairSnapshot(plan.manifest.snapshotHash, stale));
  const after = plan.manifest.replacements.flatMap(s => s.rows);
  assert.equal(repairHash(after), plan.rollback.expectedProjectedHash);
  const restored = plan.rollback.restore.flatMap(s => s.rows);
  assert.deepEqual(restored, input.snapshot.facts);
  assert.deepEqual(plan.backup, input.snapshot);
  restored[0].accountId = id(999);
  assert.equal(input.snapshot.facts[0].accountId, id(1));
});

test("solo reemplaza alcances afectados y conserva otro custodio sin tocar su revisión", () => {
  const input = repairFixture();
  input.snapshot.scopes.push({ ...input.snapshot.scopes[0], id: id(51), custodianId: id(20), activeBatchId: id(61), rows: 1, values: 1, totalUsd: "0.1" });
  const fact = structuredClone(input.snapshot.facts[0]);
  fact.id = id(104); fact.scopeId = id(51); fact.accountId = id(3); fact.record.id = id(204);
  fact.record.currentAccountId = id(3); fact.record.provenance.importId = id(61);
  fact.record.references[0].custodianId = id(20);
  input.snapshot.facts.push(fact);
  input.snapshot.context.identifiers = [...input.snapshot.context.identifiers, { id: id(31), accountId: id(3), reference: fact.record.references[0], evidence: "SINTETICO: otro custodio" }];
  const before = structuredClone(input);
  const plan = planRepair(input);
  assert.equal(plan.manifest.status, "reviewable");
  assert.deepEqual(plan.manifest.replacements.map(s => s.scopeId), [id(50)]);
  assert.deepEqual(plan.rollback.restore.map(s => s.scope.id), [id(50)]);
  assert.deepEqual(plan.manifest.comparisons[1].before, plan.manifest.comparisons[1].after);
  assert.deepEqual(input, before);
});

test("CLI: dry-run privado, no sobrescribe, no acepta apply ni imprime datos individuales", () => {
  const dir = mkdtempSync(join(tmpdir(), "gma-repair-synthetic-"));
  try {
    const source = join(dir, "SINTETICO.json"), output = join(dir, "plan");
    writeFileSync(source, JSON.stringify(repairFixture()), { mode: 0o600 });
    const run = (mode: string) => spawnSync(process.execPath, ["scripts/plan-data-repair.ts", mode, source, output], { encoding: "utf8" });
    const result = run("--dry-run");
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { mode: "dry-run", status: "reviewable", changes: 1, blockers: 0 });
    assert.equal(statSync(output).mode & 0o777, 0o700);
    for (const name of ["manifest", "backup", "rollback"]) assert.equal(statSync(join(output, `${name}.json`)).mode & 0o777, 0o600);
    const saved = readFileSync(join(output, "manifest.json"), "utf8");
    assert.equal(run("--dry-run").status, 1);
    assert.equal(run("--apply").status, 1);
    const inRepo = spawnSync(process.execPath, ["scripts/plan-data-repair.ts", "--dry-run", source, "gma-private-plan-must-not-be-created"], { encoding: "utf8" });
    assert.equal(inRepo.status, 1);
    assert.equal(readFileSync(join(output, "manifest.json"), "utf8"), saved);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
