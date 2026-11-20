import test from "node:test";
import assert from "node:assert/strict";
import { MASTER_HEADERS, basisPoints, prepareMaster } from "../src/lib/imports/master.ts";
import { xlsx, type TestCell } from "./fixtures/imports/build.ts";
import { readBook } from "../src/lib/imports/read.ts";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
const headers = [...MASTER_HEADERS.slice(0, 9), "Balance as 30 Sep\r\nof 30 Sep", ...MASTER_HEADERS.slice(9)];
function row(rate: TestCell = { n: "50" }): TestCell[] { return ["SINTETICO", "0000123", "", "", "SINTETICO", "SINTETICO", "Advisory", rate, "SINTETICO", { n: "100000.12345" }, { formula: "J3*H3/10000", cached: "500.00061725" }, "", "", ""]; }
const book = (rows: TestCell[][]) => xlsx([{ name: "SINTETICO", rows: [["SINTETICO"], headers, ...rows] }]);
test("Master: puntos básicos exactos, ceros, negativos y precisión", () => {
  assert.equal(basisPoints("50"), "0.005"); assert.equal(basisPoints("25"), "0.0025");
  assert.equal(basisPoints("0"), "0"); assert.equal(basisPoints("-50"), "-0.005");
  assert.equal(basisPoints("50.123456789"), "0.0050123456789");
  assert.equal(basisPoints("0.000000000000000000000000000001"), "0.0000000000000000000000000000000001");
});
test("Master: preserva 14 originales, fórmulas guardadas y condiciones sin ejecutarlas", async () => {
  const bytes = book([row(), row("POR REVISAR"), ["", "", "", "", "", "", "", "", "", "", { formula: "SUBTOTAL(9,K3:K4)", cached: "500" }]]);
  const result = await prepareMaster(bytes, "SINTETICO.xlsx", "", "undefined");
  assert.equal(result.rows.length, 2); assert.deepEqual(result.subtotalRows, [5]);
  assert.equal(result.rows[0].account, "0000123"); assert.equal(result.rows[0].balance, "100000.12345");
  assert.equal(result.rows[0].annualRate, "0.005"); assert.equal(Object.keys(result.rows[0].cells).length, 14);
  assert.equal(result.rows[0].original[10].formula, "J3*H3/10000");
  assert.equal(result.rows[1].annualRate, null); assert.match(result.rows[1].issue!, /pendiente/);
});
test("Master: sólo admite combinadas en el preámbulo, mantiene rechazo del lector general", async () => {
  const z = unzipSync(book([row()]));
  const xml = strFromU8(z["xl/worksheets/sheet1.xml"]);
  z["xl/worksheets/sheet1.xml"] = strToU8(xml.replace("</worksheet>", '<mergeCells count="1"><mergeCell ref="K1:L1"/></mergeCells></worksheet>'));
  await prepareMaster(zipSync(z), "SINTETICO.xlsx", "", "dot");
  await assert.rejects(readBook(zipSync(z), "SINTETICO.xlsx", ","), /combinadas/);
  z["xl/worksheets/sheet1.xml"] = strToU8(xml.replace("</worksheet>", '<mergeCells count="1"><mergeCell ref="K3:L3"/></mergeCells></worksheet>'));
  await assert.rejects(prepareMaster(zipSync(z), "SINTETICO.xlsx", "", "dot"), /combinadas/);
});
test("Master: bloquea cuenta ambigua, error de saldo, contrato alterado y archivo vacío", async () => {
  const numeric = row(); numeric[1] = { n: "1234567890123456" };
  await assert.rejects(prepareMaster(book([numeric]), "S.xlsx", "", "dot"), /cuenta numérica ambigua/);
  const badRate = row({ formula: "1/0", cached: "#DIV/0!", type: "e" });
  await assert.rejects(prepareMaster(book([badRate]), "S.xlsx", "", "dot"), /tasa con error/);
  const missingRate = await prepareMaster(book([["SINTETICO", "0000123"]]), "S.xlsx", "", "dot");
  assert.equal(missingRate.rows[0].annualRate, null);
  assert.equal(missingRate.rows[0].balance, null);
  const invalid = row(); invalid[9] = { formula: "1/0", cached: "#DIV/0!", type: "e" };
  await assert.rejects(prepareMaster(book([invalid]), "S.xlsx", "", "dot"), /Balance inválido/);
  await assert.rejects(prepareMaster(book([]), "S.xlsx", "", "dot"), /no contiene cuentas/);
  await assert.rejects(prepareMaster(xlsx([{ name: "S", rows: [["S"], ["ACCOUNT"], row()] }]), "S.xlsx", "", "dot"), /14 columnas/);
});
