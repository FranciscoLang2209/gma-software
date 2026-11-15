begin;

-- Solo el ejecutor de proyecciones puede leer estas clasificaciones para lectores.
do $$ declare t text; begin
 foreach t in array array['accounts','custodians','clients','commercial_advisors','commercial_groups','account_assignments','advisor_group_memberships'] loop
  execute format('create policy report_read on app_private.%I for select to app_papa_executor using ((select app_private.current_access()) in (''admin'',''reader''))',t);
 end loop;
end $$;
create policy report_fa on app_private.fa_rows for select to app_papa_executor
using ((select app_private.current_access()) in ('admin','reader')
 and exists(select 1 from app_private.import_scopes s where s.active_batch_id=fa_rows.batch_id));

create function app_private.aggregate_report(
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
  select account_id,period,sum(payout_broker_usd) amount,count(*) rows,count(payout_broker_usd) vals
  from app_private.revenue_current
  where period between (month_from-interval '1 month')::date and month_to
   and (custodian is null or custodian_id=custodian) and (account is null or account_id=account)
  group by account_id,period
 ),
 -- Unión de fuentes ya agregadas; ningún alias ni detalle multiplica AUM.
 facts as materialized (
  select coalesce(a.account_id,r.account_id) account_id,coalesce(a.period,r.period) period,
   a.amount aum,r.amount revenue,coalesce(a.rows,0) arows,coalesce(a.vals,0) avals,
   coalesce(r.rows,0) rrows,coalesce(r.vals,0) rvals
  from a full join r using(account_id,period)
 ),
 universe as (select distinct account_id from facts),
 attributed as materialized (
  select u.account_id,m.period,ac.custodian_id,ac.client_id,ac.service,
   app_private.advisor_at(u.account_id,m.period) advisor_id,
   f.aum,f.revenue,coalesce(f.arows,0) arows,coalesce(f.avals,0) avals,
   coalesce(f.rrows,0) rrows,coalesce(f.rvals,0) rvals
  from universe u cross join months m join app_private.accounts ac on ac.id=u.account_id
  left join facts f on f.account_id=u.account_id and f.period=m.period
  where (client is null or ac.client_id=client) and (service_filter is null or ac.service=service_filter)
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
 revision as (
  select md5(jsonb_build_object('filters',jsonb_build_array(month_from,month_to,custodian,team,advisor,client,account,service_filter,group_by),
   'rows',(select jsonb_agg(to_jsonb(f) order by period,account_id) from filtered f),
   'coverage',(select jsonb_agg(to_jsonb(c) order by period,custodian_id,source) from coverage c))::text) value
 )
 select jsonb_build_object(
  'revision',(select value from revision),
  'period',jsonb_build_object('from',month_from,'to',month_to,'aum_closing_month',month_to),
  'filters',jsonb_build_object('custodian',custodian,'team',team,'advisor',advisor,'client',client,'account',account,'service',service_filter),
  'attribution','month_end','coverage_basis','observed_accounts_in_range_and_previous_month; expected_coverage_unconfirmed',
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
  'rows',coalesce((select jsonb_agg(data order by key collate "C") from
   (select key,data from encoded where kind='row' order by key collate "C" limit page_size offset page_offset) page),'[]'::jsonb)
 ) into result;
 if expected_revision is not null and expected_revision is distinct from result->>'revision' then
  raise exception using errcode='40001',message='Report changed; restart pagination';
 end if;
 return result;
end $$;

grant create on schema app_private to app_papa_executor;
alter function app_private.aggregate_report(date,date,uuid,uuid,uuid,uuid,uuid,text,text,integer,integer,text) owner to app_papa_executor;
revoke create on schema app_private from app_papa_executor;
revoke all on function app_private.aggregate_report(date,date,uuid,uuid,uuid,uuid,uuid,text,text,integer,integer,text) from public,anon,service_role;
grant execute on function app_private.aggregate_report(date,date,uuid,uuid,uuid,uuid,uuid,text,text,integer,integer,text) to authenticated;
create function public.aggregate_report(
 month_from date, month_to date, custodian uuid default null, team uuid default null,
 advisor uuid default null, client uuid default null, account uuid default null, service_filter text default null,
 group_by text default 'account', page_size integer default 100, page_offset integer default 0, expected_revision text default null
) returns jsonb language sql stable security invoker set search_path='' as $$
 select app_private.aggregate_report(month_from,month_to,custodian,team,advisor,client,account,service_filter,group_by,page_size,page_offset,expected_revision)
$$;
revoke all on function public.aggregate_report(date,date,uuid,uuid,uuid,uuid,uuid,text,text,integer,integer,text) from public,anon,service_role;
grant execute on function public.aggregate_report(date,date,uuid,uuid,uuid,uuid,uuid,text,text,integer,integer,text) to authenticated;
commit;
