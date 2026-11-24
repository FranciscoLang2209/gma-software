// SINTÉTICO: Next y PostgreSQL locales; transportes Auth/PostgREST/Storage del arnés.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { csv,revenueRow } from "../tests/fixtures/imports/build.ts";
export async function verifyDataQuality({request,sql,asRole,adminSub,appOrigin}) {
 const json=async(response,status=200)=>{const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));return data;};
 const post=(path,input,origin=appOrigin,admin=true)=>request(path,admin,{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(input)});
 const facts=()=>sql("select md5(coalesce(jsonb_agg(to_jsonb(f) order by source,id)::text,'[]')) from (select 'aum' source,id,value_usd amount from app_private.aum_current union all select 'revenue',id,payout_broker_usd from app_private.revenue_current)f;").trim();
 const before=facts();
 const custodian="10000000-0000-0000-0000-000000000001",account="20000000-0000-0000-0000-000000000001";
 assert.equal((await request("/api/calidad-datos")).status,403);
 const forbidden=await request("/calidad-datos");
 if(forbidden.status===307)assert.match(forbidden.headers.get("location"),/sin-acceso/);
 else {assert.equal(forbidden.status,200);const html=await forbidden.text();assert.match(html,/url=\/sin-acceso/);assert.ok(!html.includes("Relación técnica por fuente"));}
 assert.equal((await fetch(appOrigin+"/api/calidad-datos",{redirect:"manual"})).status,401);
 const stage=async(month,rows)=>{
  const options={source:"revenue",period:"2026-"+month+"-01",custodianId:custodian,custodianCode:"SYN1",sheet:"CSV",numericFormat:"dot",delimiter:","};
  const raw=csv("revenue",rows.map(([literal,amount])=>{const r=revenueRow(literal,amount,"SYN1");r[1]=String(Number(month));return r;}));
  const form=new FormData();form.set("file",new File([raw],"SINTETICO-QUALITY-PANEL.csv"));form.set("requestId",randomUUID());form.set("options",JSON.stringify(options));
  const {id}=await json(await request("/api/importaciones",true,{method:"POST",headers:{Origin:appOrigin},body:form}));
  await json(await post("/api/importaciones/"+id,{options}));
  const detail=await json(await request("/api/importaciones/"+id+"/gestion",true));
  return {id,rows:detail.rows};
 };
 const batch=await stage("06",[...Array.from({length:61},()=>["BULK-QUALITY","0.1"]),["OTHER-QUALITY","-0.05"],[" BULK-QUALITY ","0"]]);
 const first=batch.rows[0],second=batch.rows[1];
 const base={batch_id:batch.id,row_id:first.id,evidence:"SINTETICO: equivalencia revisada por lote, mismo ACCOUNT/custodio."};
 await json(await post("/api/calidad-datos",base),409);
 await json(await post("/api/importaciones/"+batch.id+"/gestion",{operation:"resolve",input:{row_id:first.id,custodian_id:custodian,account_id:account,evidence:"SINTETICO: alias acreditado individualmente."}}));
 const pending=await json(await request("/api/calidad-datos?fuente=revenue&problema=unresolved&desde=2026-06&hasta=2026-06",true));
 assert.equal(pending.row_count,62);assert.equal(pending.rows.length,25);
 assert.ok(pending.rows.every(r=>r.source==="revenue"&&r.stage==="preparation"));
 assert.ok(pending.rows.some(r=>r.candidates.some(c=>c.account_id===account)));
 const preview=await json(await post("/api/calidad-datos",base));assert.equal(preview.count,61);assert.equal(preview.literal,"BULK-QUALITY");
 await json(await post("/api/calidad-datos",{...base,revision:preview.revision}),400);
 await json(await post("/api/calidad-datos",{...base,revision:preview.revision,confirm:true},"https://evil.invalid"),403);
 await json(await post("/api/calidad-datos",{...base,revision:preview.revision,confirm:true},appOrigin,false),403);
 await json(await post("/api/importaciones/"+batch.id+"/gestion",{operation:"resolve",input:{row_id:second.id,custodian_id:custodian,account_id:account,evidence:"SINTETICO: cambió la revisión de esta fila."}}));
 await json(await post("/api/calidad-datos",{...base,revision:preview.revision,confirm:true}),409);
 const fresh=await json(await post("/api/calidad-datos",base));
 const applied=await json(await post("/api/calidad-datos",{...base,revision:fresh.revision,confirm:true}));assert.equal(applied.status,"applied");
 await json(await post("/api/calidad-datos",{...base,revision:fresh.revision,confirm:true}));
 const left=await json(await request("/api/calidad-datos?fuente=revenue&problema=unresolved&desde=2026-06&hasta=2026-06",true));assert.equal(left.row_count,2);
 const stale=await request("/api/calidad-datos?fuente=revenue&problema=unresolved&desde=2026-06&hasta=2026-06&offset=25&revision="+pending.revision,true);
 const staleData=await json(stale,409);assert.ok(!staleData.error.includes("SYNTHETIC PRIVATE"));
 for(const path of ["/api/calidad-datos?offset=25","/api/calidad-datos?fuente=aum&fuente=revenue","/api/calidad-datos?custodio=nombre","/api/calidad-datos?extra=x"])
  await json(await request(path,true),400);
 let history=await json(await request("/api/calidad-datos?vista=imports",true));
 if(history.row_count<=50) {
  sql(asRole(adminSub,"select public.begin_import(gen_random_uuid(),'revenue','2021-01-01','10000000-0000-0000-0000-000000000001','SINTETICO-HISTORY.csv',repeat('f',64),1,'{}') from generate_series(1,60)"));
  history=await json(await request("/api/calidad-datos?vista=imports",true));
 }
 assert.ok(history.row_count>50);
 const later=await json(await request("/api/calidad-datos?vista=imports&offset=50&revision="+history.revision,true));assert.equal(later.offset,50);assert.ok(later.rows.length>0);
 const audit=await json(await request("/api/calidad-datos?vista=audit",true));assert.ok(audit.row_count>0&&audit.rows[0].actor_id);
 sql("insert into app_private.audit_events(actor_id,action,entity_table,entity_id,after_data) values(:'actor'::uuid,'SINTETICO_PRECISION','aum_monthly',gen_random_uuid(),'{\"source\":\"aum\",\"value_usd\":10000000000000000000.123456789123456789}')",["-v","actor="+adminSub]);
 const precision=await json(await request("/api/calidad-datos?vista=audit&fuente=aum",true));
 assert.ok(precision.rows.some(r=>typeof r.after_data==="string"&&r.after_data.includes("10000000000000000000.123456789123456789")));
 assert.ok((await (await request("/calidad-datos?vista=audit&fuente=aum",true)).text()).includes("10000000000000000000.123456789123456789"),"HTML conserva dígitos de numeric sin parsearlos en JS");
 for(const path of ["/calidad-datos","/calidad-datos?vista=imports","/calidad-datos?vista=audit"]) {
  const response=await request(path,true);assert.equal(response.status,200);
  const html=await response.text();
  if(!html.includes("Relación técnica por fuente"))writeFileSync("/tmp/gma-phase8-ssr-"+(path.split("vista=")[1]??"issues")+".html",html);
  assert.ok(html.includes("Calidad de datos")&&html.includes("Relación técnica por fuente"),"SSR de Calidad: "+path);
 }
 const response=await request("/api/calidad-datos",true);assert.match(response.headers.get("cache-control"),/private, no-store/);
 assert.equal(facts(),before,"reportes, preview y equivalencias no alteran financieros");
 // Fixture adicional para verificar preview/confirmación mediante Chrome; aún sin resolver.
 await stage("08",[["BULK-QUALITY","0.1"],["BULK-QUALITY","0.1"],["BULK-QUALITY","-0.05"],["UI-UNMATCHED","0"]]);
 console.log("OK Calidad HTTP: admin/lector, filtros, originales/candidatos, historia >50, auditoría, preview/confirmación, 61 filas exactas, conflicto 409, retry y publicados intactos.");
}
