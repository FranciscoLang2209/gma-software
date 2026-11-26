import assert from "node:assert/strict";
import test from "node:test";
import { emptyNotice, reportNotice, roaNotice, feeReason } from "../src/lib/queries/availability.ts";
import type { Report } from "../src/lib/queries/contracts.ts";
import type { RoaReport,RoaMetrics } from "../src/lib/roa/contracts.ts";
const report=(extra:Partial<Report>={})=>({availability:{period_rows:2,accounts_without_client:1,unclassified_accounts:1},months:[{period:"2026-01-01",previous_period:"2025-12-01",aum_change_usd:null,aum_change_percent:null,revenue_change_usd:null,revenue_change_percent:null,aum_rows:1,revenue_rows:1}],coverage:[],total:{aum_rows:1,aum_values:1,revenue_rows:1,revenue_values:1,aum_missing_accounts:0,revenue_missing_account_months:0},...extra}) as Report;
test("disponibilidad: distingue período sin registros, filtros y diagnóstico ausente",()=>{
 assert.equal(emptyNotice({period_rows:0}).code,"no_period");
 assert.equal(emptyNotice({period_rows:1}).code,"no_matches");
 assert.equal(emptyNotice(undefined).code,"unverified");
 assert.equal(reportNotice(report({months:[]}))?.code,"no_matches");
 assert.equal(reportNotice(report({months:[],availability:{period_rows:0,accounts_without_client:0,unclassified_accounts:0}}))?.code,"no_period");
});
test("disponibilidad: conserva AUM anterior sin confundir un cierre faltante con período vacío",()=>{
 const r=report();r.total.aum_rows=0;r.total.aum_values=0;r.total.revenue_rows=0;r.total.revenue_values=0;r.months=[{...r.months[0],aum_rows:1,revenue_rows:0}];
 assert.equal(reportNotice(r)?.code,"incomplete");
});
test("disponibilidad: registros nulos, cobertura y cero acreditado son distintos",()=>{
 const r=report();r.total.aum_usd="0";r.total.revenue_usd="-0.05";
 assert.equal(reportNotice(r),null);
 r.total.revenue_values=0;assert.equal(reportNotice(r)?.code,"insufficient");
 r.total.revenue_values=1;r.coverage=[{published:false,period:"2026-01-01",source:"aum",custodian_id:"SINTETICO"}];assert.equal(reportNotice(r)?.code,"incomplete");
});
test("disponibilidad ROA: explica cada impedimento sin calcular ni modificar los importes",()=>{
 const r={availability:{period_rows:2},total:{calculation_status:"no_data"}} as RoaReport;
 assert.equal(roaNotice(r)?.code,"no_matches");
 for(const status of ["incomplete","zero_aum","negative_aum","open_quarter"] as const){r.total.calculation_status=status;assert.ok(roaNotice(r)?.message);}
 r.total.calculation_status="calculable";assert.equal(roaNotice(r),null);
});
test("Fee ausente: distingue tasas faltantes, fotos insuficientes y referencia obsoleta",()=>{
 const m={advisory_fee_status:"insufficient_coverage",missing_rate_account_months:1} as RoaMetrics;
 assert.match(feeReason(m),/Faltan tasas/);m.missing_rate_account_months=0;assert.match(feeReason(m),/Faltan fotos/);
 m.advisory_fee_status="obsolete";assert.match(feeReason(m),/obsoleta/);
 m.advisory_fee_status="not_applicable";assert.match(feeReason(m),/Sin población/);
 m.advisory_accounts=1;assert.match(feeReason(m),/Conjunto mixto/);
 m.advisory_fee_status="insufficient_coverage";m.calculation_status="open_quarter";assert.match(feeReason(m),/Trimestre abierto/);
});
