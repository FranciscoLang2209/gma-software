begin;
-- Proyección determinística de JSON: nunca cambia before_data/after_data ni ejecuta entradas.
create function app_private.quality_audit_context(previous jsonb,next_value jsonb) returns jsonb
language sql immutable security invoker set search_path='' as $body$
 select jsonb_build_object('source',e->'source','options',jsonb_build_object('source',e#>'{options,source}'),
 'custodian_id',e->'custodian_id','period',e->'period','batch_id',e->'batch_id')
 from (select coalesce(next_value,previous) e)x
$body$;
revoke all on function app_private.quality_audit_context(jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function app_private.quality_audit_context(jsonb,jsonb) to app_papa_executor;
alter table app_private.audit_events add column quality_context jsonb
 generated always as (app_private.quality_audit_context(before_data,after_data)) stored;
grant app_papa_quality_reader to current_user with inherit true,set true;
do $migration$
declare definition text; original text;
begin
 select pg_get_functiondef('app_private.quality_report(jsonb)'::regprocedure) into definition;
 original:=$part$case when source_filter is not null or start_month is not null or end_month is not null or custodian_filter is not null then coalesce(e.after_data,e.before_data) end entity$part$;
 if strpos(definition,original)=0 then raise exception 'Unexpected audit context'; end if;
 definition:=replace(definition,original,$part$case when source_filter is not null or start_month is not null or end_month is not null or custodian_filter is not null then e.quality_context end entity$part$);
 execute definition;
end $migration$;
revoke app_papa_quality_reader from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
