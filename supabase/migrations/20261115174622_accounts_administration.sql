begin;

-- Desactivar conserva todas las referencias y la atribución histórica.
do $$ declare t text; begin
 foreach t in array array['custodians','clients','commercial_groups','commercial_advisors','accounts'] loop
  execute format('alter table app_private.%I add column active boolean not null default true',t);
  execute format('create or replace view public.admin_%I with (security_invoker=true) as select * from app_private.%I',t,t);
  execute format('create trigger preserve_entity before delete on app_private.%I for each row execute function app_private.deny_history_change()',t);
 end loop;
 foreach t in array array['custodians','clients','commercial_groups','commercial_advisors','accounts','account_assignments','advisor_group_memberships'] loop
  execute format('revoke insert,update on app_private.%I from authenticated',t);
  execute format('revoke insert,update on public.admin_%I from authenticated',t);
 end loop;
end $$;
alter table app_private.audit_events add column reason text;
create or replace function app_private.record_change() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into app_private.audit_events(actor_id,action,entity_table,entity_id,before_data,after_data,reason)
 values(auth.uid(),tg_op,tg_table_name,coalesce(new.id,old.id),
  case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end,
  nullif(current_setting('app_papa.change_reason',true),''));
 return coalesce(new,old);
end $$;
-- La identidad acreditada de una versión reemplazada sigue siendo historia publicada.
-- Solo el ejecutor lee esta procedencia; ninguna RPC entrega sus payloads a lectores.
create policy identity_published_batches on app_private.import_batches for select to app_papa_executor
 using ((select app_private.current_access()) in ('admin','reader') and status='published');
create policy identity_published_rows on app_private.import_rows for select to app_papa_executor
 using ((select app_private.current_access()) in ('admin','reader') and exists(
  select 1 from app_private.import_batches b where b.id=import_rows.batch_id and b.status='published'));
create policy identifiers_projection on app_private.account_identifiers for select to app_papa_executor
 using ((select app_private.current_access()) in ('admin','reader') and resolution_status='resolved'
  and (source_row_id is null or exists(select 1 from app_private.import_rows r where r.id=source_row_id)));
-- Una cuenta nacida en preparación no es todavía parte del directorio del lector.
alter policy report_read on app_private.accounts using ((select app_private.current_access())='admin'
 or ((select app_private.current_access())='reader' and (
  exists(select 1 from app_private.aum_monthly a where a.account_id=accounts.id)
  or exists(select 1 from app_private.revenue_entries r where r.account_id=accounts.id)
  or exists(select 1 from app_private.fa_rows f where f.account_id=accounts.id)
  or exists(select 1 from app_private.account_identifiers i where i.account_id=accounts.id))));
alter policy report_read on app_private.account_assignments using ((select app_private.current_access()) in ('admin','reader')
 and exists(select 1 from app_private.accounts a where a.id=account_assignments.account_id));

-- Grano único cuenta/mes compartido por directorio, detalle y revisión de atribución.
create function app_private.account_months(first_month date,last_month date,target_account uuid default null)
returns table(account_id uuid,period date,advisor_id uuid,team_id uuid,aum_usd text,revenue_usd text,
 aum_rows bigint,aum_values bigint,revenue_rows bigint,revenue_values bigint)
language sql stable security invoker set search_path='' as $$
 with a as (select account_id,period,sum(value_usd)::text amount,count(*) n,count(value_usd) vals
  from app_private.aum_current where period between first_month and last_month
  and (target_account is null or account_id=target_account) group by account_id,period),
 r as (select account_id,period,sum(payout_broker_usd)::text amount,count(*) n,count(payout_broker_usd) vals
  from app_private.revenue_current where period between first_month and last_month
  and (target_account is null or account_id=target_account) group by account_id,period)
 select ac.id,m::date,ad.id,gm.group_id,a.amount,r.amount,coalesce(a.n,0),coalesce(a.vals,0),coalesce(r.n,0),coalesce(r.vals,0)
 from app_private.accounts ac cross join generate_series(first_month,last_month,interval '1 month') m
 left join app_private.commercial_advisors ad on ad.id=app_private.advisor_at(ac.id,m::date)
 left join app_private.advisor_group_memberships gm on gm.advisor_id=ad.id and gm.is_primary
  and gm.valid_during @> ((m+interval '1 month')::date-1)
 left join a on a.account_id=ac.id and a.period=m::date
 left join r on r.account_id=ac.id and r.period=m::date
 where target_account is null or ac.id=target_account
