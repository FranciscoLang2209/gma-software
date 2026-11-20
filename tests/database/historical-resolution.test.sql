-- Sólo datos sintéticos: identidad exacta REV por custodio, bloques y retoma.
\set ON_ERROR_STOP on
\o /dev/null
begin;
create or replace function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$ begin
 if ok is distinct from true then raise exception 'Assertion failed: %',message; end if; end $$;
create or replace function pg_temp.expect_error(statement text,state text default 'P0001') returns void language plpgsql as $$ begin
 execute statement; raise exception 'Expected error was not raised' using errcode='XX000'; exception when others then if sqlstate<>state then raise; end if; end $$;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into auth.sessions select id,id,null from auth.users;
insert into app_private.user_profiles(id,role,enabled) values ('00000000-0000-0000-0000-000000000001','admin',true),('00000000-0000-0000-0000-000000000002','reader',true);
insert into app_private.custodians(id,code,name,created_by) values
 ('10000000-0000-0000-0000-000000000001','SYN-A','SINTETICO A','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','SYN-B','SINTETICO B','00000000-0000-0000-0000-000000000001');
create function pg_temp.resolution_input() returns jsonb language sql as $$
 select jsonb_build_object('file_name','SINTETICO-resolucion.csv','file_hash',repeat('d',64),'file_size',100,
 'options',jsonb_build_object('source','revenue','multiCustodian',true,'sheet','CSV','numericFormat','dot','delimiter',','),
 'manifest',jsonb_build_object('parserVersion',3,'sheet','CSV','excludedRows','[]'::jsonb,'unroutable','[]'::jsonb,'errors','[]'::jsonb,
 'partitions',(select jsonb_agg(jsonb_build_object('period',('2026-01-01'::date+m*interval '1 month')::date,'custodianId',c.id,'custodianCode',c.code,
 'coordinates',(select jsonb_agg(jsonb_build_object('sheet','CSV','row',(m*2+c.n)*60+a+2,'fingerprint',repeat('d',64))) from generate_series(0,59) a),
 'summary',jsonb_build_object('rowCount',60,'blockingErrors',0,'total','5.7','valueCount',59,'errors','[]'::jsonb)))
 from generate_series(0,1) m cross join (values('10000000-0000-0000-0000-000000000001','SYN-A',0),('10000000-0000-0000-0000-000000000002','SYN-B',1)) c(id,code,n))))
$$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select gen_random_uuid() upload \gset
select public.manage_historical(:'upload','begin',pg_temp.resolution_input());
select public.prepare_import_chunk(b.id,0,b.parsing_conventions->'options',
 (select jsonb_agg(jsonb_build_object('sheet_name','CSV','row_number',(c->>'row')::integer,
 'original_cells',jsonb_build_object('ACCOUNT',case when (c->>'row')::integer % 2=0 then '0001' else '1' end,
  'Payout broker',case (c->>'row')::integer % 60 when 2 then null when 3 then '-0.1' else '0.1' end),
 'cell_metadata',jsonb_build_object('amount',case (c->>'row')::integer % 60 when 2 then null when 3 then '-0.1' else '0.1' end,
  'period',b.period,'fingerprint',repeat('d',64)),'status','valid','errors','[]'::jsonb)) from jsonb_array_elements(p->'coordinates') c),p->'summary')
 from public.admin_import_batches b join public.admin_import_uploads u on u.id=b.upload_id,lateral jsonb_array_elements(u.manifest->'partitions') p
 where u.id=:'upload' and (p->>'period')::date=b.period and (p->>'custodianId')::uuid=b.custodian_id;
