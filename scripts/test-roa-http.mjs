import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Next real → transporte Auth/PostgREST sintético → PostgreSQL real efímero.
export async function verifyRoa({ request, appOrigin, sql }) {
  const path = '/api/rentabilidad?anio=2026&trimestre=1&cuenta=20000000-0000-0000-0000-000000000001';
  assert.equal((await fetch(appOrigin + path, { redirect: 'manual' })).status, 401);
  let response = await request(path);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  const reader = await response.json();
  assert.equal(reader.total.calculation_status, 'incomplete');
  assert.equal(reader.total.roa_percent, null);
  assert.equal(reader.total.revenue_quarter_usd, '22');
  assert.equal(reader.months.length, 3);
  assert.equal(reader.assessment_basis, 'observed_only_provisional');
  assert.deepEqual(await (await request(path, true)).json(), reader);
  assert.equal((await request('/api/rentabilidad?anio=2026&trimestre=5')).status, 400);
  assert.equal((await request(path + '&cuenta=duplicado')).status, 400);
  for (const format of ['csv', 'csv-completo']) {
    const rejected = await request(path + '&formato=' + format);
    assert.equal(rejected.status, 400, 'ROA no ofrece una exportación parcial ni reutiliza CSV de cierre');
    assert.match(rejected.headers.get('content-type'), /application\/json/);
    assert.equal(rejected.headers.has('content-disposition'), false);
  }
  assert.equal((await request(path + '&revision=' + 'a'.repeat(32))).status, 409);
  const screen = path.replace('/api/rentabilidad', '/rentabilidad');
  for (const admin of [false, true]) {
    const html = await (await request(screen, admin)).text();
    assert.ok(html.includes('Rentabilidad / ROA') && html.includes('Evolución trimestral'));
    assert.ok(html.includes('USD 22') && html.includes('Cobertura incompleta'));
    assert.ok(html.includes('cálculo provisional sobre cobertura observada'));
    assert.ok(html.includes('Tres meses del conjunto filtrado') && html.includes('CSV no disponible'));
    assert.ok(!html.includes('SECRETO SINTETICO') && !html.includes('SINTETICO.csv') && !html.includes('source_event_id'));
    assert.ok(!html.includes('name="source_event_id"'), 'no hay publicación administrativa en la pantalla de lectura');
  }
  const noPeriod = await (await request('/rentabilidad')).text();
  assert.ok(noPeriod.includes('Elegí un año y trimestre') && !noPeriod.includes('Desglose trimestral'));
  assert.ok((await (await request('/rentabilidad?anio=2026&trimestre=9')).text()).includes('Revisá los filtros'));
  assert.ok((await (await request(screen + '&revision=' + 'a'.repeat(32))).text()).includes('Los datos cambiaron'));
  const empty = await (await request('/rentabilidad?anio=1900&trimestre=1')).text();
  assert.ok(empty.includes('Sin datos publicados para estos filtros'));
  assert.ok(empty.includes('sin filas en esta página'), 'página vacía no anuncia una primera fila inexistente');
  const open = await (await request('/rentabilidad?anio=9998&trimestre=4')).text();
  assert.ok(open.includes('Trimestre abierto'));
  assert.equal((await fetch(appOrigin + '/rentabilidad', { redirect: 'manual' })).status, 307);
  sql(`set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
    update app_private.user_profiles set enabled=false where id='00000000-0000-0000-0000-000000000002';`);
  try {
    const denied = await request(screen);
    assert.equal(denied.status, 307); assert.equal(denied.headers.get('location'), '/sin-acceso');
    assert.equal((await request(path)).status, 403);
  } finally {
    sql(`set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
      update app_private.user_profiles set enabled=true where id='00000000-0000-0000-0000-000000000002';`);
  }
  sql(`update auth.sessions set not_after=now()-interval '1 minute' where id='00000000-0000-0000-0000-000000000002';`);
  try {
    const denied = await request(screen);
    assert.equal(denied.status, 307); assert.equal(denied.headers.get('location'), '/sin-acceso');
    assert.equal((await request(path)).status, 403);
  } finally {
    sql(`update auth.sessions set not_after=null where id='00000000-0000-0000-0000-000000000002';`);
  }
  const post = (input, admin = true, origin = appOrigin) => request('/api/rentabilidad/tasas', admin, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  const sourceId = randomUUID(), obligation = randomUUID();
  const input = { request_id: randomUUID(), source_event_id: sourceId, expected_rate_id: null, evidence: 'SINTETICO: fee anual comparable con Payout broker todo Q1' };
  assert.equal((await post(input, false)).status, 403);
  assert.equal((await post(input, true, 'https://synthetic.invalid')).status, 403);
  assert.equal((await post({ ...input, annual_rate: 0.005 })).status, 400);
  assert.equal((await post(input)).status, 400); // No existe evento verificado.
  sql(`set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
    update app_private.accounts set service='Advisory' where id='20000000-0000-0000-0000-000000000001';`);
  const original = { Broker: 'SINTETICO', ACCOUNT: '000001', IP: null, 'IP Des': null, NAME: 'SINTETICO',
    'Owner Name payout': 'SINTETICO ROA', 'Fee type': 'Advisory', 'Adv Fee / Retro': '0.5%', Status: 'SINTETICO',
    Balance: '100000', 'Gross anua USD': null, 'Net annual USD': null, 'Payout final REP': null, 'Final REP': null };
  const expected = { account_id: '20000000-0000-0000-0000-000000000001', custodian_id: '10000000-0000-0000-0000-000000000001',
    quarter: '2026-01-01', cutoff: '2025-12-31', cutoff_evidence: 'SINTETICO Q1', broker: 'SINTETICO', owner: 'SINTETICO ROA',
    fee_type: 'Advisory', basis: 'gross', component_key: 'roa-http', balance: '100000', annual_rate: '0.005',
    rate_evidence_status: 'confirmed_for_quarter', rate_evidence: 'SINTETICO Q1 completo', fee_rule: 'balance_annual_div4_v1',
    fee_rule_evidence: 'SINTETICO', eligibility_confirmed: true, source_file: 'SINTETICO.xlsx', source_sheet: 'SINTETICO', source_row: 1,
    file_sha256: 'a'.repeat(64), original_cells: original, balance_header: 'Balance', normalization_evidence: 'SINTETICO proporción anual',
    account_evidence: 'SINTETICO UUID/custodio', reason: 'SINTETICO prueba HTTP ROA' };
  response = await request('/api/comisiones', true, { method: 'POST', headers: { Origin: appOrigin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: sourceId, operation: 'expected', target_id: obligation, input: expected }) });
  assert.equal(response.status, 200);
  assert.equal((await post(input)).status, 200);
  assert.equal((await post(input)).status, 200);
  assert.equal((await post({ ...input, request_id: randomUUID() })).status, 409);
  response = await request(path);
  const after = await response.json();
  assert.notEqual(after.revision, reader.revision);
  assert.equal(after.total.advisory_fee_status, 'insufficient_coverage'); // Falta AUM marzo; sin tasa ponderada inventada.
  assert.equal(after.total.advisory_difference_pp, null);
  assert.ok(!JSON.stringify(after).includes(input.evidence));
  assert.ok(!JSON.stringify(after).includes('source_event_id'));
  assert.equal((await request(path + '&revision=' + reader.revision)).status, 409);
  sql(`set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
    update app_private.accounts set service='Servicio SINTETICO' where id='20000000-0000-0000-0000-000000000001';`);
  console.log('OK ROA HTTP: API real, filtros, revisión, cobertura, roles, origen, publicación idempotente y sin originales.');
}
