-- Sólo SINTÉTICO: conserva cada campo y multiplicidad del diagnóstico anterior.
\ir query-fixture.sql
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','revenue','ACCOUNT','000CAND','resolved','SINTETICO A',auth.uid()),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','revenue','ACCOUNT',' 000CAND ','resolved','SINTETICO B, pendiente de cotejo',auth.uid()),
('20000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000002','revenue','ACCOUNT','000CAND','resolved','SINTETICO otro custodio',auth.uid());
-- Un padre bloqueado sin hijos también debe aparecer, con sus originales.
insert into app_private.import_uploads(id,file_name,file_hash,file_size,storage_object_path,options,manifest,created_by)
values('96000000-0000-0000-0000-000000000001','SINTETICO-UNROUTABLE.csv',repeat('c',64),1,'SINTETICO/original.csv',
 '{"source":"aum","multiCustodian":true}', '{"sheet":"SINTETICO","errors":[{"code":"references_required","message":"SINTETICO"}],"partitions":[],"unroutable":[{"sheet":"SINTETICO","row":8,"cells":[{"kind":"text","value":"SINTETICO ORIGINAL"}],"errors":[{"message":"SINTETICO sin período"}]}]}',auth.uid());
insert into app_private.reference_snapshots(id,upload_id,file_hash,payload_hash,source_sheet,source_uploader,approval_evidence)
values('96000000-0000-0000-0000-000000000002','96000000-0000-0000-0000-000000000001',repeat('c',64),repeat('d',64),'SINTETICO',auth.uid(),'SINTETICO referencia acreditada');
insert into app_private.reference_snapshot_rows(snapshot_id,source_row,custodian_id,group_error)
values('96000000-0000-0000-0000-000000000002',8,'10000000-0000-0000-0000-000000000001',false);
insert into app_private.reference_snapshot_head(snapshot_id)values('96000000-0000-0000-0000-000000000002');
insert into app_private.import_uploads(id,file_name,file_hash,file_size,storage_object_path,options,manifest,created_by)
values('96000000-0000-0000-0000-000000000005','SINTETICO-LEGACY.csv',repeat('c',64),1,'SINTETICO/legacy.csv','{}','{"partitions":[],"unroutable":[],"errors":[]}',auth.uid());
insert into app_private.master_publications(id,input,result,created_by)
values('96000000-0000-0000-0000-000000000003',
 '{"storage_path":"master/96000000-0000-0000-0000-000000000004/original.xlsx","review":{"quarter":"2023-01-01","quarter_to":"2026-10-01","brokers":{"SYN1":"10000000-0000-0000-0000-000000000001"}},"master":{"file":"SINTETICO-MASTER.xlsx","sheet":"SINTETICO","rows":[{"row":3,"cells":{"Broker":"SYN1","ACCOUNT":"000PENDING","Fee type":"Advisory"},"annualRate":null}]}}',
 '{"rows":[{"row":3,"account_id":null}]}',auth.uid());


insert into app_private.account_identifiers(custodian_id,source,namespace,value_original,created_by)
values('10000000-0000-0000-0000-000000000001','revenue','ACCOUNT','000cand',auth.uid()),
(null,'revenue','ACCOUNT','000CAND',auth.uid());
-- Dos resultados de una fila: se conserva el primero, como el LIMIT 1 previo.
insert into app_private.master_publications(id,input,result,created_by)
select gen_random_uuid(),input,'{"rows":[{"row":3,"account_id":"20000000-0000-0000-0000-000000000001"},{"row":3,"account_id":"20000000-0000-0000-0000-000000000002"}]}'::jsonb,auth.uid()
from app_private.master_publications limit 1;
select pg_temp.assert_true(not exists(
 (select to_jsonb(q) from app_private.quality_records_before q except all select to_jsonb(q) from app_private.quality_records q)
 union all
 (select to_jsonb(q) from app_private.quality_records q except all select to_jsonb(q) from app_private.quality_records_before q)
),'diagnósticos idénticos: campos, duplicados, aliases pendientes/nulos, Master y padres sin hijos');
rollback;
\o
\echo 'OK equivalencia Calidad: todas las filas/campos/multiplicidades idénticos a la vista anterior.'
