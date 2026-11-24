-- Sólo lectura. Devuelve conteos/estados y controles booleanos; no IDs ni montos reales.
-- Clasificación actual de servicio; no atribuye historia comercial ni certifica cobertura esperada.
with
quarters as (select d::date quarter from generate_series('2023-01-01'::date,'2026-10-01',interval '3 months')d),
a as materialized (select account_id,period,sum(value_usd) aum,count(*) arows,count(value_usd) avals,bool_or(value_usd<0) negative
 from app_private.aum_current group by account_id,period),
r as materialized (select account_id,period,sum(payout_broker_usd) revenue,count(*) rrows,count(payout_broker_usd) rvals
 from app_private.revenue_current group by account_id,period),
universe as (select distinct q.quarter,f.account_id from quarters q join
 (select account_id,period from a union select account_id,period from r)f
 on f.period between (q.quarter-interval '1 month')::date and (q.quarter+interval '2 months')::date),
rates as materialized (select distinct on(account_id,quarter) account_id,quarter,annual_rate,source_event_id
 from app_private.roa_rate_versions order by account_id,quarter,revision desc),
matrix as materialized (
 select u.quarter,u.account_id,case when ac.service in ('Advisory','Brokerage','sin_clasificar') then ac.service else 'otra_clasificacion' end service,m::date period,a.aum,r.revenue,
 coalesce(a.arows,0) arows,coalesce(a.avals,0) avals,coalesce(r.rrows,0) rrows,coalesce(r.rvals,0) rvals,
 coalesce(a.negative,false) negative,
 case when inv.source_event_id is null then v.annual_rate end rate
 from universe u cross join lateral generate_series(u.quarter,(u.quarter+interval '2 months')::date,interval '1 month')m
 join app_private.accounts ac on ac.id=u.account_id
 left join a on a.account_id=u.account_id and a.period=m::date
 left join r on r.account_id=u.account_id and r.period=m::date
 left join rates v on v.account_id=u.account_id and v.quarter=u.quarter
 left join app_private.roa_rate_invalidations inv on inv.source_event_id=v.source_event_id
),
per_account as (
 select quarter,service,account_id,
 count(*) filter(where arows=0 or arows<>avals) missing_aum,
 count(*) filter(where rrows=0 or rrows<>rvals) missing_revenue,sum(aum) s,sum(revenue) revenue,sum(aum*rate) weighted,
 bool_or(negative) negative,count(*) filter(where aum>0 and rate is null) missing_rate,
 bool_or(rate is not null) has_rate from matrix group by quarter,service,account_id
),
population as (
 select quarter,service,count(*) accounts,count(*) filter(where has_rate) rate_accounts,
 count(*) filter(where missing_aum=0) complete_aum_accounts,
 count(*) filter(where missing_revenue=0) complete_revenue_accounts,
 count(*) filter(where missing_aum=0 and missing_revenue=0 and s>0) positive_complete_accounts,
 count(*) filter(where service='Advisory' and missing_aum=0 and missing_revenue=0 and s>0 and not negative and missing_rate=0) advisory_comparable_accounts,
 count(*) filter(where service='Advisory' and missing_aum=0 and missing_revenue=0 and s>0 and not negative and missing_rate=0 and revenue*1200<weighted*100) advisory_below_reference,
 count(*) filter(where service='Advisory' and missing_aum=0 and missing_revenue=0 and s>0 and not negative and missing_rate=0 and revenue*1200=weighted*100) advisory_equal_reference,
 count(*) filter(where service='Advisory' and missing_aum=0 and missing_revenue=0 and s>0 and not negative and missing_rate=0 and revenue*1200>weighted*100) advisory_above_reference
 from per_account group by quarter,service
),
monthly as (select quarter,service,period,sum(aum) aum,sum(revenue) revenue from matrix group by quarter,service,period),
monthly_totals as (select quarter,service,sum(aum) s,sum(revenue) revenue from monthly group by quarter,service),
stats as (
 select quarter,service,sum(aum) s,sum(revenue) revenue,sum(arows) arows,sum(rrows) rrows,
 count(*) filter(where arows=0 or arows<>avals) missing_aum,
 count(*) filter(where rrows=0 or rrows<>rvals) missing_revenue,
 count(*) filter(where aum>0 and rate is null) positive_missing_rate,
 bool_or(negative) negative,sum(aum*rate) weighted,min(rate) min_rate,max(rate) max_rate
 from matrix group by quarter,service
),
-- Controles directos independientes; no se unen detalles AUM y Revenue.
raw_a as (select date_trunc('quarter',f.period)::date quarter,case when ac.service in ('Advisory','Brokerage','sin_clasificar') then ac.service else 'otra_clasificacion' end service,sum(f.value_usd) s from app_private.aum_current f
 join app_private.accounts ac on ac.id=f.account_id group by 1,2),
raw_r as (select date_trunc('quarter',f.period)::date quarter,case when ac.service in ('Advisory','Brokerage','sin_clasificar') then ac.service else 'otra_clasificacion' end service,sum(f.payout_broker_usd) revenue from app_private.revenue_current f
 join app_private.accounts ac on ac.id=f.account_id group by 1,2),
report as (
 select q.quarter,d.service,coalesce(p.accounts,0) observed_accounts,coalesce(p.rate_accounts,0) rate_accounts,
 coalesce(p.complete_aum_accounts,0) complete_aum_accounts,coalesce(p.complete_revenue_accounts,0) complete_revenue_accounts,
 coalesce(p.positive_complete_accounts,0) positive_complete_accounts,
 coalesce(p.advisory_comparable_accounts,0) advisory_comparable_accounts,
 coalesce(p.advisory_below_reference,0) advisory_below_reference,
 coalesce(p.advisory_equal_reference,0) advisory_equal_reference,
 coalesce(p.advisory_above_reference,0) advisory_above_reference,
 coalesce(s.arows,0) aum_rows,coalesce(s.rrows,0) revenue_rows,
 case when coalesce(s.arows,0)=0 and coalesce(s.rrows,0)=0 then 'no_data'
 when (current_timestamp at time zone 'America/Argentina/Buenos_Aires')::date<(q.quarter+interval '3 months')::date then 'open_quarter'
 when s.missing_aum>0 or s.missing_revenue>0 then 'incomplete'
 when s.s=0 then 'zero_aum' when s.s<0 then 'negative_aum' else 'calculable' end coverage_state,
 (mt.s is not distinct from raw_a.s) aum_monthly_conserved,
 (mt.revenue is not distinct from raw_r.revenue) revenue_monthly_conserved,
 coalesce(d.service='Advisory' and s.missing_aum=0 and not s.negative and s.s>0 and s.positive_missing_rate=0,false) fee_weightable,
 case when d.service='Advisory' and s.missing_aum=0 and not s.negative and s.s>0 and s.positive_missing_rate=0
 then s.weighted>=s.min_rate*s.s and s.weighted<=s.max_rate*s.s end weighted_rate_within_bounds
 from quarters q cross join (values ('Advisory'),('Brokerage'),('sin_clasificar'),('otra_clasificacion'))d(service)
 left join population p on p.quarter=q.quarter and p.service=d.service
 left join stats s on s.quarter=q.quarter and s.service=d.service
 left join monthly_totals mt on mt.quarter=q.quarter and mt.service=d.service
 left join raw_a on raw_a.quarter=q.quarter and raw_a.service=d.service
 left join raw_r on raw_r.quarter=q.quarter and raw_r.service=d.service
)
select * from report order by quarter,service;
