import assert from "node:assert/strict";
import { test } from "node:test";
import { HEADERS, validateSourceReview, type Book, type Cell } from "../src/lib/imports/contracts.ts";
import { prepare } from "../src/lib/imports/validate.ts";
import { prepareHistorical } from "../src/lib/imports/historical.ts";

const options = { source: "revenue" as const, period: "2024-01-01", custodianId: "10000000-0000-0000-0000-000000000001", custodianCode: "SYN", sheet: "SINTETICO", numericFormat: "dot" as const, delimiter: "," as const };
const review = { missingRevenueAsUnknown: true, numericIdentifiersAsWritten: true, metadataErrorsAsWarnings: true, reason: "SINTETICO: dueño acredita literales; importes ausentes N/D." };
function book(overrides: Record<string, Cell> = {}): Book {
  const values: Record<string, string> = { CUSTODIO: "SYN", MES: "1", AÑO: "2024", ACCOUNT: "12345" };
  const cells = HEADERS.revenue.map((h) => overrides[h] ?? { kind: h === "ACCOUNT" ? "n" : "text", value: values[h] ?? null });
  return { sheets: [{ name: options.sheet, rows: [
    { number: 3, cells: HEADERS.revenue.map((value) => ({ kind: "text", value })) },
    { number: 4, cells }, { number: 5, cells: cells.map((c) => ({ ...c })) },
  ] }] };
}
test("revisión conserva originales, repetidos e importes N/D sin inventar cero", () => {
  const input = book({ "Nacho GMA": { kind: "e", value: "#N/A" } });
  const before = JSON.stringify(input);
  const strict = prepare(input, options);
  assert.equal(strict.blockingErrors, 6);
  const result = prepare(input, options, review);
  assert.equal(result.blockingErrors, 0);
  assert.equal(result.total, null);
  assert.equal(result.valueCount, 0);
  assert.equal(result.missingValues, 2);
  assert.equal(result.duplicateRows, 1);
  assert.equal(result.rows[0].cell_metadata.account, "12345");
  assert.equal(result.rows[0].cell_metadata.amount, null);
  assert.equal(result.rows[0].original_cells["9"], "#N/A");
  assert.deepEqual(result.rows.map((r) => r.original_cells), strict.rows.map((r) => r.original_cells));
  assert.equal(JSON.stringify(input), before);
  const history = prepareHistorical(input, { ...options, multiCustodian: true, custodians: [{ id: options.custodianId, code: "SYN" }], sourceReview: review });
  const numeric = history.manifest.exceptionSummary!.find((e) => e.code === "numeric_identifier_reviewed")!;
  assert.equal(numeric.count, 2); assert.equal(numeric.accounts, 1);
  assert.equal(history.manifest.sourceReview?.reason, review.reason);
});
test("el consentimiento no habilita cuentas imprecisas, períodos inválidos ni importes erróneos", () => {
  for (const account of ["1234567890123456", "1E5", "1.5", "-1"]) {
    assert.ok(prepare(book({ ACCOUNT: { kind: "n", value: account } }), options, review).rows[0].errors.some((e) => e.code === "identifier_loss"));
  }
  const result = prepare(book({ ACCOUNT: { kind: "n", value: "123", formula: "1+122", cached: true }, MES: { kind: "text", value: "2" }, "Payout broker": { kind: "e", value: "#N/A" } }), options, review);
  for (const code of ["identifier_loss", "period_mismatch", "excel_error", "invalid_amount"])
    assert.ok(result.rows[0].errors.some((e) => e.code === code), code);
  const known = prepare(book({ "Payout broker": { kind: "text", value: "-0.05" } }), options, review);
  assert.equal(known.total, "-0.1");
  const aum: Book = { sheets: [{ name: options.sheet, rows: [{ number: 1, cells: HEADERS.aum.map((value) => ({ kind: "text", value })) }, { number: 2, cells: ["SINTETICO", "001", "R1", "", "1", "2024"].map((value) => ({ kind: "text", value })) }] }] };
  assert.ok(prepare(aum, { ...options, source: "aum" }, review).rows[0].errors.some((e) => e.code === "missing_amount"));
});
test("decisiones explícitas: motivo requerido y booleanos estrictos", () => {
  assert.throws(() => validateSourceReview({ ...review, reason: " " }));
  assert.throws(() => validateSourceReview({ ...review, numericIdentifiersAsWritten: "true" }));
  assert.equal(validateSourceReview(undefined), undefined);
});
