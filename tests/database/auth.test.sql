\set ON_ERROR_STOP on
\o /dev/null
begin;
-- Todos los identificadores y nombres son sintéticos. Se reutiliza preparación mínima.
\ir concurrency.sql
create function pg_temp.assert_true(ok boolean, message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Assertion failed: %', message; end if; end $$;
create function pg_temp.expect_error(statement text, expected_state text) returns void language plpgsql as $$
begin execute statement; raise exception 'Expected SQLSTATE % for %', expected_state, statement;
exception when others then if sqlstate <> expected_state then raise; end if; end $$;
insert into auth.users values ('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000004');
insert into app_private.user_profiles(id,role,enabled) values
('00000000-0000-0000-0000-000000000002','reader',true),
('00000000-0000-0000-0000-000000000003','admin',false);
insert into auth.sessions(id,user_id) select id,id from auth.users;
insert into storage.objects(bucket_id,name) values ('app-papa-imports','synthetic/race-1.xlsx');
-- Otra política permisiva no debe abrir este bucket a anónimos/lectores ni permitir borrarlo.
create policy synthetic_broad_storage on storage.objects for all to anon, authenticated using (true) with check (true);

set local role anon;
select pg_temp.expect_error('select * from public.published_metrics()','42501');
select pg_temp.expect_error('select * from public.published_totals()','42501');
select pg_temp.expect_error('select * from public.admin_import_rows','42501');
select pg_temp.expect_error('insert into public.admin_clients(name,created_by) values (''SINTETICO'',''00000000-0000-0000-0000-000000000001'')','42501');
select pg_temp.expect_error('select public.publish_import(null,null)','42501');
select pg_temp.expect_error('select * from public.source_file(null)','42501');
select pg_temp.assert_true((select count(*)=0 from storage.objects),'anónimo sin fuentes incluso con política amplia');
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;
select pg_temp.assert_true(public.current_access()='admin','perfil admin vigente');
select pg_temp.expect_error('insert into public.admin_clients(name,created_by) values (''Cliente SINTETICO'',auth.uid())','42501');
reset role;
insert into public.admin_clients(name,created_by) values ('Cliente SINTETICO','00000000-0000-0000-0000-000000000001');
set local role authenticated;
-- Fixture interno heredado: la API ya no permite escribir originales fuera de preparación.
select pg_temp.expect_error('insert into public.admin_import_rows(batch_id,sheet_name,row_number,original_cells) values (null,''SINTETICO'',2,''{}'')','42501');
reset role;
insert into public.admin_import_rows(batch_id,sheet_name,row_number,original_cells,status)
values ('60000000-0000-0000-0000-000000000002','SINTETICO',2,'{"original":"PRIVADO SINTETICO"}','pending');
set local role authenticated;
select pg_temp.assert_true((select count(*)=3 from public.admin_import_rows),'administrador consulta preparación');
select public.publish_import('60000000-0000-0000-0000-000000000001',null);
select pg_temp.assert_true((select total_usd='1' from public.published_totals()),'admin consulta agregado publicado');
select pg_temp.assert_true((select object_path='synthetic/race-1.xlsx' from public.source_file('60000000-0000-0000-0000-000000000001')),'admin localiza fuente');
select pg_temp.assert_true((select count(*)=1 from storage.objects),'admin lee fuente');
insert into storage.objects(bucket_id,name) values ('app-papa-imports','synthetic/other.xlsx');
with changed as (update storage.objects set name='overwrite' returning *) select pg_temp.assert_true(count(*)=0,'fuentes no se sobreescriben') from changed;
with changed as (delete from storage.objects returning *) select pg_temp.assert_true(count(*)=0,'fuentes no se borran') from changed;
-- Fixtures internos: cambios de catálogo por API requieren preview/save (accounts.test.sql).
reset role;
insert into public.admin_commercial_advisors(id,name,created_by)
values ('30000000-0000-0000-0000-000000000001','Comercial SINTETICO',auth.uid());
insert into public.admin_account_assignments(account_id,advisor_id,valid_from,evidence,created_by)
values ('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','2026-01-01','Asignación SINTETICA revisada',auth.uid());
update public.admin_account_assignments set valid_to='2026-02-01';
set local role authenticated;
select pg_temp.expect_error('update public.admin_account_identifiers set evidence=''bypass''','42501');
reset role;
insert into public.admin_account_identifiers(source,namespace,value_original,created_by) values ('aum','SINTETICO','00123',auth.uid());
update public.admin_account_identifiers set account_id='20000000-0000-0000-0000-000000000001',custodian_id='10000000-0000-0000-0000-000000000001',resolution_status='resolved',evidence='Correspondencia SINTETICA explícita';
set local role authenticated;
select pg_temp.assert_true((select count(*)=1 from public.admin_account_assignments where valid_to='2026-02-01'),'admin modifica vigencia');
select pg_temp.assert_true((select count(*)=1 from public.admin_account_identifiers where resolution_status='resolved'),'admin resuelve correspondencias');
select pg_temp.expect_error('update app_private.user_profiles set role=''reader''','42501');
select pg_temp.expect_error('insert into app_private.audit_events(actor_id,action,entity_table,entity_id) values (auth.uid(),''fake'',''clients'',gen_random_uuid())','42501');
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
-- user_metadata no interviene en ninguna política ni función.
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}',true);
set local role authenticated;
select pg_temp.assert_true(public.current_access()='reader','metadata no eleva privilegios');
select pg_temp.assert_true((select count(*)=1 and min(amount_usd)='1' from public.published_metrics()),'lector ve solo versión activa publicada, sin preparación');
select pg_temp.assert_true((select total_usd='1' and row_count=1 from public.published_totals()),'RPC agregado respeta RLS');
select pg_temp.assert_true((select count(*)=0 from public.admin_import_rows),'vista invoker no filtra payloads');
select pg_temp.assert_true((select count(*)=0 from public.admin_import_batches),'no filtra archivos/metadata de preparación');
select pg_temp.assert_true((select count(*)=0 from app_private.aum_monthly),'no obtiene originales publicados por tabla');
select pg_temp.expect_error('insert into public.admin_import_rows(batch_id,sheet_name,row_number,original_cells) values (''60000000-0000-0000-0000-000000000002'',''SINTETICO'',3,''{}'')','42501');
select pg_temp.expect_error('insert into public.admin_clients(name,created_by) values (''SINTETICO'',auth.uid())','42501');
select pg_temp.expect_error('insert into public.admin_account_assignments(account_id,advisor_id,valid_from,evidence,created_by) values (''20000000-0000-0000-0000-000000000001'',gen_random_uuid(),''2026-01-01'',''SINTETICO'',auth.uid())','42501');
select pg_temp.expect_error('update public.admin_account_identifiers set evidence=''forged''','42501');
select pg_temp.expect_error('select public.publish_import(''60000000-0000-0000-0000-000000000002'',''60000000-0000-0000-0000-000000000001'')','42501');
select pg_temp.expect_error('select app_private.publish_import(null,null,auth.uid())','42501');
select pg_temp.expect_error('select * from public.source_file(''60000000-0000-0000-0000-000000000001'')','42501');
select pg_temp.assert_true((select count(*)=0 from storage.objects),'lector sin descarga/listado fuentes');
select pg_temp.expect_error('insert into storage.objects(bucket_id,name) values (''app-papa-imports'',''SINTETICO'')','42501');
select pg_temp.expect_error('update app_private.user_profiles set role=''admin''','42501');
reset role;
-- Verificar que el dueño de la RPC NO es superusuario, ni dueño de tablas, ni BYPASSRLS.
select pg_temp.assert_true((select not rolbypassrls and not rolsuper and not rolcanlogin from pg_roles where rolname='app_papa_executor'),'ejecutor no omite RLS');
select pg_temp.assert_true(not pg_has_role('authenticated','app_papa_executor','MEMBER'),'usuario no puede SET ROLE al ejecutor');
set local role app_papa_executor;
select pg_temp.assert_true((select count(*)=1 from app_private.aum_current),'RLS debajo de la RPC filtra preparación');
reset role;

