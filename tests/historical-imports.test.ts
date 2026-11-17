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

test("varios custodios: AUM usa el par REF, conserva headers/filas y bloquea correspondencias ambiguas", async () => {
  const { referencePairs } = await import("../src/lib/imports/historical.ts");
  const custodians = [{ id: options.custodianId, code: "SYN-A" }, { id: "10000000-0000-0000-0000-000000000002", code: "SYN-B" }];
  const refBook = await readBook(csv("fa", [
    ["001", "R001", "SINTETICO", "", "", "", "SYN-A"],
    ["002", "R002", "SINTETICO", "", "", "", "SYN-B"],
  ]), "SINTETICO-REF.csv", ",");
  const references = { fileName: "SINTETICO-REF.csv", fileHash: "a".repeat(64), fileSize: 100, ...referencePairs(refBook, "CSV") };
  const book = await readBook(xlsx([{ name: "CSV", rows: [["Título SINTETICO"], ["Contexto SINTETICO"], [...HEADERS.aum],
    ["SINTETICO", "001", "R001", "100", "1", "2026"],
    ["SINTETICO", "002", "R002", "-0.1", "1", "2026"],
    ["SINTETICO", "001", "R002", "9", "1", "2026"],
  ] }]), "SINTETICO.xlsx", ",");
  const multi = { ...options, multiCustodian: true, custodians, references };
  const result = prepareHistorical(book, multi);
  assert.equal(result.manifest.headerRow, 3);
  assert.equal(result.manifest.preamble.length, 2);
  assert.equal(result.partitions.length, 2);
  assert.deepEqual(result.partitions.map((p) => [p.custodianCode, p.report.total, p.report.rows[0].row_number]), [["SYN-A", "100", 4], ["SYN-B", "-0.1", 5]]);
  assert.equal(result.manifest.unroutable[0].row, 6, "un solo identificador no alcanza para unir");
  const ambiguous = prepareHistorical(book, { ...multi, references: { ...references, pairs: [...references.pairs, { ...references.pairs[0], custodianCode: "SYN-B" }] } });
  assert.equal(ambiguous.partitions.length, 1);
  assert.equal(ambiguous.manifest.unroutable.length, 2);
  const missing = prepareHistorical(book, { ...multi, custodians: [custodians[0]] });
  assert.ok(missing.manifest.unroutable.some((r) => r.errors[0].message.includes("Configuración")));
});

test("Revenue histórico: múltiples custodios y meses, repeticiones/faltantes, anotación revisada sin descartar movimientos", async () => {
  const { revenueRow } = await import("./fixtures/imports/build.ts");
  const custodians = [{ id: options.custodianId, code: "SYN-A" }, { id: "10000000-0000-0000-0000-000000000002", code: "SYN-B" }];
  const rows = [revenueRow("001", "0.1"), revenueRow("001", "0.1"), revenueRow("001", "2", "SYN-B"), revenueRow("002", "", "SYN-B")];
  const book = await readBook(xlsx([{ name: "CSV", rows: [["Título SINTETICO"], [...HEADERS.revenue, "Auxiliar"], ...rows, ["NOTA SINTETICA"]] }]), "SINTETICO.xlsx", ",");
  const multi = { ...options, source: "revenue" as const, multiCustodian: true, custodians };
  const result = prepareHistorical(book, multi);
  assert.equal(result.partitions.length, 2);
  assert.equal(result.partitions[0].report.rows.length, 2);
  assert.equal(result.partitions[0].report.total, "0.2");
  assert.equal(result.partitions[0].report.duplicateRows, 1);
  assert.equal(result.partitions[1].report.missingValues, 1);
  assert.equal(result.manifest.unroutable[0].row, 7);
  const excluded = prepareHistorical(book, { ...multi, excludedRows: [7], exclusionReason: "Anotación SINTETICA sin datos" });
  assert.equal(excluded.manifest.unroutable.length, 0);
  assert.equal(excluded.manifest.excludedRows[0].number, 7);
  assert.throws(() => prepareHistorical(book, { ...multi, excludedRows: [6], exclusionReason: "Intento de ocultar importe faltante" }), /No se permite excluir/);
  assert.throws(() => prepareHistorical(book, { ...multi, excludedRows: [7] }), /motivo/);
  assert.equal(excluded.partitions[1].report.blockingErrors, 1, "faltante sigue bloqueando");
});

test("capacidad histórica ampliada aislada: 18.480 filas y 528 alcances, sin cambiar límites mensuales", async () => {
  const { HISTORICAL_LIMITS } = await import("../src/lib/imports/read.ts");
  const { referencePairs } = await import("../src/lib/imports/historical.ts");
  const custodians = Array.from({ length: 12 }, (_, i) => ({ id: `10000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`, code: `SYN-${i}` }));
  const refs = custodians.flatMap((c, i) => Array.from({ length: 35 }, (_, a) => [`A${i}-${a}`, `R${i}-${a}`, "SINTETICO", "", "", "", c.code]));
  const ref = referencePairs(await readBook(csv("fa", refs), "SINTETICO-REF.csv", ","), "CSV");
  const rows = Array.from({ length: 44 }, (_, m) => refs.map((r) => ["SINTETICO", r[0], r[1], "0.1", String(m % 12 + 1), String(2023 + Math.floor(m / 12))])).flat();
  const raw = csv("aum", rows), started = performance.now();
  await assert.rejects(() => readBook(raw, "SINTETICO.csv", ","), /filas/);
  const history = prepareHistorical(await readBook(raw, "SINTETICO.csv", ",", HISTORICAL_LIMITS), { ...options, multiCustodian: true, custodians, references: { ...ref, fileName: "SINTETICO-REF.csv", fileHash: "a".repeat(64), fileSize: 100 } });
  assert.equal(history.partitions.length, 528);
  assert.equal(history.partitions.reduce((n, p) => n + p.report.rows.length, 0), 18480);
  assert.ok(history.partitions.every((p) => p.report.total === "3.5" && p.report.blockingErrors === 0));
  assert.ok(Buffer.byteLength(JSON.stringify(history.manifest)) < 8 * 1024 * 1024);
  console.log(`Historia SINTETICA multi: 18.480 filas / 528 alcances en ${Math.round(performance.now() - started)} ms`);
});
