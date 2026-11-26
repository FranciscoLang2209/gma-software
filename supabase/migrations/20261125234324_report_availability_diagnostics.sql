begin;
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;

-- Sólo recuentos publicados del período, antes de filtros. Sin importes ni staging.
create function app_private.report_availability(month_from date,month_to date) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare answer jsonb;
begin
 if coalesce(app_private.current_access(),'') not in ('admin','reader') then raise insufficient_privilege; end if;
 with facts as materialized (
  select account_id from app_private.aum_current where period between month_from and month_to
  union all select account_id from app_private.revenue_current where period between month_from and month_to
 ), observed as (select distinct account_id from facts)
 select jsonb_build_object('period_rows',(select count(*) from facts),
  'accounts_without_client',(select count(*) from observed o join app_private.accounts a on a.id=o.account_id where a.client_id is null),
  'unclassified_accounts',(select count(*) from observed o join app_private.accounts a on a.id=o.account_id where a.service='sin_clasificar')) into answer;
 return answer;
end $$;
alter function app_private.report_availability(date,date) owner to app_papa_executor;
revoke all on function app_private.report_availability(date,date) from public,anon,authenticated,service_role;
grant execute on function app_private.report_availability(date,date) to app_papa_executor;

-- El mismo snapshot SQL y revisión que las cifras; se conservan firmas, guards y fórmulas.
do $migration$
declare name text; definition text; result_name text; dates text;
begin
 foreach name in array array['aggregate_report_ref','quarterly_roa_report_ref'] loop
  select pg_get_functiondef(p.oid) into strict definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='app_private' and p.proname=name;
  if strpos(definition,' if expected_revision is not null')=0 or strpos(definition,'''availability''')>0 then raise exception 'Unexpected report definition'; end if;
  result_name:=case when name='aggregate_report_ref' then 'result' else 'answer' end;
  dates:=case when name='aggregate_report_ref' then 'month_from,month_to' else 'first_month,last_month' end;
  definition:=replace(definition,' if expected_revision is not null',format(E' %1$s:=%1$s||jsonb_build_object(''availability'',app_private.report_availability(%2$s));\n %1$s:=%1$s||jsonb_build_object(''revision'',md5((%1$s->>''revision'')||(%1$s->''availability'')::text));\n if expected_revision is not null',result_name,dates));
  execute definition;
 end loop;
 -- Comisiones conserva su universo, incluidas filas Revenue por revisar; no fabrica expectativas.
 select pg_get_functiondef(p.oid) into strict definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='app_private' and p.proname='commission_dashboard';
 if strpos(definition,'return answer||jsonb_build_object(''revision'',md5(answer::text));')=0 then raise exception 'Unexpected commission definition'; end if;
 definition:=replace(definition,'return answer||jsonb_build_object(''revision'',md5(answer::text));',
  E'answer:=answer||jsonb_build_object(''availability'',jsonb_build_object(''period_rows'',(app_private.commission_report((filters-''broker''-''account_id''-''owner''-''fee_type''-''status''-''basis''-''min_absolute_variance''-''min_absolute_percentage''-''offset''-''limit'')||''{"limit":1,"offset":0}''::jsonb)->>''row_count'')::integer));\n return answer||jsonb_build_object(''revision'',md5(answer::text));');
 execute definition;
end $migration$;
revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
