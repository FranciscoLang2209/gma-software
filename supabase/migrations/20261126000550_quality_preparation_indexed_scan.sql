begin;
grant app_papa_executor to current_user with inherit true, set true;
-- Evita leer publicados para comprobar lotes editables vacíos. OFFSET 0 conserva el acceso por batch_id.
create or replace view app_private.quality_records with(security_invoker=true) as
with resolved_identities as materialized (
 select source,namespace,custodian_id,lower(btrim(value_original)) normalized,
 count(distinct account_id) accounts,min(account_id::text)::uuid first_account
 from app_private.account_identifiers where resolution_status='resolved'
 group by source,namespace,custodian_id,lower(btrim(value_original))
), master_inputs as materialized (
 select id,created_at,created_by,(input->'review'->>'quarter')::date first_quarter,
 coalesce((input->'review'->>'quarter_to')::date,(input->'review'->>'quarter')::date) last_quarter,
 input->'review'->'brokers' brokers,input->'master'->>'sheet' sheet,input->'master'->'rows' rows
 from app_private.master_publications
), master_results as materialized (
 select distinct on (p.id,v->>'row') p.id publication_id,v resolved
 from app_private.master_publications p cross join lateral jsonb_array_elements(coalesce(p.result->'rows','[]')) with ordinality r(v,n)
 order by p.id,v->>'row',n
), upload_bounds as materialized (
 select u.id,min((p->>'period')::date) first_month,max((p->>'period')::date) last_month
 from app_private.import_uploads u cross join lateral jsonb_array_elements(u.manifest->'partitions')p group by u.id
), facts as (
 select 'aum'::text source,id,period,custodian_id,account_id,batch_id,import_row_id,value_usd is null missing from app_private.aum_current
 union all select 'revenue',id,period,custodian_id,account_id,batch_id,import_row_id,payout_broker_usd is null from app_private.revenue_current
 union all select 'fa',f.id,b.period,b.custodian_id,f.account_id,f.batch_id,f.import_row_id,false from app_private.fa_rows f join app_private.import_scopes s on s.active_batch_id=f.batch_id join app_private.import_batches b on b.id=f.batch_id
), financial_months as (
 select source,account_id,period,count(*) n,count(*) filter(where missing) absent from facts where source in ('aum','revenue') group by 1,2,3
), quarter_accounts as (
 select distinct account_id,date_trunc('quarter',period)::date quarter from financial_months
), grid as (
 select q.account_id,(q.quarter+n*interval '1 month')::date period,s.source
 from quarter_accounts q cross join (values (0),(1),(2))months(n) cross join (values ('aum'),('revenue'))s(source)
), coverage as (
 -- FULL JOIN por claves obliga una relación de conjuntos aun con estimaciones RLS pequeñas.
 select coalesce(g.account_id,f.account_id) account_id,coalesce(g.period,f.period) period,coalesce(g.source,f.source) source,
 coalesce(f.n,0) n,coalesce(f.absent,0) absent
 from grid g full join financial_months f using(account_id,period,source)
)
select 'fact/'||f.source||'/'||f.id key,f.source,'published'::text stage,f.period,f.period period_to,
 f.custodian_id,f.account_id,f.batch_id,f.import_row_id row_id,ir.sheet_name,ir.row_number,'published'::text status,
 array_remove(array[case when ac.id is null then 'orphan_account' end,case when ir.id is null then 'orphan_source' end,
 case when ac.id is not null and ac.custodian_id is distinct from f.custodian_id then 'custodian_conflict' end,
 case when ac.id is not null and ac.client_id is null then 'missing_client' end,
 case when f.custodian_id is null then 'missing_custodian' end,case when f.missing then 'missing_amount' end],null) codes,
 (ac.id is not null and ir.id is not null and ac.custodian_id=f.custodian_id) related,b.created_at,b.created_by
from facts f left join app_private.accounts ac on ac.id=f.account_id left join app_private.import_rows ir on ir.id=f.import_row_id join app_private.import_batches b on b.id=f.batch_id
union all
select 'row/'||r.id,b.source,'preparation',b.period,b.period,b.custodian_id,rr.account_id,b.id,r.id,r.sheet_name,r.row_number,b.status,
 array_remove(array[case when rr.id is null then 'unresolved' end,case when r.status<>'valid' or r.errors<>'[]' or b.blocking_error_count>0 or b.errors<>'[]' then 'blocking_error' end,
 case when jsonb_array_length(coalesce(r.cell_metadata->'warnings','[]'))>0 then 'warning' end,
 case when (select count(distinct i.account_id) from app_private.import_references(b,r) ref join app_private.account_identifiers i
 on i.source=b.source and i.namespace=ref.namespace and i.value_original=ref.original and i.custodian_id=b.custodian_id and i.resolution_status='resolved')>1 then 'identity_conflict' end],null),
 rr.id is not null,r.created_at,b.created_by