select id child from public.admin_import_batches where upload_id=:'upload' order by period,custodian_id limit 1 \gset
select pg_temp.expect_error(format('select public.resolve_historical_revenue(%L,%L,''corto'')',:'upload',:'child'));
select public.resolve_historical_revenue(:'upload',:'child','Identidad exacta REV SINTETICA por custodio') first_chunk \gset
select pg_temp.assert_true(:'first_chunk'::jsonb @> '{"processed":50,"total":60,"done":false}','límite 50 por transacción');
select public.resolve_historical_revenue(:'upload',:'child','Identidad exacta REV SINTETICA por custodio') second_chunk \gset
select pg_temp.assert_true(:'second_chunk'::jsonb @> '{"processed":60,"done":true}','retoma las diez restantes');
select public.resolve_historical_revenue(:'upload',:'child','Identidad exacta REV SINTETICA por custodio');
select public.resolve_historical_revenue(:'upload',id,'Identidad exacta REV SINTETICA por custodio') from public.admin_import_batches where upload_id=:'upload';
select public.resolve_historical_revenue(:'upload',id,'Identidad exacta REV SINTETICA por custodio') from public.admin_import_batches where upload_id=:'upload';
select pg_temp.assert_true((select count(*)=240 from app_private.row_resolutions),'todas las filas, incluidos contenidos idénticos');
select pg_temp.assert_true((select count(*)=4 from public.admin_accounts),'ceros y custodios separados; meses reutilizan UUID');
select pg_temp.assert_true((select count(*)=4 and bool_and(source='revenue' and namespace='ACCOUNT') from public.admin_account_identifiers),'sin aliases entre fuentes inventados');
select pg_temp.assert_true((select bool_and(created_by='00000000-0000-0000-0000-000000000001') from app_private.row_resolutions),'actor real de la sesión conservado');
select pg_temp.expect_error(format('select public.resolve_historical_revenue(gen_random_uuid(),%L,''Evidencia SINTETICA'')',:'child'),'P0002');
reset role;
select pg_get_functiondef('app_private.advisor_at(uuid,date)'::regprocedure) original_advisor_at \gset
create temporary sequence advisor_calls;
grant usage,select on sequence advisor_calls to app_papa_executor;
-- Contador transaccional sintético: evita una regresión a tres consultas por movimiento.
create or replace function app_private.advisor_at(target_account uuid,target_period date) returns uuid
language plpgsql stable set search_path='' as $$ begin
 perform nextval('pg_temp.advisor_calls'); return null;
end $$;
set local role authenticated;
select public.manage_import(id,'review',jsonb_build_object('complete_scope',true,'custodian_id',custodian_id,'period',period,'expected_active_id',null))
 from public.admin_import_batches where upload_id=:'upload';
reset role;
select pg_temp.assert_true((select last_value=8 from advisor_calls),'una consulta de atribución por cuenta/mes, no tres por movimiento');
select :'original_advisor_at' \gexec
set local role authenticated;
select public.resolve_historical_revenue(:'upload',:'child','Identidad exacta REV SINTETICA por custodio');
select pg_temp.assert_true((select count(*)=4 from public.admin_accounts),'retry revisado no duplica cuentas');
select pg_temp.assert_true((select count(*)=0 from public.published_metrics()),'resolver/conciliar no publica');
reset role;
select pg_temp.assert_true((select count(*)=240 and count(payout_broker_usd)=236 and sum(payout_broker_usd)=22.8 from app_private.revenue_entries),'conciliación conserva suma exacta, N/D, ajustes negativos y multiplicidad');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}';
set local role authenticated;
select pg_temp.expect_error(format('select public.resolve_historical_revenue(%L,%L,''Evidencia SINTETICA'')',:'upload',:'child'),'42501');
reset role;
select pg_temp.assert_true(not has_function_privilege('anon','public.resolve_historical_revenue(uuid,uuid,text)','EXECUTE'),'anon sin RPC');
select pg_temp.assert_true(not has_function_privilege('service_role','public.resolve_historical_revenue(uuid,uuid,text)','EXECUTE'),'service_role sin RPC');
-- La autorización de sesión no debe recalcularse por cada hecho leído por el ejecutor.
select pg_get_functiondef('app_private.current_access()'::regprocedure) original_access \gset
create temporary sequence access_calls;
create or replace function app_private.current_access() returns text
language plpgsql stable security definer set search_path='' as $$ begin
 perform nextval('pg_temp.access_calls'); return 'admin';
end $$;
set local role app_papa_executor;
select pg_temp.assert_true((select count(*)=240 from app_private.revenue_entries),'ejecutor admin conserva todos los candidatos');
reset role;
select pg_temp.assert_true((select last_value<20 from access_calls),'autorización acotada por consulta, no por fila');
select :'original_access' \gexec
rollback;
\o
\echo 'OK resolución histórica: 50 filas, retoma, UUID exactos por custodio, ceros, repetidos, actor, roles y conciliación sin publicar.'
