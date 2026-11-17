-- Solo sintéticos: fixture con usuarios, cuentas y Revenue publicado.
\ir query-fixture.sql
create function pg_temp.expected_input(b text default '4000',rate text default '0.0025',q text default '2026-01-01',owner_name text default 'Beneficiario SINTETICO') returns jsonb language sql as $$
 select jsonb_build_object('account_id','20000000-0000-0000-0000-000000000001','custodian_id','10000000-0000-0000-0000-000000000001',
 'component_key','base','quarter',q,'cutoff',q,'cutoff_evidence','Fecha de foto SINTETICA acreditada para este trimestre','broker','Broker SINTETICO',
 'owner',owner_name,'fee_type','Advisory SINTETICO','basis','gross','balance',b,'annual_rate',rate,
 'rate_evidence_status','confirmed_for_quarter','rate_evidence','Archivo SINTETICO correspondiente al trimestre',
 'fee_rule','balance_annual_div4_v1','fee_rule_evidence','Tipo y base revisados SINTETICO','eligibility_confirmed',true,
 'source_file','SINTETICO-comisiones.xlsx','source_sheet','SINTETICO','source_row',1,'file_sha256',repeat('a',64),
 'balance_header','Balance SINTETICO','original_cells',jsonb_build_object('Balance SINTETICO',b,'Adv Fee / Retro',rate,
 'Owner Name payout',owner_name,'Broker','Broker SINTETICO','Fee type','Advisory SINTETICO','Gross anua USD','10','ACCOUNT','000001','IP',null,'IP Des',null,'NAME','SINTETICO','Status','SINTETICO','Net annual USD',null,'Payout final REP',null,'Final REP',null),
 'normalization_evidence','USD decimal punto, tasa en proporción SINTETICO','account_evidence','Equivalencia explícita por custodio SINTETICO','reason','Revisión SINTETICA');
$$;
create function pg_temp.receipt_input(entry uuid,owner_name text default 'Beneficiario SINTETICO') returns jsonb language sql as $$
 select jsonb_build_object('quarter','2026-01-01','basis','gross','broker','Broker SINTETICO','owner',owner_name,
 'fee_type','Advisory SINTETICO','metric','Payout broker','amount',r.payout_broker_usd::text,'source_value',r.payout_broker_original,
 'normalization_evidence','USD decimal punto y métrica bruta SINTETICO','received_confirmed',true,'evidence','Cobro y base bruta acreditados SINTETICO','period_evidence','Devengo Q1 SINTETICO','reason','Clasificación SINTETICA')
 from app_private.revenue_current r where r.id=entry;
