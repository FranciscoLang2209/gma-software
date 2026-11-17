-- SOLO DATOS SINTÉTICOS: manifiesto, bypass, rollback, reintentos, corrección y permisos.
\set ON_ERROR_STOP on
\o /dev/null
begin;
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$ begin
 if ok is distinct from true then raise exception 'Assertion failed: %',message; end if; end $$;
create function pg_temp.expect_error(statement text,state text default 'P0001') returns void language plpgsql as $$ begin
 execute statement; raise exception 'Expected error was not raised' using errcode='XX000'; exception when others then if sqlstate<>state then raise; end if; end $$;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into auth.sessions select id,id,null from auth.users;
insert into app_private.user_profiles(id,role,enabled) values ('00000000-0000-0000-0000-000000000001','admin',true),('00000000-0000-0000-0000-000000000002','reader',true);
insert into app_private.custodians(id,code,name,created_by) values
 ('10000000-0000-0000-0000-000000000001','SYN-A','SINTETICO A','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','SYN-B','SINTETICO B','00000000-0000-0000-0000-000000000001');
create function pg_temp.history_input(cust uuid,amount text default '0.1') returns jsonb language sql as $$
 select jsonb_build_object('file_name','SINTETICO-historia.csv','file_hash',repeat('a',64),'file_size',100,
 'options',jsonb_build_object('source','aum','custodianId',cust,'custodianCode','SYN-A','sheet','CSV','numericFormat','dot','delimiter',','),
 'manifest',jsonb_build_object('parserVersion',2,'sheet','CSV','excludedSheets','[]'::jsonb,'blankRows',0,'unroutable','[]'::jsonb,'errors','[]'::jsonb,
  'partitions',(select jsonb_agg(jsonb_build_object('period',m::date,'coordinates',jsonb_build_array(jsonb_build_object('sheet','CSV','row',n+1,'fingerprint',repeat('a',64))),
   'summary',jsonb_build_object('rowCount',1,'blockingErrors',0,'total',amount,'valueCount',1,'errors','[]'::jsonb)))
   from generate_series('2023-12-01'::date,'2024-02-01'::date,'1 month') with ordinality x(m,n))))
$$;
create function pg_temp.prepare_history(upload uuid) returns void language plpgsql as $$
declare b record; p jsonb; r uuid; account uuid;
begin
 for b in select * from public.admin_import_batches where upload_id=upload order by period loop
  select value into p from public.admin_import_uploads u,jsonb_array_elements(u.manifest->'partitions') where u.id=upload and (value->>'period')::date=b.period;
  perform public.prepare_import_chunk(b.id,0,b.parsing_conventions->'options',jsonb_build_array(jsonb_build_object(
   'sheet_name','CSV','row_number',(p->'coordinates'->0->>'row')::integer,
   'original_cells',jsonb_build_object('Holding Account Number','00001','Account Number bd_REV','SYN-00001','Value (USD)',p->'summary'->>'total','mes',extract(month from b.period)::text,'año',extract(year from b.period)::text),
   'cell_metadata',jsonb_build_object('amount',p->'summary'->>'total','period',b.period,'fingerprint',repeat('a',64)),'status','valid','errors','[]'::jsonb)),p->'summary');
 end loop;
end $$;
create function pg_temp.review_history(upload uuid) returns void language plpgsql as $$
declare b record; r uuid; account uuid;
begin
 for b in select * from public.admin_import_batches where upload_id=upload order by period loop
  select account_id into account from public.admin_account_identifiers where source='aum' and namespace='Holding Account Number' and custodian_id=b.custodian_id and value_original='00001';
  select id into strict r from public.admin_import_rows where batch_id=b.id;
  perform public.manage_import(b.id,'resolve',jsonb_build_object('row_id',r,'custodian_id',b.custodian_id,'account_id',account,'evidence','Correspondencia SINTETICA explícita'));
  perform public.manage_import(b.id,'review',jsonb_build_object('complete_scope',true,'period',b.period,'custodian_id',b.custodian_id,'expected_active_id',(select active_batch_id from public.admin_import_scopes where id=b.scope_id)));
 end loop;
 perform public.manage_historical(upload,'review','{"confirm_all":true}');
