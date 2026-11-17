begin;
grant app_papa_executor to current_user with inherit true, set true;

-- Versiones inmutables de análisis revisado; no modifica hechos Revenue ni liquida pagos.
create table app_private.commission_events (
 id uuid primary key,
 operation text not null check(operation in ('expected','receipt','reconcile')),
 target_id uuid not null,
 previous_id uuid references app_private.commission_events(id),
 revision bigint generated always as identity unique,
 input jsonb not null check(jsonb_typeof(input)='object'),
 result jsonb not null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default clock_timestamp()
);
create index commission_event_current on app_private.commission_events(operation,target_id,revision desc);
alter table app_private.commission_events enable row level security;
alter table app_private.commission_events force row level security;
create policy commission_read on app_private.commission_events for select to app_papa_executor,authenticated
 using ((select app_private.current_access())='admin');
create policy commission_insert on app_private.commission_events for insert to app_papa_executor
 with check ((select app_private.current_access())='admin' and created_by=auth.uid());
grant select on app_private.commission_events to authenticated,app_papa_executor;
grant insert on app_private.commission_events to app_papa_executor;
grant usage on sequence app_private.commission_events_revision_seq to app_papa_executor;
create trigger commission_immutable before update or delete on app_private.commission_events
 for each row execute function app_private.deny_history_change();
create view app_private.commission_current with (security_invoker=true) as
 select distinct on(operation,target_id) * from app_private.commission_events order by operation,target_id,revision desc;
grant select on app_private.commission_current to app_papa_executor;

