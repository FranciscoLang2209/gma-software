begin;

-- Las escrituras financieras solo se admiten mediante operaciones revisadas.
do $$ declare t text; begin
  foreach t in array array['import_scopes','import_batches','import_rows','aum_monthly','revenue_entries','account_identifiers'] loop
    execute format('revoke insert, update on app_private.%I from authenticated',t);
    execute format('revoke insert, update on public.admin_%I from authenticated',t);
  end loop;
end $$;
alter table app_private.import_batches add column review jsonb;
create or replace view public.admin_import_batches with (security_invoker=true) as select * from app_private.import_batches;

-- Mover las implementaciones al esquema privado; los wrappers públicos son invoker.
alter function public.begin_import(uuid,text,date,uuid,text,text,integer,jsonb) set schema app_private;
alter function public.prepare_import_chunk(uuid,integer,jsonb,jsonb,jsonb) set schema app_private;
grant create on schema app_private to app_papa_executor;
alter function app_private.begin_import(uuid,text,date,uuid,text,text,integer,jsonb) owner to app_papa_executor;
alter function app_private.begin_import(uuid,text,date,uuid,text,text,integer,jsonb) security definer;
alter function app_private.prepare_import_chunk(uuid,integer,jsonb,jsonb,jsonb) owner to app_papa_executor;
alter function app_private.prepare_import_chunk(uuid,integer,jsonb,jsonb,jsonb) security definer;
revoke create on schema app_private from app_papa_executor;
create function public.begin_import(request_id uuid, source_type text, target_period date, custodian uuid,
 file_name text, file_hash text, file_size integer, conventions jsonb) returns uuid
language sql security invoker set search_path='' as $$
 select app_private.begin_import(request_id,source_type,target_period,custodian,file_name,file_hash,file_size,conventions)
$$;
create function public.prepare_import_chunk(target_id uuid, expected_cursor integer, configuration jsonb, chunk jsonb, summary jsonb) returns integer
language sql security invoker set search_path='' as $$
 select app_private.prepare_import_chunk(target_id,expected_cursor,configuration,chunk,summary)
$$;
revoke all on function public.begin_import(uuid,text,date,uuid,text,text,integer,jsonb),public.prepare_import_chunk(uuid,integer,jsonb,jsonb,jsonb) from public,anon,service_role;
grant execute on function public.begin_import(uuid,text,date,uuid,text,text,integer,jsonb),public.prepare_import_chunk(uuid,integer,jsonb,jsonb,jsonb) to authenticated;

create or replace function app_private.guard_preparation() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' and old.preparation_only and not new.preparation_only and current_user<>'app_papa_executor' then
   raise exception 'Preparation cannot be promoted through direct updates';
 end if;
 if new.preparation_only and (new.status in ('ready','published') or new.reviewed_at is not null) then
   raise exception 'Review the complete scope before promotion';
 end if;
 return new;
end $$;

create table app_private.row_resolutions (
 id uuid primary key default gen_random_uuid(),
 batch_id uuid not null references app_private.import_batches(id) on delete restrict,
 source_row_id uuid not null unique,
 account_id uuid not null,
 custodian_id uuid not null,
 advisor_id uuid references app_private.commercial_advisors(id) on delete restrict,
 evidence text not null check (btrim(evidence)<>''),
 created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 foreign key (source_row_id,batch_id) references app_private.import_rows(id,batch_id) on delete restrict,
 foreign key (account_id,custodian_id) references app_private.accounts(id,custodian_id) on delete restrict
);
create table app_private.fa_rows (
 id uuid primary key default gen_random_uuid(),
 batch_id uuid not null references app_private.import_batches(id) on delete restrict,
 import_row_id uuid not null unique,
 account_id uuid not null references app_private.accounts(id) on delete restrict,
 advisor_id uuid references app_private.commercial_advisors(id) on delete restrict,
 valid_from date not null check (isfinite(valid_from)),
 valid_to date check (isfinite(valid_to)),
 valid_during daterange generated always as (daterange(valid_from,valid_to,'[)')) stored,
 commercial_column text not null check (commercial_column in ('Owner Name payout','Broker')),
 check(valid_to is null or valid_to>valid_from),
 foreign key (import_row_id,batch_id) references app_private.import_rows(id,batch_id) on delete restrict,
 unique(batch_id,account_id)
);
create index fa_rows_account on app_private.fa_rows(account_id);
create index resolutions_batch on app_private.row_resolutions(batch_id);
do $$ declare t text; begin
 foreach t in array array['row_resolutions','fa_rows'] loop
  execute format('alter table app_private.%I enable row level security',t);
  execute format('alter table app_private.%I force row level security',t);
  execute format('grant select on app_private.%I to authenticated,app_papa_executor',t);
  execute format('grant insert,update on app_private.%I to app_papa_executor',t);
  execute format('create policy admin_read on app_private.%I for select to authenticated,app_papa_executor using ((select app_private.current_access())=''admin'')',t);
  execute format('create policy admin_write on app_private.%I for all to app_papa_executor using ((select app_private.current_access())=''admin'') with check ((select app_private.current_access())=''admin'')',t);
  execute format('create trigger guard_detail before insert or update or delete on app_private.%I for each row execute function app_private.guard_import_detail()',t);
  execute format('create trigger audit_change after insert or update on app_private.%I for each row execute function app_private.record_change()',t);
 end loop;
