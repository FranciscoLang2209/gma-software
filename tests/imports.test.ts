import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { strToU8, zipSync } from "fflate";
import {
  HEADERS,
  LIMITS,
  validateOptions,
  type Options,
} from "../src/lib/imports/contracts.ts";
import { decimal, sumDecimals } from "../src/lib/imports/decimal.ts";
import { readBook, sha256 } from "../src/lib/imports/read.ts";
import { prepare } from "../src/lib/imports/validate.ts";
import { csv, xlsx } from "./fixtures/imports/build.ts";
const options: Options = {
  source: "aum",
  period: "2026-01-01",
  custodianId: "10000000-0000-0000-0000-000000000001",
  custodianCode: "SYN-A",
  sheet: "CSV",
  numericFormat: "dot",
  delimiter: ",",
};
const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/imports/${name}`, import.meta.url));
const report = async (file: string, o: Partial<Options> = {}) =>
  prepare(await readBook(fixture(file), file, o.delimiter ?? ","), {
    ...options,
    ...o,
  });
const codes = (r: ReturnType<typeof prepare>) =>
  [...r.errors, ...r.rows.flatMap((r) => r.errors)].map((e) => e.code);

test("decimal exacto, convenciones explícitas, negativos y ausencias", () => {
  assert.equal(decimal("1,234", "dot"), "1234");
  assert.equal(decimal("1,234", "comma"), "1.234");
  assert.throws(() => decimal("1,234", "undefined"), /ambiguo/);
  assert.throws(() => decimal("1.234", "undefined"), /ambiguo/);
  assert.throws(() => decimal("12,34.56", "dot"), /Agrupación/);
  assert.throws(() => decimal("1.23,45", "comma"), /Agrupación/);
  for (const s of ["NaN", "Infinity", "=1+1", "", "1 234", "$3", "1e9999"])
    assert.throws(() => decimal(s, "dot"));
  assert.equal(decimal("1.25E-3", "undefined", true), "0.00125");
  assert.equal(sumDecimals(["0.1", "0.2", "-0.05"]), "0.25");
  assert.equal(sumDecimals(["88259496234518.57", "0.01"]), "88259496234518.58");
  assert.equal(sumDecimals([]), null);
});
test("fixtures CSV: AUM exacto, Revenue repetido y FA contradictorio", async () => {
  const aum = await report("aum.csv");
  assert.equal(aum.total, "100");
  assert.equal(aum.distinctAccounts, 2);
  assert.equal(aum.blockingErrors, 0);
  assert.equal(aum.rows[0].cell_metadata.account, "00123");
  const revenue = await report("revenue.csv", { source: "revenue" });
  assert.equal(revenue.rows.length, 3);
  assert.equal(revenue.total, "0.15");
  assert.equal(revenue.duplicateRows, 1);
  assert.equal(revenue.blockingErrors, 0);
  assert.equal(Object.keys(revenue.rows[0].original_cells).length, 29);
  assert.equal(
    revenue.rows[0].cell_metadata.fingerprint,
    revenue.rows[1].cell_metadata.fingerprint,
  );
  const fa = await report("fa.csv", { source: "fa" });
  assert.equal(fa.total, null);
  assert.ok(codes(fa).includes("fa_contradiction"));
  assert.equal(fa.rows.length, 2);
});
test("errores por fila y control parcial, sin ceros inventados", async () => {
  const result = await report("aum-problemas.csv", {
    numericFormat: "undefined",
  });
  for (const code of [
    "aum_duplicate",
    "period_mismatch",
    "empty_identifier",
    "invalid_amount",
    "missing_amount",
  ])
    assert.ok(codes(result).includes(code), code);
  assert.equal(result.total, null);
  assert.equal(result.rows[1].cell_metadata.amount, null);
  assert.equal(result.rows[2].row_number, 4);
  const revenue = await report("revenue-problemas.csv", { source: "revenue" });
  assert.ok(codes(revenue).includes("scope_mismatch"));
});
test("XLSX preciso, hojas, número de fila y fórmulas sin ejecutar", async () => {
  const book = await readBook(fixture("aum.xlsx"), "aum.xlsx", ",");
  assert.equal(book.sheets.length, 2);
  const valid = prepare(book, {
    ...options,
    sheet: "AUM SINTETICO",
    numericFormat: "undefined",
  });
  assert.equal(valid.total, "88259496234518.57");
  assert.equal(valid.blockingErrors, 0);
  const problems = prepare(book, { ...options, sheet: "Problemas" });
  assert.ok(codes(problems).includes("formula_no_result"));
  assert.ok(codes(problems).includes("identifier_loss"));
  assert.equal(problems.rows[0].cell_metadata.amount, null);
  assert.equal(problems.rows[1].cell_metadata.amount, "2");
  assert.equal(problems.rows[0].cell_metadata.cells[3].formula, "1+1");
  assert.equal(problems.rows[1].row_number, 3);
  assert.equal(
    (
      await report("revenue.xlsx", {
        source: "revenue",
        sheet: "Revenue SINTETICO",
      })
    ).rows.length,
    2,
  );
  assert.equal(
    (await report("fa.xlsx", { source: "fa", sheet: "FA SINTETICO" }))
      .blockingErrors,
    0,
  );
});
test("headers explícitos: espacios/mayúsculas, faltantes y colisiones conservadas", async () => {
  const bytes = csv("aum", [["SINTETICO", "001", "002", "1", "1", "2026"]]);
  const text = bytes
    .toString()
    .replace("Top Level Holding Account", "  TOP   LEVEL HOLDING ACCOUNT  ");
  const book = await readBook(Buffer.from(text), "test.csv", ",");
  assert.equal(prepare(book, options).blockingErrors, 0);
  book.sheets[0].rows[0].cells[0].value = "mes";
  const r = prepare(book, options);
  assert.ok(codes(r).includes("header_collision"));
  assert.ok(codes(r).includes("missing_column"));
  assert.equal(Object.keys(r.rows[0].original_cells).length, 6);
});
test("CSV UTF-8, delimitador, comillas, líneas físicas y texto inerte", async () => {
  const bytes = csv(
    "aum",
    [
      ['SINTETICO\ncon ; comillas "', "001", "002", "1.234,56", "1", "2026"],
      ['=HYPERLINK("bad")', "003", "004", "2", "1", "2026"],
    ],
    ";",
  );
  const book = await readBook(bytes, "test.csv", ";");
  const r = prepare(book, {
    ...options,
    delimiter: ";",
    numericFormat: "comma",
  });
  assert.equal(r.total, "1236.56");
  assert.equal(r.rows[0].row_number, 2);
  assert.equal(r.rows[1].row_number, 4);
  assert.equal(r.rows[1].original_cells["1"], '=HYPERLINK("bad")');
  await assert.rejects(readBook(Buffer.from([255]), "test.csv", ","), /UTF-8/);
  await assert.rejects(
    readBook(Buffer.from('"sin cierre'), "test.csv", ","),
    /CSV inválido/,
  );
});
test("límites reales, formatos rechazados, macros y ZIP excesivo", async () => {
  await assert.rejects(
    readBook(Buffer.from("fake"), "source.xls", ","),
    /Excel/,
  );
  await assert.rejects(
    readBook(Buffer.alloc(LIMITS.bytes + 1), "source.csv", ","),
    /2 MiB/,
  );
  await assert.rejects(
    readBook(Buffer.alloc(0), "source.csv", ","),
    /contenido/,
  );
  const macro = xlsx([{ name: "SINTETICO", rows: [] }], {
    "xl/vbaProject.bin": strToU8("synthetic"),
  });
  await assert.rejects(readBook(macro, "source.xlsx", ","), /macros/);
  const bomb = zipSync({
    "xl/workbook.xml": new Uint8Array(LIMITS.expanded + 1),
  });
  await assert.rejects(readBook(bomb, "source.xlsx", ","), /12 MiB/);
  await assert.rejects(
    readBook(Buffer.from("x\n".repeat(5002)), "source.csv", ","),
    /5.000/,
  );
  assert.throws(() => validateOptions({ ...options, custodianId: "other" }));
  assert.throws(() => validateOptions({ ...options, period: "2026-13-01" }));
  assert.equal(
    sha256(Buffer.from("abc")),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});
test("5.000 filas XLSX acotadas y errores cruzando el límite de lote", async () => {
  const bytes = xlsx([
    {
      name: "SINTETICO",
      rows: [
        [...HEADERS.aum],
        ...Array.from({ length: 5000 }, (_, i) => [
          "SINTETICO",
          `00${i === 4999 ? 0 : i}`,
          `rev${i}`,
          { n: "0.01" },
          "1",
          "2026",
        ]),
      ],
    },
  ]);
  const start = performance.now();
  const book = await readBook(bytes, "load.xlsx", ",");
  const r = prepare(book, { ...options, sheet: "SINTETICO" });
  assert.equal(r.rows.length, 5000);
  assert.equal(r.total, "50");
  assert.ok(r.rows[0].errors.some((e) => e.code === "aum_duplicate"));
  assert.ok(r.rows[4999].errors.some((e) => e.code === "aum_duplicate"));
  console.info(
    `SINTETICO 5.000 filas: ${bytes.length} bytes; lectura+validación ${Math.round(performance.now() - start)} ms`,
  );
});

test("contratos coinciden con los headers documentados", () => {
  const product = readFileSync(
    new URL("../docs/product.md", import.meta.url),
    "utf8",
  );
  for (const [source, headers] of Object.entries(HEADERS)) {
    const section = product
      .split(
        `### ${source === "revenue" ? "Revenue" : source.toUpperCase()} —`,
      )[1]
      .split("### ")[0];
    assert.deepEqual(
      [...section.matchAll(/^\d+\. `([^`]+)`/gm)].map((m) => m[1]),
      [...headers],
    );
  }
});

test("valor escalar XLSX conservado y tipo monetario inválido bloqueado", async () => {
  const book = await readBook(
    xlsx([
      {
        name: "SINTETICO",
        rows: [
          [...HEADERS.aum],
          [
            "SINTETICO",
            "00123",
            "00077",
            { formula: "TRUE()", cached: "1", type: "b" },
            "1",
            "2026",
          ],
        ],
      },
    ]),
    "types.xlsx",
    ",",
  );
  const r = prepare(book, { ...options, sheet: "SINTETICO" });
  assert.equal(r.rows[0].original_cells["4"], "1");
  assert.equal(r.rows[0].cell_metadata.cells[3].kind, "b");
  assert.ok(codes(r).includes("invalid_amount"));
  assert.equal(r.total, null);
});
