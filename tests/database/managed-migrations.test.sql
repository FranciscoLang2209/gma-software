-- Solo en el clúster sintético efímero del runner.
do $$ begin
  assert not (select rolsuper from pg_roles where rolname='app_papa_migration_test');
  assert exists (select 1 from pg_roles where rolname='app_papa_executor' and not rolcanlogin and not rolbypassrls);
  assert not exists (select 1 from pg_auth_members where roleid='app_papa_executor'::regrole and (set_option or inherit_option));
  assert (select pg_get_userbyid(proowner)='app_papa_executor' from pg_proc where oid='app_private.begin_import(uuid,text,date,uuid,text,text,integer,jsonb)'::regprocedure);
end $$;
do $$ begin
 assert (select pg_get_userbyid(proowner)='app_papa_executor' from pg_proc where oid='app_private.manage_historical(uuid,text,jsonb)'::regprocedure);
 assert has_function_privilege('authenticated','app_private.manage_historical(uuid,text,jsonb)','EXECUTE');
 assert not has_function_privilege('anon','app_private.manage_historical(uuid,text,jsonb)','EXECUTE');
 assert not has_function_privilege('service_role','app_private.manage_historical(uuid,text,jsonb)','EXECUTE');
 assert not has_function_privilege('anon','public.manage_historical(uuid,text,jsonb)','EXECUTE');
 assert not has_table_privilege('authenticated','app_private.import_uploads','UPDATE');
 assert (select relrowsecurity and relforcerowsecurity from pg_class where oid='app_private.import_uploads'::regclass);
end $$;

do $$ begin
 assert (select pg_get_userbyid(proowner)='app_papa_executor' from pg_proc where oid='app_private.commission_dashboard(jsonb)'::regprocedure);
 assert has_function_privilege('authenticated','public.commission_dashboard(jsonb)','EXECUTE');
 assert not has_function_privilege('anon','public.commission_dashboard(jsonb)','EXECUTE');
 assert not has_function_privilege('service_role','public.commission_dashboard(jsonb)','EXECUTE');
 assert (select relrowsecurity and relforcerowsecurity from pg_class where oid='app_private.commission_events'::regclass);
 assert not has_table_privilege('authenticated','app_private.commission_events','INSERT');
 assert not has_table_privilege('authenticated','app_private.commission_events','UPDATE');
end $$;
