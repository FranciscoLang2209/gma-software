-- Solo en el clúster sintético efímero del runner.
do $$ begin
  assert not (select rolsuper from pg_roles where rolname='app_papa_migration_test');
  assert exists (select 1 from pg_roles where rolname='app_papa_executor' and not rolcanlogin and not rolbypassrls);
  assert not exists (select 1 from pg_auth_members where roleid='app_papa_executor'::regrole and (set_option or inherit_option));
  assert (select pg_get_userbyid(proowner)='app_papa_executor' from pg_proc where oid='app_private.begin_import(uuid,text,date,uuid,text,text,integer,jsonb)'::regprocedure);
end $$;