$$;

create function app_private.account_directory(
 month_from date,month_to date,custodian uuid default null,team uuid default null,advisor uuid default null,
 client uuid default null,account uuid default null,service_filter text default null,search_text text default '',
 sort_by text default 'identifier',page_size integer default 25,page_offset integer default 0,expected_revision text default null
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; report jsonb;
begin
 -- Reutiliza la validación de rango, filtros, límites y sesión de la consulta financiera.
 report:=app_private.aggregate_report(month_from,month_to,custodian,team,advisor,client,account,service_filter,'account',page_size,0,null);
 if search_text is null or length(search_text)>200 or sort_by is null or sort_by not in ('identifier','client','aum','revenue')
  or page_offset is null or page_offset not between 0 and 1000000 or (page_offset>0 and expected_revision is null)
  or (expected_revision is not null and expected_revision !~ '^[a-f0-9]{32}$') then
  raise invalid_parameter_value using message='Invalid directory filters';
 end if;
 with monthly as materialized (select * from app_private.account_months(month_from,month_to,account)),
 selected as (
  select m.* from monthly m where (team is null or m.team_id=team) and (advisor is null or m.advisor_id=advisor)
 ),
 metrics as (
  select account_id,sum(aum_usd::numeric) filter(where period=month_to)::text aum_usd,
   sum(revenue_usd::numeric)::text revenue_usd,sum(aum_rows) filter(where period=month_to) aum_rows,
   sum(aum_values) filter(where period=month_to) aum_values,sum(revenue_rows) revenue_rows,sum(revenue_values) revenue_values
  from selected group by account_id
 ),
 rows as materialized (
  select ac.id,ac.custodian_id,c.name custodian,ac.client_id,cl.name client,ac.service,ac.active,
   coalesce(i.value_original,ac.id::text) identifier,i.source identifier_source,i.namespace identifier_namespace,
   closing.advisor_id,ad.name advisor,closing.team_id,g.name team,
   (select count(distinct coalesce(x.advisor_id::text,'-')||'/'||coalesce(x.team_id::text,'-'))>1 from monthly x where x.account_id=ac.id) assignment_changed,
   mt.aum_usd,mt.revenue_usd,coalesce(mt.aum_rows,0) aum_rows,coalesce(mt.aum_values,0) aum_values,
   mt.revenue_rows,mt.revenue_values
  from app_private.accounts ac join app_private.custodians c on c.id=ac.custodian_id
  join metrics mt on mt.account_id=ac.id
  left join app_private.clients cl on cl.id=ac.client_id
  left join lateral (select value_original,source,namespace from app_private.account_identifiers where account_id=ac.id and resolution_status='resolved'
   order by case source when 'revenue' then 0 when 'aum' then 1 when 'fa' then 2 else 3 end,namespace collate "C",value_original collate "C",id limit 1) i on true
  left join monthly closing on closing.account_id=ac.id and closing.period=month_to
  left join app_private.commercial_advisors ad on ad.id=closing.advisor_id
  left join app_private.commercial_groups g on g.id=closing.team_id
  where (custodian is null or ac.custodian_id=custodian) and (client is null or ac.client_id=client)
   and (service_filter is null or ac.service=service_filter)
   and (search_text='' or position(lower(search_text) in lower(coalesce(cl.name,'')||' '||ac.id::text))>0
    or exists(select 1 from app_private.account_identifiers ai where ai.account_id=ac.id and ai.resolution_status='resolved'
     and position(lower(search_text) in lower(ai.value_original))>0))
 ),
 page as (select * from rows order by
  case when sort_by='aum' then aum_usd::numeric end desc nulls last,
  case when sort_by='revenue' then revenue_usd::numeric end desc nulls last,
  (case when sort_by='client' then rows.client else identifier end) collate "C" nulls last,id limit page_size offset page_offset)
 select jsonb_build_object('revision',md5(coalesce((select jsonb_agg(to_jsonb(x) order by id)::text from rows x),'[]')||report::text||jsonb_build_array(search_text,sort_by)::text),
  'report',report,'row_count',(select count(*) from rows),'offset',page_offset,'limit',page_size,
  'rows',coalesce((select jsonb_agg(to_jsonb(p) order by case when sort_by='aum' then p.aum_usd::numeric end desc nulls last,
    case when sort_by='revenue' then p.revenue_usd::numeric end desc nulls last,
    (case when sort_by='client' then p.client else p.identifier end) collate "C" nulls last,p.id) from page p),'[]')) into result;
 if expected_revision is not null and expected_revision is distinct from result->>'revision' then
  raise exception using errcode='40001',message='Directory changed; restart pagination';
 end if;
 return result;
end $$;

create function app_private.account_detail(target_id uuid,month_from date,month_to date,
 team uuid default null,advisor uuid default null,page_size integer default 25,page_offset integer default 0,expected_revision text default null,
 custodian uuid default null,client uuid default null,service_filter text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; directory jsonb; report jsonb;
begin
 directory:=app_private.account_directory(month_from,month_to,account=>target_id,page_size=>page_size);
 report:=app_private.aggregate_report(month_from,month_to,account=>target_id,team=>team,advisor=>advisor,custodian=>custodian,client=>client,service_filter=>service_filter,page_size=>page_size);
 if page_offset is null or page_offset not between 0 and 1000000 or (page_offset>0 and expected_revision is null)
  or (expected_revision is not null and expected_revision !~ '^[a-f0-9]{32}$') then
  raise invalid_parameter_value using message='Invalid record pagination';
 end if;
 if not exists(select 1 from app_private.accounts where id=target_id) then return null; end if;
 with monthly as materialized (select m.*,ad.name advisor,g.name team,
   (team is null or m.team_id=team) and (advisor is null or m.advisor_id=advisor)
   and (custodian is null or ac.custodian_id=custodian) and (client is null or ac.client_id=client)
   and (service_filter is null or ac.service=service_filter) matches_filters
  from app_private.account_months(month_from,month_to,target_id) m join app_private.accounts ac on ac.id=m.account_id
  left join app_private.commercial_advisors ad on ad.id=m.advisor_id left join app_private.commercial_groups g on g.id=m.team_id),
 records as materialized (
  select r.id,r.period,r.batch_id,r.import_row_id,r.payout_broker_usd::text amount_usd,b.version,b.published_at,b.published_by,
   case when app_private.current_access()='admin' then jsonb_build_object('cells',ir.original_cells,'headers',b.totals->'headers','file',b.file_name_original,'sheet',ir.sheet_name,'row',ir.row_number) end original
  from app_private.revenue_current r join monthly m on m.account_id=r.account_id and m.period=r.period and m.matches_filters
  join app_private.import_batches b on b.id=r.batch_id
  left join app_private.import_rows ir on ir.id=r.import_row_id and app_private.current_access()='admin'
 ),
 assignments as (
  select a.id,a.advisor_id,ad.name advisor,a.valid_from,a.valid_to,'manual' source,null::uuid batch_id,a.source_row_id
  from app_private.account_assignments a left join app_private.commercial_advisors ad on ad.id=a.advisor_id
  where a.account_id=target_id and a.is_primary
  union all
  select f.id,f.advisor_id,ad.name,f.valid_from,f.valid_to,'fa',f.batch_id,f.import_row_id
  from app_private.fa_rows f join app_private.import_scopes s on s.active_batch_id=f.batch_id
  left join app_private.commercial_advisors ad on ad.id=f.advisor_id where f.account_id=target_id
 ),
 members as (select gm.id,gm.advisor_id,ad.name advisor,gm.group_id,g.name team,gm.valid_from,gm.valid_to
  from app_private.advisor_group_memberships gm join app_private.commercial_groups g on g.id=gm.group_id
  join app_private.commercial_advisors ad on ad.id=gm.advisor_id
  where gm.is_primary and exists(select 1 from assignments a where a.advisor_id=gm.advisor_id)),
 ids as (select source,namespace,value_original,custodian_id,source_row_id from app_private.account_identifiers
  where account_id=target_id and resolution_status='resolved'),
 aum as (select a.period,a.value_usd::text amount_usd,a.batch_id,a.import_row_id,b.version,b.published_at,b.published_by
  from app_private.aum_current a join app_private.import_batches b on b.id=a.batch_id
  where a.account_id=target_id and a.period between month_from and month_to),
 revision as (select md5(report::text||directory::text||coalesce((select jsonb_agg(to_jsonb(r) order by period,id)::text from records r),'[]')
  ||coalesce((select jsonb_agg(to_jsonb(a) order by valid_from,id)::text from assignments a),'[]')
  ||coalesce((select jsonb_agg(to_jsonb(g) order by valid_from,id)::text from members g),'[]')
  ||coalesce((select jsonb_agg(to_jsonb(i) order by source,namespace,value_original)::text from ids i),'[]')
  ||coalesce((select jsonb_agg(to_jsonb(a) order by period)::text from aum a),'[]')) value)
 select jsonb_build_object('revision',(select value from revision),'account',directory->'rows'->0,'report',report,
  'identifiers',coalesce((select jsonb_agg(to_jsonb(i) order by source,namespace,value_original) from ids i),'[]'),
  'months',(select jsonb_agg(to_jsonb(m) order by period) from monthly m),
  'aum',coalesce((select jsonb_agg(to_jsonb(a) order by period) from aum a),'[]'),
  'assignments',coalesce((select jsonb_agg(to_jsonb(a) order by valid_from,id) from assignments a),'[]'),
  'memberships',coalesce((select jsonb_agg(to_jsonb(g) order by valid_from,id) from members g),'[]'),
  'record_count',(select count(*) from records),'offset',page_offset,'limit',page_size,
  'records',coalesce((select jsonb_agg(to_jsonb(p) order by period,id) from
   (select * from records order by period,id limit page_size offset page_offset) p),'[]')) into result;
 if expected_revision is not null and expected_revision is distinct from result->>'revision' then
  raise exception using errcode='40001',message='Account changed; restart pagination';
 end if;
 return result;
end $$;

create table app_private.model_reviews (
 id uuid primary key default gen_random_uuid(),actor_id uuid not null references auth.users(id),
 entity text not null,target_id uuid not null,input jsonb not null,reason text not null,
 revision text not null,preview jsonb not null,created_at timestamptz not null default clock_timestamp(),applied_at timestamptz
);
alter table app_private.model_reviews enable row level security;
alter table app_private.model_reviews force row level security;
grant select,insert,update on app_private.model_reviews to app_papa_executor;
create policy review_admin on app_private.model_reviews for all to app_papa_executor
 using ((select app_private.current_access())='admin' and actor_id=auth.uid())
 with check ((select app_private.current_access())='admin' and actor_id=auth.uid());

create function app_private.model_revision() returns text language sql stable set search_path='' as $$
 select md5(coalesce(string_agg(id::text,',' order by occurred_at,id),'') ) from app_private.audit_events
$$;

create function app_private.attribution_snapshot() returns jsonb language sql stable set search_path='' as $$
 with a as (select account_id,period,value_usd::text amount from app_private.aum_current),
 r as (select account_id,period,sum(payout_broker_usd)::text amount from app_private.revenue_current group by account_id,period),
 facts as (select coalesce(a.account_id,r.account_id) account_id,coalesce(a.period,r.period) period,a.amount aum_usd,r.amount revenue_usd
  from a full join r using(account_id,period))
 select coalesce(jsonb_agg(jsonb_build_object('account_id',f.account_id,'period',f.period,'aum_usd',f.aum_usd,'revenue_usd',f.revenue_usd,
  'advisor_id',ad.id,'advisor',ad.name,'team_id',g.id,'team',g.name,'client_id',cl.id,'client',cl.name,'service',ac.service)
  order by f.account_id,f.period),'[]')
 from facts f join app_private.accounts ac on ac.id=f.account_id
 left join app_private.clients cl on cl.id=ac.client_id
 left join app_private.commercial_advisors ad on ad.id=app_private.advisor_at(f.account_id,f.period)
 left join app_private.advisor_group_memberships gm on gm.advisor_id=ad.id and gm.is_primary
  and gm.valid_during @> ((f.period+interval '1 month')::date-1)
 left join app_private.commercial_groups g on g.id=gm.group_id
$$;

-- Solo el ejecutor puede mutar: no hay endpoint ni GRANT directo a esta función.
create function app_private.change_model(entity text,target_id uuid,input jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare t text; old_data jsonb; next_data jsonb; allowed text[]; col text; columns text; ref uuid; ref_active boolean;
begin
 t:=case entity when 'clients' then 'clients' when 'custodians' then 'custodians' when 'teams' then 'commercial_groups'
  when 'advisors' then 'commercial_advisors' when 'accounts' then 'accounts'
  when 'assignments' then 'account_assignments' when 'memberships' then 'advisor_group_memberships' end;
 if t is null or target_id is null or jsonb_typeof(input) is distinct from 'object' then
  raise invalid_parameter_value using message='Invalid model entity or input';
 end if;
 allowed:=case entity when 'custodians' then array['name','code','active'] when 'accounts' then array['client_id','service','active']
  when 'assignments' then array['account_id','advisor_id','valid_from','valid_to','evidence']
  when 'memberships' then array['advisor_id','group_id','valid_from','valid_to','evidence'] else array['name','active'] end;
 if exists(select 1 from jsonb_object_keys(input) k where not k=any(allowed)) then
  raise invalid_parameter_value using message='Unknown model field';
 end if;
 execute format('select to_jsonb(t) from app_private.%I t where id=$1 for update',t) into old_data using target_id;
 if old_data is null and entity='accounts' then raise invalid_parameter_value using message='Create accounts through imports'; end if;
 next_data:=jsonb_build_object('active',true,'valid_to',null)||coalesce(old_data,'{}')||input||jsonb_build_object('id',target_id);
 -- Referencias inactivas no pueden incorporarse a una relación nueva; desactivar no borra la historia existente.
 foreach col in array array['client_id','account_id','advisor_id','group_id'] loop
  ref:=(next_data->>col)::uuid;
  if ref is not null and (old_data is null or old_data->>col is distinct from next_data->>col) then
   execute format('select active from app_private.%I where id=$1',case col when 'client_id' then 'clients'
    when 'account_id' then 'accounts' when 'advisor_id' then 'commercial_advisors' else 'commercial_groups' end)
   into strict ref_active using ref;
   if not ref_active then raise check_violation using message='Inactive reference'; end if;
  end if;
 end loop;
 columns:=array_to_string(allowed,',');
 if old_data is null then
  execute format('insert into app_private.%I(id,%s,created_by) select $1,%s,$3 from jsonb_populate_record(null::app_private.%I,$2) returning to_jsonb(%I.*)',
   t,columns,columns,t,t) into next_data using target_id,next_data,auth.uid();
 else
  execute format('update app_private.%I t set (%s)=(select %s from jsonb_populate_record(null::app_private.%I,$2)) where id=$1 returning to_jsonb(t.*)',t,columns,columns,t)
   into next_data using target_id,next_data;
 end if;
 return next_data;
end $$;

create function app_private.manage_model(operation text,entity text default null,target_id uuid default null,
 input jsonb default '{}',reason text default null,review_id uuid default null,page_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t text; result jsonb; before_rows jsonb; after_rows jsonb; changes jsonb; saved jsonb; original jsonb;
 review app_private.model_reviews; rev text; new_id uuid; fields text; choices jsonb; option_entity text; option_table text;
begin
 if coalesce(app_private.current_access(),'') not in ('admin','reader') then
  raise insufficient_privilege using message='Enabled reader or administrator required';
 end if;
 if operation not in ('list','preview','save') or operation is null then raise invalid_parameter_value using message='Invalid operation'; end if;
 if operation<>'list' and app_private.current_access()<>'admin' then
  raise insufficient_privilege using message='Enabled administrator required';
 end if;
 t:=case entity when 'clients' then 'clients' when 'custodians' then 'custodians' when 'teams' then 'commercial_groups'
  when 'advisors' then 'commercial_advisors' when 'accounts' then 'accounts'
  when 'assignments' then 'account_assignments' when 'memberships' then 'advisor_group_memberships' end;
 if operation='list' then
  if t is null or page_offset is null or page_offset not between 0 and 1000000 then raise invalid_parameter_value using message='Invalid catalog pagination'; end if;
  -- Proyección explícita: nunca payloads, evidencia ni filas en preparación para lectores.
  fields:=case entity when 'assignments' then 'id,account_id,advisor_id,valid_from,valid_to,is_primary'
    when 'memberships' then 'id,advisor_id,group_id,valid_from,valid_to,is_primary'
    when 'accounts' then 'id,custodian_id,client_id,service,active'
    when 'custodians' then 'id,name,code,active' else 'id,name,active' end;
  execute format('select jsonb_build_object(''row_count'',(select count(*) from app_private.%1$I),''offset'',$1,''limit'',25,''rows'',coalesce(jsonb_agg(to_jsonb(p)),''[]'')) from
   (select %2$s from app_private.%1$I order by id limit 25 offset $1) p',t,
   fields) into result using page_offset;
  execute format('select to_jsonb(p) from (select %s from app_private.%I where id=$1) p',fields,t) into saved using target_id;
  result:=result||jsonb_build_object('selected',saved);
  foreach option_entity in array array['clients','custodians','teams','advisors'] loop
   option_table:=case option_entity when 'teams' then 'commercial_groups' when 'advisors' then 'commercial_advisors' else option_entity end;
   execute format('select coalesce(jsonb_agg(to_jsonb(p)),''[]'') from (select id,name label from app_private.%I where active order by name collate "C",id limit 250) p',option_table) into choices;
   result:=jsonb_set(result,array['options'],coalesce(result->'options','{}')||jsonb_build_object(option_entity,choices));
  end loop;
  select coalesce(jsonb_agg(to_jsonb(p)),'[]') into choices from
   (select ac.id,c.name||' · '||coalesce((select value_original from app_private.account_identifiers where account_id=ac.id and resolution_status='resolved' order by source,namespace,value_original,id limit 1),ac.id::text) label
    from app_private.accounts ac join app_private.custodians c on c.id=ac.custodian_id where ac.active order by ac.id limit 250) p;
  result:=jsonb_set(result,'{options,accounts}',choices);
  result:=result||jsonb_build_object('audit_count',case when app_private.current_access()='admin' then (select count(*) from app_private.audit_events where entity_table=t) else 0 end);
  if app_private.current_access()='admin' then
   result:=result||jsonb_build_object('audit',coalesce((select jsonb_agg(to_jsonb(a) order by occurred_at desc,id) from
    (select e.id,e.actor_id,e.occurred_at,e.action,e.entity_id,e.reason,e.before_data,e.after_data from app_private.audit_events e
     where entity_table=t order by occurred_at desc,id limit 25 offset page_offset) a),'[]'));
  end if;
  return result;
 end if;
 perform pg_advisory_xact_lock(71482026);
 if operation='save' then
  select * into strict review from app_private.model_reviews where id=review_id and actor_id=auth.uid() for update;
  if review.applied_at is not null then return jsonb_build_object('saved',true,'id',review.target_id); end if;
  if review.created_at<clock_timestamp()-interval '30 minutes' or review.revision<>app_private.model_revision() then
   raise exception using errcode='40001',message='Model changed; review again';
  end if;
  perform set_config('app_papa.change_reason',review.reason,true);
  saved:=app_private.change_model(review.entity,review.target_id,review.input);
  update app_private.model_reviews set applied_at=clock_timestamp() where id=review.id;
  return jsonb_build_object('saved',true,'id',review.target_id);
 end if;
 if reason is null or length(btrim(reason)) not between 3 and 2000 then raise invalid_parameter_value using message='Reason required'; end if;
 rev:=app_private.model_revision(); new_id:=coalesce(target_id,gen_random_uuid());
 before_rows:=app_private.attribution_snapshot();
 if t is not null then execute format('select to_jsonb(t) from app_private.%I t where id=$1',t) into original using new_id; end if;
 -- La prueba usa las restricciones y triggers reales y revierte TODA mutación, incluida su auditoría.
 begin
  perform set_config('app_papa.change_reason',btrim(reason),true);
  saved:=app_private.change_model(entity,new_id,input);
  after_rows:=app_private.attribution_snapshot();
  raise sqlstate 'PT001';
 exception when sqlstate 'PT001' then null;
 end;
 select coalesce(jsonb_agg(jsonb_build_object('before',b.v,'after',a.v) order by b.v->>'account_id',b.v->>'period'),'[]') into changes
 from jsonb_array_elements(before_rows) b(v) join jsonb_array_elements(after_rows) a(v)
  on b.v->>'account_id'=a.v->>'account_id' and b.v->>'period'=a.v->>'period' where b.v is distinct from a.v;
 -- shortcut: revisión completa hasta 5000 cuenta-meses afectados; agregar revisión paginada si el volumen real lo exige.
 if jsonb_array_length(changes)>5000 then raise program_limit_exceeded using message='Too many affected months; narrow the change'; end if;
 result:=jsonb_build_object('before',original,'after',saved,'changes',changes,'reason',btrim(reason));
 insert into app_private.model_reviews(actor_id,entity,target_id,input,reason,revision,preview)
 values(auth.uid(),entity,new_id,input,btrim(reason),rev,result) returning id into new_id;
 return result||jsonb_build_object('review_id',new_id);
end $$;

-- Mismo ejecutor acotado/RLS del modelo existente; wrappers públicos sin privilegios elevados.
grant create on schema app_private to app_papa_executor;
alter function app_private.account_directory(date,date,uuid,uuid,uuid,uuid,uuid,text,text,text,integer,integer,text) owner to app_papa_executor;
alter function app_private.account_detail(uuid,date,date,uuid,uuid,integer,integer,text,uuid,uuid,text) owner to app_papa_executor;
alter function app_private.manage_model(text,text,uuid,jsonb,text,uuid,integer) owner to app_papa_executor;
revoke create on schema app_private from app_papa_executor;
grant execute on function app_private.account_months(date,date,uuid),app_private.model_revision(),app_private.attribution_snapshot(),app_private.change_model(text,uuid,jsonb) to app_papa_executor;
revoke all on function app_private.account_directory(date,date,uuid,uuid,uuid,uuid,uuid,text,text,text,integer,integer,text),
 app_private.account_detail(uuid,date,date,uuid,uuid,integer,integer,text,uuid,uuid,text),app_private.manage_model(text,text,uuid,jsonb,text,uuid,integer) from public,anon,service_role;
grant execute on function app_private.account_directory(date,date,uuid,uuid,uuid,uuid,uuid,text,text,text,integer,integer,text),
 app_private.account_detail(uuid,date,date,uuid,uuid,integer,integer,text,uuid,uuid,text),app_private.manage_model(text,text,uuid,jsonb,text,uuid,integer) to authenticated;
create function public.account_directory(month_from date,month_to date,custodian uuid default null,team uuid default null,advisor uuid default null,
 client uuid default null,account uuid default null,service_filter text default null,search_text text default '',sort_by text default 'identifier',
 page_size integer default 25,page_offset integer default 0,expected_revision text default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 select app_private.account_directory(month_from,month_to,custodian,team,advisor,client,account,service_filter,search_text,sort_by,page_size,page_offset,expected_revision)
$$;
create function public.account_detail(target_id uuid,month_from date,month_to date,team uuid default null,advisor uuid default null,
 page_size integer default 25,page_offset integer default 0,expected_revision text default null,
 custodian uuid default null,client uuid default null,service_filter text default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 select app_private.account_detail(target_id,month_from,month_to,team,advisor,page_size,page_offset,expected_revision,custodian,client,service_filter)
$$;
create function public.manage_model(operation text,entity text default null,target_id uuid default null,input jsonb default '{}',reason text default null,
 review_id uuid default null,page_offset integer default 0) returns jsonb language sql security invoker set search_path='' as $$
 select app_private.manage_model(operation,entity,target_id,input,reason,review_id,page_offset)
$$;
revoke all on function public.account_directory(date,date,uuid,uuid,uuid,uuid,uuid,text,text,text,integer,integer,text),
 public.account_detail(uuid,date,date,uuid,uuid,integer,integer,text,uuid,uuid,text),public.manage_model(text,text,uuid,jsonb,text,uuid,integer) from public,anon,service_role;
grant execute on function public.account_directory(date,date,uuid,uuid,uuid,uuid,uuid,text,text,text,integer,integer,text),
 public.account_detail(uuid,date,date,uuid,uuid,integer,integer,text,uuid,uuid,text),public.manage_model(text,text,uuid,jsonb,text,uuid,integer) to authenticated;
commit;