$$;
set local role authenticated;
select pg_temp.expect_error($q$insert into app_private.commission_events(id,operation,target_id,input,result,created_by) values(gen_random_uuid(),'expected',gen_random_uuid(),'{}','{}',auth.uid())$q$,'42501');
select pg_temp.expect_error($q$update app_private.commission_events set input='{}'$q$,'42501');
select pg_temp.expect_error($q$delete from app_private.commission_events$q$,'42501');
select public.manage_commission('90000000-0000-0000-0000-000000000001','expected','91000000-0000-0000-0000-000000000001',pg_temp.expected_input()) e \gset
select pg_temp.assert_true((:'e'::jsonb->'result'->>'expected_quarterly')::numeric=2.5,'0.25% anual; dividido por cuatro');
select public.manage_commission('90000000-0000-0000-0000-000000000002','expected','91000000-0000-0000-0000-000000000002',pg_temp.expected_input('4000','0.005','2026-04-01')) e2 \gset
select pg_temp.assert_true((:'e2'::jsonb->'result'->>'expected_quarterly')::numeric=5,'0.5% Q2 independiente');
select public.manage_commission('90000000-0000-0000-0000-000000000003','expected','91000000-0000-0000-0000-000000000003',pg_temp.expected_input('4000','0.01','2026-07-01')) e3 \gset
select pg_temp.assert_true((:'e3'::jsonb->'result'->>'expected_quarterly')::numeric=10,'1% Q3 independiente');
select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input('0','0.01','2025-01-01')) zero \gset
select pg_temp.assert_true(:'zero'::jsonb->'result'->>'verified'='true' and (:'zero'::jsonb->'result'->>'expected_quarterly')::numeric=0,'cero es base válida');
select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input('-4000','0.01','2025-04-01')) negative \gset
select pg_temp.assert_true((:'negative'::jsonb->'result'->>'expected_quarterly')::numeric=-10,'ajustes negativos');
select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input(null,null,'2025-07-01')) missing \gset
select pg_temp.assert_true(:'missing'::jsonb->'result'->>'verified'='false' and :'missing'::jsonb->'result'->>'expected_quarterly' is null,'ausentes no son cero');
select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input('4000','0.01','2025-10-01')||'{"rate_evidence_status":"no_historical_evidence"}') historical \gset
select pg_temp.assert_true(:'historical'::jsonb->'result'->>'verified'='false','tasa sin evidencia no se verifica');
select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input('9007199254740993.123456789123456789123456789','0.002500000000000000000000000001','2024-01-01')) precise \gset
select pg_temp.assert_true((:'precise'::jsonb->'result'->>'expected_quarterly')::numeric=
 9007199254740993.123456789123456789123456789::numeric*0.002500000000000000000000000001::numeric*0.25,'decimales extensos exactos');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input()||'{"component_key":"invalid decimal","balance":1.2}')$q$,'22023');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input()||'{"component_key":"invalid rate","annual_rate":"NaN"}')$q$,'22023');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input() - 'cutoff')$q$,'22023');
select pg_temp.expect_error($q$select public.manage_commission('90000000-0000-0000-0000-000000000001','expected','91000000-0000-0000-0000-000000000001',pg_temp.expected_input('999'))$q$,'22023');
select public.manage_commission('90000000-0000-0000-0000-000000000001','expected','91000000-0000-0000-0000-000000000001',pg_temp.expected_input()) retry \gset
select pg_temp.assert_true(:'retry'::jsonb=:'e'::jsonb,'reimportación idempotente');
reset role;
select id rid,payout_broker_usd::text amount from app_private.revenue_current where account_id='20000000-0000-0000-0000-000000000001' and period='2026-01-01' order by payout_broker_usd limit 1 \gset
select id rid2 from app_private.revenue_current where account_id='20000000-0000-0000-0000-000000000001' and period='2026-01-01' order by payout_broker_usd offset 1 limit 1 \gset
set local role authenticated;
select public.manage_commission('92000000-0000-0000-0000-000000000001','receipt',:'rid',pg_temp.receipt_input(:'rid'));
select public.manage_commission('92000000-0000-0000-0000-000000000002','receipt',:'rid2',pg_temp.receipt_input(:'rid2'));
select pg_temp.assert_true(public.commission_report()->'coverage'->>'missing_expected'='2','cobros clasificados sin esperado y pendientes sin clasificación');
select public.manage_commission('93000000-0000-0000-0000-000000000001','reconcile','91000000-0000-0000-0000-000000000001',
 '{"expected_id":"90000000-0000-0000-0000-000000000001","receipt_ids":["92000000-0000-0000-0000-000000000001","92000000-0000-0000-0000-000000000002"],"review_complete":true,"reason":"Revisión SINTETICA"}') rec \gset
select pg_temp.assert_true(:'rec'::jsonb->'result'->>'status'='variance' and (:'rec'::jsonb->'result'->>'actual_received')::numeric=5
 and (:'rec'::jsonb->'result'->>'variance')::numeric=2.5 and (:'rec'::jsonb->'result'->>'variance_percentage')::numeric=100,'múltiples Revenue y diferencia');