end $$;
create function pg_temp.publish_history(upload uuid) returns jsonb language sql as $$
 select public.manage_historical(upload,'publish',jsonb_build_object('token',review->>'token')) from public.admin_import_uploads where id=upload
$$;
set local role anon;
select pg_temp.expect_error($q$select public.manage_historical(null,'inspect','{}')$q$,'42501');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.admin_import_uploads),'lector sin originales ni manifiestos');
select pg_temp.expect_error($q$select public.manage_historical(null,'begin','{}')$q$,'42501');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select gen_random_uuid() as upload \gset
select pg_temp.history_input('10000000-0000-0000-0000-000000000001') as original_input \gset
select public.manage_historical(:'upload','begin',:'original_input');
select public.manage_historical(:'upload','begin',:'original_input');
select pg_temp.assert_true((select count(*)=3 from public.admin_import_batches where upload_id=:'upload'),'retry no duplica particiones');
select pg_temp.assert_true((select count(distinct storage_object_path)=1 from public.admin_import_batches where upload_id=:'upload'),'original único compartido');
select pg_temp.expect_error(format('select public.manage_historical(%L,''begin'',%L)',:'upload',jsonb_set(:'original_input','{file_hash}',to_jsonb(repeat('b',64)))::text));
select pg_temp.prepare_history(:'upload');
select pg_temp.assert_true((select count(*)=0 from public.published_metrics()),'preparación nunca publica');
select pg_temp.expect_error(format('select public.manage_historical(%L,''review'',''{"confirm_all":true}'')',:'upload'));
select pg_temp.review_history(:'upload');
select id as child from public.admin_import_batches where upload_id=:'upload' order by period limit 1 \gset
select pg_temp.expect_error(format('select public.publish_import(%L,null)',:'child'));
select pg_temp.expect_error(format($q$select public.manage_import(id,'publish',jsonb_build_object('token',review->>'token')) from public.admin_import_batches where id=%L$q$,:'child'));
select pg_temp.expect_error(format($q$update public.admin_import_uploads set status='publishing' where id=%L$q$,:'upload'),'42501');
reset role;
-- Un error DESPUÉS del segundo puntero demuestra rollback de los anteriores y auditoría.
create function pg_temp.fail_history() returns trigger language plpgsql as $$ begin
 if new.period='2024-01-01' and current_setting('gma.synthetic_fail',true)='yes' then raise exception 'Synthetic failure after second partition'; end if; return new; end $$;
