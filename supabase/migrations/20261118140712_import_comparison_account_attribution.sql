begin;

create or replace function app_private.import_comparison(target_id uuid) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare b app_private.import_batches; active uuid; n integer; vals integer; total numeric; unassigned integer; old_data jsonb; own_data jsonb; unassigned_accounts integer; unassigned_total numeric; changes jsonb;
begin
 select * into strict b from app_private.import_batches where id=target_id;
 select active_batch_id into active from app_private.import_scopes where id=b.scope_id;
 if b.source='fa' then
  select count(*),count(advisor_id),count(*) filter(where advisor_id is null),count(distinct account_id) filter(where advisor_id is null) into n,vals,unassigned,unassigned_accounts from app_private.fa_rows where batch_id=target_id;
  total:=null;
 else
  -- Una atribución por cuenta/mes, reutilizada por todas sus filas y métricas.
  with facts as materialized (
   select account_id,value_usd as amount from app_private.aum_monthly where batch_id=target_id
   union all select account_id,payout_broker_usd from app_private.revenue_entries where batch_id=target_id
  ), attribution as materialized (
   select account_id,app_private.advisor_at(account_id,b.period) advisor_id from (select distinct account_id from facts) accounts
  )
  select count(*),count(amount),sum(amount),count(*) filter(where advisor_id is null),
    count(distinct f.account_id) filter(where advisor_id is null),sum(amount) filter(where advisor_id is null)
   into n,vals,total,unassigned,unassigned_accounts,unassigned_total
   from facts f join attribution a on a.account_id=f.account_id;
 end if;
 select jsonb_build_object('id',id,'version',version,'rows',row_count,'values',metric_value_count,'total',metric_total_usd::text,'sha256',file_sha256)
  into old_data from app_private.import_batches where id=active;
 select jsonb_build_object('added',coalesce(sum(greatest(new_count-old_count,0)),0),'removed',coalesce(sum(greatest(old_count-new_count,0)),0)) into changes from (
  select count(*) filter(where batch_id=target_id) as new_count,count(*) filter(where batch_id=active) as old_count
   from app_private.import_rows where batch_id in (target_id,active) group by original_cells
 ) x;
 own_data:=jsonb_build_object('rows',n,'values',vals,'total',total::text,'unassigned_rows',unassigned,
  'unassigned_accounts',unassigned_accounts,'unassigned_total',unassigned_total::text);
 return jsonb_build_object('source',b.source,'period',b.period,'custodian_id',b.custodian_id,
  'file',jsonb_build_object('rows',b.row_count,'values',b.metric_value_count,'total',b.metric_total_usd::text),
  'candidate',own_data,'active',old_data,'row_changes',changes,'same_file',coalesce(old_data->>'sha256'=b.file_sha256,false));
end $$;

commit;
