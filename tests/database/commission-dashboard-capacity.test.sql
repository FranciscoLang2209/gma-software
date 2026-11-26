-- SINTÉTICO: volumen histórico, informe trimestral de 2.400 movimientos sin clasificar.
\ir quality-volume-fixture.sql
select md5(coalesce(string_agg(md5(to_jsonb(r)::text),'' order by id),'')) before_revenue from app_private.revenue_current r \gset
set local role authenticated;
set local statement_timeout='8s';
\timing on
select public.commission_dashboard('{"year":"2019","quarter":"4"}') report \gset
\timing off
select pg_temp.assert_true(:'report'::jsonb->>'row_count'='2400' and jsonb_array_length(:'report'::jsonb->'rows')=2400,'sin perder páginas de 500');
select pg_temp.assert_true((select count(distinct r->>'entry_id')=2400 and bool_and(r->>'status'='pending' and r->>'actual_received' is null and r->>'expected_quarterly' is null) from jsonb_array_elements(:'report'::jsonb->'rows')r),'multiplicidad y faltantes sin inventar comisiones');
select pg_temp.assert_true(:'report'::jsonb->'availability'->>'period_rows'='2400','disponibilidad trimestral independiente');
select pg_temp.expect_error($q$select public.commission_dashboard('{}')$q$,'54000');
select pg_temp.expect_error($q$select public.commission_report('{"limit":501}')$q$,'22023');
select pg_temp.expect_error($q$select app_private.commission_report_dataset('{}')$q$,'42501');
reset role;
select pg_temp.assert_true(md5(coalesce(string_agg(md5(to_jsonb(r)::text),'' order by id),''))=:'before_revenue','Revenue original conservado') from app_private.revenue_current r;
select pg_temp.assert_true(not has_function_privilege('anon','app_private.commission_report_dataset(jsonb)','EXECUTE') and not has_function_privilege('service_role','app_private.commission_report_dataset(jsonb)','EXECUTE'),'helper no expuesto');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
select pg_temp.expect_error($q$select public.commission_dashboard('{"year":"2019","quarter":"4"}')$q$,'42501');
reset role;
rollback;
\o
\echo 'OK capacidad Comisiones: 2.400 movimientos, una lectura, 10.000 explícito, paginación pública intacta, NULL, roles y financieros conservados.'
