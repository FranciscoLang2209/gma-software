\ir query-fixture.sql
-- Regresión del remoto: resolver identidad sin USAGE de auth ni privilegios elevados.
revoke usage on schema auth from app_papa_executor;
select pg_temp.assert_true(not has_schema_privilege('app_papa_executor','auth','USAGE'),'reproduce restricción de esquema administrado');
set local role authenticated;
select public.manage_model('preview','custodians',input=>'{"name":"Custodio SINTETICO nuevo","code":"SYNTHETIC-NEW","active":true}',reason=>'Alta SINTETICA') custodian_preview \gset
select pg_temp.assert_true(not exists(select 1 from public.admin_custodians where code='SYNTHETIC-NEW'),'revisión no crea custodio');
select public.manage_model('save',review_id=>(:'custodian_preview'::jsonb->>'review_id')::uuid);
select pg_temp.assert_true((select count(*)=1 from public.admin_custodians where code='SYNTHETIC-NEW'),'admin crea custodio sin USAGE de auth');
reset role;
select pg_temp.assert_true((select count(*)=1 from app_private.audit_events where entity_id=(:'custodian_preview'::jsonb->'after'->>'id')::uuid and reason='Alta SINTETICA'),'alta conserva auditoría');
set local role authenticated;
select public.account_directory('2026-01-01','2026-02-01',search_text=>'0001') directory \gset
select pg_temp.assert_true(:'directory'::jsonb->>'row_count'='1' and :'directory'::jsonb->'rows'->0->>'identifier'='0001','buscar ceros exactos sin multiplicar aliases');
select pg_temp.assert_true(:'directory'::jsonb->'rows'->0 @> '{"aum_usd":"120","revenue_usd":"22","assignment_changed":true,"team":"Equipo SINTETICO 2"}','referencia al cierre y cambio histórico');
select public.account_directory('2026-01-01','2026-02-01',page_size=>1) first_page \gset
select pg_temp.assert_true(public.account_directory('2026-01-01','2026-02-01',page_size=>1,page_offset=>1,expected_revision=>:'first_page'::jsonb->>'revision')->'rows'->0->>'id'<>:'first_page'::jsonb->'rows'->0->>'id','orden paginado estable');
select public.account_detail('20000000-0000-0000-0000-000000000001','2026-01-01','2026-02-01',page_size=>2) detail \gset
select pg_temp.assert_true(:'detail'::jsonb->>'record_count'='4' and jsonb_array_length(:'detail'::jsonb->'records')=2,'detalle conserva registros paginados');
select public.account_detail('20000000-0000-0000-0000-000000000001','2026-01-01','2026-02-01',page_size=>2,page_offset=>2,expected_revision=>:'detail'::jsonb->>'revision') detail_next \gset
select pg_temp.assert_true(jsonb_array_length(:'detail_next'::jsonb->'records')=2 and :'detail_next'::jsonb->'records'->0->>'id'<>:'detail'::jsonb->'records'->0->>'id','siguiente página Revenue estable sin repetir detalle');
select pg_temp.assert_true(:'detail'::jsonb->'records'->0->'original'->>'file'='SINTETICO.csv','admin ve procedencia original');
select pg_temp.assert_true(:'detail'::jsonb->'months'->0->>'team'='Equipo SINTETICO 1' and :'detail'::jsonb->'months'->1->>'team'='Equipo SINTETICO 2','historia de equipos mensual');
reset role;
-- Identidades SINTÉTICAS creadas al resolver un lote que aún no se publicó.
insert into app_private.accounts(id,custodian_id,created_by) values('20000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000001',auth.uid());
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,source_row_id,created_by)
 select a.account_id,'10000000-0000-0000-0000-000000000001','revenue','PREPARACION SINTETICA','PRIVADO-PREPARACION-'||a.account_id,'resolved','SINTETICO',r.id,auth.uid()
 from app_private.import_rows r join app_private.import_batches b on b.id=r.batch_id
 cross join (values('20000000-0000-0000-0000-000000000001'::uuid),('20000000-0000-0000-0000-000000000008'::uuid)) a(account_id)
 where b.status='ready' limit 2;