-- Canonical decimal strings only: no JS Number, local separators, NaN or infinity.
create function app_private.commission_decimal(value jsonb) returns numeric
language plpgsql immutable security invoker set search_path='' as $$
begin
 if value is null or value='null'::jsonb then return null; end if;
 if jsonb_typeof(value)<>'string' or length(value#>>'{}')>1000
  or (value#>>'{}') !~ '^-?[0-9]+(\.[0-9]+)?$' then
  raise invalid_parameter_value using message='Canonical decimal string required';
 end if;
 return (value#>>'{}')::numeric;
end $$;
revoke all on function app_private.commission_decimal(jsonb) from public,anon,authenticated,service_role;
grant execute on function app_private.commission_decimal(jsonb) to app_papa_executor;

create function app_private.manage_commission(request_id uuid,operation text,target_id uuid,input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare
 prior app_private.commission_events; retry app_private.commission_events; ev app_private.commission_events;
 item jsonb; r app_private.revenue_entries; result jsonb; expected jsonb; receipt jsonb;
 quarter date; cutoff date; account uuid; custodian uuid; balance numeric; rate numeric;
 annual numeric; quarterly numeric; actual numeric:=null; basis text; metric text; amount numeric;
 links jsonb:='[]'; ids uuid[]:='{}'; entry_id uuid; expected_id uuid; confirmed boolean;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege; end if;
 if request_id is null or target_id is null or operation is null or operation not in ('expected','receipt','reconcile')
  or input is null or jsonb_typeof(input)<>'object' or octet_length(input::text)>1048576
  or coalesce(length(btrim(input->>'reason')),0)=0 then raise invalid_parameter_value; end if;
 -- Un único lock local al módulo serializa correcciones y asignaciones entre obligaciones.
 -- shortcut: serialización global; particionar locks si el volumen real de revisión lo requiere.
 perform pg_advisory_xact_lock(17112026,4);
 select * into retry from app_private.commission_events e where e.id=request_id;
 if found then
  if (retry.operation,retry.target_id,retry.input) is distinct from (operation,target_id,input) then
   raise invalid_parameter_value using message='Idempotency key reused with different input';
  end if;
  return jsonb_build_object('id',retry.id,'result',retry.result);
 end if;
 select * into prior from app_private.commission_current e where e.operation=manage_commission.operation and e.target_id=manage_commission.target_id;
 if prior.id is distinct from (input->>'previous_id')::uuid then
  raise serialization_failure using message='Commission version changed; review again';
 end if;
 if operation in ('expected','receipt') then
  if coalesce(input->>'quarter','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise invalid_parameter_value using message='ISO quarter required'; end if;
  quarter:=(input->>'quarter')::date;
  if quarter is null or not isfinite(quarter) or quarter<>date_trunc('quarter',quarter)::date then raise invalid_parameter_value using message='Explicit calendar quarter required'; end if;
  basis:=input->>'basis';
  if basis is null or basis not in ('gross','net','representative_payout') then raise invalid_parameter_value using message='Explicit financial basis required'; end if;
  if coalesce(length(btrim(input->>'fee_type')),0)=0 or coalesce(length(btrim(input->>'owner')),0)=0
   or coalesce(length(btrim(input->>'broker')),0)=0 then raise invalid_parameter_value; end if;
 end if;
 if operation='expected' then
  account:=(input->>'account_id')::uuid; custodian:=(input->>'custodian_id')::uuid;
  if not exists(select 1 from app_private.accounts a where a.id=account and a.custodian_id=custodian) then raise invalid_parameter_value using message='Resolved account and custodian required'; end if;
  if coalesce(input->>'cutoff','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise invalid_parameter_value using message='ISO cutoff required'; end if;
  cutoff:=(input->>'cutoff')::date;
  if cutoff is null or not isfinite(cutoff) or coalesce(length(btrim(input->>'cutoff_evidence')),0)=0
   or coalesce(length(btrim(input->>'source_file')),0)=0 or coalesce(length(btrim(input->>'source_sheet')),0)=0
   or coalesce((input->>'source_row')::integer,0)<1
   or coalesce(input->>'file_sha256','') !~ '^[0-9a-f]{64}$'
   or jsonb_typeof(input->'original_cells') is distinct from 'object'
   or not app_private.cells_are_text(input->'original_cells')
   or not (input->'original_cells' ?& array['Broker','ACCOUNT','IP','IP Des','NAME','Owner Name payout','Fee type','Adv Fee / Retro','Status','Gross anua USD','Net annual USD','Payout final REP','Final REP'])
   or coalesce(length(btrim(input->>'normalization_evidence')),0)=0
   or coalesce(length(btrim(input->>'account_evidence')),0)=0
   or coalesce(length(input->>'balance_header'),0)=0
   or not (input->'original_cells' ? (input->>'balance_header')) then
   raise invalid_parameter_value using message='Source originals and explicit cutoff evidence required';
  end if;
  if input->>'owner' is distinct from input->'original_cells'->>'Owner Name payout'
   or input->>'fee_type' is distinct from input->'original_cells'->>'Fee type'
   or input->>'broker' is distinct from input->'original_cells'->>'Broker'
   or not (input->'original_cells' ? 'Adv Fee / Retro') then raise invalid_parameter_value using message='Preserve source identity and rate'; end if;
  if coalesce(length(btrim(input->>'component_key')),0)=0 then raise invalid_parameter_value using message='Explicit additive component key required'; end if;
  if exists(select 1 from app_private.commission_current c where c.operation='expected' and c.target_id<>manage_commission.target_id
   and (c.result->>'account_id',c.result->>'quarter',c.result->>'owner',c.result->>'fee_type',c.result->>'basis',c.result->>'broker',c.result->>'component_key')
   is not distinct from (account::text,quarter::text,input->>'owner',input->>'fee_type',basis,input->>'broker',input->>'component_key')) then
   raise unique_violation using message='Economic obligation already exists; correct its version';
  end if;
  balance:=app_private.commission_decimal(input->'balance'); rate:=app_private.commission_decimal(input->'annual_rate');
  -- Aplicación trimestral sólo cuando evidencia, elegibilidad y efecto de Fee type fueron revisados.
  confirmed:=coalesce(input->>'rate_evidence_status','')='confirmed_for_quarter'
   and coalesce(length(btrim(input->>'rate_evidence')),0)>0
   and input->>'fee_rule'='balance_annual_div4_v1'
   and coalesce(length(btrim(input->>'fee_rule_evidence')),0)>0
   and input->>'eligibility_confirmed'='true'
   and coalesce(length(btrim(input->'original_cells'->>'Adv Fee / Retro')),0)>0
   and coalesce(length(btrim(input->'original_cells'->>(input->>'balance_header'))),0)>0;
  annual:=balance*rate;
  -- Multiplicar por 0.25 conserva todas las cifras decimales, incluso con escalas extensas.
  quarterly:=annual*0.25;
  result:=jsonb_build_object('account_id',account,'custodian_id',custodian,'quarter',quarter,'cutoff',cutoff,
   'broker',input->>'broker','owner',input->>'owner','fee_type',input->>'fee_type','basis',basis,
   'balance',balance::text,'annual_rate',rate::text,'rate_evidence_status',input->>'rate_evidence_status',
   'component_key',input->>'component_key','formula','balance_annual_div4_v1','expected_annual',annual::text,'expected_quarterly',quarterly::text,
   'verified',confirmed and balance is not null and rate is not null,'status','pending',
   'excel_checks','[]'::jsonb);
  -- Cada control declara período/base; jamás compara Gross con Net por el nombre del header.
  for item in select * from jsonb_array_elements(coalesce(input->'excel_checks','[]')) loop
   amount:=app_private.commission_decimal(item->'value');
   if not (input->'original_cells' ? (item->>'header')) or coalesce(item->>'periodicity','') not in ('annual','quarterly')
    or item->>'basis' is distinct from basis or amount is null or coalesce(length(item->>'evidence'),0)=0 then raise invalid_parameter_value; end if;
   result:=jsonb_set(result,'{excel_checks}',result->'excel_checks'||jsonb_build_array(jsonb_build_object(
    'header',item->>'header','original',input->'original_cells'->(item->>'header'),'value',amount::text,
    'calculated',(case when item->>'periodicity'='annual' then annual else quarterly end)::text,
    'difference',(amount-case when item->>'periodicity'='annual' then annual else quarterly end)::text)));
  end loop;
 elsif operation='receipt' then
  select * into r from app_private.revenue_current where id=target_id;
  if not found then raise invalid_parameter_value using message='Active published Revenue movement required'; end if;
  metric:=input->>'metric';
  if metric is null or metric not in ('Payout broker','GROSS','TOTAL','Payout Medina','NET Payout REP') then raise invalid_parameter_value; end if;
  if input->>'received_confirmed' is distinct from 'true' or coalesce(length(input->>'evidence'),0)=0
   or coalesce(length(input->>'period_evidence'),0)=0 or coalesce(length(input->>'normalization_evidence'),0)=0 then raise invalid_parameter_value using message='Receipt and accrual quarter evidence required'; end if;
  amount:=app_private.commission_decimal(input->'amount');
  if amount is null or coalesce(length(btrim(input->>'source_value')),0)=0 or input->>'source_value' is distinct from (case metric when 'Payout broker' then r.payout_broker_original
   when 'GROSS' then r.gross_original when 'TOTAL' then r.total_original when 'Payout Medina' then r.payout_medina_original
   when 'NET Payout REP' then r.net_payout_rep_original end) then raise invalid_parameter_value using message='Original metric and normalized amount required'; end if;
  if metric='Payout broker' and amount is distinct from r.payout_broker_usd then raise invalid_parameter_value using message='Payout broker amount differs from published decimal'; end if;
  result:=jsonb_build_object('entry_id',r.id,'batch_id',r.batch_id,'import_row_id',r.import_row_id,
   'account_id',r.account_id,'custodian_id',r.custodian_id,'revenue_month',r.period,'quarter',quarter,
   'broker',input->>'broker','owner',input->>'owner','fee_type',input->>'fee_type','basis',basis,'metric',metric,'amount',amount::text);
 else
  select * into ev from app_private.commission_current e where e.operation='expected' and e.target_id=manage_commission.target_id;
  if not found or ev.id is distinct from (input->>'expected_id')::uuid then raise serialization_failure using message='Expected version changed'; end if;
  expected:=ev.result; expected_id:=ev.id;
  if jsonb_typeof(input->'receipt_ids') is distinct from 'array' or jsonb_array_length(input->'receipt_ids')>5000 then raise invalid_parameter_value; end if;
  for item in select * from jsonb_array_elements(input->'receipt_ids') loop
   select * into ev from app_private.commission_events e where e.id=(item#>>'{}')::uuid and e.operation='receipt';
   receipt:=ev.result; entry_id:=ev.target_id;
   if not found or not exists(select 1 from app_private.commission_current c where c.id=ev.id)
    or not exists(select 1 from app_private.revenue_current rc where rc.id=entry_id) then raise serialization_failure using message='Receipt version changed'; end if;
   if entry_id=any(ids) then raise unique_violation using message='Duplicate Revenue movement'; end if;
   if exists(select 1 from app_private.commission_current c where c.operation='reconcile' and c.target_id<>manage_commission.target_id
    and c.result->'entry_ids' ? entry_id::text) then raise unique_violation using message='Revenue already assigned to another obligation'; end if;
   if (receipt->>'account_id',receipt->>'custodian_id',receipt->>'quarter',receipt->>'owner',receipt->>'fee_type',receipt->>'basis',receipt->>'broker')
    is distinct from (expected->>'account_id',expected->>'custodian_id',expected->>'quarter',expected->>'owner',expected->>'fee_type',expected->>'basis',expected->>'broker') then
    raise invalid_parameter_value using message='Receipt is not comparable to obligation';
   end if;
   ids:=array_append(ids,entry_id); links:=links||jsonb_build_array(ev.id::text);
   actual:=coalesce(actual,0)+(receipt->>'amount')::numeric;
  end loop;
  confirmed:=coalesce((input->>'review_complete')::boolean,false);
  amount:=(expected->>'expected_quarterly')::numeric;
  result:=expected||jsonb_build_object('expected_id',expected_id,'receipt_ids',links,'entry_ids',to_jsonb(ids),
   'review_complete',confirmed,'actual_received',actual::text,
   'variance',case when expected->>'verified'='true' and confirmed and actual is not null then (actual-amount)::text end,
   'variance_percentage',case when expected->>'verified'='true' and confirmed and actual is not null and amount<>0 then ((actual-amount)*100/amount)::text end,
   'variance_numerator',case when expected->>'verified'='true' and confirmed and actual is not null then ((actual-amount)*100)::text end,
   'variance_denominator',case when expected->>'verified'='true' and confirmed and actual is not null then amount::text end,
   'status',case when expected->>'verified'<>'true' or not confirmed then 'pending'
    when actual is null then 'missing_actual' when actual=amount then 'matched' else 'variance' end);
 end if;
 insert into app_private.commission_events(id,operation,target_id,previous_id,input,result,created_by)
 values(request_id,operation,target_id,prior.id,input,result,auth.uid());
 return jsonb_build_object('id',request_id,'result',result);
end $$;

create function app_private.commission_report(filters jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare answer jsonb; report_year integer; report_quarter integer; min_abs numeric; min_pct numeric;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege; end if;
 report_year:=(filters->>'year')::integer; report_quarter:=(filters->>'quarter')::integer;
 if filters is null or jsonb_typeof(filters)<>'object' or (report_year is not null and report_year not between 1900 and 9999)
  or (report_quarter is not null and report_quarter not between 1 and 4)
  or coalesce((filters->>'limit')::integer,100) not between 1 and 500
  or coalesce((filters->>'offset')::integer,0) not between 0 and 1000000
  or (filters ? 'status' and filters->>'status' not in ('matched','variance','pending','missing_expected','missing_actual')) then raise invalid_parameter_value; end if;
 min_abs:=app_private.commission_decimal(filters->'min_absolute_variance');
 min_pct:=app_private.commission_decimal(filters->'min_absolute_percentage');
 with expected as (
  select e.target_id obligation_id,e.id expected_id,e.result,
   c.result reconciliation,c.id reconciliation_id,
   c.id is not null and c.result->>'expected_id'=e.id::text and not exists(
    select 1 from jsonb_array_elements_text(c.result->'receipt_ids') x(id)
    left join app_private.commission_current rc on rc.id=x.id::uuid and rc.operation='receipt'
    left join app_private.revenue_current r on r.id=rc.target_id where rc.id is null or r.id is null) fresh
  from app_private.commission_current e left join app_private.commission_current c
   on c.target_id=e.target_id and c.operation='reconcile' where e.operation='expected'
 ), rows as (
  select result||jsonb_build_object('obligation_id',obligation_id,'expected_id',expected_id,'reconciliation_id',reconciliation_id,
   'status',case when fresh then reconciliation->>'status' else 'pending' end,
   'actual_received',case when fresh then reconciliation->>'actual_received' end,
   'variance',case when fresh then reconciliation->>'variance' end,
   'variance_percentage',case when fresh then reconciliation->>'variance_percentage' end,
   'variance_numerator',case when fresh then reconciliation->>'variance_numerator' end,
   'variance_denominator',case when fresh then reconciliation->>'variance_denominator' end,
   'requires_review',not fresh) row from expected
  union all
  select coalesce(c.result,jsonb_build_object('entry_id',r.id,'account_id',r.account_id,'custodian_id',r.custodian_id,
   'quarter',date_trunc('quarter',r.period)::date,'period_provisional',true))||jsonb_build_object(
    'status',case when c.id is null then 'pending' else 'missing_expected' end,
    'actual_received',c.result->>'amount','expected_quarterly',null,'variance',null,'variance_percentage',null)
  from app_private.revenue_current r left join app_private.commission_current c on c.operation='receipt' and c.target_id=r.id
  where not exists(select 1 from app_private.commission_current a where a.operation='reconcile' and a.result->'entry_ids' ? r.id::text)
 ), selected as materialized (
  select row from rows where (report_year is null or extract(year from (row->>'quarter')::date)=report_year)
   and (report_quarter is null or extract(quarter from (row->>'quarter')::date)=report_quarter)
   and (not filters ? 'account_id' or row->>'account_id'=filters->>'account_id')
   and (not filters ? 'broker' or row->>'broker'=filters->>'broker')
   and (not filters ? 'owner' or row->>'owner'=filters->>'owner')
   and (not filters ? 'fee_type' or row->>'fee_type'=filters->>'fee_type')
   and (not filters ? 'status' or row->>'status'=filters->>'status')
   and (min_abs is null or abs((row->>'variance')::numeric)>=min_abs)
   and (min_pct is null or abs((row->>'variance_percentage')::numeric)>=min_pct)
 ), totals as (
  select row->>'basis' basis,count(*) count,
   sum((row->>'expected_quarterly')::numeric) expected,sum((row->>'actual_received')::numeric) actual,
   sum((row->>'variance')::numeric) variance
  from selected where row->>'status' in ('matched','variance') group by row->>'basis'
 ) select jsonb_build_object('rows',coalesce((select jsonb_agg(row) from (
   select row from selected order by row->>'quarter',row->>'account_id',row->>'obligation_id',row->>'entry_id'
   limit coalesce((filters->>'limit')::integer,100) offset coalesce((filters->>'offset')::integer,0)) page),'[]'),
  'row_count',(select count(*) from selected),'coverage',jsonb_build_object(
   'comparable',(select count(*) from selected where row->>'status' in ('matched','variance')),
   'pending',(select count(*) from selected where row->>'status'='pending'),
   'missing_expected',(select count(*) from selected where row->>'status'='missing_expected'),
   'missing_actual',(select count(*) from selected where row->>'status'='missing_actual')),
  'comparable_totals',coalesce((select jsonb_agg(jsonb_build_object('basis',basis,'count',count,
   'expected',expected::text,'actual',actual::text,'variance',variance::text,
   'variance_percentage',case when expected<>0 then (variance*100/expected)::text end)) from totals),'[]')) into answer;
 return answer;
end $$;

grant create on schema app_private to app_papa_executor;
alter function app_private.manage_commission(uuid,text,uuid,jsonb) owner to app_papa_executor;
alter function app_private.commission_report(jsonb) owner to app_papa_executor;
revoke create on schema app_private from app_papa_executor;
revoke all on function app_private.manage_commission(uuid,text,uuid,jsonb),app_private.commission_report(jsonb) from public,anon,service_role;
grant execute on function app_private.manage_commission(uuid,text,uuid,jsonb),app_private.commission_report(jsonb) to authenticated;
create function public.manage_commission(request_id uuid,operation text,target_id uuid,input jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select app_private.manage_commission(request_id,operation,target_id,input) $$;
create function public.commission_report(filters jsonb default '{}') returns jsonb
language sql stable security invoker set search_path='' as $$ select app_private.commission_report(filters) $$;
revoke all on function public.manage_commission(uuid,text,uuid,jsonb),public.commission_report(jsonb) from public,anon,service_role;
grant execute on function public.manage_commission(uuid,text,uuid,jsonb),public.commission_report(jsonb) to authenticated;
revoke app_papa_executor from current_user;
commit;
