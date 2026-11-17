begin;

-- SQL estándar resuelve auth.uid al crear la función, sin elevar privilegios.
-- El ejecutor ya tiene EXECUTE de auth.uid pero Supabase restringe USAGE de auth.
create function app_private.session_user_id() returns uuid
language sql stable security invoker set search_path=''
begin atomic
 select auth.uid();
end;
revoke all on function app_private.session_user_id() from public,anon,authenticated,service_role;
grant execute on function app_private.session_user_id() to app_papa_executor;

-- Conservar cuerpos, dueños, ACL y controles de sesión/rol; sólo resolver la identidad.
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;
do $$ declare f record; begin
 for f in select pg_get_functiondef(p.oid) definition
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='app_private' and p.proname in
   ('begin_import','change_model','manage_commission','manage_historical','manage_import',
    'manage_model','publish_authorized','publish_import','record_change')
  and p.prosrc like '%auth.uid()%' loop
  execute replace(f.definition,'auth.uid()','app_private.session_user_id()');
 end loop;
end $$;
revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;

commit;
