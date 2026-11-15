import assert from "node:assert/strict";
import test from "node:test";
import { exact, exportHref, percent, reportHref, screenParameters } from "../src/lib/queries/presentation.ts";

test("presentación: decimales exactos, negativos, cero y ausencia sin redondear", () => {
  assert.equal(exact("100.123456789123456789"), "100,123456789123456789");
  assert.equal(exact("-1234567.05"), "-1.234.567,05");
  assert.equal(exact("0"), "0");
  assert.equal(exact("20.0000000000000000"), "20");
  assert.equal(percent("54.5454545454545455"), "54,55 %");
  assert.equal(percent("-0.005"), "-0,01 %");
  assert.equal(percent("99.999"), "100 %");
  assert.equal(percent("-0.004"), "0 %");
  assert.equal(exact(null), "N/D");
});
test("pantallas: parámetros compartidos, rango explícito y validación del contrato", () => {
  const now = new Date("2026-03-01T01:00:00Z");
  assert.equal(screenParameters({}, false, now).parameters.month_from, "2026-02-01");
  assert.equal(screenParameters({ desde: "2026-01" }, true).parameters.month_to, "2026-01-01");
  for (const bad of [{ cuenta: "Nombre privado" }, { desde: ["2026-01", "2026-02"] }, { formato: "csv" }])
    assert.throws(() => screenParameters(bad, true));
});
test("enlaces: conservan filtros por ID y reinician paginación al cambiar población", () => {
  const id = "20000000-0000-0000-0000-000000000001";
  const params = new URLSearchParams(`desde=2026-01&hasta=2026-02&cuenta=${id}&agrupar=account&offset=25&revision=${"a".repeat(32)}`);
  const href = reportHref("/analisis-comercial", params, { agrupar: "team" });
  assert.ok(href.includes(`cuenta=${id}`));
  assert.ok(href.includes("agrupar=team"));
  assert.ok(!href.includes("revision") && !href.includes("offset"));
  const download = exportHref(params, { group_by: "team", revision: "b".repeat(32) } as Parameters<typeof exportHref>[1]);
  const parsed = new URL(download, "http://synthetic.invalid").searchParams;
  assert.equal(parsed.get("cuenta"), id); assert.equal(parsed.get("desde"), "2026-01");
  assert.equal(parsed.get("hasta"), "2026-02"); assert.equal(parsed.get("revision"), "b".repeat(32));
  assert.equal(parsed.get("formato"), "csv-completo"); assert.equal(parsed.get("agrupar"), "team");
  assert.equal(parsed.has("offset"), false); assert.equal(parsed.has("limite"), false);
});
