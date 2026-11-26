\ir query-fixture.sql
set local role authenticated;
select public.aggregate_report_ref('{}','2026-01-01','2026-02-01') report \gset
select pg_temp.assert_true((:'report'::jsonb->'availability'->>'period_rows')::integer=(select count(*) from app_private.aum_current where period between '2026-01-01' and '2026-02-01')+(select count(*) from app_private.revenue_current where period between '2026-01-01' and '2026-02-01'),'recuento independiente sin deduplicar ni sumar importes');
select pg_temp.assert_true((:'report'::jsonb->'availability'->>'accounts_without_client')::integer>0 and (:'report'::jsonb->'availability'->>'unclassified_accounts')::integer>0,'relaciones y servicios pendientes comprobados');
select public.aggregate_report_ref('{}','2026-01-01','2026-02-01',service_filter=>'NINGUNO SINTETICO') empty_filtered \gset
select pg_temp.assert_true(:'empty_filtered'::jsonb->'availability'=:'report'::jsonb->'availability' and :'empty_filtered'::jsonb->'total'->>'revenue_usd' is null,'filtros vacíos conservan disponibilidad general y NULL');
select pg_temp.assert_true(public.aggregate_report_ref('{}','2030-01-01','2030-01-01')->'availability'->>'period_rows'='0','período inexistente no usa el mes anterior ni otro rango');
select pg_temp.assert_true(public.account_directory_ref('{}','2026-01-01','2026-02-01',search_text=>'NINGUNO SINTETICO')->'report'->'availability'=:'report'::jsonb->'availability','búsqueda no altera diagnóstico financiero');
select pg_temp.assert_true((public.quarterly_roa_report_ref('{}',2026,1,service_filter=>'Brokerage')->'availability'->>'period_rows')::integer>0,'ROA sin coincidencias conserva existencia del trimestre');
select pg_temp.assert_true(public.aggregate_report_ref('{}','2026-01-01','2026-02-01')->'total'=public.aggregate_report('2026-01-01','2026-02-01')->'total','importes y faltantes intactos');
select pg_temp.assert_true(public.commission_dashboard('{"year":"2026","quarter":"1"}')->'availability'->>'period_rows'=public.commission_report('{"year":"2026","quarter":"1"}')->>'row_count','disponibilidad del circuito de Comisiones incluye Revenue por revisar sin fabricar expectativas');
select pg_temp.assert_true(public.commission_dashboard('{"year":"2030","quarter":"1"}')->'availability'->>'period_rows'='0','Comisiones sin registros del período no arrastra otro trimestre');
select pg_temp.expect_error($q$select app_private.report_availability('2026-01-01','2026-02-01')$q$,'42501');
reset role;
update app_private.accounts set service='CAMBIO SINTETICO' where id='20000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.expect_error(format('select public.aggregate_report_ref(''{}'',''2026-01-01'',''2026-02-01'',service_filter=>''NINGUNO SINTETICO'',expected_revision=>%L)',:'empty_filtered'::jsonb->>'revision'),'40001');
reset role;
update app_private.accounts set service='sin_clasificar' where id='20000000-0000-0000-0000-000000000002';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
select pg_temp.assert_true(public.aggregate_report_ref('{}','2026-01-01','2026-02-01')=:'report'::jsonb,'admin y lector reciben sólo la misma disponibilidad publicada');
select pg_temp.expect_error('select public.commission_dashboard()','42501');
reset role;
set local role anon;
select pg_temp.expect_error($q$select public.aggregate_report_ref('{}','2026-01-01','2026-02-01')$q$,'42501');
reset role;
rollback;
\o
\echo 'OK disponibilidad: período/filtros/búsqueda, relaciones pendientes, ROA, comisiones, NULL y permisos.'