-- Una identidad ya publicada no desaparece al corregir su versión financiera.
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,source_row_id,created_by)
 select '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','revenue','HISTORIA SINTETICA','HISTORICO-PUBLICADO','resolved','SINTETICO',r.id,auth.uid()
 from app_private.import_rows r join app_private.import_batches b on b.id=r.batch_id where b.status='published'
 and not exists(select 1 from app_private.import_scopes s where s.active_batch_id=b.id) limit 1;
insert into app_private.account_assignments(account_id,advisor_id,valid_from,evidence,created_by) values('20000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000001','2026-04-01','SINTETICO',auth.uid());
set local role authenticated;
select public.manage_model('list','memberships') catalog \gset
select v->>'id' membership_id from jsonb_array_elements(:'catalog'::jsonb->'rows') v where v->>'group_id'='50000000-0000-0000-0000-000000000001' \gset
select public.manage_model('preview','memberships',:'membership_id',jsonb_build_object('valid_to','2026-02-10'),'Corrección SINTETICA') preview \gset
select pg_temp.assert_true(jsonb_array_length(:'preview'::jsonb->'changes')=0,'cambiar fecha dentro del mes no cambia cierre');
select public.manage_model('preview','memberships',:'membership_id',jsonb_build_object('valid_to','2026-01-30'),'Corrección SINTETICA') historical \gset
select pg_temp.assert_true(jsonb_array_length(:'historical'::jsonb->'changes')=2,'vista previa afecta dos cuentas en enero incluyendo FA');
select pg_temp.assert_true(:'historical'::jsonb->'changes'->0->'before'->>'revenue_usd'='10' and :'historical'::jsonb->'changes'->0->'after'->>'team_id' is null,'antes y después sin cambiar montos');
reset role;
select pg_temp.assert_true((select valid_to='2026-02-15' from app_private.advisor_group_memberships where id=:'membership_id'),'preview no persiste cambios');
set local role authenticated;
select public.manage_model('save',review_id=>(:'historical'::jsonb->>'review_id')::uuid);
select public.manage_model('save',review_id=>(:'historical'::jsonb->>'review_id')::uuid);
select pg_temp.expect_error(format($q$select public.manage_model('save',review_id=>%L)$q$,:'preview'::jsonb->>'review_id'),'40001');
select pg_temp.expect_error($q$select public.manage_model('preview','memberships',input=>'{"advisor_id":"30000000-0000-0000-0000-000000000001","group_id":"50000000-0000-0000-0000-000000000001","valid_from":"2026-02-15","valid_to":"2026-03-01","evidence":"SINTETICO"}',reason=>'Solapamiento SINTETICO')$q$,'23P01');
select pg_temp.expect_error($q$select public.manage_model('preview','assignments',input=>'{"account_id":"20000000-0000-0000-0000-000000000002","advisor_id":"30000000-0000-0000-0000-000000000001","valid_from":"2026-01-01","valid_to":"2026-02-01","evidence":"SINTETICO"}',reason=>'Superponer FA SINTETICO')$q$,'P0001');
select pg_temp.expect_error($q$select public.manage_model('preview','accounts','20000000-0000-0000-0000-000000000001','{"client_id":"ffffffff-ffff-ffff-ffff-ffffffffffff"}','Referencia SINTETICA')$q$,'P0002');
select pg_temp.expect_error($q$select public.manage_model('preview','accounts','20000000-0000-0000-0000-000000000001','{"payout_broker_usd":"999"}','Edición financiera prohibida')$q$,'22023');
select pg_temp.expect_error($q$update public.admin_account_assignments set valid_from='2026-01-02'$q$,'42501');
select public.manage_model('preview','clients','40000000-0000-0000-0000-000000000001','{"active":false}','Baja SINTETICA') deactivation \gset
select public.manage_model('save',review_id=>(:'deactivation'::jsonb->>'review_id')::uuid);
select pg_temp.expect_error($q$select public.manage_model('preview','accounts','20000000-0000-0000-0000-000000000003','{"client_id":"40000000-0000-0000-0000-000000000001"}','Referencia inactiva')$q$,'23514');
reset role;
select pg_temp.assert_true((select count(*)=1 from app_private.audit_events where entity_id=:'membership_id' and reason='Corrección SINTETICA'),'guardar idempotente y audita autor fecha antes después motivo una vez');
select pg_temp.expect_error($q$delete from app_private.clients where id='40000000-0000-0000-0000-000000000001'$q$,'P0001');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}';
set local role authenticated;
select public.account_detail('20000000-0000-0000-0000-000000000001','2026-01-01','2026-02-01') reader_detail \gset
select pg_temp.assert_true(:'reader_detail'::jsonb->'records'->0->>'original' is null and :'reader_detail' not like '%SECRETO%' and :'reader_detail' not like '%SINTETICO.csv%','lector no ve originales ni archivo privado');
select pg_temp.assert_true(jsonb_array_length(:'reader_detail'::jsonb->'identifiers')=4 and :'reader_detail' like '%HISTORICO-PUBLICADO%' and :'reader_detail' not like '%PRIVADO-PREPARACION%','lector ve solo proyección de identificadores resueltos');
select pg_temp.assert_true(public.account_directory('2026-01-01','2026-02-01',search_text=>'PRIVADO-PREPARACION')->>'row_count'='0','alias en preparación no se proyecta al lector');
select pg_temp.assert_true(public.account_detail('20000000-0000-0000-0000-000000000008','2026-01-01','2026-02-01') is null,'cuenta en preparación no es accesible por URL directa de lector');
select pg_temp.assert_true(public.manage_model('list','accounts')::text not like '%20000000-0000-0000-0000-000000000008%' and public.manage_model('list','assignments')::text not like '%20000000-0000-0000-0000-000000000008%','catálogos y sugerencias no filtran cuentas en preparación');
select pg_temp.assert_true(public.manage_model('list','clients')->'audit' is null,'lector consulta catálogo sin auditoría privada');
select pg_temp.expect_error($q$select public.manage_model('preview','clients',input=>'{"name":"intruso"}',reason=>'Lector directo')$q$,'42501');
select pg_temp.expect_error($q$select public.manage_model('save',review_id=>'00000000-0000-0000-0000-000000000001')$q$,'42501');
select pg_temp.expect_error($q$select app_private.change_model('clients',gen_random_uuid(),'{"name":"intruso"}')$q$,'42501');
select pg_temp.assert_true(public.account_directory('2026-01-01','2026-02-01',account=>'20000000-0000-0000-0000-000000000002')->'rows'->0 @> '{"aum_usd":null,"revenue_usd":null}','cuenta solo AUM sin arrastrar cierre');
select pg_temp.assert_true(public.account_directory('2026-01-01','2026-02-01',account=>'20000000-0000-0000-0000-000000000003')->'rows'->0 @> '{"aum_usd":null,"revenue_usd":"15"}','cuenta solo Revenue');
select pg_temp.assert_true(public.account_detail('20000000-0000-0000-0000-000000000001','2026-01-01','2026-02-01',team=>'50000000-0000-0000-0000-000000000002')->>'record_count'='1','detalle conserva filtro histórico de equipo');
reset role;
set local role anon;
select pg_temp.expect_error($q$select public.account_directory('2026-01-01','2026-02-01')$q$,'42501');
select pg_temp.expect_error($q$select public.manage_model('list','clients')$q$,'42501');
reset role;
rollback;
\o
\echo 'OK: directorio, ceros, fuentes faltantes, historia, originales por rol, revisión, concurrencia optimista, bajas y auditoría.'
