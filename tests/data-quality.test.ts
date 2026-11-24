import assert from "node:assert/strict";
import test from "node:test";
import { parseQualityFilters,parseQualityAction,qualityHref } from "../src/lib/quality/contracts.ts";
import { qualityFailure } from "../src/lib/quality/server.ts";
const id="10000000-0000-0000-0000-000000000001",revision="a".repeat(32);
test("calidad: filtros AND, rango, fuente y custodio explícitos",()=>{
 assert.deepEqual(parseQualityFilters(new URLSearchParams()),{mode:"issues",offset:0});
 const f=parseQualityFilters(new URLSearchParams("desde=2026-01&hasta=2026-03&fuente=revenue&custodio="+id+"&problema=unresolved&vista=imports"));
 assert.deepEqual(f,{mode:"imports",offset:0,from:"2026-01-01",to:"2026-03-01",source:"revenue",custodian:id,issue:"unresolved"});
 assert.equal(parseQualityFilters(new URLSearchParams("custodio=sin_custodio")).custodian,"sin_custodio");
});
test("calidad: rechaza filtros desconocidos/repetidos, períodos ambiguos y páginas sin revisión",()=>{
 for(const q of ["extra=x","fuente=aum&fuente=revenue","desde=2026-1","desde=2026-13","desde=2026-03&hasta=2026-02","custodio=nombre","fuente=__proto__","problema=desconocido","offset=1","offset=-1","offset=1.5","revision=bad","vista=otro"])
  assert.throws(()=>parseQualityFilters(new URLSearchParams(q)),q);
 assert.equal(parseQualityFilters(new URLSearchParams("offset=25&revision="+revision)).offset,25);
});
test("calidad: navegación conserva filtros y reinicia página/revisión al cambiar vista",()=>{
 const f=parseQualityFilters(new URLSearchParams("fuente=master&custodio="+id+"&desde=2023-01&hasta=2026-12&problema=missing_rate&offset=25&revision="+revision));
 const next=new URL(qualityHref(f,{offset:50}),"https://synthetic.invalid");
 assert.equal(next.searchParams.get("fuente"),"master"); assert.equal(next.searchParams.get("offset"),"50");assert.equal(next.searchParams.get("revision"),revision);
 const reset=new URL(qualityHref(f,{mode:"audit",offset:0,revision:undefined}),"https://synthetic.invalid");
 assert.equal(reset.searchParams.get("custodio"),id);assert.equal(reset.searchParams.get("hasta"),"2026-12");assert.equal(reset.searchParams.get("problema"),"missing_rate");
 assert.equal(reset.searchParams.has("offset"),false);assert.equal(reset.searchParams.has("revision"),false);
});
test("calidad: preview y aplicación requieren evidencia y confirmación vinculada a revisión",()=>{
 const base={batch_id:id,row_id:id,evidence:"  SINTETICO equivalencia acreditada  "};
 assert.deepEqual(parseQualityAction(base),{batch_id:id,row_id:id,evidence:"SINTETICO equivalencia acreditada",expected_revision:null});
 assert.equal(parseQualityAction({...base,revision,confirm:true}).expected_revision,revision);
 for(const value of [null,[],{...base,evidence:"x"},{...base,row_id:"nombre"},{...base,revision},{...base,revision,confirm:"true"},{...base,confirm:true},{...base,account_id:id},{...base,revision,confirm:true,amount:"1"}])
  assert.throws(()=>parseQualityAction(value));
});
test("calidad: errores distinguen revisión, permiso, timeout e indisponibilidad sin SQL privado",()=>{
 assert.equal(qualityFailure("40001").status,409);assert.equal(qualityFailure("42501").status,403);
 assert.equal(qualityFailure("57014").status,504);assert.equal(qualityFailure("XX000").status,503);
 assert.ok(!qualityFailure("SYNTHETIC PRIVATE ERROR").message.includes("PRIVATE"));
});
