begin;

-- Este rol solo ejecuta funciones acotadas; no inicia sesión ni omite RLS.
create role app_papa_executor nologin noinherit nobypassrls;
-- PostgreSQL administrado requiere SET para transferir las funciones al rol interno.
grant app_papa_executor to current_user with inherit true, set true;
grant usage on schema app_private, auth to authenticated, app_papa_executor;
grant execute on function auth.uid(), auth.jwt() to app_papa_executor;

-- Único lookup privilegiado: identidad de la sesión y perfil asignado por el operador.
create function app_private.current_access() returns text
language sql stable security definer set search_path = '' as $$
  select p.role from app_private.user_profiles p
  where p.id = auth.uid() and p.enabled
    and exists (select 1 from auth.sessions s
      where s.id::text = auth.jwt()->>'session_id' and s.user_id = p.id
        and (s.not_after is null or s.not_after > now()))
$$;
revoke all on function app_private.current_access() from public, anon, service_role;
grant execute on function app_private.current_access() to authenticated, app_papa_executor;

-- Acceso directo a originales: exclusivamente administradores activos.
grant select on all tables in schema app_private to authenticated, app_papa_executor;
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='app_private' loop
    execute format('create policy admin_read on app_private.%I for select to authenticated, app_papa_executor using ((select app_private.current_access()) = ''admin'')', t);
  end loop;
  foreach t in array array['custodians','clients','commercial_groups','commercial_advisors','accounts',
    'account_identifiers','account_assignments','advisor_group_memberships','import_scopes','import_batches',
    'import_rows','aum_monthly','revenue_entries'] loop
    execute format('grant insert, update on app_private.%I to authenticated, app_papa_executor', t);
    execute format('create policy admin_insert on app_private.%I for insert to authenticated, app_papa_executor with check ((select app_private.current_access()) = ''admin''%s)', t, case when exists (select 1 from information_schema.columns where table_schema='app_private' and table_name=t and column_name='created_by') then ' and created_by = auth.uid()' else '' end);
    execute format('create policy admin_update on app_private.%I for update to authenticated, app_papa_executor using ((select app_private.current_access()) = ''admin'') with check ((select app_private.current_access()) = ''admin'')', t);
  end loop;
end $$;
-- Sin GRANT de escritura de perfiles; ni siquiera un administrador se cambia su rol por API.
grant insert on app_private.audit_events to authenticated;
create policy audit_trigger_only on app_private.audit_events for insert to authenticated
with check (pg_trigger_depth() > 0 and actor_id = auth.uid() and app_private.current_access() = 'admin');
-- Publicación interna necesita añadir su evento explícito: se encapsula más abajo.

-- El rol de proyección lee hechos publicados mediante RLS, nunca originales por API.
grant select on app_private.import_scopes, app_private.import_batches,
  app_private.aum_monthly, app_private.revenue_entries,
  app_private.aum_current, app_private.revenue_current to app_papa_executor;
create policy published_scopes on app_private.import_scopes for select to app_papa_executor
using (app_private.current_access() in ('admin','reader') and active_batch_id is not null);
create policy published_batches on app_private.import_batches for select to app_papa_executor
using (app_private.current_access() in ('admin','reader') and status='published'
  and exists (select 1 from app_private.import_scopes s where s.active_batch_id=import_batches.id));
create policy published_aum on app_private.aum_monthly for select to app_papa_executor
using (app_private.current_access() in ('admin','reader')
  and exists (select 1 from app_private.import_batches b where b.id=batch_id));
create policy published_revenue on app_private.revenue_entries for select to app_papa_executor
using (app_private.current_access() in ('admin','reader')
  and exists (select 1 from app_private.import_batches b where b.id=batch_id));

create function app_private.published_metrics()
returns table(source text, account_id uuid, custodian_id uuid, period date, amount_usd text)
language sql stable security definer set search_path = '' as $$
  select 'aum', a.account_id, a.custodian_id, a.period::date, a.value_usd::text
  from app_private.aum_current a
  union all
  select 'revenue', r.account_id, r.custodian_id, r.period::date, r.payout_broker_usd::text
  from app_private.revenue_current r
$$;
-- Cambiar dueño requiere CREATE transitorio, revocado en esta misma transacción.
grant create on schema app_private to app_papa_executor;
alter function app_private.published_metrics() owner to app_papa_executor;
revoke create on schema app_private from app_papa_executor;
revoke all on function app_private.published_metrics() from public, anon, service_role;
grant execute on function app_private.published_metrics() to authenticated;

