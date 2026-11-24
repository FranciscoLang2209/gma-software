-- Sólo SINTÉTICO. RLS/roles reales en PostgreSQL temporal; nunca datos GMA.
\ir query-fixture.sql
select md5(coalesce(jsonb_agg(to_jsonb(f) order by source,id)::text,'[]')) before_facts from (
 select 'aum' source,id,value_usd amount from app_private.aum_current union all select 'revenue',id,payout_broker_usd from app_private.revenue_current)f \gset
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

set local role authenticated;
select public.quality_report('{}') q \gset
select pg_temp.assert_true((:'q'::jsonb->'issue_counts'->>'identity_conflict')::integer=2,'dos aliases candidatos, sin mezclar otro custodio');
select pg_temp.assert_true((:'q'::jsonb->'issue_counts'->>'period_incomplete')::integer>0,'cobertura observada distingue ausencia');
select pg_temp.assert_true((select (v->>'records')::integer=11 and (v->>'related_percent')::numeric=100 from jsonb_array_elements(:'q'::jsonb->'summaries')v where v->>'source'='aum' and v->>'stage'='published'),'AUM activo relacionado sin multiplicar aliases');
select pg_temp.assert_true((select sum((v->>'records')::integer) from jsonb_array_elements(:'q'::jsonb->'summaries')v where v->>'source'='revenue' and v->>'stage'='published')=16,'Revenue repetido conserva grano');
select pg_temp.assert_true(jsonb_array_length(public.quality_report('{"source":"manual"}')->'rows')=0,'fuente vacía sin datos inventados');
select pg_temp.assert_true((select bool_and(r->>'source'='unknown') and count(*)=1 from jsonb_array_elements(public.quality_report('{"source":"unknown","mode":"imports"}')->'rows')r),'carga sin fuente se conserva sin inventarla');
reset role;
insert into app_private.audit_events(actor_id,action,entity_table,entity_id,after_data)
values(auth.uid(),'SINTETICO_PRECISION','aum_monthly',gen_random_uuid(),'{"source":"aum","period":"2026-05-01","value_usd":10000000000000000000.123456789123456789}');
set local role authenticated;
select pg_temp.assert_true((select bool_or(jsonb_typeof(r->'after_data')='string' and position('10000000000000000000.123456789123456789' in r->>'after_data')>0) from jsonb_array_elements(public.quality_report('{"mode":"audit","source":"aum"}')->'rows')r),'auditoría numeric viaja como texto exacto, sin Number binario');
select pg_temp.assert_true((public.quality_report('{"source":"aum","issue":"unresolved"}')->>'row_count')::integer=1,'fila histórica sin alcance visible aunque no hay hijos');
select pg_temp.assert_true((public.quality_report('{"source":"ref","issue":"unresolved"}')->>'row_count')::integer=1,'REF sin cuenta visible');
select pg_temp.assert_true((public.quality_report('{"source":"master","issue":"missing_rate","from":"2026-02-01","to":"2026-02-01"}')->>'row_count')::integer=1,'Master usa solapamiento del rango de vigencia');
select pg_temp.assert_true((select count(*)=1 from jsonb_array_elements(public.quality_report('{"source":"aum","mode":"imports"}')->'rows')r where r->>'kind'='upload'),'historial incluye carga padre sin hijos');
select pg_temp.expect_error($q$select public.quality_report('{"offset":25}')$q$,'22023');
select pg_temp.expect_error($q$select public.quality_report('{"source":"desconocida"}')$q$,'22023');
select pg_temp.expect_error($q$select public.quality_report('{"offset":"25"}')$q$,'22023');
select pg_temp.expect_error($q$select public.quality_report('{"from":"2026-01-02"}')$q$,'22023');
select pg_temp.expect_error($q$select public.quality_report('{"extra":"x"}')$q$,'22023');
select public.begin_import(gen_random_uuid(),'revenue','2026-06-01','10000000-0000-0000-0000-000000000001','SINTETICO-QUALITY.csv',repeat('a',64),1,'{}') batch \gset
select public.prepare_import_chunk(:'batch',0,'{"validationVersion":1}',(
 select jsonb_agg(jsonb_build_object('sheet_name','SINTETICO','row_number',n+1,'original_cells',jsonb_build_object('ACCOUNT',case when n=61 then '000OTHER' when n=62 then ' 000BULK ' else '000BULK' end,'Payout broker','0.1'),
 'cell_metadata',jsonb_build_object('account','000BULK','amount','0.1','period','2026-06-01'),'status','valid','errors','[]'::jsonb)) from generate_series(1,62)n),
 '{"rowCount":62,"blockingErrors":0,"total":"6.2","valueCount":62,"errors":[]}');
