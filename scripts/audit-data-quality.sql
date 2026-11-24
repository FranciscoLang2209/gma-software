-- Diagnóstico agregado; no repara, publica, deduplica ni devuelve identidades/importes.
-- Ejecutar en una conexión verificada de GMA con default_transaction_read_only=on.
-- Cada bloque puede ejecutarse por separado mediante MCP execute_sql.

-- audit: sources
with facts as (
 select 'aum' source, account_id, custodian_id, period, import_row_id, value_usd amount
 from app_private.aum_current
 union all
 select 'revenue', account_id, custodian_id, period, import_row_id, payout_broker_usd
 from app_private.revenue_current
)
select f.source, count(*) rows, count(distinct f.account_id) accounts,
 min(period) first_month, max(period) last_month,
 count(*) filter(where amount is null) missing_amounts,
 count(*) filter(where amount<0) negative_amounts,
 count(*) filter(where a.id is null) orphan_accounts,
 count(*) filter(where a.custodian_id is distinct from f.custodian_id) custodian_conflicts,
 count(*) filter(where ir.id is null) orphan_source_rows,
 count(*) filter(where a.client_id is null) without_client,
 count(*) filter(where not exists(select 1 from app_private.reference_current r where r.account_id=f.account_id)) without_ref
from facts f left join app_private.accounts a on a.id=f.account_id
left join app_private.import_rows ir on ir.id=f.import_row_id
group by f.source order by f.source;

-- audit: identity
with collisions as (
 select array_agg(distinct account_id) ids
 from app_private.account_identifiers where resolution_status='resolved'
 group by source, namespace, custodian_id, lower(btrim(value_original))
 having count(distinct account_id)>1
)
select jsonb_build_object(
 'accounts',(select jsonb_build_object('total',count(*),
  'without_client',count(*) filter(where client_id is null),
  'without_custodian',count(*) filter(where custodian_id is null)) from app_private.accounts),
 'services',(select jsonb_agg(to_jsonb(x)) from (select service,count(*) accounts from app_private.accounts group by service)x),
 'identifiers',(select jsonb_agg(to_jsonb(x)) from (
  select source,resolution_status,count(*) rows,
   count(*) filter(where value_original<>btrim(value_original)) edge_spaces,
   count(*) filter(where value_original ~ '[ ​‌‍﻿]') invisible_characters,
   count(*) filter(where value_original ~ '^0[0-9]') leading_zero,
   count(*) filter(where value_original ~* '^[+-]?[0-9]+([.,][0-9]+)?e[+-]?[0-9]+$') scientific,
   count(*) filter(where value_original ~ '^[0-9]{16,}$') long_numeric
  from app_private.account_identifiers group by source,resolution_status)x),
 'candidate_collisions',(select count(*) from collisions),
 'candidate_accounts',(select coalesce(sum(cardinality(ids)),0) from collisions),
 'candidate_aum_rows',(select count(*) from app_private.aum_current where account_id in(select unnest(ids) from collisions)),
 'candidate_revenue_rows',(select count(*) from app_private.revenue_current where account_id in(select unnest(ids) from collisions)),
 'duplicate_aum_keys',(select count(*) from (select account_id,period from app_private.aum_current group by 1,2 having count(*)>1)x),
 'multiple_revenue_account_months',(select count(*) from (select account_id,period from app_private.revenue_current group by 1,2 having count(*)>1)x),
 'cross_custodian_same_literal',(select count(*) from (select source,namespace,value_original from app_private.account_identifiers
  where resolution_status='resolved' group by 1,2,3 having count(distinct custodian_id)>1)x)
) identity_diagnostics;

