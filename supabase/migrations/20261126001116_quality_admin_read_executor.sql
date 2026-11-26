begin;
-- Sólo lectura administrativa: evita expandir las proyecciones recursivas de lectores.
do $role$
begin
 if not exists(select 1 from pg_roles where rolname='app_papa_quality_reader') then
  create role app_papa_quality_reader nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
 end if;
 if exists(select 1 from pg_roles where rolname='app_papa_quality_reader' and
 (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolinherit or rolbypassrls)) then
  raise exception 'Unexpected quality reader privileges';
 end if;
end $role$;
grant usage on schema app_private to app_papa_quality_reader;
grant execute on function app_private.current_access(),
 app_private.import_cell(app_private.import_batches,app_private.import_rows,text),
 app_private.import_references(app_private.import_batches,app_private.import_rows) to app_papa_quality_reader;
do $policies$
declare tab text;
begin
 foreach tab in array array['accounts','account_identifiers','import_uploads','import_batches','import_scopes','import_rows',
 'row_resolutions','aum_monthly','revenue_entries','fa_rows','reference_snapshots','reference_snapshot_rows',
 'reference_snapshot_head','master_publications','commission_events','audit_events','custodians'] loop
  execute format('grant select on app_private.%I to app_papa_quality_reader',tab);
  execute format('create policy quality_admin_read on app_private.%I for select to app_papa_quality_reader using ((select app_private.current_access())=''admin'')',tab);
 end loop;
end $policies$;
grant select on app_private.quality_records,app_private.aum_current,app_private.revenue_current,
 app_private.reference_current,app_private.commission_current to app_papa_quality_reader;
grant app_papa_executor,app_papa_quality_reader to current_user with inherit true,set true;
grant create on schema app_private to app_papa_quality_reader;
alter function app_private.quality_report(jsonb) owner to app_papa_quality_reader;
revoke create on schema app_private from app_papa_quality_reader;
revoke app_papa_executor,app_papa_quality_reader from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
