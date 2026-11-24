\ir query-fixture.sql
insert into app_private.import_uploads(id,file_name,file_hash,file_size,storage_object_path,options,manifest,created_by)
values('91000000-0000-0000-0000-000000000001','SINTETICO.xlsx',repeat('a',64),1,'SINTETICO','{}','{}',auth.uid());
insert into app_private.reference_snapshots(id,upload_id,file_hash,payload_hash,source_sheet,source_uploader,approval_evidence)
values('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001',repeat('a',64),'SINTETICO','SINTETICO',auth.uid(),'SINTETICO: foto revisada');
insert into app_private.reference_snapshot_rows(snapshot_id,source_row,account_id,custodian_id,client_label,advisor_label,team_label,group_error)
select '92000000-0000-0000-0000-000000000001',i,('20000000-0000-0000-0000-00000000000'||i)::uuid,
('10000000-0000-0000-0000-00000000000'||case when i=7 then 2 else 1 end)::uuid,
case when i=2 then 'Beta SINTETICO' else 'Alpha SINTETICO' end,'Owner SINTETICO',case when i=3 then 'Equipo B SINTETICO' else 'Equipo A SINTETICO' end,false
from unnest(array[1,2,3,7])i;
insert into app_private.reference_snapshot_head values(true,'92000000-0000-0000-0000-000000000001');
set local role authenticated;
select public.aggregate_report_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","client":"1"}','2026-01-01','2026-02-01') ref_report \gset
select pg_temp.assert_true(:'ref_report'::jsonb->'total' @> '{"aum_usd":"129","revenue_usd":"41","accounts_with_aum":2,"accounts_with_revenue":3}', 'REF incluye solo-Revenue, solo-custodio y no multiplica aliases/detalle');
select pg_temp.assert_true(public.aggregate_report_ref('{}','2026-01-01','2026-02-01')->'total'=public.aggregate_report('2026-01-01','2026-02-01')->'total','sin REF conserva finanzas');
select pg_temp.assert_true(public.aggregate_report_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","client":"1"}','2026-01-01','2026-02-01',custodian=>'10000000-0000-0000-0000-000000000002')->'total' @> '{"aum_usd":"9","revenue_usd":"4"}','REF AND custodio');
select pg_temp.assert_true(public.aggregate_report_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","client":"1","team":"3"}','2026-01-01','2026-02-01')->'total' @> '{"aum_usd":null,"revenue_usd":"15"}','varias referencias AND sin exigir AUM');
select pg_temp.assert_true(public.aggregate_report_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","client":"sin_referencia"}','2026-01-01','2026-02-01')->'total' @> '{"aum_usd":"-10","revenue_usd":"-3","aum_rows":3,"aum_values":2}','sin referencia conserva negativos/cero/null');
select pg_temp.assert_true(public.account_directory_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","client":"1"}','2026-01-01','2026-02-01')->>'row_count'='3','directorio filtra mismas cuentas');
select pg_temp.assert_true(public.account_detail_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","client":"1"}','20000000-0000-0000-0000-000000000004','2026-01-01','2026-02-01')->'aum'='[]','detalle no filtra solo Revenue dejando AUM fuera del filtro');
select pg_temp.assert_true(public.quarterly_roa_report_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","client":"2"}',2026,1)->'total'=public.quarterly_roa_report(2026,1,account=>'20000000-0000-0000-0000-000000000002')->'total','ROA: mismo conjunto en numerador/denominador, sin cambiar formula/cobertura');
select pg_temp.expect_error($q$select public.aggregate_report_ref('{"snapshot":"92000000-0000-0000-0000-000000000002","client":"1"}','2026-01-01','2026-02-01')$q$,'40001');
select pg_temp.expect_error($q$select public.aggregate_report_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","client":"7"}','2026-01-01','2026-02-01')$q$,'22023');
select pg_temp.expect_error($q$select public.aggregate_report_ref('{"client":"1"}','2026-01-01','2026-02-01')$q$,'22023');
select pg_temp.expect_error($q$select public.aggregate_report_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","extra":"1"}','2026-01-01','2026-02-01')$q$,'22023');
select pg_temp.expect_error($q$select public.aggregate_report_ref('{}','2026-01-01','2026-02-01',expected_revision=>'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')$q$,'40001');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}';
set local role authenticated;
select pg_temp.assert_true(public.aggregate_report_ref('{"snapshot":"92000000-0000-0000-0000-000000000001","client":"1"}','2026-01-01','2026-02-01')=:'ref_report'::jsonb,'lector y admin: misma proyección publicada');
select pg_temp.assert_true(strpos(:'ref_report','SECRETO SINTETICO')=0,'sin originales en proyección');
select pg_temp.expect_error('select * from app_private.reference_snapshot_rows','42501');
reset role;
set local role anon;
select pg_temp.expect_error($q$select public.aggregate_report_ref('{}','2026-01-01','2026-02-01')$q$,'42501');
reset role;
rollback;
\o
\echo 'OK REF: alcance canónico, AND, sin referencia, fuentes independientes, ROA/detalle, revisión y roles.'
