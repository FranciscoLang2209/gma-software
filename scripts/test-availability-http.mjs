// SINTÉTICO: servidor Next y PostgreSQL locales, con transporte Auth del arnés.
import assert from "node:assert/strict";
import {writeFileSync} from "node:fs";
export async function verifyAvailability({request}) {
 const range="desde=2026-01&hasta=2026-02";
 const query=async suffix=>{const r=await request("/api/consultas?"+range+suffix);assert.equal(r.status,200);return r.json();};
 const base=await query("");assert.ok(base.availability.period_rows>0);
 const filtered=await query("&servicio=NINGUNO_SINTETICO");
 assert.deepEqual(filtered.availability,base.availability);assert.equal(filtered.total.revenue_usd,null);
 const html=await (await request("/?"+range+"&servicio=NINGUNO_SINTETICO")).text();
 assert.ok(html.includes("Los registros del período no cumplen estos filtros"));
 assert.ok(html.includes("sin cliente canónico")&&html.includes("sin servicio clasificado"));
 assert.ok(html.includes("Quitar filtros y conservar el período"));
 assert.ok(!html.includes('href="/calidad-datos"')&&!html.includes("SECRETO SINTETICO"));
 const admin=await (await request("/?"+range+"&servicio=NINGUNO_SINTETICO",true)).text();
 assert.ok(admin.includes('href="/calidad-datos"'));
 const absent=await (await request("/?desde=2030-01&hasta=2030-02")).text();
 assert.ok(absent.includes("No existen registros publicados para este período")&&!absent.includes("Los registros del período no cumplen"));
 const missing=await (await request("/?"+range+"&cuenta=20000000-0000-0000-0000-000000000005")).text();
 assert.ok(missing.includes("Hay registros sin importe: la información es insuficiente"));
 const incomplete=await (await request("/?desde=2026-01&hasta=2026-03&cuenta=20000000-0000-0000-0000-000000000001")).text();
 assert.ok(incomplete.includes("El período tiene cobertura incompleta")&&!incomplete.includes("No existen registros publicados para este período"));
 const directory=await (await request("/cuentas?"+range+"&buscar=NINGUNO_SINTETICO")).text();
 assert.ok(directory.includes("No hay cuentas que cumplan esta búsqueda y sus filtros"));
 const groups=await query("&agrupar=custodian");
 const page=await (await request("/analisis-comercial?"+range+"&agrupar=custodian&offset=999&revision="+groups.revision)).text();
 assert.ok(page.includes("Esta página no tiene filas")&&!page.includes("No existen registros publicados para este período"));
 const roa=await (await request("/rentabilidad?anio=2026&trimestre=1&servicio=Brokerage")).text();
 if(!roa.includes("Los registros del período no cumplen estos filtros"))writeFileSync("/tmp/gma-phase9-roa-failure.html",roa);
 assert.ok(roa.includes("Los registros del período no cumplen estos filtros"));
 const commission=await (await request("/comisiones?year=2026&quarter=1&owner=NINGUNO_SINTETICO",true)).text();
 assert.ok(commission.includes("Los registros del período no cumplen estos filtros"));
 const noCommission=await (await request("/comisiones?year=2030&quarter=1",true)).text();
 assert.ok(noCommission.includes("No existen registros publicados para este período"));
 console.log("OK vacíos HTTP: período/filtros, relaciones pendientes publicadas, importes nulos, cierre faltante, búsqueda/página, ROA/Comisiones y administrador/lector.");
}
