begin;
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;

create function app_private.reference_filter_accounts(filters jsonb) returns uuid[]
language plpgsql stable security invoker set search_path='' as $$
declare head uuid; dimension text; choice text; label text; representative integer; labels jsonb:='{}'; population uuid[];
begin
 if coalesce(app_private.current_access(),'') not in ('admin','reader') then raise insufficient_privilege; end if;
 if filters is null or jsonb_typeof(filters)<>'object' or exists(select 1 from jsonb_object_keys(filters)k where k not in ('snapshot','client','advisor','team')) then raise invalid_parameter_value; end if;
 if filters='{}' then return null; end if;
 if jsonb_typeof(filters->'snapshot') is distinct from 'string' or (filters->>'snapshot') !~* '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$' then raise invalid_parameter_value; end if;
 select snapshot_id into head from app_private.reference_snapshot_head;
 if head is distinct from (filters->>'snapshot')::uuid then raise serialization_failure using message='REF snapshot changed; restart selection'; end if;
 foreach dimension in array array['client','advisor','team'] loop
  if not filters ? dimension then continue; end if;
  if jsonb_typeof(filters->dimension) is distinct from 'string' then raise invalid_parameter_value; end if;
  choice:=filters->>dimension;
  if choice='sin_referencia' then labels:=labels||jsonb_build_object(dimension,null); continue; end if;
  if choice !~ '^[1-9][0-9]{0,8}$' then raise invalid_parameter_value; end if;
  select case dimension when 'client' then client_label when 'advisor' then advisor_label else team_label end into label
   from app_private.reference_current where source_row=choice::integer;
  if label is null then raise invalid_parameter_value using message='Invalid REF selection'; end if;
  select min(source_row) into representative from app_private.reference_current
   where (case dimension when 'client' then client_label when 'advisor' then advisor_label else team_label end)=label;
  if representative<>choice::integer then raise invalid_parameter_value using message='REF group representative required'; end if;
  labels:=labels||jsonb_build_object(dimension,label);
 end loop;
 if labels='{}' then return null; end if;
 select coalesce(array_agg(a.id order by a.id),'{}'::uuid[]) into population
 from app_private.accounts a left join app_private.reference_current r on r.account_id=a.id
 where (not labels ? 'client' or r.client_label is not distinct from labels->>'client')
  and (not labels ? 'advisor' or r.advisor_label is not distinct from labels->>'advisor')
  and (not labels ? 'team' or r.team_label is not distinct from labels->>'team');
 return population;
end $$;

create function app_private.reference_filter_options() returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if coalesce(app_private.current_access(),'') not in ('admin','reader') then raise insufficient_privilege; end if;
 if not exists(select 1 from app_private.reference_snapshot_head) then return null; end if;
 with labels as (
  select d.kind,d.label,min(r.source_row) id,bool_or(r.account_id is not null) has_account
  from app_private.reference_current r cross join lateral (values ('ref_cliente',r.client_label),('ref_comercial',r.advisor_label),('ref_equipo',r.team_label))d(kind,label)
  where d.label is not null group by d.kind,d.label
 ), groups as (select kind,jsonb_agg(jsonb_build_object('id',id::text,'label',label) order by label collate "C",id) items from labels where has_account group by kind)
 select jsonb_build_object('snapshot',(select snapshot_id from app_private.reference_snapshot_head),'options',coalesce(jsonb_object_agg(kind,items),'{}')) into result from groups;
 return result;
end $$;
revoke all on function app_private.reference_filter_accounts(jsonb),app_private.reference_filter_options() from public,anon,authenticated,service_role;
grant execute on function app_private.reference_filter_accounts(jsonb),app_private.reference_filter_options() to app_papa_executor;

