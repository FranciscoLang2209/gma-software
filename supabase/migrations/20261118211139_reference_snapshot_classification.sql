begin;
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;

-- Una referencia de origen no es una identidad de cliente/persona ni una vigencia.
create table app_private.reference_snapshots (
 id uuid primary key,
 upload_id uuid not null references app_private.import_uploads(id) on delete restrict,
 previous_id uuid references app_private.reference_snapshots(id) on delete restrict,
 file_hash text not null check(file_hash ~ '^[a-f0-9]{64}$'),
 payload_hash text not null,
 source_sheet text not null,
 source_uploader uuid not null references auth.users(id) on delete restrict,
 operation_role text not null default current_user,
 approval_evidence text not null check(length(btrim(approval_evidence)) between 10 and 2000),
 published_at timestamptz not null default clock_timestamp()
);
create table app_private.reference_snapshot_rows (
 snapshot_id uuid not null references app_private.reference_snapshots(id) on delete restrict,
 source_row integer not null check(source_row>0),
 account_id uuid,
 custodian_id uuid not null references app_private.custodians(id) on delete restrict,
 client_label text, advisor_label text, team_label text, old_owner_label text,
 group_error boolean not null,
 primary key(snapshot_id,source_row),
 unique(snapshot_id,account_id),
 foreign key(account_id,custodian_id) references app_private.accounts(id,custodian_id) on delete restrict,
 check(greatest(length(client_label),length(advisor_label),length(team_label),length(old_owner_label))<=1000)
);
create table app_private.reference_snapshot_head (
 singleton boolean primary key default true check(singleton),
 snapshot_id uuid not null references app_private.reference_snapshots(id) on delete restrict
);
create trigger snapshots_immutable before update or delete on app_private.reference_snapshots
 for each row execute function app_private.deny_history_change();
create trigger snapshot_rows_immutable before update or delete on app_private.reference_snapshot_rows
 for each row execute function app_private.deny_history_change();
alter table app_private.reference_snapshots enable row level security;
alter table app_private.reference_snapshots force row level security;
alter table app_private.reference_snapshot_rows enable row level security;
alter table app_private.reference_snapshot_rows force row level security;
alter table app_private.reference_snapshot_head enable row level security;
alter table app_private.reference_snapshot_head force row level security;
grant select on app_private.reference_snapshots,app_private.reference_snapshot_rows,app_private.reference_snapshot_head to app_papa_executor;
create policy snapshot_read on app_private.reference_snapshots for select to app_papa_executor
 using ((select app_private.current_access()) in ('admin','reader'));
create policy snapshot_row_read on app_private.reference_snapshot_rows for select to app_papa_executor
 using ((select app_private.current_access()) in ('admin','reader'));
create policy snapshot_head_read on app_private.reference_snapshot_head for select to app_papa_executor
 using ((select app_private.current_access()) in ('admin','reader'));
create view app_private.reference_current with(security_invoker=true) as
 select r.* from app_private.reference_snapshot_rows r
 join app_private.reference_snapshot_head h on h.snapshot_id=r.snapshot_id;
grant select on app_private.reference_current to app_papa_executor;