select pg_temp.assert_true(public.commission_report('{"year":"2026","quarter":"1","broker":"Broker SINTETICO","owner":"Beneficiario SINTETICO","fee_type":"Advisory SINTETICO","status":"variance","min_absolute_variance":"2","min_absolute_percentage":"10"}')->>'row_count'='1','todos los filtros');
select pg_temp.assert_true(public.commission_report()->'coverage'->>'comparable'='1' and (public.commission_report()->'comparable_totals'->0->>'actual')::numeric=5,'totales solo comparables');
-- Dashboard: mismas cifras exactas que la conciliación, una foto SQL y fuente recuperable.
select public.commission_dashboard('{"year":"2026","quarter":"1","status":"variance","basis":"gross"}') dashboard \gset
select pg_temp.assert_true((:'dashboard'::jsonb->'summary'->0->>'expected')::numeric=2.5
 and (:'dashboard'::jsonb->'summary'->0->>'comparable_expected')::numeric=2.5
 and (:'dashboard'::jsonb->'summary'->0->>'actual')::numeric=5
 and (:'dashboard'::jsonb->'summary'->0->>'variance')::numeric=2.5
 and :'dashboard'::jsonb->'summary'->0->>'reconciled_accounts'='1','KPIs exactos sobre pares comparables');
select pg_temp.assert_true(:'dashboard'::jsonb->'rows'->0->>'account'='000001'
 and :'dashboard'::jsonb->'rows'->0->>'source_file'='SINTETICO-comisiones.xlsx'
 and jsonb_array_length(:'dashboard'::jsonb->'rows'->0->'receipt_evidence')=2,'identificadores y evidencia conservados');
select pg_temp.assert_true(public.commission_dashboard('{"year":1900}')->>'row_count'='0'
 and public.commission_dashboard('{"year":1900}')->'summary'='[]','vacío sin importes ficticios');
select pg_temp.expect_error($q$select public.commission_dashboard('{"basis":"invalid"}')$q$,'22023');
select public.manage_commission(gen_random_uuid(),'reconcile','91000000-0000-0000-0000-000000000002',
 '{"expected_id":"90000000-0000-0000-0000-000000000002","receipt_ids":[],"review_complete":true,"reason":"Sin cobro comparable SINTETICO"}') noactual \gset
select pg_temp.assert_true(:'noactual'::jsonb->'result'->>'status'='missing_actual' and :'noactual'::jsonb->'result'->>'actual_received' is null,'sin cobro no es cero ni deuda');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input()||'{"cutoff":"01/02/2026"}')$q$,'22023');
-- Dos filas físicas idénticas se mantienen como dos cobros legítimos.
reset role;
select array_agg(id order by id) duplicate_ids from app_private.revenue_current
 where account_id='20000000-0000-0000-0000-000000000001' and period='2026-05-01' and payout_broker_usd=0.1 \gset
select id q2_previous from app_private.commission_current where operation='reconcile' and target_id='91000000-0000-0000-0000-000000000002' \gset
set local role authenticated;
select public.manage_commission('99000000-0000-0000-0000-000000000001','receipt',(:'duplicate_ids'::uuid[])[1],pg_temp.receipt_input((:'duplicate_ids'::uuid[])[1])||'{"quarter":"2026-04-01"}');
select public.manage_commission('99000000-0000-0000-0000-000000000002','receipt',(:'duplicate_ids'::uuid[])[2],pg_temp.receipt_input((:'duplicate_ids'::uuid[])[2])||'{"quarter":"2026-04-01"}');
select public.manage_commission(gen_random_uuid(),'reconcile','91000000-0000-0000-0000-000000000002',jsonb_build_object(
 'previous_id',:'q2_previous','expected_id','90000000-0000-0000-0000-000000000002','receipt_ids',jsonb_build_array('99000000-0000-0000-0000-000000000001','99000000-0000-0000-0000-000000000002'),
 'review_complete',true,'reason','Filas idénticas legítimas SINTETICO')) duplicate_comparison \gset
select pg_temp.assert_true((:'duplicate_comparison'::jsonb->'result'->>'actual_received')::numeric=0.2
 and jsonb_array_length(:'duplicate_comparison'::jsonb->'result'->'entry_ids')=2,'conserva multiplicidad idéntica');
select public.commission_dashboard('{"year":"2026","quarter":"2","basis":"gross"}') duplicates_dashboard \gset
select pg_temp.assert_true((:'duplicates_dashboard'::jsonb->'summary'->0->>'actual')::numeric=0.2
 and (:'duplicates_dashboard'::jsonb->'summary'->0->>'expected')::numeric=5,'dashboard conserva dos movimientos físicos idénticos');
