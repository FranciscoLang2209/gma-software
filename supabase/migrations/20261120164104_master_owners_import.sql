begin;
grant app_papa_executor to current_user with inherit true, set true;
create table app_private.master_publications (
 id uuid primary key, input jsonb not null, result jsonb not null,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default clock_timestamp()
);
alter table app_private.master_publications enable row level security;
alter table app_private.master_publications force row level security;
create policy master_admin_read on app_private.master_publications for select to app_papa_executor
 using ((select app_private.current_access())='admin');
create policy master_admin_insert on app_private.master_publications for insert to app_papa_executor
 with check ((select app_private.current_access())='admin' and created_by=app_private.session_user_id());
grant select,insert on app_private.master_publications to app_papa_executor;
create trigger master_immutable before update or delete on app_private.master_publications
 for each row execute function app_private.deny_history_change();

create function app_private.import_master(request_id uuid, operation text, input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare
 r jsonb; cfg jsonb:=input->'review'; m jsonb:=input->'master'; cells jsonb;
 rows jsonb:='[]'; planned jsonb:='[]'; result jsonb; retry app_private.master_publications;
 destinations uuid[]; account uuid; custodian uuid; prior uuid; obligation uuid; rate_id uuid; event_id uuid;
 service text; problem text; selected boolean; quarter date; cutoff date; revision text; keys text[]:='{}'; economic_key text;
 expected jsonb; plan jsonb; published integer:=0;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege; end if;
 if request_id is null or operation is null or operation not in ('preview','publish') or input is null
  or octet_length(input::text)>12582912
  or jsonb_typeof(m->'rows') is distinct from 'array' or jsonb_array_length(m->'rows') not between 1 and 5000
  or coalesce(m->>'hash','') !~ '^[a-f0-9]{64}$' or coalesce(length(input->>'storage_path'),0)=0
  or coalesce(length(btrim(cfg->>'evidence')),0)<10 or length(cfg->>'evidence')>8000
  or coalesce(cfg->>'quarter','') !~ '^[0-9]{4}-(01|04|07|10)-01$'
  or coalesce(cfg->>'cutoff','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  or cfg->>'identity_confirmed' is distinct from 'true' then raise invalid_parameter_value; end if;
 quarter:=(cfg->>'quarter')::date; cutoff:=(cfg->>'cutoff')::date;
 perform pg_advisory_xact_lock(71482026);
 perform pg_advisory_xact_lock(17112026,4);
 if operation='publish' then
  select * into retry from app_private.master_publications p where p.id=request_id;
  if found then
   if retry.input is distinct from input then raise invalid_parameter_value using message='Idempotency key reused'; end if;
   return retry.result;
  end if;
 end if;
 select md5(coalesce((select string_agg(id::text,',' order by id) from app_private.commission_current), '')||'/'||
  coalesce((select string_agg(id::text,',' order by id) from app_private.roa_rate_versions),'')||'/'||app_private.model_revision()) into revision;
 if operation='publish' and revision is distinct from cfg->>'revision' then raise serialization_failure using message='Review changed'; end if;
 for r in select * from jsonb_array_elements(m->'rows') loop
  cells:=r->'cells'; problem:=r->>'issue'; account:=null; service:=null;
  custodian:=nullif(cfg->'brokers'->>(cells->>'Broker'),'')::uuid;
  if nullif(cfg->'accounts'->>(r->>'row'),'') is not null then
   account:=(cfg->'accounts'->>(r->>'row'))::uuid;
   if not exists(select 1 from app_private.accounts a where a.id=account and a.custodian_id=custodian) then account:=null; end if;
  elsif custodian is not null then
   select array_agg(distinct i.account_id) into destinations from app_private.account_identifiers i
    where i.source='revenue' and i.namespace='ACCOUNT' and i.custodian_id=custodian
     and i.value_original=r->>'account' and i.resolution_status='resolved';
   if cardinality(destinations)=1 then account:=destinations[1]; end if;
  end if;
  if account is not null then select a.service into service from app_private.accounts a where a.id=account; end if;
  if account is null then problem:=concat_ws(' ',problem,'Correspondencia cuenta/custodio pendiente.'); end if;
  if r->>'numericAccount'='true' and cfg->>'numeric_accounts_confirmed' is distinct from 'true' then
   problem:=concat_ws(' ',problem,'Confirmá las cuentas numéricas tal como están escritas.');
  end if;
  if service is distinct from 'Advisory' then problem:=concat_ws(' ',problem,'La cuenta no está clasificada como Advisory.'); end if;
  if nullif(btrim(cells->>'Owner Name payout'),'') is null or nullif(btrim(cells->>'Fee type'),'') is null
   or nullif(btrim(cells->>'Broker'),'') is null then problem:=concat_ws(' ',problem,'Referencias de origen incompletas.'); end if;
  if app_private.commission_decimal(r->'annualRate')<0 then problem:=concat_ws(' ',problem,'Tasa negativa: requiere revisión fuera de esta publicación ROA.'); end if;
  selected:=coalesce(cfg->'selected','[]') @> jsonb_build_array((r->>'row')::integer);
  rows:=rows||jsonb_build_array(jsonb_build_object('row',r->'row','account_id',account,'service',service,'problem',problem,'selected',selected,'previous_rate',
   (select v.annual_rate::text from app_private.roa_rate_versions v where v.account_id=account and v.quarter=quarter order by revision desc limit 1)));
  if not selected then continue; end if;
  if problem is not null or app_private.commission_decimal(r->'annualRate') is null or app_private.commission_decimal(r->'balance') is null then
   if operation='publish' then raise invalid_parameter_value using message='Selected row is unresolved'; end if;
   continue;
  end if;
  economic_key:=account::text;
  if economic_key=any(keys) then raise unique_violation using message='Multiple selected fees for same account; review components separately'; end if;
  keys:=array_append(keys,economic_key);
  -- Un componente estable permite corregir otra versión sin duplicar obligaciones.
  select c.target_id,c.id into obligation,prior from app_private.commission_current c where c.operation='expected'
   and c.result->>'account_id'=account::text and c.result->>'quarter'=quarter::text
   and c.result->>'component_key'='master-owners';
  if obligation is null then obligation:=gen_random_uuid(); end if;
  select v.id into rate_id from app_private.roa_rate_versions v where v.account_id=account and v.quarter=quarter order by revision desc limit 1;
  expected:=jsonb_build_object('previous_id',prior,'account_id',account,'custodian_id',custodian,
   'quarter',quarter,'cutoff',cutoff,'cutoff_evidence',cfg->>'evidence','account_evidence',cfg->>'evidence',
   'broker',cells->>'Broker','owner',cells->>'Owner Name payout','fee_type',cells->>'Fee type','basis','gross',
   'component_key','master-owners','balance',r->'balance','annual_rate',r->'annualRate',
   'rate_evidence_status','confirmed_for_quarter','rate_evidence',cfg->>'evidence',
   'fee_rule','balance_annual_div4_v1','fee_rule_evidence',cfg->>'evidence','eligibility_confirmed',true,
   'source_file',m->>'file','source_sheet',m->>'sheet','source_row',r->'row','file_sha256',m->>'hash',
   'balance_header',m->>'balanceHeader','original_cells',cells,'normalization_evidence','USD; Adv Fee / Retro en puntos básicos anuales /10000; '||(cfg->>'evidence'),
   'reason',cfg->>'evidence','master_storage_path',input->>'storage_path');
  planned:=planned||jsonb_build_array(jsonb_build_object('obligation',obligation,'input',expected,'rate_id',rate_id));
 end loop;
 if jsonb_array_length(coalesce(cfg->'selected','[]'))<>jsonb_array_length(planned) and operation='publish' then raise invalid_parameter_value; end if;
 if operation='publish' then
  for plan in select * from jsonb_array_elements(planned) loop
   event_id:=gen_random_uuid();
   perform app_private.manage_commission(event_id,'expected',(plan->>'obligation')::uuid,plan->'input');
   perform app_private.publish_roa_rate(gen_random_uuid(),event_id,(plan->>'rate_id')::uuid,cfg->>'evidence');
   published:=published+1;
  end loop;
 end if;
 result:=jsonb_build_object('revision',revision,'rows',rows,'ready',jsonb_array_length(planned),
  'published',published,'snapshot_rows',jsonb_array_length(m->'rows'));
 if operation='publish' then
  insert into app_private.master_publications(id,input,result,created_by) values(request_id,input,result,app_private.session_user_id());
 end if;
 return result;
end $$;
grant create on schema app_private to app_papa_executor;
alter function app_private.import_master(uuid,text,jsonb) owner to app_papa_executor;
revoke create on schema app_private from app_papa_executor;
revoke all on function app_private.import_master(uuid,text,jsonb) from public,anon,service_role;
grant execute on function app_private.import_master(uuid,text,jsonb) to authenticated;
create function public.import_master(request_id uuid,operation text,input jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select app_private.import_master(request_id,operation,input) $$;
revoke all on function public.import_master(uuid,text,jsonb) from public,anon,service_role;
grant execute on function public.import_master(uuid,text,jsonb) to authenticated;
revoke app_papa_executor from current_user granted by current_user;
commit;
