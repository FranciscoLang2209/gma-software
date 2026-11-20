begin;
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;

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
   -- Hashes de tamaño fijo evitan serializar un único JSON con toda la matriz cuenta×mes.
   'rows',(select md5(string_agg(md5(to_jsonb(f)::text),'' order by period,account_id)) from filtered f),
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

revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
commit;