create function public.current_access() returns text
language sql stable security invoker set search_path = '' as $$ select app_private.current_access() $$;
create function public.published_metrics()
returns table(source text, account_id uuid, custodian_id uuid, period date, amount_usd text)
language sql stable security invoker set search_path = '' as $$ select * from app_private.published_metrics() $$;
-- Cada fuente se agrega independientemente; importes como texto decimal en JSON/JS.
create function public.published_totals()
returns table(source text, period date, total_usd text, row_count bigint, value_count bigint)
language sql stable security invoker set search_path = '' as $$
  select source, period, sum(amount_usd::numeric)::text, count(*), count(amount_usd)
  from public.published_metrics() group by source, period
$$;

-- Vistas administrativas invoker: también las escrituras directas pasan por RLS/triggers.
do $$ declare t text; begin
  foreach t in array array['custodians','clients','commercial_groups','commercial_advisors','accounts',
    'account_identifiers','account_assignments','advisor_group_memberships','import_scopes','import_batches',
    'import_rows','aum_monthly','revenue_entries'] loop
    execute format('create view public.admin_%I with (security_invoker=true) as select * from app_private.%I', t, t);
    execute format('revoke all on public.admin_%I from public, anon, authenticated, service_role', t);
    execute format('grant select, insert, update on public.admin_%I to authenticated', t);
  end loop;
end $$;

-- El evento de publicación se escribe con un rol acotado sujeto a RLS.
grant usage on schema extensions to authenticated;
grant execute on function app_private.cells_are_text(jsonb) to authenticated, app_papa_executor;
grant execute on function app_private.publish_import(uuid,uuid,uuid) to app_papa_executor;
grant insert on app_private.audit_events to app_papa_executor;
create policy audit_publish on app_private.audit_events for insert to app_papa_executor
with check (app_private.current_access()='admin' and actor_id=auth.uid());
create function app_private.publish_authorized(target_id uuid, expected_active_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  if app_private.current_access() is distinct from 'admin' then
    raise insufficient_privilege using message='Enabled administrator required';
  end if;
  return app_private.publish_import(target_id,expected_active_id,auth.uid());
end $$;
grant create on schema app_private to app_papa_executor;
alter function app_private.publish_authorized(uuid,uuid) owner to app_papa_executor;
revoke create on schema app_private from app_papa_executor;
revoke all on function app_private.publish_authorized(uuid,uuid) from public, anon, service_role;
grant execute on function app_private.publish_authorized(uuid,uuid) to authenticated;
create function public.publish_import(target_id uuid, expected_active_id uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
begin
  if app_private.current_access() is distinct from 'admin' then
    raise insufficient_privilege using message='Enabled administrator required';
  end if;
  return app_private.publish_authorized(target_id,expected_active_id);
end $$;

create function public.source_file(target_id uuid)
returns table(bucket text, object_path text)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if app_private.current_access() is distinct from 'admin' then
    raise insufficient_privilege using message='Enabled administrator required';
  end if;
  return query select b.storage_bucket,b.storage_object_path from app_private.import_batches b where b.id=target_id;
end $$;

revoke all on function public.current_access(), public.published_metrics(), public.published_totals(),
  public.publish_import(uuid,uuid), public.source_file(uuid) from public, anon, service_role;
grant execute on function public.current_access(), public.published_metrics(), public.published_totals(),
  public.publish_import(uuid,uuid), public.source_file(uuid) to authenticated;

insert into storage.buckets(id,name,public) values ('app-papa-imports','app-papa-imports',false);
-- Restrictive evita que otra política permisiva abra accidentalmente ESTE bucket.
create policy app_papa_sources_boundary on storage.objects as restrictive for all to anon, authenticated
using (bucket_id <> 'app-papa-imports' or app_private.current_access()='admin')
with check (bucket_id <> 'app-papa-imports' or app_private.current_access()='admin');
create policy app_papa_sources_read on storage.objects for select to authenticated
using (bucket_id='app-papa-imports' and app_private.current_access()='admin');
create policy app_papa_sources_insert on storage.objects for insert to authenticated
with check (bucket_id='app-papa-imports' and app_private.current_access()='admin');
-- Ni otra política permisiva puede habilitar sobreescritura/borrado de fuentes.
create policy app_papa_sources_no_update on storage.objects as restrictive for update to anon, authenticated
using (bucket_id <> 'app-papa-imports') with check (bucket_id <> 'app-papa-imports');
create policy app_papa_sources_no_delete on storage.objects as restrictive for delete to anon, authenticated
using (bucket_id <> 'app-papa-imports');
grant usage on schema app_private to anon;
grant execute on function app_private.current_access() to anon;

commit;