select id row_id from public.admin_import_rows where batch_id=:'batch' and row_number=2 \gset
select pg_temp.expect_error(format('select public.quality_apply_alias(%L,%L,%L)',:'batch',:'row_id','SINTETICO evidencia común'),'P0002');
select public.manage_import(:'batch','resolve',jsonb_build_object('row_id',:'row_id','custodian_id','10000000-0000-0000-0000-000000000001','account_id','20000000-0000-0000-0000-000000000001','evidence','SINTETICO equivalencia individual revisada'));
select public.quality_apply_alias(:'batch',:'row_id','SINTETICO evidencia común') preview \gset
select pg_temp.assert_true(:'preview'::jsonb->>'status'='preview' and (:'preview'::jsonb->>'count')::integer=60 and jsonb_array_length(:'preview'::jsonb->'sample_rows')=25,'preview completo, mismo literal, un lote/custodio');
select pg_temp.assert_true((:'preview'::jsonb->>'already_resolved')::integer=1 and (:'preview'::jsonb->>'pending')::integer=59,'impacto anterior y posterior concreto');
select pg_temp.assert_true((select count(*) from public.admin_import_rows r join app_private.row_resolutions x on x.source_row_id=r.id where r.batch_id=:'batch')=1,'vista previa no resuelve filas');
select id second_row from public.admin_import_rows where batch_id=:'batch' and row_number=3 \gset
select public.manage_import(:'batch','resolve',jsonb_build_object('row_id',:'second_row','custodian_id','10000000-0000-0000-0000-000000000001','account_id','20000000-0000-0000-0000-000000000001','evidence','SINTETICO otra revisión'));
select pg_temp.expect_error(format('select public.quality_apply_alias(%L,%L,%L,%L)',:'batch',:'row_id','SINTETICO evidencia común',:'preview'::jsonb->>'revision'),'40001');
select public.quality_apply_alias(:'batch',:'row_id','SINTETICO evidencia común') preview \gset
-- Error en la última fila revierte también las resoluciones/auditoría anteriores.
reset role;
create function app_private.quality_failure_test() returns trigger language plpgsql as $$
begin
 if new.source_row_id=(select id from app_private.import_rows where batch_id=new.batch_id and original_cells->>'ACCOUNT'='000BULK' order by id desc limit 1) then raise exception 'SINTETICO fallo al final'; end if;
 return new;
end $$;
create trigger quality_failure_test before insert or update on app_private.row_resolutions for each row execute function app_private.quality_failure_test();
set local role authenticated;
select count(*) rollback_events from app_private.audit_events \gset
select pg_temp.expect_error(format('select public.quality_apply_alias(%L,%L,%L,%L)',:'batch',:'row_id','SINTETICO evidencia común',:'preview'::jsonb->>'revision'),'P0001');
select pg_temp.assert_true((select count(*) from app_private.row_resolutions where batch_id=:'batch')=2 and (select count(*) from app_private.audit_events)=:'rollback_events'::integer,'rollback total de resolución y auditoría');
reset role;
drop trigger quality_failure_test on app_private.row_resolutions;
drop function app_private.quality_failure_test();
set local role authenticated;
select public.quality_apply_alias(:'batch',:'row_id','SINTETICO evidencia común',:'preview'::jsonb->>'revision') applied \gset
select pg_temp.assert_true(:'applied'::jsonb->>'status'='applied','aplicación confirmada');
select pg_temp.assert_true((select count(*) from app_private.row_resolutions where batch_id=:'batch')=60,'no salta pendientes por bool_and con null ni toca los otros literales');
select count(*) events_before from app_private.audit_events \gset
select public.quality_apply_alias(:'batch',:'row_id','SINTETICO evidencia común',:'preview'::jsonb->>'revision');
select pg_temp.assert_true((select count(*) from app_private.audit_events)=:'events_before'::integer,'retry sin auditoría o resoluciones duplicadas');
select pg_temp.expect_error(format('select public.quality_report(%L)',jsonb_build_object('revision',:'q'::jsonb->>'revision')::text),'40001');
-- Fuera de los últimos 50: historial con total/paginación, no selector truncado.
select public.begin_import(gen_random_uuid(),'revenue','2026-07-01','10000000-0000-0000-0000-000000000001','SINTETICO-HISTORY.csv',repeat('b',64),1,'{}') from generate_series(1,60);
select public.quality_report('{"mode":"imports","source":"revenue","from":"2026-07-01","to":"2026-07-01"}') history \gset
select public.quality_report(jsonb_build_object('mode','imports','source','revenue','from','2026-07-01','to','2026-07-01','offset',50,'revision',:'history'::jsonb->>'revision')) last_page \gset
select pg_temp.assert_true((:'history'::jsonb->>'row_count')::integer=60 and jsonb_array_length(:'last_page'::jsonb->'rows')=10,'paginación después de 50 con revisión');
select public.quality_report('{"mode":"audit","source":"revenue"}') audit \gset
select pg_temp.assert_true((:'audit'::jsonb->>'row_count')::integer>60 and jsonb_array_length(:'audit'::jsonb->'rows')=25,'historial privado de cambios');
select pg_temp.assert_true(jsonb_array_length(public.quality_report('{"custodian":"10000000-0000-0000-0000-000000000002","source":"aum","from":"2026-02-01","to":"2026-02-01","issue":"missing_client"}')->'rows')=1,'filtros AND preservan cuenta de otro custodio sin cliente');
reset role;
select pg_temp.assert_true(md5(coalesce(jsonb_agg(to_jsonb(f) order by source,id)::text,'[]'))=:'before_facts','diagnóstico y resolución no modifican hechos financieros') from (
 select 'aum' source,id,value_usd amount from app_private.aum_current union all select 'revenue',id,payout_broker_usd from app_private.revenue_current)f;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
select pg_temp.expect_error($q$select public.quality_report('{}')$q$,'42501');
select pg_temp.expect_error($q$select app_private.quality_report('{}')$q$,'42501');
select pg_temp.expect_error($q$select * from app_private.quality_records$q$,'42501');
select pg_temp.expect_error($q$select public.quality_apply_alias(null,null,'SINTETICO evidencia')$q$,'42501');
reset role;
set local role anon;
select pg_temp.expect_error($q$select public.quality_report('{}')$q$,'42501');
reset role;
set local role service_role;
select pg_temp.expect_error($q$select public.quality_report('{}')$q$,'42501');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
update app_private.user_profiles set enabled=false where id=auth.uid();
set local role authenticated;
select pg_temp.expect_error($q$select public.quality_report('{}')$q$,'42501');
reset role;
rollback;
\o
\echo 'OK Calidad SQL: granos/roles/filtros/cobertura, historia >50, revisión obsoleta, alias por lote atómico/idempotente y publicados intactos.'