-- Operación de mantenimiento explícita: sólo el dueño SQL, nunca JWT simulado.
-- Los usuarios de la app sólo reciben las proyecciones publicadas de las consultas.
create function app_private.apply_reference_snapshot(operation_id uuid,source_upload uuid,ref_hash text,
 entries jsonb,approval_evidence text,expected_current uuid default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare u app_private.import_uploads; old_id uuid; previous app_private.reference_snapshots;
 e jsonb; destinations uuid[]; custody uuid; matched integer:=0; source_count integer;
begin
 if operation_id is null or jsonb_typeof(entries) is distinct from 'array'
  or jsonb_array_length(entries) not between 1 and 10000 or length(btrim(approval_evidence)) not between 10 and 2000
  or approval_evidence is null then raise exception 'Complete reviewed REF and approval_evidence required'; end if;
 perform pg_advisory_xact_lock(71482026);
 select * into strict u from app_private.import_uploads where id=source_upload;
 if u.status<>'published' or u.options->>'source'<>'aum'
  or u.options->'references'->>'fileHash' is distinct from ref_hash
  or not exists(select 1 from app_private.import_batches b join app_private.import_scopes s on s.active_batch_id=b.id where b.upload_id=u.id)
  then raise exception 'Published AUM and its verified REF original required'; end if;
 source_count:=jsonb_array_length(u.options->'references'->'pairs');
 if source_count is distinct from jsonb_array_length(entries)
  or (select count(distinct x->>'row') from jsonb_array_elements(entries)x)<>source_count
  then raise exception 'REF must contain every original reference row exactly once'; end if;
 select snapshot_id into old_id from app_private.reference_snapshot_head where singleton;
 select * into previous from app_private.reference_snapshots where id=operation_id;
 if found then
  if (previous.upload_id,previous.file_hash,previous.payload_hash,previous.approval_evidence)
   is distinct from (source_upload,ref_hash,md5(entries::text),approval_evidence) or old_id<>operation_id
   then raise exception 'Snapshot retry differs or version is no longer active'; end if;
  return jsonb_build_object('id',operation_id,'matched',(select count(*) from app_private.reference_snapshot_rows where snapshot_id=operation_id and account_id is not null),'source_rows',source_count);
 end if;
 if old_id is distinct from expected_current then raise exception 'Snapshot changed; review again'; end if;
 insert into app_private.reference_snapshots(id,upload_id,previous_id,file_hash,payload_hash,source_sheet,source_uploader,approval_evidence)
 values(operation_id,u.id,old_id,ref_hash,md5(entries::text),u.options->'references'->>'sheet',u.created_by,approval_evidence);
 for e in select * from jsonb_array_elements(entries) loop
  if jsonb_typeof(e->'row') is distinct from 'number' or jsonb_typeof(e->'group_error') is distinct from 'boolean'
   or exists(select 1 from jsonb_each(e) f where f.key in ('holding','account','custodianCode','client','advisor','team','old_owner')
    and jsonb_typeof(f.value) not in ('string','null'))
   or not exists(select 1 from jsonb_array_elements(u.options->'references'->'pairs')p
    where (p->>'row')::integer=(e->>'row')::integer and p->>'holding'=e->>'holding' and p->>'account'=e->>'account'
     and p->>'custodianCode'=e->>'custodianCode') then raise exception 'REF row does not match original identity evidence'; end if;
  select id into strict custody from app_private.custodians where lower(btrim(code))=lower(btrim(e->>'custodianCode'));
  select array_agg(distinct account_id) into destinations from app_private.account_identifiers
   where custodian_id=custody and resolution_status='resolved' and
    ((source='revenue' and namespace='ACCOUNT' and value_original=e->>'account')
     or (source='aum' and namespace='Holding Account Number' and value_original=e->>'holding')
     or (source='aum' and namespace='Account Number bd_REV' and value_original=e->>'account'));
  if cardinality(destinations)>1 then raise exception 'Conflicting account identities; no merge allowed'; end if;
  if cardinality(destinations)=1 then
   if (e->>'group_error')::boolean then raise exception 'Applicable REF row has a blocking group error'; end if;
   matched:=matched+1;
  end if;
  insert into app_private.reference_snapshot_rows(snapshot_id,source_row,account_id,custodian_id,client_label,advisor_label,team_label,old_owner_label,group_error)
   values(operation_id,(e->>'row')::integer,destinations[1],custody,nullif(e->>'client',''),nullif(e->>'advisor',''),
    nullif(e->>'team',''),nullif(e->>'old_owner',''),(e->>'group_error')::boolean);
 end loop;
 if matched=0 then raise exception 'No resolved accounts in reviewed REF'; end if;
 insert into app_private.reference_snapshot_head(singleton,snapshot_id) values(true,operation_id)
 on conflict(singleton) do update set snapshot_id=excluded.snapshot_id;
 insert into app_private.audit_events(actor_id,action,entity_table,entity_id,before_data,after_data,reason)
 values(null,'publish_reference_snapshot','reference_snapshots',operation_id,
  jsonb_build_object('snapshot_id',old_id),jsonb_build_object('snapshot_id',operation_id,'source_rows',source_count,'matched',matched,'source_upload',u.id),approval_evidence);
 return jsonb_build_object('id',operation_id,'matched',matched,'source_rows',source_count);
end $$;
revoke all on function app_private.apply_reference_snapshot(uuid,uuid,text,jsonb,text,uuid) from public,anon,authenticated,service_role,app_papa_executor;

-- Funciones de lectura existentes conservan su owner, ACL y SECURITY DEFINER.

create or replace function app_private.aggregate_report(
 month_from date, month_to date, custodian uuid default null, team uuid default null,
 advisor uuid default null, client uuid default null, account uuid default null, service_filter text default null,
 group_by text default 'account', page_size integer default 100, page_offset integer default 0,
 expected_revision text default null
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if coalesce(app_private.current_access(),'') not in ('admin','reader') then
  raise insufficient_privilege using message='Enabled reader or administrator required';
 end if;
 if month_from is null or month_to is null or not isfinite(month_from) or not isfinite(month_to)
  or extract(day from month_from)<>1 or extract(day from month_to)<>1
  or month_from<date '1900-01-01' or month_to>date '9998-12-01'
  or month_to<month_from or month_to>=month_from+interval '120 months'
  or group_by is null or group_by not in ('account','custodian','team','advisor','client','service')
  or page_size is null or page_size not between 1 and 250 or page_offset is null or page_offset<0 or page_offset>1000000
  or (page_offset>0 and expected_revision is null)
  or (expected_revision is not null and expected_revision !~ '^[a-f0-9]{32}$')
  or (service_filter is not null and (btrim(service_filter)='' or length(service_filter)>200)) then
  raise invalid_parameter_value using message='Invalid report filters or pagination';
 end if;
 -- shortcut: matriz cuenta×mes y OFFSET acotados; pasar a cursor/snapshot si el volumen medido lo exige.
 with
 months as (select m::date period from generate_series((month_from-interval '1 month')::date,month_to,interval '1 month') m),
 a as materialized (
  select account_id,period,sum(value_usd) amount,count(*) rows,count(value_usd) vals
  from app_private.aum_current
  where period between (month_from-interval '1 month')::date and month_to
   and (custodian is null or custodian_id=custodian) and (account is null or account_id=account)
  group by account_id,period
 ),
 r as materialized (
  select account_id,period,sum(payout_broker_usd) amount,count(*) rows,count(payout_broker_usd) vals,bool_or(payout_broker_usd<0) has_negative
  from app_private.revenue_current
  where period between (month_from-interval '1 month')::date and month_to
   and (custodian is null or custodian_id=custodian) and (account is null or account_id=account)
  group by account_id,period
 ),
 -- Unión de fuentes ya agregadas; ningún alias ni detalle multiplica AUM.
 facts as materialized (
  select coalesce(a.account_id,r.account_id) account_id,coalesce(a.period,r.period) period,
   a.amount aum,r.amount revenue,coalesce(a.rows,0) arows,coalesce(a.vals,0) avals,
   coalesce(r.rows,0) rrows,coalesce(r.vals,0) rvals,coalesce(r.has_negative,false) revenue_negative
  from a full join r using(account_id,period)
 ),
 universe as (select distinct account_id from facts),
 -- FA publicado tiene prioridad incluso si deja el comercial sin asignar.
 assignment_candidates as materialized (
  select f.account_id,f.advisor_id,f.valid_during,0 priority
  from app_private.fa_rows f join app_private.import_scopes s on s.active_batch_id=f.batch_id
  join universe u on u.account_id=f.account_id
  union all
  select a.account_id,a.advisor_id,a.valid_during,1 priority
  from app_private.account_assignments a join universe u on u.account_id=a.account_id
  where a.is_primary
 ),
 attributed as materialized (
  select distinct on (u.account_id,m.period) u.account_id,m.period,ac.custodian_id,ac.client_id,ac.service,
   assignment.advisor_id,
   f.aum,f.revenue,coalesce(f.arows,0) arows,coalesce(f.avals,0) avals,
   coalesce(f.rrows,0) rrows,coalesce(f.rvals,0) rvals,coalesce(f.revenue_negative,false) revenue_negative
  from universe u cross join months m join app_private.accounts ac on ac.id=u.account_id
  left join facts f on f.account_id=u.account_id and f.period=m.period
  left join assignment_candidates assignment on assignment.account_id=u.account_id
   and assignment.valid_during @> ((m.period+interval '1 month')::date-1)
  where (client is null or ac.client_id=client) and (service_filter is null or ac.service=service_filter)
  order by u.account_id,m.period,assignment.priority nulls last
 ),
 filtered as materialized (
  select x.*,gm.group_id team_id,c.name custodian_name,cl.name client_name,ad.name advisor_name,g.name team_name
  from attributed x
  left join app_private.advisor_group_memberships gm on gm.advisor_id=x.advisor_id and gm.is_primary
   and gm.valid_during @> ((x.period+interval '1 month')::date-1)
  join app_private.custodians c on c.id=x.custodian_id
  left join app_private.clients cl on cl.id=x.client_id
  left join app_private.commercial_advisors ad on ad.id=x.advisor_id
  left join app_private.commercial_groups g on g.id=gm.group_id
  where (advisor is null or x.advisor_id=advisor) and (team is null or gm.group_id=team)
 ),
 keyed as (
  select f.*,
   case group_by when 'account' then account_id::text
    when 'custodian' then custodian_id::text when 'team' then team_id::text when 'advisor' then advisor_id::text
    when 'client' then client_id::text when 'service' then service end bucket,
   case group_by when 'account' then account_id::text
    when 'custodian' then custodian_name when 'team' then team_name when 'advisor' then advisor_name
    when 'client' then client_name when 'service' then service end label
  from filtered f
 ),
 expanded as (
  select k.*,d.kind,d.key,d.title,(d.kind='month' or k.period=month_to) closing
  from keyed k cross join lateral (values ('total','total','Total'),('month',k.period::text,k.period::text),
   ('row',coalesce(k.bucket,'sin_asignar'),coalesce(k.label,'Sin asignar'))) d(kind,key,title)
  where d.kind='month' or k.period>=month_from
 ),
 aggregates as (
  select kind,key,title,
   sum(aum) filter(where closing) aum,sum(revenue) revenue,
   coalesce(sum(arows) filter(where closing),0) aum_rows,coalesce(sum(avals) filter(where closing),0) aum_values,
   coalesce(sum(rrows),0) revenue_rows,coalesce(sum(rvals),0) revenue_values,
   count(distinct account_id) filter(where closing and arows>0) accounts_with_aum,
   count(distinct client_id) filter(where closing and arows>0) clients_with_aum,
   count(distinct account_id) filter(where closing and arows>0 and client_id is null) aum_accounts_without_client,
   count(distinct account_id) filter(where rrows>0) accounts_with_revenue,
   count(*) filter(where closing and arows=0) aum_missing_accounts,
   count(*) filter(where rrows=0) revenue_missing_account_months,
   count(distinct account_id) filter(where closing and arows>0 and advisor_id is null) aum_accounts_without_advisor,
   count(distinct account_id) filter(where rrows>0 and advisor_id is null) revenue_accounts_without_advisor,
   count(distinct account_id) filter(where closing and arows>0 and team_id is null) aum_accounts_without_team,
   count(distinct account_id) filter(where rrows>0 and team_id is null) revenue_accounts_without_team,
   sum(aum) filter(where closing and advisor_id is null) aum_without_advisor,
   sum(revenue) filter(where advisor_id is null) revenue_without_advisor,
   array_agg(distinct account_id order by account_id) filter(where closing and arows>0) aum_population,
   array_agg(distinct account_id order by account_id) filter(where rrows>0) revenue_population
  from expanded group by kind,key,title
 ),
 -- El total vacío existe; una suma sin datos sigue siendo NULL.
 stats as (
  select * from aggregates union all
  select 'total','total','Total',null::numeric,null::numeric,0,0,0,0,0,0,0,0,0,0,0,0,0,0,null::numeric,null::numeric,null::uuid[],null::uuid[]
  where not exists(select 1 from aggregates where kind='total')
 ),
 encoded as (
  select s.*,jsonb_build_object('key',key,'label',title,'aum_usd',aum::text,'revenue_usd',revenue::text,
   'aum_rows',aum_rows,'aum_values',aum_values,'revenue_rows',revenue_rows,'revenue_values',revenue_values,
   'accounts_with_aum',accounts_with_aum,'clients_with_aum',clients_with_aum,'aum_accounts_without_client',aum_accounts_without_client,
   'accounts_with_revenue',accounts_with_revenue,'aum_missing_accounts',aum_missing_accounts,
   'revenue_missing_account_months',revenue_missing_account_months,
   'aum_accounts_without_advisor',aum_accounts_without_advisor,'revenue_accounts_without_advisor',revenue_accounts_without_advisor,
   'aum_accounts_without_team',aum_accounts_without_team,'revenue_accounts_without_team',revenue_accounts_without_team,
   'aum_without_advisor_usd',aum_without_advisor::text,'revenue_without_advisor_usd',revenue_without_advisor::text) data
  from stats s
 ),
 monthly as (
  select m.period,e.*,p.aum prev_aum,p.revenue prev_revenue,
   (e.aum_population=p.aum_population and e.aum_values=e.aum_rows and p.aum_values=p.aum_rows) aum_comparable,
   (e.revenue_population=p.revenue_population and e.revenue_values=e.revenue_rows and p.revenue_values=p.revenue_rows) revenue_comparable
  from months m left join encoded e on e.kind='month' and e.key=m.period::text
  left join encoded p on p.kind='month' and p.key=(m.period-interval '1 month')::date::text
  where m.period>=month_from
 ),
 coverage as (
  select m.period,u.custodian_id,src.source,s.active_batch_id is not null published
  from months m cross join (select distinct custodian_id from filtered union select custodian where custodian is not null) u
  cross join (values ('aum'),('revenue')) src(source)
  left join app_private.import_scopes s on s.period=m.period and s.custodian_id=u.custodian_id and s.source=src.source
  where m.period>=month_from
 ),
 ref_accounts as materialized (
  select f.account_id,ref.snapshot_id,ref.client_label,ref.advisor_label,ref.team_label,
   sum(f.aum) filter(where f.period=month_to) aum,sum(f.revenue) revenue,
   coalesce(sum(f.arows) filter(where f.period=month_to),0) aum_rows,
   coalesce(sum(f.avals) filter(where f.period=month_to),0) aum_values,
   sum(f.rrows) revenue_rows,sum(f.rvals) revenue_values
  from filtered f left join app_private.reference_current ref on ref.account_id=f.account_id
  where f.period>=month_from and (f.arows>0 or f.rrows>0)
  group by f.account_id,ref.snapshot_id,ref.client_label,ref.advisor_label,ref.team_label
 ),
 ref_groups as (
  select case group_by when 'client' then client_label when 'team' then team_label else advisor_label end label,
   count(*) accounts,sum(aum)::text aum_usd,sum(revenue)::text revenue_usd,
   sum(aum_rows) aum_rows,sum(aum_values) aum_values,sum(revenue_rows) revenue_rows,sum(revenue_values) revenue_values
  from ref_accounts group by 1
 ),
 options as (
  select d.kind,d.id,min(d.label) label from filtered f cross join lateral (values
   ('custodio',f.custodian_id::text,f.custodian_name),('equipo',f.team_id::text,f.team_name),
   ('comercial',f.advisor_id::text,f.advisor_name),('cliente',f.client_id::text,f.client_name),
   ('cuenta',f.account_id::text,f.account_id::text),('servicio',f.service,f.service)) d(kind,id,label)
  where d.id is not null group by d.kind,d.id
 ),
 ranked as (
  select e.*,row_number() over(order by e.aum desc nulls last,e.key collate "C") position,
   data || jsonb_build_object(
    'aum_share_percent',case when t.aum>0 and t.aum_rows=t.aum_values
      and not exists(select 1 from filtered where period=month_to and aum<0)
      then (e.aum*100/t.aum)::text end,
    'revenue_share_percent',case when t.revenue>0 and t.revenue_rows=t.revenue_values
      and not exists(select 1 from filtered where revenue_negative and period>=month_from)
      then (e.revenue*100/t.revenue)::text end) display_data
  from encoded e cross join (select * from stats where kind='total') t where e.kind='row'
 ),
 revision as (
  select md5(jsonb_build_object('filters',jsonb_build_array(month_from,month_to,custodian,team,advisor,client,account,service_filter,group_by),
   'rows',(select jsonb_agg(to_jsonb(f) order by period,account_id) from filtered f),
   'reference_snapshot',(select snapshot_id from app_private.reference_snapshot_head),
   'coverage',(select jsonb_agg(to_jsonb(c) order by period,custodian_id,source) from coverage c))::text) value
 )
 select jsonb_build_object(
  'revision',(select value from revision),
  'published_at',(select max(b.published_at) from app_private.import_batches b join app_private.import_scopes s on s.active_batch_id=b.id
    where (s.source='fa' or s.period between (month_from-interval '1 month')::date and month_to)
    and s.custodian_id in (select distinct custodian_id from filtered union select custodian where custodian is not null)),
  'options',coalesce((select jsonb_object_agg(kind,items) from (
    select kind,jsonb_agg(jsonb_build_object('id',id,'label',label) order by label,id) items from (
      select *,row_number() over(partition by kind order by label,id) n from options
    ) limited where n<=100 group by kind) groups),'{}'::jsonb),
  'period',jsonb_build_object('from',month_from,'to',month_to,'aum_closing_month',month_to),
  'filters',jsonb_build_object('custodian',custodian,'team',team,'advisor',advisor,'client',client,'account',account,'service',service_filter),
  'attribution','month_end','coverage_basis','observed_accounts_in_range_and_previous_month; expected_coverage_unconfirmed',
  'reference_classification',case when exists(select 1 from app_private.reference_snapshot_head) then jsonb_build_object(
   'snapshot_id',(select snapshot_id from app_private.reference_snapshot_head),
   'published_at',(select s.published_at from app_private.reference_snapshots s join app_private.reference_snapshot_head h on h.snapshot_id=s.id),
   'basis','REF_snapshot_without_historical_validity',
   'dimension',case when group_by in ('client','team') then group_by else 'advisor' end,
   'observed_accounts',(select count(*) from ref_accounts),
   'matched_accounts',(select count(*) from ref_accounts where snapshot_id is not null),
   'accounts_without_client_label',(select count(*) from ref_accounts where client_label is null),
   'accounts_without_advisor_label',(select count(*) from ref_accounts where advisor_label is null),
   'accounts_without_team_label',(select count(*) from ref_accounts where team_label is null),
   'aum_client_labels',(select count(distinct client_label) from ref_accounts where aum_rows>0),
   'group_count',(select count(*) from ref_groups),
   'groups',coalesce((select jsonb_agg(to_jsonb(g) order by g.aum_usd::numeric desc nulls last,g.label collate "C" nulls last)
    from (select * from ref_groups order by aum_usd::numeric desc nulls last,label collate "C" nulls last limit 1000)g),'[]'::jsonb)
   ) end,
  'total',(select data from encoded where kind='total'),
  'months',(select jsonb_agg(coalesce(data,jsonb_build_object('aum_usd',null,'revenue_usd',null)) || jsonb_build_object(
   'period',period,'previous_period',(period-interval '1 month')::date,
   'aum_change_usd',case when aum_comparable then (aum-prev_aum)::text end,
   'aum_change_percent',case when aum_comparable then ((aum-prev_aum)*100/nullif(prev_aum,0))::text end,
   'revenue_change_usd',case when revenue_comparable then (revenue-prev_revenue)::text end,
   'revenue_change_percent',case when revenue_comparable then ((revenue-prev_revenue)*100/nullif(prev_revenue,0))::text end) order by period) from monthly),
  'coverage',coalesce((select jsonb_agg(to_jsonb(c) order by period,custodian_id,source) from coverage c),'[]'::jsonb),
  'group_by',group_by,'row_count',(select count(*) from encoded where kind='row'),
  'offset',page_offset,'limit',page_size,
  'rows',coalesce((select jsonb_agg(display_data order by sort_position,key collate "C") from
   (select key,display_data,case when group_by='account' then 0 else position end sort_position
    from ranked order by sort_position,key collate "C" limit page_size offset page_offset) page),'[]'::jsonb)
 ) into result;
 if expected_revision is not null and expected_revision is distinct from result->>'revision' then
  raise exception using errcode='40001',message='Report changed; restart pagination';
 end if;
 return result;
end $$;

create or replace function app_private.account_directory(
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
   ref.client_label ref_client,ref.advisor_label ref_advisor,ref.team_label ref_team,ref.snapshot_id ref_snapshot_id,
   coalesce(i.value_original,ac.id::text) identifier,i.source identifier_source,i.namespace identifier_namespace,
   closing.advisor_id,ad.name advisor,closing.team_id,g.name team,
   (select count(distinct coalesce(x.advisor_id::text,'-')||'/'||coalesce(x.team_id::text,'-'))>1 from monthly x where x.account_id=ac.id) assignment_changed,
   mt.aum_usd,mt.revenue_usd,coalesce(mt.aum_rows,0) aum_rows,coalesce(mt.aum_values,0) aum_values,
   mt.revenue_rows,mt.revenue_values
  from app_private.accounts ac join app_private.custodians c on c.id=ac.custodian_id
  join metrics mt on mt.account_id=ac.id
  left join app_private.clients cl on cl.id=ac.client_id
  left join app_private.reference_current ref on ref.account_id=ac.id
  left join lateral (select value_original,source,namespace from app_private.account_identifiers where account_id=ac.id and resolution_status='resolved'
   order by case source when 'revenue' then 0 when 'aum' then 1 when 'fa' then 2 else 3 end,namespace collate "C",value_original collate "C",id limit 1) i on true
  left join monthly closing on closing.account_id=ac.id and closing.period=month_to
  left join app_private.commercial_advisors ad on ad.id=closing.advisor_id
  left join app_private.commercial_groups g on g.id=closing.team_id
  where (custodian is null or ac.custodian_id=custodian) and (client is null or ac.client_id=client)
   and (service_filter is null or ac.service=service_filter)
   and (search_text='' or position(lower(search_text) in lower(coalesce(cl.name,'')||' '||coalesce(ref.client_label,'')||' '||ac.id::text))>0
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

revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
commit;
