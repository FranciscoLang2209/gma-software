import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Next real → transporte Auth/PostgREST sintético → PostgreSQL real local.
export async function verifyCommissions({ request, appOrigin, sql }) {
  assert.equal((await request('/api/comisiones')).status, 403);
  const readerPage = await (await request('/comisiones')).text();
  assert.ok(readerPage.includes('/sin-acceso') && !readerPage.includes('Cobertura del conjunto filtrado'));
  const expectedId = randomUUID(), obligation = randomUUID();
  const original = { Broker: 'Broker SINTETICO', ACCOUNT: '000001', IP: null, 'IP Des': null, NAME: 'SINTETICO',
    'Owner Name payout': 'Beneficiario SINTETICO', 'Fee type': 'Advisory SINTETICO', 'Adv Fee / Retro': '0.25%',
    Status: 'SINTETICO', 'Balance SINTETICO': '3200', 'Gross anua USD': '8', 'Net annual USD': null, 'Payout final REP': null, 'Final REP': null };
  const input = { account_id: '20000000-0000-0000-0000-000000000001', custodian_id: '10000000-0000-0000-0000-000000000001',
    quarter: '2026-01-01', cutoff: '2025-12-31', cutoff_evidence: 'Cierre previo aplicable confirmado SINTETICO',
    broker: original.Broker, owner: original['Owner Name payout'], fee_type: original['Fee type'], basis: 'gross',
    component_key: 'base', balance: '3200', annual_rate: '0.0025', rate_evidence_status: 'confirmed_for_quarter',
    rate_evidence: 'Archivo aplicable Q1 SINTETICO', fee_rule: 'balance_annual_div4_v1', fee_rule_evidence: 'Regla por tipo SINTETICO',
    eligibility_confirmed: true, source_file: 'SINTETICO.xlsx', source_sheet: 'SINTETICO', source_row: 1,
    file_sha256: 'a'.repeat(64), original_cells: original, balance_header: 'Balance SINTETICO',
    normalization_evidence: 'Punto decimal USD; 0.25% equivale a 0.0025 SINTETICO', account_evidence: 'Alias explícito SINTETICO', reason: 'Revisión SINTETICA',
    excel_checks: [{ header: 'Gross anua USD', value: '8', basis: 'gross', periodicity: 'annual', evidence: 'Bruto anual SINTETICO' }] };
  const command = (request_id, operation, target_id, input, origin = appOrigin) => request('/api/comisiones', true, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id, operation, target_id, input }),
  });
  assert.equal((await command(expectedId, 'expected', obligation, input, 'https://synthetic.invalid')).status, 403);
  let response = await command(expectedId, 'expected', obligation, input);
  assert.equal(response.status, 200); assert.equal((await response.json()).result.expected_quarterly, '2.000000');
  assert.equal((await command(expectedId, 'expected', obligation, input)).status, 200);
  const entry = JSON.parse(sql(`select json_build_object('id',id,'amount',payout_broker_usd::text,'source',payout_broker_original) from app_private.revenue_current where account_id='20000000-0000-0000-0000-000000000001' and period='2026-01-01' order by payout_broker_usd limit 1;`).trim());
  const receiptId = randomUUID();
  response = await command(receiptId, 'receipt', entry.id, { quarter: input.quarter, broker: input.broker, owner: input.owner,
    fee_type: input.fee_type, basis: input.basis, metric: 'Payout broker', amount: entry.amount, source_value: entry.source,
    received_confirmed: true, evidence: 'Cobro bruto confirmado SINTETICO', period_evidence: 'Devengo Q1 SINTETICO',
    normalization_evidence: 'Decimal canónico USD SINTETICO', reason: 'Clasificación SINTETICA' });
  assert.equal(response.status, 200);
  response = await command(randomUUID(), 'reconcile', obligation, { expected_id: expectedId, receipt_ids: [receiptId], review_complete: true, reason: 'Comparación SINTETICA' });
  assert.equal(response.status, 200); assert.equal((await response.json()).result.status, 'matched');
  const report = await (await request('/api/comisiones?year=2026&quarter=1&status=matched', true)).json();
  assert.equal(report.coverage.comparable, 1); assert.equal(report.comparable_totals[0].expected, '2.000000');
  const page = await (await request('/comisiones?year=2026&quarter=1&vista=cuentas', true)).text();
  assert.ok(page.includes('Beneficiario SINTETICO') && page.includes('Matched') && page.includes('2025-12-31'));
  assert.equal((await request('/api/comisiones?quarter=9', true)).status, 400);
  assert.equal((await request('/api/comisiones?formato=csv&vista=cuentas')).status, 403);
  const dashboardUrl = '/api/comisiones?dashboard=1&year=2026&quarter=1&basis=gross';
  const dashboard = await (await request(dashboardUrl, true)).json();
  assert.equal(dashboard.summary[0].actual, '2');
  assert.equal(dashboard.summary[0].expected, '2.000000');
  assert.equal(dashboard.rows.find(row => row.obligation_id === obligation).account, '000001');
  for (const view of ['resumen', 'representantes', 'cuentas', 'conciliaciones']) {
    const screen = await (await request(`/comisiones?year=2026&quarter=1&vista=${view}`, true)).text();
    assert.ok(screen.includes('Exportar') && screen.includes('CSV completo') && !screen.includes('No se pudo consultar Comisiones'), view);
    const csvResponse = await request(`/api/comisiones?formato=csv&vista=${view}&year=2026&quarter=1&basis=gross&revision=${dashboard.revision}`, true);
    assert.equal(csvResponse.status, 200);
    assert.ok(csvResponse.headers.get('cache-control').includes('no-store'));
    const csv = await csvResponse.text();
    assert.ok(csv.includes('000001') && csv.includes('SINTETICO.xlsx') && csv.includes('receipt_evidence') && csv.includes('Cobro bruto confirmado SINTETICO'));
  }
  const detail = await (await request(`/comisiones?vista=conciliaciones&detalle=${obligation}&year=2026&quarter=1`, true)).text();
  assert.ok(detail.includes('Guardar revisión auditada') && detail.includes('Revisar correspondencias'));
  // Más de una página: los totales y el CSV mantienen toda la población.
  for (let i = 0; i < 26; i++) {
    const owner = `Beneficiario SINTETICO ${String(i).padStart(2, '0')}`;
    const response = await command(randomUUID(), 'expected', randomUUID(), { ...input, owner,
      original_cells: { ...original, 'Owner Name payout': owner }, reason: 'Componente independiente por beneficiario SINTETICO' });
    assert.equal(response.status, 200);
  }
  const expanded = await (await request(dashboardUrl, true)).json();
  assert.equal(expanded.summary[0].expected, '54.000000');
  assert.equal(expanded.summary[0].comparable_expected, '2.000000');
  assert.equal(expanded.summary[0].actual, '2');
  assert.equal(expanded.summary[0].reconciled_accounts, 1);
  assert.equal(expanded.summary[0].pending, 26);
  assert.equal(expanded.summary[0].balance, null); // No multiplicar el balance repetido.
  const secondPage = await (await request('/comisiones?vista=representantes&year=2026&quarter=1&basis=gross&page=2', true)).text();
  assert.ok(secondPage.includes('26–27 de 27') && secondPage.includes('Anterior'));
  assert.equal((await request(`/api/comisiones?formato=csv&year=2026&quarter=1&basis=gross&revision=${dashboard.revision}`, true)).status, 409);
  const fullCsv = await (await request('/api/comisiones?formato=csv&vista=representantes&year=2026&quarter=1&basis=gross', true)).text();
  assert.ok(fullCsv.includes('Beneficiario SINTETICO 25') && fullCsv.includes('Beneficiario SINTETICO 00'));
  assert.equal((await request('/api/comisiones?dashboard=1&basis=invalid', true)).status, 400);
  assert.equal((await request('/api/comisiones?formato=csv&vista=constructor', true)).status, 400);
  // Una corrección conserva historia e invalida la comparación hasta revisión explícita.
  const correction = await command(randomUUID(), 'expected', obligation, { ...input, balance: '6400', previous_id: expectedId });
  assert.equal(correction.status, 200);
  const correctedDashboard = await (await request(dashboardUrl, true)).json();
  const correctedRow = correctedDashboard.rows.find(row => row.obligation_id === obligation);
  assert.equal(correctedRow.status, 'pending'); assert.equal(correctedRow.actual_received, null);
  assert.equal(sql(`select result->>'expected_quarterly' from app_private.commission_events where id='${expectedId}'`).trim(), '2.000000');
  console.log('OK: comisiones HTTP, origen, lector, cálculo, Excel, retry, clasificación, matched, cuatro vistas, CSV completo, revisión obsoleta, corrección/historia y bandeja SSR.');
}
