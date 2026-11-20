begin;
grant app_papa_executor to current_user with inherit true, set true;
-- Una referencia de tasa puede proceder del Master sin inventar una obligación de comisiones.
alter table app_private.roa_rate_versions alter column source_event_id drop not null;
alter table app_private.roa_rate_versions add column master_publication_id uuid references app_private.master_publications(id);
alter table app_private.roa_rate_versions add column master_source_row integer;
alter table app_private.roa_rate_versions add constraint roa_rate_source check (
 (source_event_id is not null and master_publication_id is null and master_source_row is null) or
 (source_event_id is null and master_publication_id is not null and master_source_row is not null and master_source_row>2));
create index roa_rate_master_source on app_private.roa_rate_versions(master_publication_id) where master_publication_id is not null;

create function app_private.import_master_rates(request_id uuid,operation text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare
 m jsonb:=input->'master'; cfg jsonb:=input->'review'; r jsonb; cells jsonb; old_rates jsonb;
 rows jsonb:='[]'; planned jsonb:='[]'; result jsonb; prior app_private.master_publications;
 account uuid; custodian uuid; destinations uuid[]; class_ids uuid[]:='{}'; selected_accounts uuid[]:='{}';
 problem text; service text; identity_problem text; selected boolean; classify boolean;
 first_quarter date; last_quarter date; cutoff date; q date; quarter_count integer; rate numeric; revision text;
 previous_rate uuid; published integer:=0; classification_count integer:=0; plan jsonb;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege; end if;
 if request_id is null or operation is null or operation not in ('preview','publish') or input is null
  or octet_length(input::text)>12582912 or jsonb_typeof(m->'rows') is distinct from 'array'
  or jsonb_array_length(m->'rows') not between 1 and 5000 or coalesce(m->>'hash','') !~ '^[a-f0-9]{64}$'
  or coalesce(length(btrim(input->>'storage_path')),0)=0 or coalesce(length(btrim(cfg->>'evidence')),0)<10
  or length(cfg->>'evidence')>8000 or cfg->>'identity_confirmed' is distinct from 'true'
  or cfg->>'validity_confirmed' is distinct from 'true'
  or coalesce(cfg->>'quarter','') !~ '^[0-9]{4}-(01|04|07|10)-01$'
  or coalesce(cfg->>'quarter_to','') !~ '^[0-9]{4}-(01|04|07|10)-01$'
  or coalesce(cfg->>'cutoff','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  or jsonb_typeof(cfg->'selected') is distinct from 'array' then raise invalid_parameter_value; end if;
 first_quarter:=(cfg->>'quarter')::date; last_quarter:=(cfg->>'quarter_to')::date; cutoff:=(cfg->>'cutoff')::date;
 quarter_count:=((extract(year from last_quarter)-extract(year from first_quarter))*4+
  (extract(month from last_quarter)-extract(month from first_quarter))/3)::integer+1;
 if first_quarter>last_quarter or quarter_count not between 1 and 20 then
  raise invalid_parameter_value using message='Explicit range of at most 20 full quarters required'; end if;
 perform pg_advisory_xact_lock(71482026);
 perform pg_advisory_xact_lock(17112026,4);
 if operation='publish' then
  select * into prior from app_private.master_publications p where p.id=request_id;
  if found then
   if prior.input is distinct from input then raise invalid_parameter_value using message='Idempotency key reused'; end if;
   return prior.result;
  end if;
 end if;
 select md5(app_private.model_revision()||'/'||coalesce(string_agg(id::text,',' order by id),''))
  into revision from app_private.roa_rate_versions;
 if operation='publish' and revision is distinct from cfg->>'revision' then raise serialization_failure using message='Review changed'; end if;
 for r in select * from jsonb_array_elements(m->'rows') loop
  cells:=r->'cells'; account:=null; service:=null; identity_problem:=null; problem:=null;
  if jsonb_typeof(cells) is distinct from 'object' or not app_private.cells_are_text(cells)
   or not (cells ?& array['Broker','ACCOUNT','IP','IP Des','NAME','Owner Name payout','Fee type','Adv Fee / Retro','Status',
    'Gross anua USD','Net annual USD','Payout final REP','Final REP']) or not (cells ? (m->>'balanceHeader'))
   or cells->>'ACCOUNT' is distinct from r->>'account' or coalesce((r->>'row')::integer,0)<3 then raise invalid_parameter_value; end if;
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
  if account is null then identity_problem:='Correspondencia cuenta/custodio pendiente.';
  else select a.service into service from app_private.accounts a where a.id=account; end if;
  if r->>'numericAccount'='true' and cfg->>'numeric_accounts_confirmed' is distinct from 'true' then
   identity_problem:=concat_ws(' ',identity_problem,'Confirmá las cuentas numéricas tal como están escritas.'); end if;
  classify:=cfg->>'classify_advisory'='true' and cells->>'Fee type'='Advisory'
   and service='sin_clasificar' and identity_problem is null;
  if classify and not account=any(class_ids) then class_ids:=array_append(class_ids,account); end if;
  rate:=app_private.commission_decimal(r->'annualRate');
  problem:=identity_problem;
  if cells->>'Fee type' is distinct from 'Advisory' then problem:=concat_ws(' ',problem,'Fee type distinto de Advisory; se conserva sin convertir.'); end if;
  if service is distinct from 'Advisory' and not coalesce(classify,false) then
   problem:=concat_ws(' ',problem,'Servicio pendiente o en conflicto; no se sobrescribe otra clasificación.'); end if;
  if rate is null then problem:=concat_ws(' ',problem,'Sin tasa numérica confirmada; pendiente.');
  elsif rate<0 then problem:=concat_ws(' ',problem,'Tasa negativa: revisar sin convertir a cero.'); end if;
  selected:=(cfg->'selected') @> jsonb_build_array((r->>'row')::integer);
  select coalesce(jsonb_agg(jsonb_build_object('quarter',v.quarter,'annual_rate',v.annual_rate::text) order by v.quarter),'[]') into old_rates
   from (select distinct on(v.quarter) v.quarter,v.annual_rate from app_private.roa_rate_versions v
    where v.account_id=account and v.quarter between first_quarter and last_quarter order by v.quarter,v.revision desc) v;
  rows:=rows||jsonb_build_array(jsonb_build_object('row',r->'row','account_id',account,'service',service,
   'will_classify',coalesce(classify,false),'problem',problem,'selected',selected,'previous_rates',old_rates));
  if not selected then continue; end if;
  if problem is not null then
   if operation='publish' then raise invalid_parameter_value using message='Selected rate unresolved'; end if;
   continue;
  end if;
  if account=any(selected_accounts) then raise unique_violation using message='Multiple selected rates for account'; end if;
  selected_accounts:=array_append(selected_accounts,account);
  planned:=planned||jsonb_build_array(jsonb_build_object('account_id',account,'annual_rate',rate::text,'row',r->'row'));
 end loop;
 if operation='publish' and jsonb_array_length(cfg->'selected')<>jsonb_array_length(planned) then raise invalid_parameter_value; end if;
 classification_count:=cardinality(class_ids);
 if operation='publish' then published:=jsonb_array_length(planned)*quarter_count; end if;
 result:=jsonb_build_object('revision',revision,'rows',rows,'ready',jsonb_array_length(planned),
  'published',published,'snapshot_rows',jsonb_array_length(m->'rows'),'quarter_count',quarter_count,
  'classifications',classification_count,'quarter_from',first_quarter,'quarter_to',last_quarter,'mode','rates_only');
 if operation='publish' then
  insert into app_private.master_publications(id,input,result,created_by) values(request_id,input,result,app_private.session_user_id());
  perform set_config('app_papa.change_reason','Master '||request_id::text||': Fee type=Advisory; '||(cfg->>'evidence'),true);
  foreach account in array class_ids loop
   perform app_private.change_model('accounts',account,'{"service":"Advisory"}');
  end loop;
  for plan in select * from jsonb_array_elements(planned) loop
   for q in select d::date from generate_series(first_quarter,last_quarter,interval '3 months') d loop
    select id into previous_rate from app_private.roa_rate_versions v
     where v.account_id=(plan->>'account_id')::uuid and v.quarter=q order by revision desc limit 1;
    insert into app_private.roa_rate_versions(id,account_id,quarter,previous_id,annual_rate,evidence,created_by,master_publication_id,master_source_row)
     values(gen_random_uuid(),(plan->>'account_id')::uuid,q,previous_rate,(plan->>'annual_rate')::numeric,
      cfg->>'evidence',app_private.session_user_id(),request_id,(plan->>'row')::integer);
   end loop;
  end loop;
 end if;
 return result;
end $$;
grant create on schema app_private to app_papa_executor;
alter function app_private.import_master_rates(uuid,text,jsonb) owner to app_papa_executor;
revoke create on schema app_private from app_papa_executor;
revoke all on function app_private.import_master_rates(uuid,text,jsonb) from public,anon,service_role;
grant execute on function app_private.import_master_rates(uuid,text,jsonb) to authenticated;
create function public.import_master_rates(request_id uuid,operation text,input jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select app_private.import_master_rates(request_id,operation,input) $$;
revoke all on function public.import_master_rates(uuid,text,jsonb) from public,anon,service_role;
grant execute on function public.import_master_rates(uuid,text,jsonb) to authenticated;
revoke app_papa_executor from current_user granted by current_user;
commit;