end $$;

-- Headers canónicos apuntan a posiciones originales: nunca depender del orden del Excel.
create function app_private.import_cell(b app_private.import_batches,r app_private.import_rows,h text) returns text
language sql immutable set search_path='' as $$
 select coalesce(r.original_cells->>(select x->>'position' from jsonb_array_elements(b.totals->'headers') x where x->>'canonical'=h),r.original_cells->>h)
$$;
create function app_private.import_references(b app_private.import_batches,r app_private.import_rows)
returns table(namespace text, original text) language sql immutable set search_path='' as $$
 select h,app_private.import_cell(b,r,h) from unnest(case b.source
 when 'aum' then array['Holding Account Number','Account Number bd_REV']
 when 'fa' then array['ACC # Addepar','ACCOUNT'] else array['ACCOUNT'] end) h
$$;
grant execute on function app_private.import_cell(app_private.import_batches,app_private.import_rows,text),app_private.import_references(app_private.import_batches,app_private.import_rows) to app_papa_executor;

-- Cierre mensual, sin arrastre ni atribución del FA actual a períodos sin cobertura.
create function app_private.advisor_at(target_account uuid, target_period date) returns uuid
language sql stable set search_path='' as $$
 select advisor_id from (
  select f.advisor_id from app_private.fa_rows f join app_private.import_scopes s on s.active_batch_id=f.batch_id
  where f.account_id=target_account and f.valid_during @> ((target_period+interval '1 month')::date-1)
  union all
  select a.advisor_id from app_private.account_assignments a where a.account_id=target_account and a.is_primary
   and a.valid_during @> ((target_period+interval '1 month')::date-1)
 ) x limit 1
$$;
grant execute on function app_private.advisor_at(uuid,date) to app_papa_executor;

