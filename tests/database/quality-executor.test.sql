-- SINTÉTICO: el ejecutor aislado no autentica ni escribe ni hereda otros roles.
\ir query-fixture.sql
select pg_temp.assert_true((select not rolcanlogin and not rolbypassrls and not rolsuper and not rolcreaterole and not rolinherit from pg_roles where rolname='app_papa_quality_reader'),'lector interno sin bypass/login');
select pg_temp.assert_true(not exists(select 1 from pg_auth_members where roleid='app_papa_quality_reader'::regrole or member='app_papa_quality_reader'::regrole),'sin membresías persistidas');
select pg_temp.assert_true((select pg_get_userbyid(proowner)='app_papa_quality_reader' and prosecdef and 'search_path=""'=any(proconfig) from pg_proc where oid='app_private.quality_report(jsonb)'::regprocedure),'owner privado acotado');
select pg_temp.assert_true(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app_private' and c.relkind='r' and (has_table_privilege('app_papa_quality_reader',c.oid,'INSERT') or has_table_privilege('app_papa_quality_reader',c.oid,'UPDATE') or has_table_privilege('app_papa_quality_reader',c.oid,'DELETE'))),'sin escrituras en ninguna tabla privada');
select pg_temp.assert_true(not has_schema_privilege('app_papa_quality_reader','app_private','CREATE') and not has_table_privilege('app_papa_quality_reader','auth.users','SELECT') and not has_table_privilege('app_papa_quality_reader','auth.sessions','SELECT'),'sin CREATE ni Auth');
set local role authenticated;
select pg_temp.assert_true((public.quality_report('{}')->>'row_count')::integer>0,'admin conserva diagnóstico');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role app_papa_quality_reader;
select pg_temp.assert_true(not exists(select 1 from app_private.accounts),'RLS del nuevo ejecutor no expone cuentas a lector');
select pg_temp.expect_error($q$insert into app_private.audit_events(action,entity_table,entity_id)values('SINTETICO','accounts',gen_random_uuid())$q$,'42501');
reset role;
rollback;
\o
\echo 'OK ejecutor Calidad: sólo admin, RLS, cero escrituras/Auth/login/bypass/CREATE/membresías.'