select pg_temp.assert_true(public.commission_dashboard('{"year":2025,"quarter":3}')->'summary'->0->>'expected' is null
 and public.commission_dashboard('{"year":2025,"quarter":3}')->'summary'->0->>'actual' is null,'ausencias y tasas no verificadas no generan importes');
select pg_temp.assert_true(public.commission_dashboard('{"year":2026}')->'owners'->0->>'balance' is null,'no suma balances entre fotos');
-- Corrección conserva original e invalida conciliación anterior.
select public.manage_commission('90000000-0000-0000-0000-000000000004','expected','91000000-0000-0000-0000-000000000001',
 pg_temp.expected_input('8000')||'{"previous_id":"90000000-0000-0000-0000-000000000001"}') corrected \gset
select pg_temp.assert_true(public.commission_report('{"year":2026,"quarter":1,"status":"variance"}')->>'row_count'='0','corregir invalida cálculo relacionado');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'expected','91000000-0000-0000-0000-000000000001',pg_temp.expected_input())$q$,'40001');
select public.manage_commission('93000000-0000-0000-0000-000000000002','reconcile','91000000-0000-0000-0000-000000000001',
 '{"previous_id":"93000000-0000-0000-0000-000000000001","expected_id":"90000000-0000-0000-0000-000000000004","receipt_ids":["92000000-0000-0000-0000-000000000001","92000000-0000-0000-0000-000000000002"],"review_complete":true,"reason":"Corrección SINTETICA"}') matched \gset
select pg_temp.assert_true(:'matched'::jsonb->'result'->>'status'='matched','matched confirmado');
select public.manage_commission('90000000-0000-0000-0000-000000000005','expected','91000000-0000-0000-0000-000000000005',pg_temp.expected_input('8000','0.0025','2026-01-01','Otro beneficiario SINTETICO'));
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'reconcile','91000000-0000-0000-0000-000000000005','{"expected_id":"90000000-0000-0000-0000-000000000005","receipt_ids":["92000000-0000-0000-0000-000000000001"],"reason":"Duplicado SINTETICO"}')$q$,'23505');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'reconcile','91000000-0000-0000-0000-000000000001','{"previous_id":"93000000-0000-0000-0000-000000000002","expected_id":"90000000-0000-0000-0000-000000000004","receipt_ids":["92000000-0000-0000-0000-000000000001","92000000-0000-0000-0000-000000000001"],"reason":"Duplicado SINTETICO"}')$q$,'23505');
-- Soltar movimientos requiere revisión explícita; ahora probar incompatibilidad de beneficiario.
select public.manage_commission(gen_random_uuid(),'reconcile','91000000-0000-0000-0000-000000000001','{"previous_id":"93000000-0000-0000-0000-000000000002","expected_id":"90000000-0000-0000-0000-000000000004","receipt_ids":[],"reason":"Liberación SINTETICA"}');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'reconcile','91000000-0000-0000-0000-000000000005','{"expected_id":"90000000-0000-0000-0000-000000000005","receipt_ids":["92000000-0000-0000-0000-000000000001"],"reason":"Otro beneficiario SINTETICO"}')$q$,'22023');
-- Fee type no confirmado queda fuera de comparables; controles Excel separados por base.
select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input('4000','0.0025','2023-01-01')||'{"fee_rule":"unknown"}') unknown_fee \gset
select pg_temp.assert_true(:'unknown_fee'::jsonb->'result'->>'verified'='false','Fee type sin regla revisada no confirma cálculo');
select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input('4000','0.0025','2023-04-01')||'{"excel_checks":[{"header":"Gross anua USD","basis":"gross","periodicity":"annual","value":"10","evidence":"Control bruto anual SINTETICO"}]}') excel \gset
select pg_temp.assert_true((:'excel'::jsonb->'result'->'excel_checks'->0->>'difference')::numeric=0,'Excel original comparado con cálculo propio');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input('4000','0.0025','2023-07-01')||'{"excel_checks":[{"header":"Gross anua USD","basis":"net","periodicity":"annual","value":"10","evidence":"Incompatible SINTETICO"}]}')$q$,'22023');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input())$q$,'23505');
-- Cero esperado frente a un cobro: porcentaje N/D; diferencia nominal exacta.
select public.manage_commission('97000000-0000-0000-0000-000000000001','expected','98000000-0000-0000-0000-000000000001',pg_temp.expected_input('0')||'{"component_key":"zero comparison"}');
select public.manage_commission(gen_random_uuid(),'reconcile','98000000-0000-0000-0000-000000000001','{"expected_id":"97000000-0000-0000-0000-000000000001","receipt_ids":["92000000-0000-0000-0000-000000000002"],"review_complete":true,"reason":"Cero SINTETICO"}') zero_comparison \gset
select pg_temp.assert_true(:'zero_comparison'::jsonb->'result'->>'status'='variance' and :'zero_comparison'::jsonb->'result'->>'variance_percentage' is null,'sin división por cero');
-- Cambiar clasificación invalida el resultado sin perder el evento auditado.
select public.manage_commission('92000000-0000-0000-0000-000000000003','receipt',:'rid2',pg_temp.receipt_input(:'rid2')||'{"previous_id":"92000000-0000-0000-0000-000000000002"}');
select pg_temp.assert_true(public.commission_report('{"year":2026,"quarter":1,"status":"variance"}')->>'row_count'='0','corrección de clasificación requiere revisar');
reset role;
select pg_temp.seed('revenue','2022-01-01',1,(select jsonb_agg(jsonb_build_array(1,'0.1')) from generate_series(1,501)));
set local role authenticated;
select public.commission_dashboard('{"year":2022}') multipage_dashboard \gset
select pg_temp.assert_true(:'multipage_dashboard'::jsonb->>'row_count'='501'
 and jsonb_array_length(:'multipage_dashboard'::jsonb->'rows')=501
 and :'multipage_dashboard'::jsonb->'summary'->0->>'pending'='501'
 and :'multipage_dashboard'::jsonb->'summary'->0->>'actual' is null,'reporte cruza página RPC sin truncar ni convertir sin clasificar en cobro');
