-- Datos exclusivamente SINTÉTICOS; rollback al terminar.
\ir query-fixture.sql
update app_private.accounts set service='Advisory' where id in ('20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002');
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by)
 values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','revenue','ACCOUNT','000001','resolved','SINTETICO',auth.uid());
create function pg_temp.master_input() returns jsonb language sql as $$
 select jsonb_build_object('storage_path','master/SINTETICO/original.xlsx','master',jsonb_build_object(
 'file','SINTETICO.xlsx','hash',repeat('a',64),'sheet','SINTETICO','balanceHeader','Balance',
 'rows',jsonb_build_array(jsonb_build_object('row',3,'account','000001','numericAccount',false,'balance','100000','annualRate','0.005','issue',null,
 'cells',jsonb_build_object('Broker','SINTETICO','ACCOUNT','000001','IP',null,'IP Des',null,'NAME','SINTETICO',
 'Owner Name payout','SINTETICO','Fee type','Advisory','Adv Fee / Retro','50','Status','SINTETICO','Balance','100000',
 'Gross anua USD',null,'Net annual USD',null,'Payout final REP',null,'Final REP',null)),
 jsonb_build_object('row',4,'account','000002','numericAccount',false,'balance',null,'annualRate',null,'issue','Condición pendiente',
 'cells',jsonb_build_object('Broker','SINTETICO','ACCOUNT','000002','Adv Fee / Retro','POR REVISAR')))),
 'review',jsonb_build_object('quarter','2026-01-01','cutoff','2025-12-31','evidence','SINTETICO: identidad exacta, tasa y base bruta comparables durante todo Q1',
 'identity_confirmed',true,'brokers',jsonb_build_object('SINTETICO','10000000-0000-0000-0000-000000000001'),'accounts','{}'::jsonb,'selected','[3]'::jsonb));
$$;
set local role authenticated;
select public.import_master(gen_random_uuid(),'preview',pg_temp.master_input()) preview \gset
select pg_temp.assert_true(:'preview'::jsonb->>'ready'='1','resuelve exclusivamente ACCOUNT literal por custodio');
select pg_temp.assert_true(:'preview'::jsonb->'rows'->0->>'account_id'='20000000-0000-0000-0000-000000000001','ceros conservados');
select pg_temp.assert_true(:'preview'::jsonb->'rows'->1->>'problem' is not null,'condición sin tasa conservada pendiente');
select pg_temp.assert_true((public.import_master(gen_random_uuid(),'preview',jsonb_set(pg_temp.master_input(),'{review,brokers,SINTETICO}','"10000000-0000-0000-0000-000000000002"'))->>'ready')::integer=0,'otro custodio no se une por número ni nombre');
select pg_temp.assert_true((public.import_master(gen_random_uuid(),'preview',jsonb_set(pg_temp.master_input(),'{master,rows,0,numericAccount}','true'))->>'ready')::integer=0,'cuentas numéricas sin confirmación no publicables');
select jsonb_set(pg_temp.master_input(),'{review,revision}',:'preview'::jsonb->'revision') reviewed \gset
select public.import_master('aa000000-0000-0000-0000-000000000001','publish',:'reviewed') publication \gset
select pg_temp.assert_true(:'publication'::jsonb @> '{"published":1,"snapshot_rows":2}','snapshot completo, sólo tasa seleccionada publicada');
select pg_temp.assert_true(public.import_master('aa000000-0000-0000-0000-000000000001','publish',:'reviewed')=:'publication'::jsonb,'reintento idempotente');
select pg_temp.expect_error(format('select public.import_master(gen_random_uuid(),''publish'',%L)',:'reviewed'),'40001');
select pg_temp.expect_error(format('select public.import_master(''aa000000-0000-0000-0000-000000000001'',''publish'',%L)',jsonb_set(:'reviewed','{review,evidence}','"SINTETICO otro motivo"')),'22023');
reset role;
select pg_temp.assert_true((select count(*)=1 from app_private.master_publications),'un snapshot');
select pg_temp.assert_true((select count(*)=1 from app_private.roa_rate_versions),'una tasa');
select pg_temp.assert_true((select annual_rate=0.005 from app_private.roa_rate_versions),'50pb a proporción anual exacta');
select pg_temp.assert_true((select (result->>'expected_quarterly')::numeric=125 from app_private.commission_current where operation='expected'),'base bruta /4');
-- Una segunda fila inválida impide publicación de la primera y del snapshot.
set local role authenticated;
select public.import_master(gen_random_uuid(),'preview',pg_temp.master_input()) new_preview \gset
reset role;
update app_private.accounts set service='sin_clasificar' where id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.expect_error(format('select public.import_master(gen_random_uuid(),''publish'',%L)',jsonb_set(:'reviewed','{review,revision}',:'new_preview'::jsonb->'revision')),'40001');
reset role;
update app_private.accounts set service='Advisory' where id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
select public.import_master(gen_random_uuid(),'preview',pg_temp.master_input()) new_preview \gset
select jsonb_set(jsonb_set(pg_temp.master_input(),'{review,revision}',:'new_preview'::jsonb->'revision'),'{review,selected}','[3,4]') bad_review \gset
select pg_temp.expect_error(format('select public.import_master(gen_random_uuid(),''publish'',%L)',:'bad_review'),'22023');
-- Fallo DURANTE la segunda escritura: la primera obligación/tasa también se revierte.
select jsonb_set(
 jsonb_set(
  jsonb_set(:'bad_review','{master,rows,1}',jsonb_set(:'bad_review'::jsonb->'master'->'rows'->0,'{row}','4')),
  '{review,accounts}', '{"4":"20000000-0000-0000-0000-000000000002"}'),
 '{master,rows,1,cells}', (:'bad_review'::jsonb->'master'->'rows'->0->'cells')-'Gross anua USD') mid_write_failure \gset
