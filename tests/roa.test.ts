import assert from "node:assert/strict";
import test from "node:test";
import { parseRoaParameters, parseRoaRatePublication } from "../src/lib/roa/contracts.ts";
import { queryQuarterlyRoa, roaFailure } from "../src/lib/roa/server.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

const parse = (query: string) => parseRoaParameters(new URLSearchParams(query));
const uuid = "20000000-0000-0000-0000-000000000001";
test("ROA: trimestre y filtros combinados sin reinterpretar importes", () => {
  const params = parse(`anio=2026&trimestre=1&custodio=${uuid}&equipo=${uuid}&comercial=${uuid}&cliente=${uuid}&cuenta=${uuid}&servicio=Advisory&agrupar=team&limite=250`);
  assert.deepEqual(params, {
    report_year: 2026, report_quarter: 1, custodian: uuid, team: uuid, advisor: uuid, client: uuid, account: uuid,
    service_filter: "Advisory", group_by: "team", page_size: 250, page_offset: 0, expected_revision: null,
  });
  assert.equal(parse("anio=9998&trimestre=4").page_size, 25);
  assert.equal(parse("anio=1900&trimestre=1&servicio=Brokerage").report_year, 1900);
  assert.equal(parse(`anio=2026&trimestre=2&offset=25&revision=${"a".repeat(32)}`).page_offset, 25);
});
test("ROA: rechaza filtros ambiguos, rangos, servicio no acreditado y páginas sin revisión", () => {
  for (const query of ["", "anio=2026", "anio=1899&trimestre=1", "anio=9999&trimestre=1", "anio=2026&trimestre=0",
    "anio=2026&trimestre=5", "anio=2026.1&trimestre=1", "anio=2e3&trimestre=1", "anio=2026&trimestre=1&anio=2025",
    ...["desde=2026-01", "servicio=advisory", "servicio=", "role=admin", "agrupar=unknown", "cuenta=00123", "cliente=", "limite=0", "limite=251", "offset=25", "offset=-1", "revision=xyz"].map(q => `anio=2026&trimestre=1&${q}`)])
    assert.throws(() => parse(query), query);
});
test("ROA: publicación requiere fuente, revisión explícita y evidencia; no recibe tasas calculadas en cliente", () => {
  const input = { request_id: uuid, source_event_id: uuid, expected_rate_id: null, evidence: "SINTÉTICO: tasa comparable con Payout broker durante Q1." };
  assert.deepEqual(parseRoaRatePublication(input), input);
  for (const invalid of [null, [], {}, { ...input, annual_rate: 0.005 }, { ...input, expected_rate_id: undefined },
    { ...input, evidence: " " }, { ...input, request_id: "x" }, { ...input, source_event_id: "x" },
    { ...input, expected_rate_id: "x" }, { ...input, evidence: "a".repeat(10001) }]) assert.throws(() => parseRoaRatePublication(invalid));
});
test("ROA: adaptador usa la RPC independiente y preserva texto/null y fallos", async () => {
  const parameters = parse("anio=2026&trimestre=1");
  const report = { total: { roa_percent: "0.400000000000000000001", advisory_difference_pp: null } };
  const client = { rpc: async (name: string, input: unknown) => {
    assert.equal(name, "quarterly_roa_report_ref"); assert.deepEqual(input, { ...parameters, reference_filters: {} });
    return { data: report, error: null };
  } } as unknown as SupabaseClient;
  assert.deepEqual(await queryQuarterlyRoa(client, parameters), { data: report, error: null });
  for (const [code, status] of [["40001", 409], ["42501", 403], ["22023", 400], ["22P02", 400], ["57014", 504], ["XX000", 503]] as const)
    assert.equal(roaFailure(code).status, status);
});