create trigger synthetic_history_failure after update on app_private.import_scopes for each row execute function pg_temp.fail_history();
set local gma.synthetic_fail='yes';
set local role authenticated;
select pg_temp.expect_error(format('select pg_temp.publish_history(%L)',:'upload'));
select pg_temp.assert_true((select count(*)=0 from public.published_metrics()),'fallo no deja meses publicados');
select pg_temp.assert_true((select status='ready' from public.admin_import_uploads where id=:'upload'),'padre recuperable ready');
reset role;
select pg_temp.assert_true((select count(*)=0 from app_private.audit_events where action='publish'),'rollback conserva auditoría coherente');
set local gma.synthetic_fail='no';
set local role authenticated;
select pg_temp.publish_history(:'upload'); select pg_temp.publish_history(:'upload');
select pg_temp.assert_true((select count(*)=3 from public.published_metrics()),'recuperación publica tres meses una sola vez');
select gen_random_uuid() as replacement \gset
select public.manage_historical(:'replacement','begin',:'original_input');
select pg_temp.prepare_history(:'replacement'); select pg_temp.review_history(:'replacement'); select pg_temp.publish_history(:'replacement');
select pg_temp.publish_history(:'upload');
select pg_temp.assert_true((select bool_and(active_batch_id in (select id from public.admin_import_batches where upload_id=:'replacement')) from public.admin_import_scopes),'retry antiguo no reactiva historia reemplazada');
select gen_random_uuid() as other \gset
select public.manage_historical(:'other','begin',pg_temp.history_input('10000000-0000-0000-0000-000000000002','9'));
select pg_temp.prepare_history(:'other'); select pg_temp.review_history(:'other'); select pg_temp.publish_history(:'other');
select pg_temp.assert_true((select count(distinct account_id)=2 from public.admin_aum_monthly),'mismo identificador entre custodios nunca fusiona');
-- Dos cargas revisadas con el mismo puntero: la perdedora completa se rechaza.
select gen_random_uuid() as correction \gset
select gen_random_uuid() as stale \gset
select public.manage_historical(:'correction','begin',pg_temp.history_input('10000000-0000-0000-0000-000000000001','0.2'));
select public.manage_historical(:'stale','begin',pg_temp.history_input('10000000-0000-0000-0000-000000000001','0.3'));
select pg_temp.prepare_history(:'correction'); select pg_temp.review_history(:'correction');
select pg_temp.prepare_history(:'stale'); select pg_temp.review_history(:'stale');
select pg_temp.publish_history(:'correction');
select pg_temp.expect_error(format('select pg_temp.publish_history(%L)',:'stale'));
reset role;
select pg_temp.assert_true((select count(*)=6 and sum(value_usd)=27.6 from app_private.aum_current),'corrección exacta preserva otros custodios');
select pg_temp.assert_true((select count(*)=15 from app_private.aum_monthly),'todas las versiones anteriores conservadas');
select pg_temp.assert_true((select count(*)=12 from app_private.audit_events where action='publish'),'reintentos sin doble auditoría');
set local role authenticated;
-- Privacidad efectiva cuando ya existen operaciones y hechos publicados.
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.admin_import_uploads),'lector no ve manifiestos ni revisiones después de publicar');
select pg_temp.expect_error(format('select public.manage_historical(%L,''inspect'',''{}'')',:'upload'),'42501');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
-- Manifiestos con coordenadas o particiones repetidas se rechazan sin crear operación.
select pg_temp.expect_error(format($q$select public.manage_historical(gen_random_uuid(),'begin',%L)$q$,
 jsonb_set(:'original_input','{manifest,partitions,1,coordinates,0,row}','2')::text));
select gen_random_uuid() as tampered \gset
select public.manage_historical(:'tampered','begin',jsonb_set(:'original_input','{manifest,partitions,0,coordinates,0,fingerprint}',to_jsonb(repeat('b',64))));
select pg_temp.expect_error(format('select pg_temp.prepare_history(%L)',:'tampered'));
select pg_temp.assert_true((select sum((totals->>'processed')::integer) is null from public.admin_import_batches where upload_id=:'tampered'),'fila fuera de manifiesto revierte todo el bloque');
select gen_random_uuid() as invalid \gset
select public.manage_historical(:'invalid','begin',jsonb_set(:'original_input','{manifest,unroutable}','[{"sheet":"CSV","row":99,"errors":["SINTETICO"]}]'));
select pg_temp.prepare_history(:'invalid');
select pg_temp.expect_error(format('select pg_temp.review_history(%L)',:'invalid'));
reset role;
\if :{?history_race}
set local role authenticated;
select public.manage_historical('72000000-0000-0000-0000-000000000001','begin',pg_temp.history_input('10000000-0000-0000-0000-000000000001','0.4'));
select public.manage_historical('72000000-0000-0000-0000-000000000002','begin',pg_temp.history_input('10000000-0000-0000-0000-000000000001','0.5'));
select pg_temp.prepare_history('72000000-0000-0000-0000-000000000001'); select pg_temp.review_history('72000000-0000-0000-0000-000000000001');
select pg_temp.prepare_history('72000000-0000-0000-0000-000000000002'); select pg_temp.review_history('72000000-0000-0000-0000-000000000002');
commit;
\else
rollback;
\endif
\o
\echo 'OK historia SQL: manifiesto, roles, originales, bypass, rollback entre meses, retoma, reimportación, corrección y revisión obsoleta.'
