-- SINTÉTICO: 38.400 hechos activos, 800 cuentas, 24 meses, grano por fuente intacto.
\ir query-fixture.sql
insert into app_private.accounts(id,custodian_id,created_by)
select ('21000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001',auth.uid() from generate_series(1,800)n;
do $$ declare src text; m date; scope uuid; batch uuid; begin
 foreach src in array array['aum','revenue'] loop
 for m in select d::date from generate_series('2019-01-01'::date,'2020-12-01',interval '1 month')d loop
  insert into app_private.import_scopes(source,period,custodian_id,created_by) values(src,m,'10000000-0000-0000-0000-000000000001',auth.uid()) returning id into scope;
  insert into app_private.import_batches(scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,file_name_original,file_sha256,file_size_bytes,row_count,metric_total_usd,metric_value_count,status,reviewed_at,reviewed_by,created_by)
  values(scope,src,m,'10000000-0000-0000-0000-000000000001',1,gen_random_uuid(),'SINTETICO/capacity.csv','SINTETICO.csv',repeat('e',64),1,800,case src when 'aum' then 80000 else 80 end,800,'ready',now(),auth.uid(),auth.uid()) returning id into batch;
  insert into app_private.import_rows(batch_id,sheet_name,row_number,original_cells,status) select batch,'SINTETICO',n,'{}','valid' from generate_series(1,800)n;
  if src='aum' then
   insert into app_private.aum_monthly(account_id,custodian_id,period,batch_id,import_row_id,value_usd,value_original)
   select ('21000000-0000-0000-0000-'||lpad(row_number::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001',m,batch,id,100,'100' from app_private.import_rows where batch_id=batch;
  else
   insert into app_private.revenue_entries(account_id,custodian_id,period,batch_id,import_row_id,payout_broker_usd,payout_broker_original)
   select ('21000000-0000-0000-0000-'||lpad(row_number::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001',m,batch,id,0.1,'0.1' from app_private.import_rows where batch_id=batch;
  end if;
  perform public.publish_import(batch,null);
 end loop;
 end loop;
end $$;
-- Estadísticas persistidas y plan genérico reproducen el servidor de larga vida.
insert into app_private.import_batches(scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,file_name_original,file_sha256,file_size_bytes,created_by)
select b.scope_id,b.source,b.period,b.custodian_id,2000+n,gen_random_uuid(),'SINTETICO/empty.csv','SINTETICO.csv',repeat('f',64),0,auth.uid()
from (select * from app_private.import_batches order by id limit 1)b cross join generate_series(1,1600)n;
analyze app_private.import_batches;
analyze app_private.import_rows;
analyze app_private.aum_monthly;
analyze app_private.revenue_entries;
analyze app_private.accounts;
analyze app_private.import_scopes;