-- audit: classification
select jsonb_build_object(
 'catalogs',jsonb_build_object('clients',(select count(*) from app_private.clients),
  'advisors',(select count(*) from app_private.commercial_advisors),
  'teams',(select count(*) from app_private.commercial_groups),
  'custodians',(select count(*) from app_private.custodians),
  'assignments',(select count(*) from app_private.account_assignments),
  'memberships',(select count(*) from app_private.advisor_group_memberships),
  'fa_rows',(select count(*) from app_private.fa_rows)),
 'ref',(select jsonb_build_object('rows',count(*),'matched_rows',count(account_id),'unmatched_rows',count(*)-count(account_id),
  'without_client_label',count(*) filter(where client_label is null),
  'without_advisor_label',count(*) filter(where advisor_label is null),
  'without_team_label',count(*) filter(where team_label is null),
  'group_errors',count(*) filter(where group_error),
  'edge_spaces',count(*) filter(where client_label<>btrim(client_label) or advisor_label<>btrim(advisor_label) or team_label<>btrim(team_label)),
  'invisible_characters',count(*) filter(where concat(client_label,advisor_label,team_label) ~ '[ ​‌‍﻿]')) from app_private.reference_current),
 'rates',(select jsonb_build_object('rows',count(*),'accounts',count(distinct account_id),
  'without_master',count(*) filter(where master_publication_id is null),
  'without_source_row',count(*) filter(where master_source_row is null),
  'orphan_accounts',count(*) filter(where not exists(select 1 from app_private.accounts a where a.id=v.account_id))) from app_private.roa_rate_versions v),
 'commission_events',(select count(*) from app_private.commission_events),
 'master',(select jsonb_build_object('snapshot_rows',jsonb_array_length(input->'master'->'rows'),
  'unmatched_rows',(select count(*) from jsonb_array_elements(result->'rows')r where r->>'account_id' is null),
  'advisory_unmatched',(select count(*) from jsonb_array_elements(input->'master'->'rows')m
   join jsonb_array_elements(result->'rows')r on r->>'row'=m->>'row'
   where m->'cells'->>'Fee type'='Advisory' and r->>'account_id' is null),
  'advisory_missing_rate',(select count(*) from jsonb_array_elements(input->'master'->'rows')m
   join jsonb_array_elements(result->'rows')r on r->>'row'=m->>'row'
   where m->'cells'->>'Fee type'='Advisory' and r->>'account_id' is not null and m->>'annualRate' is null))
  from app_private.master_publications order by created_at desc limit 1)
) classification_diagnostics;

-- audit: publication
select s.source,count(*) active_scopes,
 count(*) filter(where b.metric_total_usd is distinct from f.total
  or b.metric_value_count is distinct from f.values or b.row_count is distinct from f.rows) mismatched_scopes
from app_private.import_scopes s join app_private.import_batches b on b.id=s.active_batch_id
cross join lateral (
 select sum(amount) total,count(amount)::int values,count(*)::int rows from (
  select value_usd amount from app_private.aum_monthly where batch_id=b.id
  union all select payout_broker_usd from app_private.revenue_entries where batch_id=b.id
 ) amounts
) f group by s.source order by s.source;

-- audit: monthly_invariance
with a as (select account_id,period,sum(value_usd) amount from app_private.aum_current group by 1,2),
r as (select account_id,period,sum(payout_broker_usd) amount from app_private.revenue_current group by 1,2),
facts as (select coalesce(a.account_id,r.account_id) account_id,coalesce(a.period,r.period) period,
 a.amount aum,r.amount revenue from a full join r using(account_id,period)),
monthly as (
 select f.period,sum(aum) aum,sum(revenue) revenue from facts f
 join app_private.accounts ac on ac.id=f.account_id
 left join app_private.reference_current ref on ref.account_id=ac.id group by f.period
),
raw as (select period,
 (select sum(value_usd) from app_private.aum_current x where x.period=p.period) aum,
 (select sum(payout_broker_usd) from app_private.revenue_current x where x.period=p.period) revenue
 from (select distinct period from facts)p)
select count(*) months,bool_and(m.aum is not distinct from r.aum and m.revenue is not distinct from r.revenue) exact_totals_conserved
from monthly m full join raw r using(period);

-- audit: preparation
select jsonb_build_object(
 'batches',(select jsonb_agg(to_jsonb(x)) from (select source,status,count(*) batches,sum(row_count) declared_rows
  from app_private.import_batches group by source,status)x),
 'source_rows',(select jsonb_agg(to_jsonb(x)) from (select b.source,r.status,count(*) rows,
  count(*) filter(where rr.id is null) without_resolution,
  count(*) filter(where r.cell_metadata->>'period' is distinct from b.period::text) invalid_period_metadata
  from app_private.import_rows r join app_private.import_batches b on b.id=r.batch_id
  left join app_private.row_resolutions rr on rr.source_row_id=r.id group by b.source,r.status)x),
 'warnings',(select jsonb_agg(to_jsonb(x)) from (select b.source,w->>'code' code,count(*) occurrences
  from app_private.import_rows r join app_private.import_batches b on b.id=r.batch_id
  cross join lateral jsonb_array_elements(coalesce(r.cell_metadata->'warnings','[]'))w group by 1,2)x)
) preparation_diagnostics;