-- Conciliación como texto decimal: JSON/JavaScript no redondean numeric.
create function app_private.import_comparison(target_id uuid) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare b app_private.import_batches; active uuid; n integer; vals integer; total numeric; unassigned integer; old_data jsonb; own_data jsonb; unassigned_accounts integer; unassigned_total numeric; changes jsonb;
begin
 select * into strict b from app_private.import_batches where id=target_id;
 select active_batch_id into active from app_private.import_scopes where id=b.scope_id;
 if b.source='fa' then
  select count(*),count(advisor_id),count(*) filter(where advisor_id is null),count(distinct account_id) filter(where advisor_id is null) into n,vals,unassigned,unassigned_accounts from app_private.fa_rows where batch_id=target_id;
  total:=null;
 else
  select count(*),count(amount),sum(amount),count(*) filter(where app_private.advisor_at(account_id,b.period) is null),
    count(distinct account_id) filter(where app_private.advisor_at(account_id,b.period) is null),
    sum(amount) filter(where app_private.advisor_at(account_id,b.period) is null)
   into n,vals,total,unassigned,unassigned_accounts,unassigned_total from (
    select account_id,value_usd as amount from app_private.aum_monthly where batch_id=target_id
    union all select account_id,payout_broker_usd from app_private.revenue_entries where batch_id=target_id
   ) f;
 end if;
 select jsonb_build_object('id',id,'version',version,'rows',row_count,'values',metric_value_count,'total',metric_total_usd::text,'sha256',file_sha256)
  into old_data from app_private.import_batches where id=active;
 select jsonb_build_object('added',coalesce(sum(greatest(new_count-old_count,0)),0),'removed',coalesce(sum(greatest(old_count-new_count,0)),0)) into changes from (
  select count(*) filter(where batch_id=target_id) as new_count,count(*) filter(where batch_id=active) as old_count
   from app_private.import_rows where batch_id in (target_id,active) group by original_cells
 ) x;
 own_data:=jsonb_build_object('rows',n,'values',vals,'total',total::text,'unassigned_rows',unassigned,
  'unassigned_accounts',unassigned_accounts,'unassigned_total',unassigned_total::text);
 return jsonb_build_object('source',b.source,'period',b.period,'custodian_id',b.custodian_id,
  'file',jsonb_build_object('rows',b.row_count,'values',b.metric_value_count,'total',b.metric_total_usd::text),
  'candidate',own_data,'active',old_data,'row_changes',changes,'same_file',coalesce(old_data->>'sha256'=b.file_sha256,false));
end $$;
grant execute on function app_private.import_comparison(uuid) to app_papa_executor;