-- Revenue también atraviesa RLS; no se combina su detalle con AUM.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;
-- Fixtures SQL internos; la publicación sí se ejecuta bajo authenticated.
reset role;
insert into public.admin_import_scopes(id,source,period,custodian_id,created_by)
values ('50000000-0000-0000-0000-000000000002','revenue','2026-01-01','10000000-0000-0000-0000-000000000001',auth.uid());
insert into public.admin_import_batches(id,scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,file_name_original,file_sha256,file_size_bytes,row_count,metric_total_usd,metric_value_count,status,reviewed_at,reviewed_by,created_by)
values ('60000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000002','revenue','2026-01-01','10000000-0000-0000-0000-000000000001',1,gen_random_uuid(),'synthetic/revenue.xlsx','SINTETICO.xlsx',repeat('e',64),1,3,10,3,'ready',now(),auth.uid(),auth.uid());
insert into public.admin_import_rows(batch_id,sheet_name,row_number,original_cells,status)
select '60000000-0000-0000-0000-000000000003','SINTETICO',n,'{"PRIVADO":"SINTETICO"}','valid' from generate_series(1,3) n;
insert into public.admin_revenue_entries(account_id,custodian_id,period,batch_id,import_row_id,payout_broker_usd,payout_broker_original)
select '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','2026-01-01',r.batch_id,r.id,
case r.row_number when 1 then 2 when 2 then 3 else 5 end,case r.row_number when 1 then '2' when 2 then '3' else '5' end
from public.admin_import_rows r where r.batch_id='60000000-0000-0000-0000-000000000003';
set local role authenticated;
select public.publish_import('60000000-0000-0000-0000-000000000003',null);
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000002"}',true);
set local role authenticated;
select pg_temp.assert_true((select total_usd='10' and row_count=3 from public.published_totals() where source='revenue'),'lector consulta Revenue agregado sin perder detalle');
select pg_temp.assert_true((select total_usd='1' and row_count=1 from public.published_totals() where source='aum'),'Revenue no multiplica AUM');
select pg_temp.assert_true((select count(*)=0 from public.admin_revenue_entries),'lector no obtiene columnas originales de Revenue publicado');
reset role;

