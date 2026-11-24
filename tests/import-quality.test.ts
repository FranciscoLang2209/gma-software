// Casos exclusivamente SINTÉTICOS: ningún identificador corresponde a una cuenta real.
import assert from "node:assert/strict";
import test from "node:test";
import { HEADERS, IMPORT_VALIDATION_VERSION, requireCurrentValidation, type Cell } from "../src/lib/imports/contracts.ts";
import { identifierIssues } from "../src/lib/imports/identifiers.ts";
import { prepare, prepareHeaders } from "../src/lib/imports/validate.ts";
import { prepareHistorical, referencePairs, reportSummary } from "../src/lib/imports/historical.ts";
import { MASTER_HEADERS, prepareMaster } from "../src/lib/imports/master.ts";
import { readBook } from "../src/lib/imports/read.ts";
import { csv, revenueRow, xlsx, type TestCell } from "./fixtures/imports/build.ts";

const options = { source: "aum" as const, period: "2026-01-01", custodianId: "10000000-0000-0000-0000-000000000001", custodianCode: "SYN-A", sheet: "CSV", numericFormat: "dot" as const, delimiter: "," as const };
const review = { missingRevenueAsUnknown: false, numericIdentifiersAsWritten: true, metadataErrorsAsWarnings: false, reason: "SINTETICO: literales numéricos acreditados por el dueño." };

test("calidad: literales con ceros/espacios/invisibles se conservan, sin convertirlos en aliases", () => {
  for (const value of [" 00123 ", "00\u200b123", "00\u202e123", "00\t123", "00\u00a0123"]) {
    const cell = { kind: "text", value }, before = JSON.stringify(cell);
    const checked = identifierIssues(cell, "ACCOUNT");
    assert.equal(checked.errors.length, 0);
    assert.equal(checked.warnings[0].code, "identifier_format_review");
    assert.equal(checked.warnings[0].column, "ACCOUNT");
    assert.equal(JSON.stringify(cell), before);
  }
  for (const value of ["00123", "000-123", "123456789012345678901234567890"])
    assert.deepEqual(identifierIssues({ kind: "text", value }, "ACCOUNT"), { errors: [], warnings: [] });
});

test("calidad: el consentimiento numérico no habilita ciencia textual, booleanos o cuentas calculadas", () => {
  const invalid: Cell[] = [
    { kind: "text", value: " 1.23E+12 " }, { kind: "n", value: "1234567890123456" },
    { kind: "b", value: "1" }, { kind: "d", value: "2026-01-01" },
    { kind: "str", value: "00123", formula: "A1", cached: true },
  ];
  for (const cell of invalid) assert.equal(identifierIssues(cell, "ACCOUNT", true).errors[0].code, "identifier_loss");
  const numeric = { kind: "n", value: "123" };
  assert.equal(identifierIssues(numeric, "ACCOUNT").errors[0].code, "identifier_loss");
  assert.equal(identifierIssues(numeric, "ACCOUNT", true).warnings[0].code, "numeric_identifier_reviewed");
});

test("calidad: REF valida encabezados y devuelve fila/columna sin producir pares desde columnas ambiguas", async () => {
  const book = await readBook(csv("fa", [["001", "R1", "", "", "", "", "SYN-A"]]), "SINTETICO.csv", ",");
  const header = book.sheets[0].rows[0];
  header.cells.push({ kind: "text", value: " account " });
  let result = referencePairs(book, "CSV");
  assert.equal(result.pairs.length, 0);
  assert.ok(result.errors.some(e => e.code === "header_collision" && e.row === 1 && e.column === "8"));
  header.cells.pop();
  header.cells[0] = { kind: "str", value: "ACC # Addepar", formula: '"ACC # Addepar"', cached: true };
  result = referencePairs(book, "CSV");
  assert.equal(result.pairs.length, 0);
  assert.ok(result.errors.some(e => e.code === "header_type" && e.row === 1));
  const mapped = prepareHeaders({ number: 7, cells: [] }, HEADERS.aum);
  assert.equal(mapped.errors.length, 6);
  assert.ok(mapped.errors.every(e => e.row === 7 && e.column));
});

test("calidad: REF controla tipos/precisión y exige consentimiento para números literales", async () => {
  const bytes = xlsx([{ name: "CSV", rows: [[...HEADERS.fa],
    [{ n: "123" }, "R1", "", "", "", "", "SYN-A"],
    [" 001 ", "R2", "", "", "", "", "SYN-A"],
    ["1E+12", "R3", "", "", "", "", "SYN-A"],
    ["004", "R4", "", "", "", "", { formula: '"SYN-A"', cached: "SYN-A", type: "str" }],
  ] }]);
  const book = await readBook(bytes, "SINTETICO.xlsx", ",");
  const strict = referencePairs(book, "CSV"), accepted = referencePairs(book, "CSV", review);
  assert.deepEqual(strict.pairs.map(p => p.holding), [" 001 "]);
  assert.deepEqual(accepted.pairs.map(p => p.holding), ["123", " 001 "]);
  assert.ok(strict.errors.some(e => e.row === 2 && e.column === "ACC # Addepar"));
  assert.ok(accepted.errors.some(e => e.row === 4 && e.code === "identifier_loss"));
  assert.ok(accepted.errors.some(e => e.row === 5 && e.column === "Broker"));
  assert.ok(accepted.warnings.some(e => e.row === 2 && e.code === "numeric_identifier_reviewed"));
  assert.ok(accepted.warnings.some(e => e.row === 3 && e.code === "identifier_format_review"));
});

