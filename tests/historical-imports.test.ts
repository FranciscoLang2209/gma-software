import assert from "node:assert/strict";
import { test } from "node:test";
import { HEADERS } from "../src/lib/imports/contracts.ts";
import { prepareHistorical } from "../src/lib/imports/historical.ts";
import { readBook } from "../src/lib/imports/read.ts";
import { csv, xlsx } from "./fixtures/imports/build.ts";
import { historicalRows } from "./fixtures/imports/historical.ts";
const options = { source: "aum" as const, custodianId: "10000000-0000-0000-0000-000000000001", custodianCode: "SYN-A", sheet: "CSV", numericFormat: "dot" as const, delimiter: "," as const };

test("historia sintética: 36 meses desordenados, cuentas repetidas entre meses y decimales exactos CSV/XLSX", async () => {
  const rows = historicalRows();
  for (const [name, bytes] of [["SINTETICO.csv", csv("aum", rows)], ["SINTETICO.xlsx", xlsx([{ name: "CSV", rows: [[...HEADERS.aum], ...rows] }])]] as const) {
    const result = prepareHistorical(await readBook(bytes, name, ","), options);
    assert.equal(result.partitions.length, 36);
    assert.equal(result.partitions[0].period, "2023-01-01");
    assert.equal(result.partitions.at(-1)?.period, "2025-12-01");
    assert.equal(result.manifest.unroutable.length, 0);
    for (const p of result.partitions) {
      assert.equal(p.report.blockingErrors, 0);
      assert.equal(p.report.total, "0.25");
      assert.equal(p.report.distinctAccounts, 3);
      assert.equal(p.report.rows[0].cell_metadata.account, "00001");
    }
    assert.equal(new Set(result.manifest.partitions.flatMap((p) => p.coordinates.map((c) => c.row))).size, 108);
    assert.equal(result.partitions[0].report.rows[0].row_number, 107);
  }
});
test("duplicado de cuenta/mes bloquea, período inválido queda en padre, meses ausentes no se rellenan", async () => {
  const rows = historicalRows().slice(0, 3);
  rows.push([...rows[0]], ["SINTETICO", "00004", "R4", "10", "13", "2025"]);
  const result = prepareHistorical(await readBook(csv("aum", rows), "SINTETICO.csv", ","), options);
  assert.equal(result.partitions.length, 1);
  assert.ok(result.partitions[0].report.rows.some((r) => r.errors.some((e) => e.code === "aum_duplicate")));
  assert.equal(result.manifest.partitions[0].summary.duplicateAccounts, 2);
  assert.equal(result.manifest.unroutable.length, 1);
  assert.equal(result.manifest.unroutable[0].row, 6);
});
test("custodios declarados separados y configuración/header/ceros protegidos", async () => {
  const book = await readBook(csv("aum", [["SINTETICO", "00123", "123", "0", "1", "2024"]]), "SINTETICO.csv", ",");
  assert.equal(prepareHistorical(book, options).partitions[0].report.total, "0");
  assert.equal(prepareHistorical(book, { ...options, custodianCode: "SYN-B", custodianId: "10000000-0000-0000-0000-000000000002" }).partitions[0].report.rows[0].cell_metadata.account, "00123");
  assert.throws(() => prepareHistorical(book, { ...options, source: "revenue" }));
  assert.throws(() => prepareHistorical(book, { ...options, sheet: "missing" }));
  const empty = prepareHistorical(await readBook(csv("aum", []), "SINTETICO.csv", ","), options);
  assert.ok(empty.manifest.errors.length);
});
test("capacidad acotada: 4.968 filas / 36 meses y exceso rechazado", async () => {
  const rows = Array.from({ length: 36 }, (_, m) => Array.from({ length: 138 }, (_, a) => [
    "SINTETICO", `A-${String(a).padStart(5, "0")}`, `R-${a}`, "0.1", String(m % 12 + 1), String(2023 + Math.floor(m / 12)),
  ])).flat();
  const bytes = csv("aum", rows);
  const started = performance.now();
  const result = prepareHistorical(await readBook(bytes, "SINTETICO-capacidad.csv", ","), options);
  assert.equal(result.partitions.length, 36);
  assert.ok(result.partitions.every((p) => p.report.total === "13.8" && p.report.blockingErrors === 0));
  assert.equal(result.partitions.reduce((n, p) => n + p.report.rows.length, 0), 4968);
  console.log(`Historia SINTETICA 4.968 filas: ${bytes.length} bytes; lectura/partición/validación ${Math.round(performance.now() - started)} ms`);
  await assert.rejects(() => readBook(csv("aum", [...rows, ...rows.slice(0, 34)]), "SINTETICO-exceso.csv", ","), /5.000|5000|filas/);
});