select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;
select pg_temp.assert_true(public.current_access() is null,'sesión de otro usuario no sirve');
reset role;
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000002"}',true);

-- Deshabilitar perfil, revocar sesión y vencerla tienen efecto sin renovar JWT.
update app_private.user_profiles set enabled=false where id='00000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.assert_true(public.current_access() is null,'perfil deshabilitado');
select pg_temp.assert_true((select count(*)=0 from public.published_metrics()),'deshabilitado sin publicados');
reset role;
update app_private.user_profiles set enabled=true where id='00000000-0000-0000-0000-000000000002';
update auth.sessions set not_after=now()-interval '1 minute' where user_id='00000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.assert_true(public.current_access() is null,'sesión vencida sin acceso');
reset role;
delete from auth.sessions where user_id='00000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.published_metrics()),'JWT de sesión revocada sin acceso');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000004"}',true);
set local role authenticated;
select pg_temp.assert_true(public.current_access() is null,'usuario sin perfil no obtiene acceso');
reset role;
-- Corrección explícita por administrador y conservación de la versión anterior.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000001"}',true);
reset role;
insert into public.admin_accounts(id,custodian_id,created_by) values ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001',auth.uid());
reset role;
update public.admin_import_rows set status='valid' where batch_id='60000000-0000-0000-0000-000000000002';
insert into public.admin_aum_monthly(account_id,custodian_id,period,batch_id,import_row_id,value_usd,value_original)
select '20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','2026-01-01',r.batch_id,r.id,5,'5' from public.admin_import_rows r where batch_id='60000000-0000-0000-0000-000000000002' and row_number=2;
update public.admin_import_batches set row_count=2,metric_total_usd=7,metric_value_count=2 where id='60000000-0000-0000-0000-000000000002';
set local role authenticated;
select public.publish_import('60000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001');
select pg_temp.assert_true((select total_usd='7' from public.published_totals() where source='aum'),'reemplazo autorizado sin duplicar anterior');
select pg_temp.assert_true((select count(*)=3 from public.admin_aum_monthly),'historia anterior conservada');
reset role;
rollback;
\o
\echo 'OK: anónimo/lector/admin, RPC/vistas con RLS, preparación, publicación, roles, fuentes y revocación (contratos SQL locales).'