reset role;
select pg_temp.assert_true((select result->>'expected_quarterly' from app_private.commission_events where id='90000000-0000-0000-0000-000000000001')::numeric=2.5,'historia original conservada');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}';
set local role authenticated;
select pg_temp.expect_error($q$select public.commission_report()$q$,'42501');
select pg_temp.expect_error($q$select public.commission_dashboard()$q$,'42501');
select pg_temp.expect_error($q$select public.manage_commission(gen_random_uuid(),'expected',gen_random_uuid(),pg_temp.expected_input())$q$,'42501');
select pg_temp.assert_true((select count(*)=0 from app_private.commission_events),'lector sin originales ni preparación');
reset role;
set local role anon;
select pg_temp.expect_error($q$select public.commission_report()$q$,'42501');
select pg_temp.expect_error($q$select public.commission_dashboard()$q$,'42501');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
\if :{?commission_race}
set local role authenticated;
select public.manage_commission('94000000-0000-0000-0000-000000000001','expected','95000000-0000-0000-0000-000000000001',pg_temp.expected_input()||'{"component_key":"Race 1 SINTETICO"}');
select public.manage_commission('94000000-0000-0000-0000-000000000002','expected','95000000-0000-0000-0000-000000000002',pg_temp.expected_input()||'{"component_key":"Race 2 SINTETICO"}');
reset role;
commit;
\else
select pg_temp.seed('revenue','2026-01-01',1,'[[1,"99"]]');
set local role authenticated;
select pg_temp.assert_true(public.commission_report('{"status":"matched"}')->>'row_count'='0','reemplazo de Revenue invalida conciliaciones');
reset role;
rollback;
\endif
\o
\echo 'OK: comisiones, tasas, decimales, cobros múltiples, estados, filtros, versiones y permisos.'
