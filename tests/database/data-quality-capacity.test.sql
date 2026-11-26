-- SINTÉTICO: volumen y estadísticas compartidos con historial.
\ir quality-volume-fixture.sql
set local plan_cache_mode='force_generic_plan';
set local statement_timeout='8s';
set local role authenticated;
\timing on
select public.quality_report('{"from":"2019-01-01","to":"2020-12-01"}') report \gset
\timing off
select pg_temp.assert_true((select sum((v->>'records')::integer) from jsonb_array_elements(:'report'::jsonb->'summaries')v where v->>'stage'='published')=38400,'38.400 hechos, sin multiplicación por fuentes');
select pg_temp.assert_true(jsonb_array_length(:'report'::jsonb->'rows')=25 and (:'report'::jsonb->>'row_count')::integer>800,'cola paginada con total completo');
select pg_temp.assert_true((select sum((v->>'unrelated')::integer) from jsonb_array_elements(:'report'::jsonb->'summaries')v where v->>'stage'='published')=0,'relaciones técnicas completas, clientes pendientes conservados');
reset role;
rollback;
\o
\echo 'OK capacidad Calidad: 38.400 hechos / 800 cuentas / 24 meses, cola y sumarios bajo timeout local 8 s.'
