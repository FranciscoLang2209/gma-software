\set ON_ERROR_STOP on
\o /dev/null
begin;
create function pg_temp.assert_true(ok boolean, message text) returns void language plpgsql as $$ begin
 if ok is distinct from true then raise exception 'Assertion failed: %',message; end if;
end $$;
create function pg_temp.expect_error(statement text, state text) returns void language plpgsql as $$ begin
 execute statement; raise exception 'Expected failure';
exception when others then if sqlstate<>state then raise; end if; end $$;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into auth.sessions values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',null),('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',null);
insert into app_private.user_profiles(id,role,enabled) values ('00000000-0000-0000-0000-000000000001','admin',true),('00000000-0000-0000-0000-000000000002','reader',true);
insert into app_private.custodians(id,code,name,created_by) values ('10000000-0000-0000-0000-000000000001','SYN-A','SINTETICO','00000000-0000-0000-0000-000000000001');
set local role anon;
select pg_temp.expect_error($q$select public.begin_import(null,null,null,null,null,null,null,null)$q$,'42501');
select pg_temp.expect_error($q$select public.prepare_import_chunk(null,0,'{}','[]','{}')$q$,'42501');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;
select public.begin_import('70000000-0000-0000-0000-000000000001','revenue','2026-01-01','10000000-0000-0000-0000-000000000001','SINTETICO.csv',repeat('a',64),100,'{"options":{"source":"revenue"}}') as batch_id \gset
select pg_temp.assert_true(public.begin_import('70000000-0000-0000-0000-000000000001','revenue','2026-01-01','10000000-0000-0000-0000-000000000001','SINTETICO.csv',repeat('a',64),100,'{"options":{"source":"revenue"}}')=:'batch_id'::uuid,'reintento de carga conserva ID');
select pg_temp.expect_error($q$select public.begin_import('70000000-0000-0000-0000-000000000001','revenue','2026-01-01','10000000-0000-0000-0000-000000000001','SINTETICO.csv',repeat('b',64),100,'{}')$q$,'P0001');
select pg_temp.assert_true(public.prepare_import_chunk(:'batch_id',0,'{"sheet":"CSV"}',
 '[{"sheet_name":"CSV","row_number":2,"original_cells":{"ACCOUNT":"00077","Payout broker":"0.1"},"cell_metadata":{"fingerprint":"SINTETICO"},"status":"valid","errors":[]}]',
 '{"rowCount":2,"blockingErrors":0,"total":"0.2","valueCount":2,"errors":[]}')=1,'primer lote guarda cursor');
select pg_temp.assert_true((select status='validating' and totals->>'processed'='1' from public.admin_import_batches where id=:'batch_id'),'preparación interrumpida reanudable');
select pg_temp.assert_true(public.prepare_import_chunk(:'batch_id',0,'{"sheet":"CSV"}','[]','{}')=1,'retry obsoleto no duplica filas');
select pg_temp.expect_error(format($q$select public.prepare_import_chunk(%L,1,'{"sheet":"otra"}','[]','{}')$q$,:'batch_id'),'P0001');
-- La segunda fila idéntica se conserva por procedencia distinta.
select pg_temp.assert_true(public.prepare_import_chunk(:'batch_id',1,'{"sheet":"CSV"}',
 '[{"sheet_name":"CSV","row_number":3,"original_cells":{"ACCOUNT":"00077","Payout broker":"0.1"},"cell_metadata":{"fingerprint":"SINTETICO"},"status":"valid","errors":[]}]',
 '{"rowCount":2,"blockingErrors":0,"total":"0.2","valueCount":2,"errors":[]}')=2,'reanudar conserva repetidos');