create function app_private.manage_import(target_id uuid, operation text, input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare b app_private.import_batches; selected_row app_private.import_rows; res app_private.row_resolutions;
 identifier_ref record; destination uuid; advisor uuid; matched uuid; active uuid; token uuid; comparison jsonb;
 page_no integer; output_rows jsonb; selected_custodian uuid; from_date date; to_date date; column_name text;
begin
 if app_private.current_access() is distinct from 'admin' then
  raise insufficient_privilege using message='Enabled administrator required';
 end if;
 if input is null or jsonb_typeof(input)<>'object' or octet_length(input::text)>16384 then raise exception 'Invalid request'; end if;
 -- shortcut: serializar este circuito MVP, pasar a locks por cuenta/alcance si el volumen lo exige.
 perform pg_advisory_xact_lock(71482026);
 select * into strict b from app_private.import_batches where id=target_id;
 select active_batch_id into active from app_private.import_scopes where id=b.scope_id for update;
 select * into strict b from app_private.import_batches where id=target_id for update;
 if operation='inspect' then
  page_no:=coalesce((input->>'page')::integer,0);
  if page_no not between 0 and 200 then raise exception 'Invalid page'; end if;
  select coalesce(jsonb_agg(data order by row_number),'[]') into output_rows from (
   select r.row_number,jsonb_build_object('id',r.id,'sheet',r.sheet_name,'row',r.row_number,'status',r.status,'errors',r.errors,
    'cells',(select jsonb_object_agg(h,app_private.import_cell(b,r,h)) from unnest(case b.source
     when 'fa' then array['ACC # Addepar','ACCOUNT','Owner Name payout','Broker','Grupo','Client','OLD Owner Name payout']
     when 'aum' then array['Holding Account Number','Account Number bd_REV','Value (USD)']
     else array['CUSTODIO','ACCOUNT','NAME','Payout broker'] end) h),
    'resolution',(select to_jsonb(x) from app_private.row_resolutions x where x.source_row_id=r.id),
    'matches',(select coalesce(jsonb_agg(jsonb_build_object('namespace',i.namespace,'original',i.value_original,'account_id',i.account_id,'custodian_id',i.custodian_id,'evidence',i.evidence)),'[]')
      from app_private.import_references(b,r) ref join app_private.account_identifiers i on i.source=b.source and i.namespace=ref.namespace
      and i.value_original=ref.original and i.resolution_status='resolved'
      and (b.source='fa' or i.custodian_id=b.custodian_id)),
    'originals',r.original_cells) data
   from app_private.import_rows r where r.batch_id=target_id order by r.row_number offset page_no*25 limit 25
  ) q;
  return jsonb_build_object('batch',jsonb_build_object('id',b.id,'source',b.source,'period',b.period,'custodian_id',b.custodian_id,
   'status',case when b.status='published' and active is distinct from b.id then 'superseded' else b.status end,
   'rows',b.row_count,'errors',b.errors,'blocking_errors',b.blocking_error_count,'review',b.review,'filename',b.file_name_original),
   'rows',output_rows,'page',page_no,'comparison',app_private.import_comparison(target_id));
 elsif operation='resolve' then
  if b.status<>'needs_resolution' or not b.preparation_only or b.blocking_error_count<>0 then raise exception 'Only valid pending imports can be resolved'; end if;
  select * into strict selected_row from app_private.import_rows where id=(input->>'row_id')::uuid and batch_id=target_id;
  if selected_row.status<>'valid' or selected_row.errors<>'[]' then raise exception 'Row has blocking errors'; end if;
  if nullif(btrim(input->>'evidence'),'') is null or input->>'custodian_id' is null then raise exception 'Custodian and evidence required; FA does not declare a custodian'; end if;
  selected_custodian:=(input->>'custodian_id')::uuid;
  if selected_custodian<>b.custodian_id then raise exception 'Custodian differs from declared scope; create another import'; end if;
  select * into res from app_private.row_resolutions where source_row_id=selected_row.id;
  if found and res.evidence=input->>'evidence' and (nullif(input->>'account_id','') is null or res.account_id=(input->>'account_id')::uuid)
   and ((nullif(btrim(input->>'new_advisor'),'') is null and res.advisor_id is not distinct from nullif(input->>'advisor_id','')::uuid)
    or (nullif(input->>'advisor_id','') is null and exists(select 1 from app_private.commercial_advisors where id=res.advisor_id and name=input->>'new_advisor'))) then
   return jsonb_build_object('account_id',res.account_id);
  end if;
  destination:=coalesce(nullif(input->>'account_id','')::uuid,res.account_id);
  if destination is null then
   insert into app_private.accounts(custodian_id,created_by) values(selected_custodian,auth.uid()) returning id into destination;
  elsif not exists(select 1 from app_private.accounts where id=destination and custodian_id=selected_custodian) then raise exception 'Account not in custodian'; end if;
  advisor:=nullif(input->>'advisor_id','')::uuid;
  if b.source<>'fa' and advisor is not null then raise exception 'Advisor only supported in FA'; end if;
  if b.source='fa' and nullif(btrim(input->>'new_advisor'),'') is not null then
   if advisor is not null then raise exception 'Choose existing or new advisor'; end if;
   insert into app_private.commercial_advisors(name,created_by) values(input->>'new_advisor',auth.uid()) returning id into advisor;
  end if;
  for identifier_ref in select * from app_private.import_references(b,selected_row) order by namespace loop
   if nullif(btrim(identifier_ref.original),'') is null then raise exception 'Missing reference'; end if;
   select account_id into matched from app_private.account_identifiers where source=b.source and namespace=identifier_ref.namespace
    and value_original=identifier_ref.original and custodian_id=selected_custodian and resolution_status='resolved' for update;
   if found and matched<>destination then raise exception 'Reference already belongs to another account; preserve evidence and correct the source'; end if;
   if not found then
    insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,source_row_id,created_by)
    values(destination,selected_custodian,b.source,identifier_ref.namespace,identifier_ref.original,'resolved',input->>'evidence',selected_row.id,auth.uid());
   end if;
  end loop;
  select * into res from app_private.row_resolutions where source_row_id=selected_row.id;
  if found and (res.account_id,res.advisor_id,res.evidence) is not distinct from (destination,advisor,input->>'evidence') then return jsonb_build_object('account_id',destination); end if;
  insert into app_private.row_resolutions(batch_id,source_row_id,account_id,custodian_id,advisor_id,evidence,created_by)
   values(target_id,selected_row.id,destination,selected_custodian,advisor,input->>'evidence',auth.uid())
   on conflict(source_row_id) do update set account_id=excluded.account_id,advisor_id=excluded.advisor_id,evidence=excluded.evidence,created_by=excluded.created_by;
  return jsonb_build_object('account_id',destination);
 elsif operation='review' then
  if b.status not in ('needs_resolution','ready') or b.row_count=0 or b.blocking_error_count<>0 or b.errors<>'[]' then raise exception 'Nonempty import free of blocking errors required'; end if;
  if input->'complete_scope' is distinct from 'true'::jsonb or (input->>'custodian_id')::uuid is distinct from b.custodian_id
    or (input->>'period')::date is distinct from b.period then raise exception 'Confirm complete month and custodian scope'; end if;
  if active is distinct from nullif(input->>'expected_active_id','')::uuid then raise exception 'Active version changed; review again'; end if;
  if (select count(*) from app_private.import_rows where batch_id=target_id and status='valid' and errors='[]')<>b.row_count
   or (select count(*) from app_private.row_resolutions where batch_id=target_id)<>b.row_count then raise exception 'Resolve every row before review'; end if;
  if b.source='fa' then
   column_name:=input->>'commercial_column'; from_date:=(input->>'valid_from')::date; to_date:=nullif(input->>'valid_to','')::date;
   if column_name is null or column_name not in ('Owner Name payout','Broker') or from_date is null or not isfinite(from_date)
    or (to_date is not null and (not isfinite(to_date) or to_date<=from_date)) then raise exception 'Confirm commercial column and explicit validity'; end if;
   if exists(select 1 from app_private.row_resolutions x join app_private.import_rows r on r.id=x.source_row_id where x.batch_id=target_id
     and x.advisor_id is not null and nullif(btrim(app_private.import_cell(b,r,column_name)),'') is null) then raise exception 'Chosen commercial column is empty for an assigned row'; end if;
   if b.status='ready' and (b.review->>'commercial_column',b.review->>'valid_from',b.review->>'valid_to') is distinct from (column_name,from_date::text,to_date::text) then raise exception 'Reviewed validity is frozen; create a new version'; end if;
  end if;
  if b.status<>'ready' then
   if b.source='aum' then
    insert into app_private.aum_monthly(account_id,custodian_id,period,batch_id,import_row_id,value_usd,value_original)
     select x.account_id,b.custodian_id,b.period,b.id,r.id,(r.cell_metadata->>'amount')::numeric,app_private.import_cell(b,r,'Value (USD)')
     from app_private.import_rows r join app_private.row_resolutions x on x.source_row_id=r.id where r.batch_id=b.id;
   elsif b.source='revenue' then
    insert into app_private.revenue_entries(account_id,custodian_id,period,batch_id,import_row_id,payout_broker_usd,
     custodian_original,month_original,year_original,account_original,name_original,advisor_name_original,adv_name_sec_original,rel_2nd_original,nacho_gma_original,ip_original,ip_payment_original,pago_ok_original,buy_sell_original,asset_original,quantity_original,description_original,cusip_original,price_original,ticket_original,ticket_o_original,service_charge_original,gross_original,total_original,payout_broker_original,payout_medina_base_original,final_payout_medina_percent_original,payout_medina_original,payout_rep_percent_original,net_payout_rep_original)
    select x.account_id,b.custodian_id,b.period,b.id,r.id,(r.cell_metadata->>'amount')::numeric,
     app_private.import_cell(b,r,'CUSTODIO'),
     app_private.import_cell(b,r,'MES'),
     app_private.import_cell(b,r,'AÑO'),
     app_private.import_cell(b,r,'ACCOUNT'),
     app_private.import_cell(b,r,'NAME'),
     app_private.import_cell(b,r,'Advisor Name'),
     app_private.import_cell(b,r,'ADV NAME SEC'),
     app_private.import_cell(b,r,'Rel. 2nd'),
     app_private.import_cell(b,r,'Nacho GMA'),
     app_private.import_cell(b,r,'IP'),
     app_private.import_cell(b,r,'IP PAYMENT'),
     app_private.import_cell(b,r,'PAGO OK'),
     app_private.import_cell(b,r,'B/S'),
     app_private.import_cell(b,r,'ASSET'),
     app_private.import_cell(b,r,'QUANTITY'),
     app_private.import_cell(b,r,'DESCRIPTION'),
     app_private.import_cell(b,r,'CUSIP'),
     app_private.import_cell(b,r,'PRICE'),
     app_private.import_cell(b,r,'TICKET'),
     app_private.import_cell(b,r,'TICKET (O)'),
     app_private.import_cell(b,r,'SERVICE CHARGE'),
     app_private.import_cell(b,r,'GROSS'),
     app_private.import_cell(b,r,'TOTAL'),
     app_private.import_cell(b,r,'Payout broker'),
     app_private.import_cell(b,r,'Payout Medina base'),
     app_private.import_cell(b,r,'Final payout Medina %'),
     app_private.import_cell(b,r,'Payout Medina'),
     app_private.import_cell(b,r,'% Payout REP'),
     app_private.import_cell(b,r,'NET Payout REP')
    from app_private.import_rows r join app_private.row_resolutions x on x.source_row_id=r.id where r.batch_id=b.id;
   else
    insert into app_private.fa_rows(batch_id,import_row_id,account_id,advisor_id,valid_from,valid_to,commercial_column)
    select b.id,x.source_row_id,x.account_id,x.advisor_id,from_date,to_date,column_name from app_private.row_resolutions x where x.batch_id=b.id;
   end if;
  end if;
  comparison:=app_private.import_comparison(target_id);
  if (comparison->'candidate'->>'rows')::integer<>b.row_count or (b.source<>'fa' and
    ((comparison->'candidate'->>'total')::numeric is distinct from b.metric_total_usd
     or (comparison->'candidate'->>'values')::integer is distinct from b.metric_value_count)) then raise exception 'File and candidate totals or coverage differ'; end if;
  token:=gen_random_uuid();
  update app_private.import_batches set preparation_only=false,status='ready',reviewed_at=clock_timestamp(),reviewed_by=auth.uid(),
   review=jsonb_build_object('token',token,'expected_active_id',active,'comparison',comparison,'complete_scope',true,
    'commercial_column',column_name,'valid_from',from_date,'valid_to',to_date) where id=target_id;
  return jsonb_build_object('token',token,'comparison',comparison);
 elsif operation='publish' then
  if b.review is null or (input->>'token')::uuid is distinct from (b.review->>'token')::uuid then raise exception 'Review token required'; end if;
  if active=target_id then return jsonb_build_object('id',target_id,'status','published'); end if;
  if active is distinct from (b.review->>'expected_active_id')::uuid then raise exception 'Active version changed; review again'; end if;
  perform app_private.publish_import(target_id,(b.review->>'expected_active_id')::uuid,auth.uid());
  return jsonb_build_object('id',target_id,'status','published');
 else raise exception 'Unknown operation';
 end if;
