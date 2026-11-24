import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";

export async function verifyReferenceFilters({ request, sql, appOrigin, cookies }) {
  // Foto SINTÉTICA sembrada solo en el clúster temporal del runner HTTP.
  sql(`insert into app_private.import_uploads(id,file_name,file_hash,file_size,storage_object_path,options,manifest,created_by)
    values('91000000-0000-0000-0000-000000000001','SINTETICO.xlsx',repeat('a',64),1,'SINTETICO','{}','{}','00000000-0000-0000-0000-000000000001');
    insert into app_private.reference_snapshots(id,upload_id,file_hash,payload_hash,source_sheet,source_uploader,approval_evidence)
    values('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001',repeat('a',64),'SINTETICO','SINTETICO','00000000-0000-0000-0000-000000000001','SINTETICO: foto revisada');
    insert into app_private.reference_snapshot_rows(snapshot_id,source_row,account_id,custodian_id,client_label,advisor_label,team_label,group_error)
    values('92000000-0000-0000-0000-000000000001',1,'20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Cliente REF SINTETICO','Owner REF SINTETICO','Equipo REF SINTETICO',false);
    insert into app_private.reference_snapshot_head values(true,'92000000-0000-0000-0000-000000000001') on conflict(singleton) do update set snapshot_id=excluded.snapshot_id;`);
  const range = "desde=2026-01&hasta=2026-02", ref = "ref_snapshot=92000000-0000-0000-0000-000000000001&ref_cliente=1";
  const response = await request(`/api/consultas?${range}&${ref}`);
  assert.equal(response.status, 200);
  const report = await response.json();
  assert.equal(report.total.aum_usd, "120"); assert.equal(report.total.revenue_usd, "22");
  const csv = await (await request(`/api/consultas?${range}&${ref}&formato=csv-completo&revision=${report.revision}`)).text();
  assert.ok(csv.includes('filtro_REF') && csv.includes('sin vigencia histórica'));
  assert.ok(!csv.includes('SECRETO SINTETICO'));
  for (const path of ["/", "/analisis-comercial", "/cuentas", "/cuentas/20000000-0000-0000-0000-000000000001"]) {
    const html = await (await request(`${path}?${range}&${ref}`)).text();
    assert.ok(html.includes('Referencias de REF') && html.includes('Cliente REF SINTETICO'));
    assert.ok(html.includes('USD 120') && html.includes('USD 22'));
  }
  const roa = await (await request(`/api/rentabilidad?anio=2026&trimestre=1&${ref}`)).json();
  assert.equal(roa.total.revenue_quarter_usd, "22");
  assert.equal(roa.total.calculation_status, "incomplete");
  assert.equal((await request(`/api/consultas?${range}&ref_cliente=1`)).status, 400);
  assert.equal((await request(`/api/consultas?${range}&${ref.replace('ref_cliente=1', 'ref_cliente=999')}`)).status, 400);
  const stale = ref.replace('000000000001&', '000000000002&');
  assert.equal((await request(`/api/consultas?${range}&${stale}`)).status, 409);
  const reset = await (await request(`/?${range}&${stale}`)).text();
  assert.ok(reset.includes('limpiar selección REF'));
  if (process.env.APP_PAPA_PLAYWRIGHT) {
    const { chromium } = await import(process.env.APP_PAPA_PLAYWRIGHT);
    const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
    try {
      for (const width of [1440, 390]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 } });
        await context.addCookies(cookies.map(c => ({ name: c.name, value: c.value, url: appOrigin })));
        const page = await context.newPage(), errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`${appOrigin}/?${range}`);
        await page.getByRole('combobox', { name: 'Cliente REF', exact: true }).click();
        await page.getByRole('option', { name: 'Cliente REF SINTETICO', exact: true }).click();
        await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
        await page.waitForURL(/ref_cliente=1/);
        assert.equal(new URL(page.url()).searchParams.get('ref_snapshot'), '92000000-0000-0000-0000-000000000001');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `/tmp/gma-phase5-ref-${width}.png` });
        writeFileSync(`/tmp/gma-phase5-ref-${width}.txt`, await page.locator('body').innerText());
        assert.equal(new URL(page.url()).searchParams.get('desde'), '2026-01');
        assert.equal(new URL(page.url()).searchParams.get('hasta'), '2026-02');
        assert.ok((await page.locator('body').innerText()).includes('USD 120'));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        assert.deepEqual(errors, []);
        if (!process.argv.includes('--reference-only')) {
          await page.goto(`${appOrigin}/?desde=2028-01&hasta=2028-02`);
          await page.locator('details.advanced-filters > summary').click();
          await page.getByRole('searchbox', { name: 'Buscar Cuenta', exact: true }).fill('00M250');
          await page.getByRole('combobox', { name: 'Cuenta', exact: true }).click();
          await page.getByRole('option', { name: '00M250', exact: true }).click();
          await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
          await page.waitForURL(/cuenta=[a-f0-9-]{36}/);
          await page.waitForLoadState('networkidle');
          const account = new URL(page.url()).searchParams.get('cuenta');
          const financial = await context.request.get(`${appOrigin}/api/consultas?desde=2028-01&hasta=2028-02&cuenta=${account}`);
          assert.equal(financial.status(), 200);
          assert.equal((await financial.json()).total.revenue_usd, '0.01');
          assert.deepEqual(errors, []);
        }
        await context.close();
      }
    } finally { await browser.close(); }
    console.log('OK REF navegador: selección real, envío, UUID/snapshot, 1440/390 px sin errores ni desbordes; búsqueda completa en recorrido integral.');
  }
  console.log('OK REF HTTP: filtros, Cuentas/ROA, CSV, estados inválidos/obsoletos y selección separada.');
}
