import assert from "node:assert/strict";
import { test } from "node:test";
import { parseReportParameters } from "../src/lib/queries/contracts.ts";
import { parseRoaParameters } from "../src/lib/roa/contracts.ts";
import { accountParameters, accountHref } from "../src/lib/accounts/contracts.ts";
import { reportHref, exportHref } from "../src/lib/queries/presentation.ts";
import { roaHref, roaYearQuarters } from "../src/lib/roa/presentation.ts";
import { clearReferenceFilters } from "../src/lib/queries/references.ts";
import type { Report } from "../src/lib/queries/contracts.ts";
const snapshot = "92000000-0000-0000-0000-000000000001";
const refs = `ref_snapshot=${snapshot}&ref_cliente=1&ref_comercial=sin_referencia&ref_equipo=4`;

test("REF: contrato separado, común a cierre/Cuentas/ROA, con ID y snapshot", () => {
  const monthly = parseReportParameters(new URLSearchParams(`desde=2026-01&hasta=2026-03&${refs}`)).parameters;
  const quarterly = parseRoaParameters(new URLSearchParams(`anio=2026&trimestre=1&${refs}`));
  const directory = accountParameters(Object.fromEntries(new URLSearchParams(`desde=2026-01&hasta=2026-03&${refs}`))).parameters;
  assert.deepEqual(monthly.reference_filters, { snapshot, client: "1", advisor: "sin_referencia", team: "4" });
  assert.deepEqual(quarterly.reference_filters, monthly.reference_filters);
  assert.deepEqual(directory.reference_filters, monthly.reference_filters);
  assert.equal(monthly.client, null);
  assert.equal(monthly.advisor, null);
  assert.ok(roaYearQuarters(quarterly).every(q => q.reference_filters === quarterly.reference_filters));
});

test("REF: rechaza nombres como IDs, ceros ambiguos, sin snapshot, repetición y mezcla de namespaces", () => {
  for (const bad of ["ref_cliente=1", `ref_snapshot=x&ref_cliente=1`, `ref_snapshot=${snapshot}&ref_cliente=Cliente`,
    `ref_snapshot=${snapshot}&ref_cliente=01`, `ref_snapshot=${snapshot}&ref_equipo=0`,
    `ref_snapshot=${snapshot}&ref_cliente=1&ref_cliente=2`, `ref_snapshot=${snapshot}&ref_owner=1`,
    `ref_snapshot=${snapshot}&cliente=1`, `ref_snapshot=${snapshot}&ref_cliente=`]) {
    assert.throws(() => parseReportParameters(new URLSearchParams(`desde=2026-01&hasta=2026-03&${bad}`)), bad);
    assert.throws(() => parseRoaParameters(new URLSearchParams(`anio=2026&trimestre=1&${bad}`)), bad);
  }
});

test("REF: enlaces de pantalla/exportación/paginación conservan selección y reinicio la elimina", () => {
  const params = new URLSearchParams(`desde=2026-01&hasta=2026-03&${refs}`);
  const report = { group_by: "account", revision: "a".repeat(32) } as Report;
  for (const href of [reportHref("/analisis-comercial", params), accountHref("/cuentas", params), exportHref(params, report)]) {
    assert.equal(new URL(href, "http://synthetic.invalid").searchParams.get("ref_cliente"), "1");
    assert.equal(new URL(href, "http://synthetic.invalid").searchParams.get("ref_snapshot"), snapshot);
  }
  assert.match(roaHref(new URLSearchParams(refs), { trimestre: "2" }), /ref_cliente=1/);
  assert.doesNotMatch(reportHref("/", params, clearReferenceFilters()), /ref_/);
});
