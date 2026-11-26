// SINTÉTICO y aislado: este runner sólo acepta el arnés PostgreSQL/Next local.
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

export async function verifyQualityBrowser({appOrigin,readerLogin,adminLogin}) {
 const app=new URL(appOrigin);
 assert.equal(app.hostname,"127.0.0.1");
 for(const url of [readerLogin,adminLogin])assert.equal(new URL(url).hostname,"127.0.0.1");
 const playwrightModule=process.env.GMA_PLAYWRIGHT_MODULE??"playwright-core";
 const {chromium}=await import(playwrightModule.startsWith("/")?pathToFileURL(playwrightModule).href:playwrightModule);
 const browser=await chromium.launch({headless:true,...(process.env.GMA_CHROME_EXECUTABLE?{executablePath:process.env.GMA_CHROME_EXECUTABLE}:{})});
 const artifacts=mkdtempSync(join(tmpdir(),"gma-quality-browser-")),errors=[],checked=[];
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:"es-AR"}),page=await context.newPage();
  page.on("pageerror",e=>errors.push({url:page.url(),message:e.message}));page.on("console",m=>{if(m.type()==="error")errors.push({url:page.url(),message:m.text()});});
  const range="desde=2026-01&hasta=2026-02";
  async function visit(path,heading,name) {
   await page.goto(appOrigin+path);
   try { await page.getByRole("heading",{name:heading,exact:true}).waitFor(); }
   catch(error) { writeFileSync(join(artifacts,name+"-failure.html"),await page.content());throw error; }
   await page.waitForLoadState("networkidle");
   assert.equal(await page.getByRole("heading",{name:"No pudimos completar la consulta",exact:true}).count(),0);
   for(const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"overflow "+name);
    await page.getByRole("heading",{name:heading,exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:join(artifacts,name+"-"+width+".png")});
   }
   checked.push(name);
  }
  await page.goto(readerLogin);
  await visit("/?"+range,"Resumen ejecutivo","reader-summary");
  await visit("/analisis-comercial?"+range,"Análisis comercial","reader-commercial");
  await visit("/cuentas?"+range,"Directorio de cuentas","reader-accounts");
  await visit("/cuentas/20000000-0000-0000-0000-000000000005?"+range,"Historia mensual y atribución del Revenue","reader-account");
  assert.equal(await page.getByText("Ver columnas originales",{exact:true}).count(),0);
  await visit("/rentabilidad?anio=2026&trimestre=1","Tres meses del conjunto filtrado","reader-roa");
  await visit("/?"+range+"&servicio=NINGUNO_SINTETICO","Los registros del período no cumplen estos filtros","reader-no-matches");
  assert.equal(await page.getByRole("link",{name:"Revisar relaciones y fuentes pendientes",exact:true}).count(),0);
  await page.getByRole("link",{name:"Quitar filtros y conservar el período",exact:true}).click();
  await page.waitForURL(url=>!url.searchParams.has("servicio"));
  await page.waitForLoadState("networkidle");
  assert.equal(new URL(page.url()).searchParams.get("desde"),"2026-01");
  assert.equal(new URL(page.url()).searchParams.has("servicio"),false);
  await visit("/?desde=2099-01&hasta=2099-02","No existen registros publicados para este período","reader-no-period");
  await visit("/?"+range+"&cuenta=20000000-0000-0000-0000-000000000005","Hay registros sin importe: la información es insuficiente","reader-null-amount");
  for(const path of ["/calidad-datos","/importaciones","/correspondencias","/comisiones"]) {
   await page.goto(appOrigin+path);await page.waitForURL(/sin-acceso/);
  }
  // Dos muestras API/SSR del antecedente intermitente, con un filtro excluyente estable.
  for(let i=0;i<2;i++) {
   const query="anio=2026&trimestre=1&cliente=eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
   const api=await page.request.get(appOrigin+"/api/rentabilidad?"+query),data=await api.json();
   assert.equal(api.status(),200);assert.equal(data.total.calculation_status,"no_data");assert.ok(data.availability.period_rows>0);
   const html=await (await page.request.get(appOrigin+"/rentabilidad?"+query)).text();
   if(!html.includes("Los registros del período no cumplen estos filtros"))writeFileSync(join(artifacts,"roa-failure.html"),html);
   assert.ok(html.includes("Los registros del período no cumplen estos filtros"));
  }
  await page.goto(adminLogin);
  await visit("/importaciones","Importaciones","admin-imports");
  await visit("/correspondencias","Elegir importación","admin-correspondences");
  await visit("/configuracion?entidad=accounts","Configuración","admin-configuration");
  await visit("/comisiones?year=2026&quarter=1","Resumen trimestral exacto","admin-commissions");
  await visit("/calidad-datos?fuente=manual","Relación técnica por fuente","admin-quality-empty");
  await visit("/calidad-datos?vista=audit","Historial de cambios","admin-audit");
  await page.getByText("Comparar anterior y posterior",{exact:true}).first().click();
  assert.ok(await page.locator("pre").first().isVisible());
  const fiscalBefore=await (await page.request.get(appOrigin+"/api/consultas?"+range)).json();
  await page.goto(appOrigin+"/calidad-datos?fuente=revenue&problema=unresolved&desde=2026-08&hasta=2026-08");
  const row=page.locator("article.resolution-row").filter({has:page.getByText("Comparar coincidencias exactas acreditadas (1)",{exact:true})}).first();
  await row.getByText("Aplicar una equivalencia acreditada a este ACCOUNT",{exact:true}).click();
  await row.getByLabel("Evidencia para todas las filas",{exact:true}).fill("SINTETICO QA final: mismo literal, custodio y lote; publicados conservados.");
  await row.getByRole("button",{name:"Preparar vista previa",exact:true}).click();
  await row.getByText("Anterior: 0 filas resueltas y 3 pendientes;",{exact:false}).waitFor();
  await row.getByLabel("Revisé literal, custodio, destino y todas las filas del alcance.",{exact:false}).check();
  await row.getByRole("button",{name:"Confirmar equivalencia en el lote",exact:true}).click();
  await row.getByText("Correspondencias guardadas con auditoría.",{exact:false}).waitFor();
  const fiscalAfter=await (await page.request.get(appOrigin+"/api/consultas?"+range)).json();
  assert.deepEqual(fiscalBefore.total,fiscalAfter.total);assert.deepEqual(fiscalBefore.months,fiscalAfter.months);
  writeFileSync(join(artifacts,"errors.json"),JSON.stringify(errors,null,2));
  assert.deepEqual(errors,[]);
  writeFileSync(join(artifacts,"result.json"),JSON.stringify({synthetic:true,checked,widths:[1440,390],errors,financialMetricsUnchanged:true},null,2));
  console.log("OK Chrome QA integral: "+checked.length+" vistas × 1440/390, roles, vacíos, historial, preview/confirmación y finanzas intactas. Artefactos sintéticos: "+artifacts);
 }finally{await browser.close();}
}