test("calidad: resumen sin excepciones explícitas conserva Revenue idéntico y advierte ambos literales", async () => {
  const book = await readBook(csv("revenue", [revenueRow(" 001 ", "0.1"), revenueRow(" 001 ", "0.1"), revenueRow("001", "-0.05")]), "SINTETICO.csv", ",");
  const opts = { ...options, source: "revenue" as const };
  const report = prepare(book, opts), summary = reportSummary(report, book);
  assert.equal(report.blockingErrors, 0);
  assert.equal(report.rows.length, 3);
  assert.equal(report.total, "0.15");
  assert.equal(report.distinctAccounts, 2);
  assert.equal(report.rows[0].original_cells["4"], " 001 ");
  const warning = summary.issues.find(i => i.code === "identifier_format_review")!;
  assert.equal(warning.count, 2); assert.deepEqual(warning.rows, [2, 3]);
  const history = prepareHistorical(book, { ...opts, multiCustodian: true, custodians: [{ id: options.custodianId, code: options.custodianCode }] });
  assert.ok(history.manifest.exceptionSummary.some(i => i.code === "repeated_row"));
  assert.equal(history.manifest.validationVersion, IMPORT_VALIDATION_VERSION);
});

test("calidad: mes booleano/fecha no se interpreta como número ni se enruta a un mes válido", async () => {
  for (const month of [{ formula: "TRUE()", cached: "1", type: "b" }, { formula: "A1", cached: "2026-01-01", type: "d" }]) {
    const book = await readBook(xlsx([{ name: "CSV", rows: [[...HEADERS.aum], ["SINTETICO", "001", "R1", "10", month, "2026"]] }]), "SINTETICO.xlsx", ",");
    assert.ok(prepare(book, options).rows[0].errors.some(e => e.code === "period_mismatch"));
    const history = prepareHistorical(book, options);
    assert.equal(history.partitions.length, 0);
    assert.equal(history.manifest.unroutable[0].row, 2);
    assert.equal(history.manifest.unroutable[0].cells[4].value, month.cached);
  }
});

test("calidad: Master comparte controles de identidad/header y no toma booleanos como saldo/tasa", async () => {
  const headers: TestCell[] = [...MASTER_HEADERS.slice(0, 9), "Balance", ...MASTER_HEADERS.slice(9)];
  const row: TestCell[] = ["SINTETICO", " 001 ", "", "", "SINTETICO", "", "Advisory", { n: "50" }, "", { n: "-0.05" }];
  const book = (r = row, h = headers) => xlsx([{ name: "CSV", rows: [["SINTETICO"], h, r] }]);
  const result = await prepareMaster(book(), "SINTETICO.xlsx", "", "dot");
  assert.equal(result.rows[0].account, " 001 "); assert.equal(result.rows[0].balance, "-0.05");
  assert.equal(result.rows[0].warnings?.[0].code, "identifier_format_review");
  await assert.rejects(prepareMaster(book(row, headers.map((h, i) => i === 1 ? { formula: '"ACCOUNT"', cached: "ACCOUNT", type: "str" } : h)), "SINTETICO.xlsx", "", "dot"), /encabezados/);
  for (const account of ["1E+12", { formula: "TRUE()", cached: "1", type: "b" }])
    await assert.rejects(prepareMaster(book(row.map((c, i) => i === 1 ? account : c)), "SINTETICO.xlsx", "", "dot"), /ACCOUNT/);
  for (const index of [7, 9])
    await assert.rejects(prepareMaster(book(row.map((c, i) => i === index ? { formula: "TRUE()", cached: "1", type: "b" } : c)), "SINTETICO.xlsx", "", "dot"), /inválid/);
});

test("calidad: se rechaza retomar validadores antiguos sin modificar manifiestos", () => {
  for (const value of [{}, { validationVersion: 0 }, { validationVersion: String(IMPORT_VALIDATION_VERSION) }]) {
    const before = JSON.stringify(value);
    assert.throws(() => requireCurrentValidation(value), /nueva preparación/);
    assert.equal(JSON.stringify(value), before);
  }
  requireCurrentValidation({ validationVersion: IMPORT_VALIDATION_VERSION });
});
