-- Preparación sintética persistida solo dentro del clúster efímero.
insert into auth.users values ('00000000-0000-0000-0000-000000000001');
insert into app_private.user_profiles(id,role,enabled) values ('00000000-0000-0000-0000-000000000001','admin',true);
insert into app_private.custodians(id,code,name,created_by) values ('10000000-0000-0000-0000-000000000001','RACE','Custodio sintético','00000000-0000-0000-0000-000000000001');
insert into app_private.accounts(id,custodian_id,created_by) values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001');
insert into app_private.import_scopes(id,source,period,custodian_id,created_by) values ('50000000-0000-0000-0000-000000000001','aum','2026-01-01','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001');
insert into app_private.import_batches(id,scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,file_name_original,file_sha256,file_size_bytes,row_count,metric_total_usd,metric_value_count,status,reviewed_at,reviewed_by,created_by)
select ('60000000-0000-0000-0000-00000000000'||v)::uuid,s.id,s.source,s.period,s.custodian_id,v,gen_random_uuid(),
'synthetic/race-'||v||'.xlsx','SINTETICO.xlsx',repeat('d',64),1,1,v,1,'ready',now(),'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'
from app_private.import_scopes s cross join generate_series(1,2) v;
insert into app_private.import_rows(batch_id,sheet_name,row_number,original_cells,status)
select id,'SINTETICO',1,jsonb_build_object('Value (USD)',version::text),'valid' from app_private.import_batches;
insert into app_private.aum_monthly(account_id,custodian_id,period,batch_id,import_row_id,value_usd,value_original)
select '20000000-0000-0000-0000-000000000001',b.custodian_id,b.period,b.id,r.id,b.version,b.version::text
from app_private.import_batches b join app_private.import_rows r on r.batch_id=b.id;
