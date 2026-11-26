-- SINTÉTICO: historial voluminoso, payload privado sólo para la página visible.
\ir quality-volume-fixture.sql
insert into app_private.audit_events(actor_id,action,entity_table,entity_id,after_data)
select auth.uid(),'SINTETICO_CAPACIDAD','aum_monthly',gen_random_uuid(),
 jsonb_build_object('source','aum','period','2026-01-01','custodian_id','10000000-0000-0000-0000-000000000001',
 'private_original',repeat(md5(n::text),64),'value_usd',10000000000000000000.123456789123456789)
from generate_series(1,50000)n;
select pg_temp.assert_true((select bool_and(quality_context=app_private.quality_audit_context(before_data,after_data)) from app_private.audit_events),'contexto generado coincide con cada evento original');
select pg_temp.assert_true(not (app_private.quality_audit_context('{"source":"aum","private_original":"SINTETICO"}',null)?'private_original'),'metadata acotada, sin copiar payload privado');
select pg_temp.assert_true(app_private.quality_audit_context('{"source":"aum"}',null)->>'source'='aum' and app_private.quality_audit_context('{"source":"aum"}','{"source":"revenue"}')->>'source'='revenue','before como fallback; after tiene prioridad exacta');
set local statement_timeout='8s';
set local role authenticated;
select public.quality_report('{"mode":"imports"}') imports_before \gset
select public.quality_report('{}') issues_before \gset
reset role;
update app_private.accounts set client_id='40000000-0000-0000-0000-000000000001' where id='20000000-0000-0000-0000-000000000005';
set local role authenticated;
select pg_temp.assert_true(public.quality_report('{"mode":"imports"}')->>'revision'=:'imports_before'::jsonb->>'revision','historial conserva revisión cuando sus filas no cambian');
select pg_temp.expect_error(format('select public.quality_report(%L)',jsonb_build_object('revision',:'issues_before'::jsonb->>'revision')::text),'40001');
reset role;
set local role authenticated;
\timing on
select public.quality_report('{"source":"manual"}') empty_source \gset
select public.quality_report('{"mode":"audit"}') audit_page \gset
select public.quality_report(jsonb_build_object('mode','audit','offset',50,'revision',:'audit_page'::jsonb->>'revision')) later \gset
\timing off
select pg_temp.assert_true(:'empty_source'::jsonb->>'row_count'='0','fuente vacía sin procesar el historial');
select pg_temp.assert_true((:'audit_page'::jsonb->>'row_count')::integer>=50000 and jsonb_array_length(:'audit_page'::jsonb->'rows')=25,'auditoría completa, payload acotado por página');
select pg_temp.assert_true(jsonb_array_length(:'later'::jsonb->'rows')=25,'más de 50 con misma revisión');
select pg_temp.assert_true(strpos(:'audit_page','10000000000000000000.123456789123456789')>0,'numeric exacto como texto sin Number');
select pg_temp.assert_true(strpos(:'audit_page','row_version')=0,'versión de tupla interna no expuesta');
select public.quality_report('{"mode":"audit","source":"aum","from":"2026-01-01","to":"2026-01-01"}') filtered \gset
select pg_temp.assert_true((:'filtered'::jsonb->>'row_count')::integer>=50000,'filtros de auditoría conservan población');
reset role;
select pg_temp.expect_error(format('update app_private.audit_events set after_data=after_data||''{"SINTETICO_UPDATE":true}'' where id=%L',:'audit_page'::jsonb->'rows'->0->>'id'),'P0001');
insert into app_private.audit_events(actor_id,action,entity_table,entity_id,after_data) values(auth.uid(),'SINTETICO_APPEND','aum_monthly',gen_random_uuid(),'{"source":"aum"}');
set local role authenticated;
select pg_temp.expect_error(format('select public.quality_report(%L)',jsonb_build_object('mode','audit','revision',:'audit_page'::jsonb->>'revision')::text),'40001');
reset role;
rollback;
\o
\echo 'OK historial Calidad: 38.400 hechos + 1.600 lotes vacíos + 50.000 eventos con payload >100 MB expandido, fuente vacía/auditoría/páginas/filtros bajo 8 s, precisión, historia inmutable y revisión obsoleta tras nuevo evento.'
