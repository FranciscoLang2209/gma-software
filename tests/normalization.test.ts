import assert from "node:assert/strict";
import { test } from "node:test";
import { textSearchKey, inspectAccountIdentifier, isoDate, importPeriod, isImportPeriod } from "../src/lib/data/normalization.ts";
import { HEADERS, validateOptions, type Options } from "../src/lib/imports/contracts.ts";
import { readBook } from "../src/lib/imports/read.ts";
import { prepare } from "../src/lib/imports/validate.ts";
import { prepareHistorical } from "../src/lib/imports/historical.ts";
import { csv } from "./fixtures/imports/build.ts";

const options: Options = { source: "aum", period: "2026-01-01", custodianId: "10000000-0000-0000-0000-000000000001", custodianCode: "SYN-A", sheet: "CSV", numericFormat: "dot", delimiter: "," };

test("búsqueda: headers/custodios y etiquetas usan la misma regla sin equivalencias semánticas", () => {
  for (const original of ["  Owner  Name payout\t", " SYN-A ", " Cliente SINTÉTICO ", " Equipo\u00a0A ", " Advisory ", " Retro "]) {
    const key = textSearchKey(original);
    assert.equal(key, original.trim().replace(/\s+/g, " ").toLocaleLowerCase("es"));
    assert.equal(textSearchKey(key), key);
  }
  assert.notEqual(textSearchKey("José"), textSearchKey("Jose"));
  assert.notEqual(textSearchKey("Advisory"), textSearchKey("Advisory Fee"));
  assert.notEqual(textSearchKey("Equipo A"), textSearchKey("Equipo\u200b A"));
});

test("cuentas: preservar literalmente ceros, separadores, mayúsculas y espacios; solo señalar riesgos", () => {
  for (const original of ["000123", "123", "A-01/2", "a-01/2", " 000123 ", "000\u200b123", "000\u00a0123", "1.23E+12"]) {
    const result = inspectAccountIdentifier(original);
    assert.equal(result.key, original);
    assert.equal(result.original, original);
    assert.deepEqual(inspectAccountIdentifier(result.key), result);
  }
  assert.notEqual(inspectAccountIdentifier("000123").key, inspectAccountIdentifier("123").key);
  assert.notEqual(inspectAccountIdentifier("123 ").key, inspectAccountIdentifier("123").key);
  assert.equal(inspectAccountIdentifier("123 ").edgeWhitespace, true);
  assert.equal(inspectAccountIdentifier("123\u200b").invisibleCharacters, true);
  assert.equal(inspectAccountIdentifier("1.23E+12").scientific, true);
});

test("fechas: ISO exacto sin inferir formato local, bisiestos y fin de mes", () => {
  for (const value of ["2024-02-29", "2000-02-29", "2026-11-24", "0001-01-01"]) assert.equal(isoDate(value), value);
  for (const value of ["1900-02-29", "2026-02-29", "2026-04-31", "2026-00-01", "2026-01-00", "0000-01-01", "9999-01-01", "24/11/2026", "11/24/2026", "2026-1-01", "2026-01-01\n", " 2026-01-01"]) assert.equal(isoDate(value), null, value);
});

test("períodos: límites de importación comunes a configuración y filas, sin inventar meses", () => {
  assert.equal(importPeriod(" 1 ", " 2026 "), "2026-01-01");
  assert.equal(importPeriod("01", "2026"), "2026-01-01");
  for (const [month, year] of [["0", "2026"], ["13", "2026"], ["enero", "2026"], ["1.0", "2026"], ["1", "26"], ["1", "1899"], ["1", "2201"]]) assert.equal(importPeriod(month, year), null);
  for (const period of ["1900-01-01", "2200-12-01"]) assert.equal(validateOptions({ ...options, period }).period, period);
  for (const period of [null, undefined, "2026-01-02", "2026-1-01", "2026-01-01\n", "1899-01-01", "2201-01-01"]) {
    assert.equal(isImportPeriod(period), false);
    assert.throws(() => validateOptions({ ...options, period }));
  }
});

test("importación mensual/histórica: mismas coordenadas, huellas, totales y claves literales", async () => {
  const rows = [["SINTETICO", "000123", "REV-01", "0.1", " 01 ", "2026"], ["SINTETICO", "000123 ", "REV-02", "-0.01", "1", "2026"]];
  const bytes = csv("aum", rows);
  const book = await readBook(bytes, "SINTETICO.csv", ",");
  const before = structuredClone(book);
  const monthly = prepare(book, options);
  const historical = prepareHistorical(book, options);
  assert.deepEqual(historical.partitions[0].report, monthly);
  assert.deepEqual(prepare(book, options), monthly);
  assert.deepEqual(book, before);
  assert.equal(monthly.total, "0.09");
  assert.equal(monthly.blockingErrors, 0);
  assert.equal(monthly.distinctAccounts, 2);
  assert.deepEqual(monthly.rows.map(r => r.cell_metadata.account), ["000123", "000123 "]);
  assert.deepEqual(monthly.rows.map(r => r.row_number), [2, 3]);
});

test("headers y códigos normalizados no deduplican Revenue ni cambian originales", async () => {
  const cells: Record<string, string> = { CUSTODIO: " syn-a ", MES: "01", AÑO: "2026", ACCOUNT: "000123", "Payout broker": "0.1" };
  const row = HEADERS.revenue.map(h => cells[h] ?? "SINTETICO");
  const book = await readBook(csv("revenue", [row, [...row]]), "SINTETICO.csv", ",");
  book.sheets[0].rows[0].cells.forEach(c => { c.value = ` ${c.value!.toUpperCase().replaceAll(" ", "  ")} `; });
  const result = prepare(book, { ...options, source: "revenue" });
  assert.equal(result.blockingErrors, 0);
  assert.equal(result.rows.length, 2);
  assert.equal(result.duplicateRows, 1);
  assert.equal(result.total, "0.2");
  assert.equal(result.rows[0].original_cells["1"], " syn-a ");
  assert.equal(Object.keys(result.rows[0].original_cells).length, 29);
});
