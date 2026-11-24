begin;
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;

-- Diagnósticos de lectura; cada fuente conserva su grano. Sin importes agregados.
create view app_private.quality_records with(security_invoker=true) as
with facts as (
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
from app_private.import_rows r join app_private.import_batches b on b.id=r.batch_id left join app_private.row_resolutions rr on rr.source_row_id=r.id
where b.status<>'published'
union all
select 'account/'||a.id,'accounts','catalog',null::date,null::date,a.custodian_id,a.id,null::uuid,null::uuid,null::text,null::integer,case when a.active then 'active' else 'inactive' end,
 array_remove(array[case when a.client_id is null then 'missing_client' end,case when a.custodian_id is null then 'missing_custodian' end],null),
 a.custodian_id is not null,a.created_at,a.created_by from app_private.accounts a
union all
select 'identifier/'||i.id,i.source,'identifier',null::date,null::date,i.custodian_id,i.account_id,null::uuid,i.source_row_id,null::text,null::integer,i.resolution_status,
 array_remove(array[case when i.resolution_status<>'resolved' then 'unresolved' end,
 case when i.value_original<>btrim(i.value_original) or i.value_original ~ '[[:cntrl:] ​‌‍‎‏‪-‮⁠-⁩﻿]' then 'identifier_format' end,
 case when exists(select 1 from app_private.account_identifiers j where j.source=i.source and j.namespace=i.namespace
 and j.custodian_id=i.custodian_id and j.resolution_status='resolved' and j.account_id<>i.account_id
 and lower(btrim(j.value_original))=lower(btrim(i.value_original))) then 'identity_conflict' end],null),
 i.resolution_status='resolved',i.created_at,i.created_by from app_private.account_identifiers i
union all
select 'ref/'||r.snapshot_id||'/'||r.source_row,'ref','reference',null::date,null::date,r.custodian_id,r.account_id,null::uuid,null::uuid,s.source_sheet,r.source_row,'published',
 array_remove(array[case when r.account_id is null then 'unresolved' end,case when r.group_error then 'blocking_error' end],null),
 r.account_id is not null,s.published_at,s.source_uploader from app_private.reference_current r join app_private.reference_snapshots s on s.id=r.snapshot_id
union all
select 'master/'||p.id||'/'||(m->>'row'),'master','reference',(p.input->'review'->>'quarter')::date,
 coalesce((p.input->'review'->>'quarter_to')::date,(p.input->'review'->>'quarter')::date),
 coalesce(ac.custodian_id,(p.input->'review'->'brokers'->>(m->'cells'->>'Broker'))::uuid),
 (resolved->>'account_id')::uuid,p.id,null::uuid,p.input->'master'->>'sheet',(m->>'row')::integer,'published',
 array_remove(array[case when resolved->>'account_id' is null then 'unresolved' end,
 case when m->'cells'->>'Fee type'='Advisory' and m->>'annualRate' is null then 'missing_rate' end,
 case when resolved->>'account_id' is not null and ac.id is null then 'orphan_account' end],null),
 ac.id is not null,p.created_at,p.created_by
from app_private.master_publications p cross join lateral jsonb_array_elements(coalesce(p.input->'master'->'rows','[]'))m
left join lateral (select v resolved from jsonb_array_elements(coalesce(p.result->'rows','[]'))v where v->>'row'=m->>'row' limit 1)x on true
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
from app_private.import_uploads u cross join lateral (select min((p->>'period')::date) first_month,max((p->>'period')::date) last_month from jsonb_array_elements(u.manifest->'partitions')p)bounds
union all
select 'coverage/'||v.source||'/'||v.account_id||'/'||v.period,v.source,'coverage',v.period,v.period,a.custodian_id,v.account_id,
 null::uuid,null::uuid,null::text,null::integer,'observed_incomplete',array['period_incomplete'],null::boolean,null::timestamptz,null::uuid
from coverage v join app_private.accounts a on a.id=v.account_id where v.n=0 or v.absent>0;
revoke all on app_private.quality_records from public,anon,authenticated,service_role;
grant select on app_private.quality_records to app_papa_executor;

create function app_private.quality_report(filters jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare answer jsonb; start_month date; end_month date; source_filter text; issue_filter text; custodian_filter text; mode text;
 offset_no integer; revision text;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege; end if;
 if filters is null or jsonb_typeof(filters)<>'object' or octet_length(filters::text)>4096
 or exists(select 1 from jsonb_object_keys(filters)k where k not in ('from','to','source','issue','custodian','mode','offset','revision'))
 or exists(select 1 from jsonb_each(filters)kv where jsonb_typeof(kv.value)<>case when kv.key='offset' then 'number' else 'string' end) then raise invalid_parameter_value; end if;
 start_month:=(filters->>'from')::date; end_month:=(filters->>'to')::date;
 source_filter:=filters->>'source'; issue_filter:=filters->>'issue'; custodian_filter:=filters->>'custodian';
 mode:=coalesce(filters->>'mode','issues'); offset_no:=coalesce((filters->>'offset')::integer,0); revision:=filters->>'revision';
 if (start_month is not null and (not isfinite(start_month) or extract(day from start_month)<>1 or extract(year from start_month) not between 1900 and 2200))
 or (end_month is not null and (not isfinite(end_month) or extract(day from end_month)<>1 or extract(year from end_month) not between 1900 and 2200))
 or (start_month is not null and end_month is not null and start_month>end_month)
 or (source_filter is not null and source_filter not in ('aum','revenue','fa','ref','master','commissions','accounts','manual','unknown'))
 or (issue_filter is not null and issue_filter not in ('unresolved','blocking_error','warning','orphan_account','orphan_source','custodian_conflict','missing_client','missing_custodian','missing_amount','missing_rate','missing_source','identifier_format','identity_conflict','period_incomplete'))
 or (custodian_filter is not null and custodian_filter<>'sin_custodio' and custodian_filter !~* '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$')
 or mode not in ('issues','imports','audit') or offset_no not between 0 and 1000000
 or (offset_no>0 and revision is null) or (revision is not null and revision !~ '^[a-f0-9]{32}$') then raise invalid_parameter_value; end if;
 with base as materialized (
  select q.* from app_private.quality_records q where (source_filter is null or q.source=source_filter)
   and (q.period is null or ((start_month is null or coalesce(q.period_to,q.period)>=start_month) and (end_month is null or q.period<=end_month)))
   and (custodian_filter is null or (custodian_filter='sin_custodio' and q.custodian_id is null) or q.custodian_id::text=custodian_filter)
 ), summaries as (
  select source,stage,count(*) records,count(*) filter(where related) related,count(*) filter(where not related) unrelated,count(*) filter(where related is null) not_applicable,
   (100*count(*) filter(where related)::numeric/nullif(count(related),0))::text related_percent
  from base where stage<>'coverage' group by source,stage
 ), issues as materialized (
  select * from base where cardinality(codes)>0 and (issue_filter is null or issue_filter=any(codes))
 ), imports as materialized (
  select 'batch'::text kind,b.id,b.source,b.period,b.custodian_id,b.file_name_original,b.row_count,b.blocking_error_count,b.version,b.upload_id,
   b.created_at,b.created_by,b.reviewed_at,b.reviewed_by,b.published_at,b.published_by,
   case when b.status='published' and s.active_batch_id is distinct from b.id then 'superseded' else b.status end status
  from app_private.import_batches b join app_private.import_scopes s on s.id=b.scope_id
  where (source_filter is null or b.source=source_filter) and (start_month is null or b.period>=start_month) and (end_month is null or b.period<=end_month)
   and (custodian_filter is null or b.custodian_id::text=custodian_filter)
  union all
  select 'upload',u.id,coalesce(u.options->>'source','unknown'),null::date,null::uuid,u.file_name,
   (coalesce((select sum(jsonb_array_length(p->'coordinates')) from jsonb_array_elements(u.manifest->'partitions')p),0)+jsonb_array_length(coalesce(u.manifest->'unroutable','[]')))::integer,
   (jsonb_array_length(coalesce(u.manifest->'errors','[]'))+jsonb_array_length(coalesce(u.manifest->'unroutable','[]'))+coalesce((select sum((p->'summary'->>'blockingErrors')::integer) from jsonb_array_elements(u.manifest->'partitions')p),0))::integer,null::integer,u.id,
   u.created_at,u.created_by,null::timestamptz,null::uuid,u.published_at,null::uuid,u.status
  from app_private.import_uploads u where (source_filter is null or coalesce(u.options->>'source','unknown')=source_filter)
   and (not exists(select 1 from jsonb_array_elements(u.manifest->'partitions')) or exists(select 1 from jsonb_array_elements(u.manifest->'partitions')p where (start_month is null or (p->>'period')::date>=start_month) and (end_month is null or (p->>'period')::date<=end_month)))
   and (custodian_filter is null or (custodian_filter='sin_custodio' and not exists(select 1 from jsonb_array_elements(u.manifest->'partitions')))
    or exists(select 1 from jsonb_array_elements(u.manifest->'partitions')p where coalesce(p->>'custodianId',u.options->>'custodianId')=custodian_filter))
 ), audit_all as (
  select e.*,coalesce(e.after_data,e.before_data) entity from app_private.audit_events e
 ), audits as materialized (
  select e.id,e.occurred_at,e.actor_id,e.action,e.entity_table,e.entity_id,e.reason,e.before_data,e.after_data,b.id batch_id,
   coalesce(e.entity->>'source',e.entity->'options'->>'source',b.source,case e.entity_table when 'accounts' then 'accounts' when 'master_publications' then 'master' when 'commission_events' then 'commissions' when 'reference_snapshots' then 'ref' end) source,coalesce((e.entity->>'custodian_id')::uuid,b.custodian_id) custodian_id,
   coalesce((e.entity->>'period')::date,b.period) period
  from audit_all e left join app_private.import_batches b on b.id=case when e.entity_table='import_batches' then e.entity_id else (e.entity->>'batch_id')::uuid end
  where (source_filter is null or coalesce(e.entity->>'source',e.entity->'options'->>'source',b.source,case e.entity_table when 'accounts' then 'accounts' when 'master_publications' then 'master' when 'commission_events' then 'commissions' when 'reference_snapshots' then 'ref' end)=source_filter)
   and (start_month is null or coalesce((e.entity->>'period')::date,b.period) is null or coalesce((e.entity->>'period')::date,b.period)>=start_month)
   and (end_month is null or coalesce((e.entity->>'period')::date,b.period) is null or coalesce((e.entity->>'period')::date,b.period)<=end_month)
   and (custodian_filter is null or coalesce(e.entity->>'custodian_id',b.custodian_id::text)=custodian_filter
    or (custodian_filter='sin_custodio' and coalesce(e.entity->>'custodian_id',b.custodian_id::text) is null))
 ), fingerprint as (
  select md5((filters - 'offset' - 'revision')::text
    ||coalesce((select md5(string_agg(md5(to_jsonb(b)::text),'' order by key)) from base b),'')
    ||coalesce((select md5(string_agg(md5(to_jsonb(i)::text),'' order by id)) from imports i),'')
    ||coalesce((select md5(string_agg(md5(to_jsonb(a)::text),'' order by id)) from audits a),'')
    ||coalesce((select md5(string_agg(md5(jsonb_build_array(id,code,name,active)::text),'' order by id)) from app_private.custodians),'')) value
 ), page as (select * from issues order by source,stage,period nulls last,key limit 25 offset offset_no)
 select jsonb_build_object('revision',(select value from fingerprint),'mode',mode,'offset',offset_no,'limit',25,
 'summaries',coalesce((select jsonb_agg(to_jsonb(s) order by source,stage) from summaries s),'[]'),
 'issue_counts',coalesce((select jsonb_object_agg(code,n) from (select code,count(*) n from base cross join lateral unnest(codes)code group by code)x),'{}'),
 'custodians',coalesce((select jsonb_agg(jsonb_build_object('id',id,'label',name||' ('||code||')') order by name,id) from app_private.custodians),'[]'),
 'row_count',case mode when 'issues' then (select count(*) from issues) when 'imports' then (select count(*) from imports) else (select count(*) from audits) end,
 'rows',case mode when 'issues' then coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('original',
  case when p.stage in ('published','preparation') then (select jsonb_build_object('cells',r.original_cells,'errors',r.errors,'warnings',r.cell_metadata->'warnings','headers',b.totals->'headers') from app_private.import_rows r join app_private.import_batches b on b.id=r.batch_id where r.id=p.row_id)
   when p.stage='identifier' then (select to_jsonb(i) from app_private.account_identifiers i where 'identifier/'||i.id=p.key)
   when p.source='ref' then (select to_jsonb(r) from app_private.reference_current r where 'ref/'||r.snapshot_id||'/'||r.source_row=p.key)
   when p.stage='routing' then (select r from app_private.import_uploads u cross join lateral jsonb_array_elements(u.manifest->'unroutable')r where u.id=p.batch_id and (r->>'row')::integer=p.row_number)
   when p.stage='upload' then (select jsonb_build_object('file',u.file_name,'errors',u.manifest->'errors','excluded_rows',u.manifest->'excludedRows','unroutable_count',jsonb_array_length(coalesce(u.manifest->'unroutable','[]'))) from app_private.import_uploads u where u.id=p.batch_id)
   when p.source='master' then (select jsonb_build_object('row',m,'storage_path',v.input->>'storage_path','file',v.input->'master'->>'file') from app_private.master_publications v cross join lateral jsonb_array_elements(v.input->'master'->'rows')m where v.id=p.batch_id and (m->>'row')::integer=p.row_number)
   when p.source='commissions' then (select input from app_private.commission_current e where 'commission/'||e.id=p.key)
   when p.source='accounts' then (select to_jsonb(a) from app_private.accounts a where a.id=p.account_id) end,
 'candidates',case when p.stage='preparation' then (select coalesce(jsonb_agg(distinct jsonb_build_object('account_id',i.account_id,'custodian_id',i.custodian_id,'namespace',i.namespace,'original',i.value_original,'evidence',i.evidence)),'[]')
 from app_private.import_rows r join app_private.import_batches b on b.id=r.batch_id cross join lateral app_private.import_references(b,r)ref join app_private.account_identifiers i on i.source=b.source and i.namespace=ref.namespace and i.value_original=ref.original and i.resolution_status='resolved' and i.custodian_id=b.custodian_id where r.id=p.row_id) else '[]'::jsonb end,
 'review_upload_id',case when p.source='master' then (select split_part(input->>'storage_path','/',2) from app_private.master_publications where id=p.batch_id)
  when p.source='ref' then (select upload_id::text from app_private.reference_snapshots where id=split_part(p.key,'/',2)::uuid) end,
 'review_page',case when p.stage in ('published','preparation') then (select ((count(*)-1)/25)::integer from app_private.import_rows r where r.batch_id=p.batch_id and r.row_number<=p.row_number) end) order by source,stage,period nulls last,key) from page p),'[]')
 when 'imports' then coalesce((select jsonb_agg(to_jsonb(i) order by created_at desc,id) from (select * from imports order by created_at desc,id limit 25 offset offset_no)i),'[]')
 else coalesce((select jsonb_agg((to_jsonb(a)-'before_data'-'after_data')||jsonb_build_object('before_data',jsonb_pretty(a.before_data),'after_data',jsonb_pretty(a.after_data)) order by occurred_at desc,id) from (select * from audits order by occurred_at desc,id limit 25 offset offset_no)a),'[]') end) into answer;
 if revision is not null and revision is distinct from answer->>'revision' then raise serialization_failure using message='Quality snapshot changed'; end if;
 return answer;