end $$;
grant create on schema app_private to app_papa_executor;
alter function app_private.manage_import(uuid,text,jsonb) owner to app_papa_executor;
revoke create on schema app_private from app_papa_executor;
revoke all on function app_private.manage_import(uuid,text,jsonb) from public,anon,service_role;
grant execute on function app_private.manage_import(uuid,text,jsonb) to authenticated;
create function public.manage_import(target_id uuid,operation text,input jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select app_private.manage_import(target_id,operation,input) $$;
revoke all on function public.manage_import(uuid,text,jsonb) from public,anon,service_role;
grant execute on function public.manage_import(uuid,text,jsonb) to authenticated;

create or replace function app_private.guard_batch() returns trigger language plpgsql set search_path = '' as $$
declare actual_total numeric; actual_values integer;
begin
  if tg_op = 'DELETE' then raise exception 'Import history cannot be deleted'; end if;
  if tg_op = 'INSERT' and new.status = 'published' then raise exception 'Publish explicitly after validation'; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'published' then raise exception 'Published batch is immutable'; end if;
    if (new.id, new.scope_id, new.source, new.period, new.custodian_id, new.version, new.idempotency_key,
        new.storage_bucket, new.storage_object_path, new.file_name_original, new.file_sha256, new.file_size_bytes, new.created_by, new.created_at)
      is distinct from
       (old.id, old.scope_id, old.source, old.period, old.custodian_id, old.version, old.idempotency_key,
        old.storage_bucket, old.storage_object_path, old.file_name_original, old.file_sha256, old.file_size_bytes, old.created_by, old.created_at) then
      raise exception 'Batch identity and source file are immutable';
    end if;
    if new.status = 'published' then
      if old.status <> 'ready' or new.reviewed_by is null or new.blocking_error_count <> 0 or new.errors <> '[]'::jsonb or new.row_count = 0 then
        raise exception 'Batch must be reviewed, nonempty and free of blocking errors';
      end if;
      if (select count(*) from app_private.import_rows where batch_id = new.id) <> new.row_count
        or exists (select 1 from app_private.import_rows where batch_id = new.id and (status <> 'valid' or errors <> '[]'::jsonb)) then
        raise exception 'All rows must be reconciled and valid';
      end if;
      if new.source = 'aum' and (select count(*) from app_private.aum_monthly where batch_id = new.id) <> new.row_count then
        raise exception 'Every AUM row requires a resolved account';
      elsif new.source = 'revenue' and (select count(*) from app_private.revenue_entries where batch_id = new.id) <> new.row_count then
        raise exception 'Every Revenue row requires a resolved account';
      elsif new.source = 'fa' and (select count(*) from app_private.fa_rows where batch_id=new.id)<>new.row_count then
        raise exception 'Every FA row requires reviewed account and validity';
      end if;
      if new.source = 'aum' then
        select sum(value_usd), count(value_usd) into actual_total, actual_values from app_private.aum_monthly where batch_id = new.id;
      elsif new.source = 'fa' then
        actual_total:=null; actual_values:=0;
      else
        select sum(payout_broker_usd), count(payout_broker_usd) into actual_total, actual_values from app_private.revenue_entries where batch_id = new.id;
      end if;
      if new.metric_total_usd is distinct from actual_total or new.metric_value_count is distinct from actual_values then
        raise exception 'Reviewed metric total and coverage must match stored rows';
      end if;
    end if;
  end if;
  return new;
end $$;

create or replace function app_private.publish_import(target_id uuid, expected_active_id uuid, actor uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare target_scope uuid; current_id uuid; target_status text;
begin
  if auth.uid() is distinct from actor or not exists (select 1 from app_private.user_profiles where id = actor and role = 'admin' and enabled) then
    raise exception 'Enabled administrator required';
  end if;
  perform pg_advisory_xact_lock(71482026);
  select scope_id into strict target_scope from app_private.import_batches where id = target_id;
  select active_batch_id into current_id from app_private.import_scopes where id = target_scope for update;
  select status into target_status from app_private.import_batches where id = target_id for update;
  if current_id = target_id then return target_id; end if;
  if current_id is distinct from expected_active_id then raise exception 'Active version changed; review again'; end if;
  if target_status <> 'ready' then raise exception 'Ready batch required; restore history as a new version'; end if;
  if exists(select 1 from app_private.fa_rows f where f.batch_id=target_id and (
    exists(select 1 from app_private.fa_rows other join app_private.import_scopes s on s.active_batch_id=other.batch_id
      where other.account_id=f.account_id and other.valid_during && f.valid_during and s.id<>target_scope)
    or exists(select 1 from app_private.account_assignments a where a.account_id=f.account_id and a.is_primary and a.valid_during && f.valid_during)
  )) then raise exception 'FA validity overlaps an active assignment; review explicit dates and scope'; end if;
  update app_private.import_batches set status = 'published', published_at = clock_timestamp(), published_by = actor where id = target_id;
  update app_private.import_scopes set active_batch_id = target_id where id = target_scope;
  insert into app_private.audit_events(actor_id, action, entity_table, entity_id, before_data, after_data)
    values (actor, 'publish', 'import_scopes', target_scope,
      jsonb_build_object('active_batch_id', current_id), jsonb_build_object('active_batch_id', target_id));
  return target_id;
end $$;


create function app_private.guard_manual_assignment() returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(71482026);
 if new.is_primary and exists(select 1 from app_private.fa_rows f join app_private.import_scopes s on s.active_batch_id=f.batch_id
   where f.account_id=new.account_id and f.valid_during && daterange(new.valid_from,new.valid_to,'[)')) then
  raise exception 'Manual assignment overlaps active FA validity';
 end if;
 return new;
end $$;
create trigger manual_fa_overlap before insert or update on app_private.account_assignments
 for each row execute function app_private.guard_manual_assignment();
commit;