from app_private.import_batches b cross join lateral (select r.* from app_private.import_rows r where r.batch_id=b.id offset 0)r left join app_private.row_resolutions rr on rr.source_row_id=r.id
where b.status<>'published'
union all
select 'account/'||a.id,'accounts','catalog',null::date,null::date,a.custodian_id,a.id,null::uuid,null::uuid,null::text,null::integer,case when a.active then 'active' else 'inactive' end,
 array_remove(array[case when a.client_id is null then 'missing_client' end,case when a.custodian_id is null then 'missing_custodian' end],null),
 a.custodian_id is not null,a.created_at,a.created_by from app_private.accounts a
union all
select 'identifier/'||i.id,i.source,'identifier',null::date,null::date,i.custodian_id,i.account_id,null::uuid,i.source_row_id,null::text,null::integer,i.resolution_status,
 array_remove(array[case when i.resolution_status<>'resolved' then 'unresolved' end,
 case when i.value_original<>btrim(i.value_original) or i.value_original ~ '[[:cntrl:] ​‌‍‎‏‪-‮⁠-⁩﻿]' then 'identifier_format' end,
 case when i.account_id is not null and (g.accounts>1 or (g.accounts=1 and g.first_account<>i.account_id)) then 'identity_conflict' end],null),
 i.resolution_status='resolved',i.created_at,i.created_by from app_private.account_identifiers i left join resolved_identities g on g.source=i.source and g.namespace=i.namespace and g.custodian_id=i.custodian_id and g.normalized=lower(btrim(i.value_original))
union all
select 'ref/'||r.snapshot_id||'/'||r.source_row,'ref','reference',null::date,null::date,r.custodian_id,r.account_id,null::uuid,null::uuid,s.source_sheet,r.source_row,'published',
 array_remove(array[case when r.account_id is null then 'unresolved' end,case when r.group_error then 'blocking_error' end],null),
 r.account_id is not null,s.published_at,s.source_uploader from app_private.reference_current r join app_private.reference_snapshots s on s.id=r.snapshot_id
union all
select 'master/'||p.id||'/'||(m->>'row'),'master','reference',p.first_quarter,p.last_quarter,
 coalesce(ac.custodian_id,(p.brokers->>(m->'cells'->>'Broker'))::uuid),
 (resolved->>'account_id')::uuid,p.id,null::uuid,p.sheet,(m->>'row')::integer,'published',
 array_remove(array[case when resolved->>'account_id' is null then 'unresolved' end,
 case when m->'cells'->>'Fee type'='Advisory' and m->>'annualRate' is null then 'missing_rate' end,
 case when resolved->>'account_id' is not null and ac.id is null then 'orphan_account' end],null),
 ac.id is not null,p.created_at,p.created_by
from master_inputs p cross join lateral jsonb_array_elements(coalesce(p.rows,'[]'))m
left join master_results x on x.publication_id=p.id and x.resolved->>'row'=m->>'row'
left join app_private.accounts ac on ac.id=(resolved->>'account_id')::uuid
union all
select 'commission/'||e.id,'commissions','reference',coalesce((e.result->>'quarter')::date,(e.result->>'period')::date),
 coalesce((e.result->>'quarter')::date,(e.result->>'period')::date),(e.result->>'custodian_id')::uuid,(e.result->>'account_id')::uuid,
 null::uuid,null::uuid,null::text,null::integer,e.operation,
 array_remove(array[case when e.result->>'account_id' is null then 'unresolved' end,
 case when e.result->>'account_id' is not null and not exists(select 1 from app_private.accounts a where a.id=(e.result->>'account_id')::uuid) then 'orphan_account' end],null),
 (e.result->>'account_id' is not null and exists(select 1 from app_private.accounts a where a.id=(e.result->>'account_id')::uuid)),e.created_at,e.created_by from app_private.commission_current e
union all
select 'routing/'||u.id||'/'||(r->>'row'),coalesce(u.options->>'source','unknown'),'routing',null::date,null::date,
 case when u.options->>'multiCustodian'='true' then null::uuid else (u.options->>'custodianId')::uuid end,
 null::uuid,u.id,null::uuid,r->>'sheet',(r->>'row')::integer,u.status,array['unresolved','blocking_error'],false,u.created_at,u.created_by
from app_private.import_uploads u cross join lateral jsonb_array_elements(coalesce(u.manifest->'unroutable','[]'))r
union all
select 'upload/'||u.id,coalesce(u.options->>'source','unknown'),'upload',bounds.first_month,bounds.last_month,
 case when u.options->>'multiCustodian'='true' then null::uuid else (u.options->>'custodianId')::uuid end,
 null::uuid,u.id,null::uuid,u.manifest->>'sheet',null::integer,u.status,
 array_remove(array[case when jsonb_array_length(coalesce(u.manifest->'errors','[]'))>0 then 'blocking_error' end,case when u.options->>'source' is null then 'missing_source' end],null),
 null::boolean,u.created_at,u.created_by
from app_private.import_uploads u left join upload_bounds bounds on bounds.id=u.id
union all
select 'coverage/'||v.source||'/'||v.account_id||'/'||v.period,v.source,'coverage',v.period,v.period,a.custodian_id,v.account_id,
 null::uuid,null::uuid,null::text,null::integer,'observed_incomplete',array['period_incomplete'],null::boolean,null::timestamptz,null::uuid
from coverage v join app_private.accounts a on a.id=v.account_id where v.n=0 or v.absent>0;
revoke app_papa_executor from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
