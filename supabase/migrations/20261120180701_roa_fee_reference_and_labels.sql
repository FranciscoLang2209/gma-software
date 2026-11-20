begin;
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;
-- Separate a published account rate from the AUM-weighted comparator; preserve financial formulas and permissions.
create or replace function app_private.quarterly_roa_report(
 report_year integer, report_quarter integer,
 custodian uuid default null, team uuid default null, advisor uuid default null,
 client uuid default null, account uuid default null, service_filter text default null,
 group_by text default 'account', page_size integer default 25, page_offset integer default 0,
 expected_revision text default null
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare first_month date; last_month date; quarter_closed boolean; answer jsonb;
begin
 if coalesce(app_private.current_access(),'') not in ('admin','reader') then raise insufficient_privilege; end if;
 if report_year is null or report_year not between 1900 and 9998
  or report_quarter is null or report_quarter not between 1 and 4
  or (service_filter is not null and service_filter not in ('Advisory','Brokerage','sin_clasificar'))
  or group_by is null or group_by not in ('account','service','custodian','team','advisor','client')
  or page_size is null or page_size not between 1 and 250
  or page_offset is null or page_offset not between 0 and 1000000
  or (page_offset>0 and expected_revision is null)
  or (expected_revision is not null and expected_revision !~ '^[a-f0-9]{32}$') then
  raise invalid_parameter_value using message='Invalid quarterly filters or pagination';
 end if;
 first_month:=make_date(report_year,(report_quarter-1)*3+1,1);
 last_month:=(first_month+interval '2 months')::date;
 quarter_closed:=(current_timestamp at time zone 'America/Argentina/Buenos_Aires')::date >= (first_month+interval '3 months')::date;
 with
 months as (select m::date period from generate_series(first_month,last_month,interval '1 month') m),
 a as materialized (
  select account_id,period,sum(value_usd) amount,count(*) rows,count(value_usd) vals,bool_or(value_usd<0) negative,
   array_agg(distinct batch_id order by batch_id) batches
  from app_private.aum_current where period between (first_month-interval '1 month')::date and last_month
   and (custodian is null or custodian_id=custodian) and (account is null or account_id=account)
  group by account_id,period
 ),
 r as materialized (
  select account_id,period,sum(payout_broker_usd) amount,count(*) rows,count(payout_broker_usd) vals,
   array_agg(distinct batch_id order by batch_id) batches
  from app_private.revenue_current where period between (first_month-interval '1 month')::date and last_month
   and (custodian is null or custodian_id=custodian) and (account is null or account_id=account)
  group by account_id,period
 ),
 universe as (select account_id from a union select account_id from r),
 assignments as materialized (
  select f.account_id,f.advisor_id,f.valid_during,0 priority from app_private.fa_rows f
  join app_private.import_scopes s on s.active_batch_id=f.batch_id join universe u using(account_id)
  union all
  select x.account_id,x.advisor_id,x.valid_during,1 from app_private.account_assignments x
  join universe u using(account_id) where x.is_primary
 ),
 attributed as materialized (
  select distinct on (u.account_id,m.period) u.account_id,m.period,ac.custodian_id,ac.client_id,ac.service,
   x.advisor_id,a.amount aum,r.amount revenue,coalesce(a.rows,0) arows,coalesce(a.vals,0) avals,
   coalesce(r.rows,0) rrows,coalesce(r.vals,0) rvals,coalesce(a.negative,false) negative_aum,
   a.batches aum_batches,r.batches revenue_batches
  from universe u cross join months m join app_private.accounts ac on ac.id=u.account_id
  left join a on a.account_id=u.account_id and a.period=m.period
  left join r on r.account_id=u.account_id and r.period=m.period
  left join assignments x on x.account_id=u.account_id and x.valid_during @> ((m.period+interval '1 month')::date-1)
  where client is null or ac.client_id=client
  order by u.account_id,m.period,x.priority nulls last
 ),
 before_service as materialized (
  select x.*,i.value_original account_identifier,gm.group_id team_id,c.name custodian_name,cl.name client_name,ad.name advisor_name,g.name team_name
  from attributed x join app_private.custodians c on c.id=x.custodian_id
  left join lateral (select value_original from app_private.account_identifiers
   where account_id=x.account_id and resolution_status='resolved'
   order by case source when 'revenue' then 0 when 'aum' then 1 when 'fa' then 2 else 3 end,
    namespace collate "C",value_original collate "C",id limit 1) i on true
  left join app_private.clients cl on cl.id=x.client_id
  left join app_private.commercial_advisors ad on ad.id=x.advisor_id
  left join app_private.advisor_group_memberships gm on gm.advisor_id=x.advisor_id and gm.is_primary
   and gm.valid_during @> ((x.period+interval '1 month')::date-1)
  left join app_private.commercial_groups g on g.id=gm.group_id
  where (advisor is null or x.advisor_id=advisor) and (team is null or gm.group_id=team)
 ),
 rates as materialized (
  select distinct on (v.account_id) v.* from app_private.roa_rate_versions v join universe u using(account_id)
  where v.quarter=first_month order by v.account_id,v.revision desc
 ),
 filtered as materialized (
  select f.*,v.id rate_version_id,v.annual_rate,v.created_at rate_published_at,
   inv.source_event_id is not null rate_obsolete,
   case when inv.source_event_id is null then v.annual_rate end effective_rate
  from before_service f left join rates v on v.account_id=f.account_id
  left join app_private.roa_rate_invalidations inv on inv.source_event_id=v.source_event_id
  where service_filter is null or f.service=service_filter
 ),
 keyed as (
  select f.*,case group_by when 'account' then account_id::text when 'service' then service
   when 'custodian' then custodian_id::text when 'team' then team_id::text
   when 'advisor' then advisor_id::text when 'client' then client_id::text end bucket,
   case group_by when 'account' then custodian_name||' · '||coalesce(account_identifier,account_id::text) when 'service' then case service when 'sin_clasificar' then 'Sin clasificar' else service end
   when 'custodian' then custodian_name when 'team' then team_name when 'advisor' then advisor_name
   when 'client' then client_name end label from filtered f
 ),
 expanded as (
  select k.*,d.kind,d.key,d.title from keyed k cross join lateral (values
   ('total','total','Total'),('row',coalesce(k.bucket,'sin_asignar'),coalesce(k.label,'Sin asignar')),
   ('service',k.service,k.service)) d(kind,key,title)
 ),
 stats as (
  select kind,key,title,sum(aum) s,sum(revenue) revenue,count(*) account_months,count(distinct account_id) accounts,
   sum(arows) aum_rows,sum(avals) aum_values,sum(rrows) revenue_rows,sum(rvals) revenue_values,
   count(*) filter(where arows=0) missing_aum,count(*) filter(where rrows=0) missing_revenue,
   count(*) filter(where arows>avals) null_aum,count(*) filter(where rrows>rvals) null_revenue,
   count(*) filter(where advisor_id is null) unassigned_advisor,count(*) filter(where team_id is null) unassigned_team,
   count(*) filter(where client_id is null) unassigned_client,bool_or(negative_aum) negative_aum,
   bool_and(service='Advisory') advisory_only,
   case when count(distinct account_id)=1 then max(rate_version_id::text) filter(where service='Advisory') end rate_version_id,
   count(distinct account_id) filter(where service='Advisory') advisory_accounts,
   count(distinct account_id) filter(where service='Advisory' and effective_rate is not null) rate_accounts,
   case when count(distinct account_id)=1 and bool_and(service='Advisory') then max(effective_rate)*100 end reference_fee,
   count(*) filter(where service='Advisory' and aum>0 and effective_rate is null) missing_rate,
   count(*) filter(where service='Advisory' and rate_obsolete) obsolete_rate,
   sum(aum) filter(where service='Advisory') advisory_aum,
   sum(aum) filter(where service='Advisory' and effective_rate is not null) covered_rate_aum,
   sum(aum*effective_rate) filter(where service='Advisory') weighted_rate
  from expanded group by kind,key,title
 ),
 states as (
  select s.*,case when aum_rows=0 and revenue_rows=0 then 'no_data'
   when not quarter_closed then 'open_quarter'
   when missing_aum>0 or missing_revenue>0 or null_aum>0 or null_revenue>0 then 'incomplete'
   when s=0 then 'zero_aum' when s<0 then 'negative_aum' else 'calculable' end state
  from stats s
 ),
 calculated as (
  select s.*,case when state='calculable' then revenue*1200/s end roa,
   case when advisory_only and missing_aum=0 and null_aum=0 and not negative_aum and s>0 and missing_rate=0
    then weighted_rate*100/s end fee
  from states s
 ),
 encoded as (
  select kind,key,jsonb_build_object('key',key,'label',title,'account_months',account_months,'accounts',accounts,
   'aum_known_sum_usd',s::text,'aum_average_divisor',3,
   'aum_average_usd',case when missing_aum=0 and null_aum=0 then (s/3)::text end,
   'revenue_quarter_usd',revenue::text,'roa_numerator',case when revenue is not null then (revenue*1200)::text end,
   'roa_denominator',s::text,'roa_percent',roa::text,'calculation_status',state,
   'classification',case when roa is not null then case when revenue*1200<0.40*s then 'Bajo'
    when revenue*1200<=0.60*s then 'OK' else 'Muy bien' end end,
   'aum_rows',aum_rows,'aum_values',aum_values,'revenue_rows',revenue_rows,'revenue_values',revenue_values,
   'missing_aum_account_months',missing_aum,'missing_revenue_account_months',missing_revenue,
   'null_aum_account_months',null_aum,'null_revenue_account_months',null_revenue,
   'unassigned_advisor_account_months',unassigned_advisor,'unassigned_team_account_months',unassigned_team,
   'unassigned_client_account_months',unassigned_client,'has_negative_aum',negative_aum,
   'advisory_fee_percent',fee::text,
   'advisory_reference_percent',reference_fee::text,'advisory_accounts',advisory_accounts,'advisory_rate_accounts',rate_accounts,
   'advisory_rate_version_id',rate_version_id,
   'advisory_fee_numerator',case when fee is not null then (weighted_rate*100)::text end,
   'advisory_fee_denominator',case when fee is not null then s::text end,
   'advisory_difference_numerator',case when roa is not null and fee is not null then (revenue*1200-weighted_rate*100)::text end,
   'advisory_difference_pp',case when roa is not null and fee is not null then ((revenue*1200-weighted_rate*100)/s)::text end,
   'advisory_fee_status',case when not advisory_only then 'not_applicable' when fee is not null then 'verified_reference'
    when obsolete_rate>0 then 'obsolete' else 'insufficient_coverage' end,
   'advisory_aum_month_sum_usd',advisory_aum::text,'rate_covered_aum_month_sum_usd',covered_rate_aum::text,
   'missing_rate_account_months',missing_rate,'obsolete_rate_account_months',obsolete_rate) data
  from calculated
 ),
 coverage as (
  select m.period,u.custodian_id,src.source,s.active_batch_id,b.published_at
  from months m cross join (select distinct custodian_id from filtered union select custodian where custodian is not null) u
  cross join (values ('aum'),('revenue')) src(source)
  left join app_private.import_scopes s on s.period=m.period and s.custodian_id=u.custodian_id and s.source=src.source
  left join app_private.import_batches b on b.id=s.active_batch_id
 ),
 revision as (
  select md5(jsonb_build_object('filters',jsonb_build_array(report_year,report_quarter,custodian,team,advisor,client,account,service_filter,group_by),
   'closed',quarter_closed,'formula','quarterly_roa_v1',
   'rows',(select md5(string_agg(md5(to_jsonb(f)::text),'' order by period,account_id)) from filtered f),
   'classification',(select md5(string_agg(md5(to_jsonb(f)::text),'' order by period,account_id)) from before_service f),
   'coverage',(select jsonb_agg(to_jsonb(c) order by period,custodian_id,source) from coverage c))::text) value
 )
 select jsonb_build_object('revision',(select value from revision),'formula_version','quarterly_roa_v1',
  'period',jsonb_build_object('year',report_year,'quarter',report_quarter,'from',first_month,'to',last_month,'closed',quarter_closed),
  'filters',jsonb_build_object('custodian',custodian,'team',team,'advisor',advisor,'client',client,'account',account,'service',service_filter),
  'attribution','month_end','dimension_basis','current_client_and_service_without_history',
  'revenue_basis','SUM(Payout broker); published MES/AÑO; service_suitability_unconfirmed',
  'assessment_basis','observed_only_provisional','coverage_basis','observed_quarter_and_previous_month; expected_coverage_unconfirmed',
  'published_at',greatest((select max(published_at) from coverage),(select max(rate_published_at) from filtered)),
  'total',coalesce((select data from encoded where kind='total'),jsonb_build_object('key','total','label','Total',
   'aum_known_sum_usd',null,'aum_average_divisor',3,'aum_average_usd',null,'revenue_quarter_usd',null,
   'roa_numerator',null,'roa_denominator',null,'roa_percent',null,'classification',null,'calculation_status','no_data',
   'accounts',0,'account_months',0,'aum_rows',0,'aum_values',0,'revenue_rows',0,'revenue_values',0,
   'missing_aum_account_months',0,'missing_revenue_account_months',0,'null_aum_account_months',0,'null_revenue_account_months',0,
   'unassigned_advisor_account_months',0,'unassigned_team_account_months',0,'unassigned_client_account_months',0,
   'advisory_reference_percent',null,'advisory_accounts',0,'advisory_rate_accounts',0,
   'has_negative_aum',false,'advisory_fee_percent',null,'advisory_difference_pp',null,'advisory_rate_version_id',null,
   'advisory_fee_numerator',null,'advisory_fee_denominator',null,'advisory_difference_numerator',null,'advisory_fee_status','not_applicable',
   'advisory_aum_month_sum_usd',null,'rate_covered_aum_month_sum_usd',null,'missing_rate_account_months',0,'obsolete_rate_account_months',0)),
  'services',coalesce((select jsonb_agg(data order by key collate "C") from encoded where kind='service'),'[]'),
  'months',(select jsonb_agg(jsonb_build_object('period',m.period,'aum_known_usd',x.aum::text,'revenue_known_usd',x.revenue::text,
    'included_account_months',x.n,'missing_aum_account_months',x.ma,'missing_revenue_account_months',x.mr,
    'aum_rows',x.ar,'aum_values',x.av,'revenue_rows',x.rr,'revenue_values',x.rv) order by m.period)
    from months m cross join lateral (select sum(aum) aum,sum(revenue) revenue,count(*) n,
     count(*) filter(where arows=0) ma,count(*) filter(where rrows=0) mr,sum(arows) ar,sum(avals) av,sum(rrows) rr,sum(rvals) rv
     from filtered f where f.period=m.period) x),
  'coverage',coalesce((select jsonb_agg(jsonb_build_object('period',period,'custodian_id',custodian_id,'source',source,
    'published',active_batch_id is not null) order by period,custodian_id,source) from coverage),'[]'),
  'service_coverage_before_filter',(select jsonb_build_object('accounts',count(distinct account_id),
   'unclassified_accounts',count(distinct account_id) filter(where service not in ('Advisory','Brokerage')),
   'unclassified_aum_month_sum_usd',(sum(aum) filter(where service not in ('Advisory','Brokerage')))::text,
   'unclassified_revenue_usd',(sum(revenue) filter(where service not in ('Advisory','Brokerage')))::text) from before_service),
  'group_by',group_by,'row_count',(select count(*) from encoded where kind='row'),'offset',page_offset,'limit',page_size,
  'rows',coalesce((select jsonb_agg(data order by key collate "C") from
   (select key,data from encoded where kind='row' order by key collate "C" limit page_size offset page_offset) p),'[]')
 ) into answer;
 if expected_revision is not null and expected_revision is distinct from answer->>'revision' then
  raise serialization_failure using message='Quarterly report changed; restart pagination';
 end if;
 return answer;
end $$;

revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
commit;