select pg_temp.expect_error(format('select public.import_master(gen_random_uuid(),''publish'',%L)',:'mid_write_failure'),'22023');
reset role;
select pg_temp.assert_true((select count(*)=1 from app_private.master_publications) and (select count(*)=1 from app_private.roa_rate_versions),'fallo atómico sin publicación parcial');
-- Corrección explícita conserva historia e invalida la tasa anterior.
set local role authenticated;
select jsonb_set(jsonb_set(:'reviewed','{review,revision}',:'new_preview'::jsonb->'revision'),'{master,rows,0,annualRate}','"0.006"') correction \gset
select public.import_master('aa000000-0000-0000-0000-000000000002','publish',:'correction');
reset role;
select pg_temp.assert_true((select count(*)=2 from app_private.master_publications) and (select count(*)=2 from app_private.roa_rate_versions),'versiones conservadas');
select pg_temp.assert_true((select count(*)=1 from app_private.roa_rate_invalidations),'tasa previa obsoleta');
select pg_temp.assert_true((select count(*)=1 from app_private.commission_current where operation='expected'),'corregir no duplica obligación');
select pg_temp.expect_error($q$update app_private.master_publications set result='{}'$q$,'P0001');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
select pg_temp.expect_error($q$select public.import_master(gen_random_uuid(),'preview',pg_temp.master_input())$q$,'42501');
select pg_temp.expect_error($q$select * from app_private.master_publications$q$,'42501');
reset role;
select pg_temp.assert_true(not has_function_privilege('anon','public.import_master(uuid,text,jsonb)','EXECUTE'),'sin ejecución anon');
select pg_temp.assert_true(not has_function_privilege('service_role','public.import_master(uuid,text,jsonb)','EXECUTE'),'sin ejecución service_role');
rollback;
\o
\echo 'OK: Master sintético, revisión, publicación atómica, retry, corrección, originales privados y roles.'