select pg_temp.assert_true((select count(*)=2 from public.admin_import_rows where batch_id=:'batch_id'),'dos filas físicas');
select pg_temp.assert_true((select status='needs_resolution' and metric_total_usd=0.2 and preparation_only from public.admin_import_batches where id=:'batch_id'),'total exacto sin publicación');
select pg_temp.assert_true(public.begin_import('70000000-0000-0000-0000-000000000001','revenue','2026-01-01','10000000-0000-0000-0000-000000000001','SINTETICO.csv',repeat('a',64),100,'{"options":{"source":"revenue"}}')=:'batch_id'::uuid,'retry después de preparar conserva ID y configuración fijada');
select pg_temp.assert_true((select count(*)=1 from public.admin_import_batches),'retry preparado no crea otra versión');
select pg_temp.assert_true((select parsing_conventions->'configuration'='{"sheet":"CSV"}'::jsonb from public.admin_import_batches where id=:'batch_id'),'retry no modifica configuración de parsing');
select pg_temp.expect_error($q$select public.begin_import('70000000-0000-0000-0000-000000000001','revenue','2026-01-01','10000000-0000-0000-0000-000000000001','SINTETICO.csv',repeat('a',64),100,'{"options":{"source":"aum"}}')$q$,'P0001');
select pg_temp.expect_error($q$select public.begin_import('70000000-0000-0000-0000-000000000001','revenue','2026-01-01','10000000-0000-0000-0000-000000000001','SINTETICO.csv',repeat('b',64),100,'{"options":{"source":"revenue"}}')$q$,'P0001');
select pg_temp.expect_error(format('update public.admin_import_batches set status=''ready'' where id=%L',:'batch_id'),'42501');
select pg_temp.expect_error(format('update public.admin_import_batches set preparation_only=false where id=%L',:'batch_id'),'42501');
select pg_temp.expect_error(format('select public.publish_import(%L,null)',:'batch_id'),'P0001');
select pg_temp.assert_true((select count(*)=0 from public.published_metrics()),'preparados ausentes del dashboard');
-- Mismo hash en otro mes es advertencia, no unicidad ni permiso de reemplazo.
select public.begin_import('70000000-0000-0000-0000-000000000002','revenue','2026-02-01','10000000-0000-0000-0000-000000000001','SINTETICO.csv',repeat('a',64),100,'{}') as failed_id \gset
-- Fallo en una fila del chunk revierte también filas previas y el cursor.
select pg_temp.expect_error(format($q$select public.prepare_import_chunk(%L,0,'{}',
 '[{"sheet_name":"CSV","row_number":2,"original_cells":{},"cell_metadata":{},"status":"valid","errors":[]},{"sheet_name":"CSV","row_number":0,"original_cells":{},"cell_metadata":{},"status":"valid","errors":[]}]',
 '{"rowCount":2,"blockingErrors":0,"total":null,"valueCount":0,"errors":[]}')$q$,:'failed_id'),'23514');
select pg_temp.assert_true((select count(*)=0 from public.admin_import_rows where batch_id=:'failed_id'),'rollback atómico de chunk inválido');
select public.prepare_import_chunk(:'failed_id',0,'{}','[]','{"rowCount":0,"blockingErrors":1,"total":null,"valueCount":0,"errors":[{"code":"empty_file"}]}');
select pg_temp.assert_true((select status='failed' and metric_total_usd is null from public.admin_import_batches where id=:'failed_id'),'error vacío conserva ausencia');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}',true);
set local role authenticated;
select pg_temp.expect_error($q$select public.begin_import(null,null,null,null,null,null,null,null)$q$,'42501');
select pg_temp.expect_error(format($q$select public.prepare_import_chunk(%L,0,'{}','[]','{}')$q$,:'failed_id'),'42501');
select pg_temp.assert_true((select count(*)=0 from public.admin_import_batches),'lector no ve preparación');
select pg_temp.assert_true((select count(*)=0 from public.admin_import_rows),'lector no ve originales');
select pg_temp.assert_true((select count(*)=0 from public.published_totals()),'lector sin datos preparados en métricas');
reset role;
rollback;
\o
\echo 'OK: preparación por lotes, retry, precisión, repetidos, rollback, hash por alcance y permisos reales SQL; sin publicar.'