end $$;

-- Sólo una equivalencia Revenue ya acreditada, dentro de un lote todavía editable.
create function app_private.quality_apply_alias(batch_id uuid,row_id uuid,evidence text,expected_revision text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare b app_private.import_batches; r app_private.import_rows; literal text; destination uuid; ids uuid[]; stamp text; all_done boolean; resolved_count integer; evidence_changes integer; x uuid; result jsonb;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege; end if;
 if batch_id is null or row_id is null or evidence is null or length(btrim(evidence)) not between 10 and 2000
 or (expected_revision is not null and expected_revision !~ '^[a-f0-9]{32}$') then raise invalid_parameter_value; end if;
 evidence:=btrim(evidence);
 perform pg_advisory_xact_lock(71482026);
 select * into strict b from app_private.import_batches where id=batch_id for update;
 if b.source<>'revenue' or b.status<>'needs_resolution' or not b.preparation_only or b.blocking_error_count<>0 or b.errors<>'[]' then raise exception 'Only valid pending Revenue'; end if;
 select * into strict r from app_private.import_rows where id=row_id and import_rows.batch_id=batch_id;
 literal:=app_private.import_cell(b,r,'ACCOUNT');
 select account_id into strict destination from app_private.account_identifiers where source='revenue' and namespace='ACCOUNT' and custodian_id=b.custodian_id and value_original=literal and resolution_status='resolved' for update;
 select array_agg(i.id order by i.id),md5(coalesce(jsonb_agg(jsonb_build_array(i.id,i.status,i.errors,i.original_cells,i.cell_metadata,to_jsonb(rr)) order by i.id)::text,'[]')||destination::text||evidence),
 bool_and(coalesce(rr.account_id=destination and rr.evidence=evidence and rr.created_by=app_private.session_user_id(),false)),count(rr.id),count(*) filter(where rr.id is not null and (rr.evidence<>evidence or rr.created_by<>app_private.session_user_id()))
 into ids,stamp,all_done,resolved_count,evidence_changes from app_private.import_rows i left join app_private.row_resolutions rr on rr.source_row_id=i.id
 where i.batch_id=batch_id and app_private.import_cell(b,i,'ACCOUNT')=literal;
 if ids is null or exists(select 1 from app_private.import_rows i left join app_private.row_resolutions rr on rr.source_row_id=i.id
 where i.id=any(ids) and (i.status<>'valid' or i.errors<>'[]' or (rr.id is not null and rr.account_id<>destination))) then raise exception 'Conflicting rows'; end if;
 result:=jsonb_build_object('batch_id',batch_id,'row_id',row_id,'account_id',destination,'custodian_id',b.custodian_id,'period',b.period,'literal',literal,
 'count',cardinality(ids),'already_resolved',resolved_count,'pending',cardinality(ids)-resolved_count,'evidence_changes',evidence_changes,'revision',stamp,'evidence',evidence,'sample_rows',(select jsonb_agg(row_number order by row_number) from (select row_number from app_private.import_rows where id=any(ids) order by row_number limit 25)s));
 if expected_revision is null then return result||'{"status":"preview"}'; end if;
 if expected_revision<>stamp and not coalesce(all_done,false) then raise serialization_failure using message='Quality resolution changed'; end if;
 if not coalesce(all_done,false) then
  foreach x in array ids loop
   perform app_private.manage_import(batch_id,'resolve',jsonb_build_object('row_id',x,'custodian_id',b.custodian_id,'account_id',destination,'evidence',evidence));
  end loop;
 end if;
 return result||'{"status":"applied"}';
end $$;

alter function app_private.quality_report(jsonb) owner to app_papa_executor;
alter function app_private.quality_apply_alias(uuid,uuid,text,text) owner to app_papa_executor;
revoke all on function app_private.quality_report(jsonb),app_private.quality_apply_alias(uuid,uuid,text,text) from public,anon,service_role;
grant execute on function app_private.quality_report(jsonb),app_private.quality_apply_alias(uuid,uuid,text,text) to authenticated;
create function public.quality_report(filters jsonb default '{}') returns jsonb language sql stable security invoker set search_path='' as $$
 select app_private.quality_report(filters)
$$;
create function public.quality_apply_alias(batch_id uuid,row_id uuid,evidence text,expected_revision text default null) returns jsonb language sql security invoker set search_path='' as $$
 select app_private.quality_apply_alias(batch_id,row_id,evidence,expected_revision)
$$;
revoke all on function public.quality_report(jsonb),public.quality_apply_alias(uuid,uuid,text,text) from public,anon,service_role;
grant execute on function public.quality_report(jsonb),public.quality_apply_alias(uuid,uuid,text,text) to authenticated;
revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
notify pgrst,'reload schema';
commit;

