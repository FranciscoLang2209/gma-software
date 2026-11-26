begin;
grant app_papa_executor to current_user with inherit true, set true;
-- No cambia historia ni permisos: evita preparar payloads de vistas que no se consultan.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('app_private.quality_report(jsonb)'::regprocedure) into definition;
 if strpos(definition,$part0$ ), audit_all as (
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
$part0$)=0 then raise exception 'Unexpected quality report part 0'; end if;
 definition:=replace(definition,$part0$ ), audit_all as (
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
$part0$,$part0$ ), audit_all as (
  select e.id,e.occurred_at,e.actor_id,e.action,e.entity_table,e.entity_id,e.reason,jsonb_build_array(e.xmin::text,e.ctid::text) row_version,
   case when source_filter is not null or start_month is not null or end_month is not null or custodian_filter is not null then coalesce(e.after_data,e.before_data) end entity
  from app_private.audit_events e where mode='audit'
 ), audits as materialized (
  select e.id,e.occurred_at,e.actor_id,e.action,e.entity_table,e.entity_id,e.reason,e.row_version,b.id batch_id,
   coalesce(e.entity->>'source',e.entity->'options'->>'source',b.source,case e.entity_table when 'accounts' then 'accounts' when 'master_publications' then 'master' when 'commission_events' then 'commissions' when 'reference_snapshots' then 'ref' end) source,coalesce((e.entity->>'custodian_id')::uuid,b.custodian_id) custodian_id,
   coalesce((e.entity->>'period')::date,b.period) period
  from audit_all e left join app_private.import_batches b on (source_filter is not null or start_month is not null or end_month is not null or custodian_filter is not null) and b.id=case when e.entity_table='import_batches' then e.entity_id else (e.entity->>'batch_id')::uuid end
  where (source_filter is null or coalesce(e.entity->>'source',e.entity->'options'->>'source',b.source,case e.entity_table when 'accounts' then 'accounts' when 'master_publications' then 'master' when 'commission_events' then 'commissions' when 'reference_snapshots' then 'ref' end)=source_filter)
   and (start_month is null or coalesce((e.entity->>'period')::date,b.period) is null or coalesce((e.entity->>'period')::date,b.period)>=start_month)
   and (end_month is null or coalesce((e.entity->>'period')::date,b.period) is null or coalesce((e.entity->>'period')::date,b.period)<=end_month)
   and (custodian_filter is null or coalesce(e.entity->>'custodian_id',b.custodian_id::text)=custodian_filter
    or (custodian_filter='sin_custodio' and coalesce(e.entity->>'custodian_id',b.custodian_id::text) is null))
$part0$);
 if strpos(definition,$part1$ else coalesce((select jsonb_agg((to_jsonb(a)-'before_data'-'after_data')||jsonb_build_object('before_data',jsonb_pretty(a.before_data),'after_data',jsonb_pretty(a.after_data)) order by occurred_at desc,id) from (select * from audits order by occurred_at desc,id limit 25 offset offset_no)a),'[]') end)$part1$)=0 then raise exception 'Unexpected quality report part 1'; end if;
 definition:=replace(definition,$part1$ else coalesce((select jsonb_agg((to_jsonb(a)-'before_data'-'after_data')||jsonb_build_object('before_data',jsonb_pretty(a.before_data),'after_data',jsonb_pretty(a.after_data)) order by occurred_at desc,id) from (select * from audits order by occurred_at desc,id limit 25 offset offset_no)a),'[]') end)$part1$,$part1$ else coalesce((select jsonb_agg((to_jsonb(a)-'row_version')||jsonb_build_object(
 'before_data',jsonb_pretty(raw.before_data),'after_data',jsonb_pretty(raw.after_data),
 'batch_id',b.id,'source',coalesce(x.entity->>'source',x.entity->'options'->>'source',b.source,case raw.entity_table when 'accounts' then 'accounts' when 'master_publications' then 'master' when 'commission_events' then 'commissions' when 'reference_snapshots' then 'ref' end),
 'custodian_id',coalesce((x.entity->>'custodian_id')::uuid,b.custodian_id),'period',coalesce((x.entity->>'period')::date,b.period)) order by a.occurred_at desc,a.id)
 from (select * from audits order by occurred_at desc,id limit 25 offset offset_no)a
 join app_private.audit_events raw on raw.id=a.id
 cross join lateral (select coalesce(raw.after_data,raw.before_data) entity)x
 left join app_private.import_batches b on b.id=case when raw.entity_table='import_batches' then raw.entity_id else (x.entity->>'batch_id')::uuid end),'[]') end)$part1$);
 if strpos(definition,$part2$where (source_filter is null or b.source=source_filter)$part2$)=0 then raise exception 'Unexpected quality report part 2'; end if;
 definition:=replace(definition,$part2$where (source_filter is null or b.source=source_filter)$part2$,$part2$where mode='imports' and (source_filter is null or b.source=source_filter)$part2$);
 if strpos(definition,$part3$from app_private.import_uploads u where (source_filter is null$part3$)=0 then raise exception 'Unexpected quality report part 3'; end if;
 definition:=replace(definition,$part3$from app_private.import_uploads u where (source_filter is null$part3$,$part3$from app_private.import_uploads u where mode='imports' and (source_filter is null$part3$);
 execute definition;
end $migration$;
revoke app_papa_executor from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