-- Copias versionadas: se conservan fórmulas, guards y contrato previo para otros clientes.
-- Fallar si cambia la estructura esperada, en lugar de omitir un filtro silenciosamente.
do $migration$
declare name text; definition text; original text; result_name text; arguments text; oid regprocedure;
begin
 foreach name in array array['aggregate_report','account_directory','account_detail','quarterly_roa_report'] loop
  select p.oid::regprocedure into strict oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='app_private' and p.proname=name;
  definition:=pg_get_functiondef(oid); original:=definition;
  definition:=replace(definition,'FUNCTION app_private.'||name||'(','FUNCTION app_private.'||name||'_ref(reference_filters jsonb, ');
  definition:=replace(definition,'declare ','declare ref_population uuid[]; ');
  definition:=replace(definition,E'begin\n',E'begin\n ref_population:=app_private.reference_filter_accounts(reference_filters);\n');
  if name in ('aggregate_report','quarterly_roa_report') then
   if strpos(definition,'and (account is null or account_id=account)')=0 then raise exception 'Unexpected financial population'; end if;
   definition:=replace(definition,'and (account is null or account_id=account)','and (account is null or account_id=account) and (ref_population is null or account_id=any(ref_population))');
  end if;
  if name='aggregate_report' then
   if strpos(definition,'where n<=100 group by kind')=0 then raise exception 'Unexpected option limit'; end if;
   definition:=replace(definition,'where n<=100 group by kind','group by kind');
   definition:=replace(definition,'''cuenta'',f.account_id::text,f.account_id::text','''cuenta'',f.account_id::text,coalesce((select i.value_original from app_private.account_identifiers i where i.account_id=f.account_id and i.resolution_status=''resolved'' order by case i.source when ''revenue'' then 0 when ''aum'' then 1 else 2 end,i.namespace collate "C",i.value_original collate "C",i.id limit 1),f.account_id::text)');
  end if;
  if name='account_directory' then
   definition:=replace(definition,'app_private.aggregate_report(','app_private.aggregate_report_ref(reference_filters,');
   if strpos(definition,'where (custodian is null or ac.custodian_id=custodian)')=0 then raise exception 'Unexpected directory population'; end if;
   definition:=replace(definition,'where (custodian is null or ac.custodian_id=custodian)','where (ref_population is null or ac.id=any(ref_population)) and (custodian is null or ac.custodian_id=custodian)');
  end if;
  if name='account_detail' then
   if strpos(definition,'and (service_filter is null or ac.service=service_filter) matches_filters')=0 then raise exception 'Unexpected detail population'; end if;
   definition:=replace(definition,'app_private.aggregate_report(','app_private.aggregate_report_ref(reference_filters,');
   definition:=replace(definition,'and (service_filter is null or ac.service=service_filter) matches_filters','and (service_filter is null or ac.service=service_filter) and (ref_population is null or ac.id=any(ref_population)) matches_filters');
   definition:=replace(definition,'where a.account_id=target_id and a.period between month_from and month_to','where a.account_id=target_id and a.period between month_from and month_to and exists(select 1 from monthly m where m.account_id=a.account_id and m.period=a.period and m.matches_filters)');
  end if;
  result_name:=case when name='quarterly_roa_report' then 'answer' else 'result' end;
  if strpos(definition,' if expected_revision is not null')=0 then raise exception 'Missing revision check'; end if;
  definition:=replace(definition,' if expected_revision is not null',format(E' %1$s:=%1$s||jsonb_build_object(''reference_filters'',reference_filters,''reference_options'',app_private.reference_filter_options(),''revision'',md5((%1$s->>''revision'')||reference_filters::text));\n if expected_revision is not null',result_name));
  if definition=original or strpos(definition,'ref_population:=')=0 then raise exception 'Unexpected report definition'; end if;
  execute definition;
  select pg_get_function_identity_arguments(p.oid) into arguments from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='app_private' and p.proname=name||'_ref';
  execute format('alter function app_private.%I(%s) owner to app_papa_executor',name||'_ref',arguments);
  execute format('revoke all on function app_private.%I(%s) from public,anon,service_role',name||'_ref',arguments);
  execute format('grant execute on function app_private.%I(%s) to authenticated',name||'_ref',arguments);
  select pg_get_functiondef(p.oid) into strict definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=name;
  definition:=replace(definition,'FUNCTION public.'||name||'(','FUNCTION public.'||name||'_ref(reference_filters jsonb, ');
  definition:=replace(definition,'app_private.'||name||'(','app_private.'||name||'_ref(reference_filters,');
  execute definition;
  select pg_get_function_identity_arguments(p.oid) into arguments from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=name||'_ref';
  execute format('revoke all on function public.%I(%s) from public,anon,service_role',name||'_ref',arguments);
  execute format('grant execute on function public.%I(%s) to authenticated',name||'_ref',arguments);
 end loop;
end $migration$;
revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
