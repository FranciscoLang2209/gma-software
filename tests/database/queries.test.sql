\ir query-fixture.sql
set local role authenticated;
select public.aggregate_report('2026-01-01','2026-02-01') as admin_report \gset
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}';
set local role authenticated;
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01')=:'admin_report'::jsonb,'admin/lector comparten filtros y proyección');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-01-01',account=>'20000000-0000-0000-0000-000000000001')->'total' @> '{"aum_usd":"100","revenue_usd":"10","revenue_rows":3}','A: 100 AUM y 2+3+5=10 Revenue');
select public.aggregate_report('2026-01-01','2026-02-01',account=>'20000000-0000-0000-0000-000000000001') a_report \gset
select pg_temp.assert_true(:'a_report'::jsonb->'total' @> '{"aum_usd":"120","revenue_usd":"22","accounts_with_aum":1,"clients_with_aum":1}', 'rango A: cierre120 Revenue22');
select pg_temp.assert_true((:'a_report'::jsonb->'months'->1->>'aum_change_percent')::numeric=20 and (:'a_report'::jsonb->'months'->1->>'revenue_change_percent')::numeric=20,'variación calendario exacta');
select pg_temp.assert_true(:'a_report'::jsonb->'months'->0->>'aum_change_percent' is null,'base ausente N/D');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-01-01',team=>'50000000-0000-0000-0000-000000000001')->'total' @> '{"aum_usd":"150","revenue_usd":"10"}','lector atribuye FA activo al cierre y no exige originales');
select pg_temp.assert_true(public.aggregate_report('2026-05-01','2026-05-01')->'total' @> '{"aum_usd":"100.123456789123456789","revenue_usd":"0.15","revenue_rows":3}','numeric exacto, repetición idéntica y ajuste');
select public.aggregate_report('2026-01-01','2026-02-01') full_report \gset
select pg_temp.assert_true(:'full_report'::jsonb->'total' @> '{"aum_usd":"119","revenue_usd":"38","accounts_with_aum":5,"accounts_with_revenue":6,"aum_missing_accounts":2,"aum_rows":5,"aum_values":4}', 'solo fuentes, negativos, nulls y ceros conservados');
select pg_temp.assert_true(:'full_report'::jsonb->'months'->1->>'revenue_change_percent' is null,'poblaciones distintas no son comparables');
select pg_temp.assert_true(:'full_report'::jsonb->'total'->>'aum_without_advisor_usd'='-1' and :'full_report'::jsonb->'total'->>'revenue_without_advisor_usd'='16','sin asignar incluido');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01',team=>'50000000-0000-0000-0000-000000000001')->'total' @> '{"aum_usd":null,"revenue_usd":"10"}','equipo anterior solo Revenue enero, sin atribución actual');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01',team=>'50000000-0000-0000-0000-000000000002')->'total' @> '{"aum_usd":"120","revenue_usd":"12"}','equipo al cierre febrero');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01',advisor=>'30000000-0000-0000-0000-000000000001')->'total' @> '{"aum_usd":"120","revenue_usd":"22"}','filtro comercial histórico');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01',client=>'40000000-0000-0000-0000-000000000001')->'total' @> '{"aum_usd":"120","revenue_usd":"22","aum_missing_accounts":1}', 'cliente y cuenta solo AUM con cierre faltante');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01',service_filter=>'Servicio SINTETICO')->'total' @> '{"aum_usd":"120","revenue_usd":"22"}', 'servicio sin inferir advisory');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01',custodian=>'10000000-0000-0000-0000-000000000002')->'total' @> '{"aum_usd":"9","revenue_usd":"4"}', 'custodio independiente');
-- Proyección de dashboard: orden global antes de paginar, proporciones exactas y metadatos seguros.
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01',group_by=>'team',page_size=>1)->'rows'->0->>'key'='50000000-0000-0000-0000-000000000002','ranking AUM global antes del LIMIT');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01',account=>'20000000-0000-0000-0000-000000000001')->'rows'->0->>'aum_share_percent' is not null,'participación positiva presente');
select pg_temp.assert_true((public.aggregate_report('2026-01-01','2026-02-01',account=>'20000000-0000-0000-0000-000000000001')->'rows'->0->>'aum_share_percent')::numeric=100,'participación exacta del total filtrado');
select pg_temp.assert_true(:'full_report'::jsonb->'rows'->0->>'aum_share_percent' is null and :'full_report'::jsonb->'rows'->0->>'revenue_share_percent' is null,'negativos/importes ausentes suprimen participaciones');
select pg_temp.assert_true(public.aggregate_report('2026-05-01','2026-05-01')->'rows'->0->>'revenue_share_percent' is null,'ajuste negativo suprime participación aunque neto sea positivo');
select pg_temp.assert_true(public.aggregate_report('2026-02-01','2026-02-01',account=>'20000000-0000-0000-0000-000000000006')->'rows'->0->>'aum_share_percent' is null,'denominador cero N/D');
select pg_temp.assert_true(:'full_report'::jsonb->>'published_at' is not null and jsonb_array_length(:'full_report'::jsonb->'options'->'custodio')=2,'fecha publicación y opciones observadas para lector');
select pg_temp.assert_true((public.aggregate_report('2026-01-01','2026-02-01',account=>'20000000-0000-0000-0000-000000000001',group_by=>'team',page_size=>1)->'rows'->0->>'revenue_share_percent')::numeric=12::numeric*100/22,'participación usa todas las páginas, no el subtotal visible');
-- Conciliación con todas las dimensiones, global y cada filtro; los conteos de clientes distintos no son aditivos.
do $$ declare dimension text; filtered integer; report jsonb; ar numeric; rr numeric; begin
 foreach dimension in array array['account','custodian','team','advisor','client','service'] loop
  for filtered in 0..7 loop
   report:=public.aggregate_report('2026-01-01','2026-02-01',
    custodian=>case when filtered in (1,7) then '10000000-0000-0000-0000-000000000001'::uuid end,
    team=>case when filtered in (2,7) then '50000000-0000-0000-0000-000000000001'::uuid end,
    advisor=>case when filtered in (3,7) then '30000000-0000-0000-0000-000000000001'::uuid end,
    client=>case when filtered in (4,7) then '40000000-0000-0000-0000-000000000001'::uuid end,
    account=>case when filtered in (5,7) then '20000000-0000-0000-0000-000000000001'::uuid end,
    service_filter=>case when filtered=6 then 'sin_clasificar' when filtered=7 then 'Servicio SINTETICO' end,
    group_by=>dimension,page_size=>250);
   select sum((v->>'aum_usd')::numeric),sum((v->>'revenue_usd')::numeric) into ar,rr from jsonb_array_elements(report->'rows') v;
   perform pg_temp.assert_true(ar is not distinct from (report->'total'->>'aum_usd')::numeric and rr is not distinct from (report->'total'->>'revenue_usd')::numeric,'sum(desglose)=global '||dimension||' filtro '||filtered);
  end loop;
 end loop;
end $$;
select pg_temp.assert_true(public.aggregate_report('2027-01-01','2027-02-01',custodian=>'10000000-0000-0000-0000-000000000001')->'total' @> '{"aum_usd":null,"revenue_usd":null,"aum_rows":0,"revenue_rows":0}','conjunto vacío es N/D, sin monto cero artificial');
select pg_temp.assert_true(jsonb_array_length(public.aggregate_report('2027-01-01','2027-02-01')->'months')=2,'serie incluye meses sin ninguna observación');
select pg_temp.assert_true(jsonb_array_length(public.aggregate_report('2027-01-01','2027-02-01',custodian=>'10000000-0000-0000-0000-000000000001')->'coverage')=4,'custodio explícito sin datos conserva dos fuentes por mes');
select public.aggregate_report('2026-02-01','2026-03-01') missing \gset
select pg_temp.assert_true(:'missing'::jsonb->'total'->>'aum_usd' is null and (:'missing'::jsonb->'total'->>'aum_missing_accounts')::integer>0,'mes entero ausente sin arrastre');
select pg_temp.assert_true(:'missing'::jsonb->'months'->1->>'revenue_usd' is null and :'missing'::jsonb->'months'->1->>'aum_change_percent' is null,'no salto de mes faltante');
select pg_temp.assert_true(exists(select 1 from jsonb_array_elements(:'missing'::jsonb->'coverage') c where c->>'period'='2026-03-01' and c->>'published'='false'),'alcances ausentes visibles');
select pg_temp.assert_true(public.aggregate_report('2026-02-01','2026-02-01',account=>'20000000-0000-0000-0000-000000000006')->'months'->0->>'aum_change_percent' is null,'base cero porcentaje N/D');
select public.aggregate_report('2026-01-01','2026-02-01',page_size=>1) first_page \gset
select pg_temp.assert_true(jsonb_array_length(:'first_page'::jsonb->'rows')=1 and :'first_page'::jsonb->'total'=:'full_report'::jsonb->'total','total no limitado a página');
select public.aggregate_report('2026-01-01','2026-02-01',page_size=>1,page_offset=>1,expected_revision=>:'first_page'::jsonb->>'revision') second_page \gset
select pg_temp.assert_true(:'first_page'::jsonb->'rows'->0->>'key'<>:'second_page'::jsonb->'rows'->0->>'key','páginas estables sin repetición');
select pg_temp.expect_error($q$select public.aggregate_report('2026-01-01','2026-02-01',expected_revision=>'00000000000000000000000000000000')$q$,'40001');
select pg_temp.expect_error($q$select public.aggregate_report('2026-02-02','2026-02-01')$q$,'22023');
select pg_temp.expect_error($q$select public.aggregate_report('2026-01-01','2026-02-01',group_by=>'injection;drop table x')$q$,'22023');
select pg_temp.expect_error($q$select public.aggregate_report('2026-01-01','2026-02-01',page_size=>251)$q$,'22023');
select pg_temp.assert_true(not (:'full_report' like '%SECRETO%' or :'full_report' like '%original%' or :'full_report' like '%storage%'),'proyección no incluye originales/archivos');
select pg_temp.assert_true((select count(*)=0 from app_private.accounts),'no se abren tablas dimensionales al lector');
select pg_temp.assert_true((select count(*)=0 from public.admin_import_rows),'originales siguen privados');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
select pg_temp.seed('revenue','2026-02-01',1,'[[1,"13"],[3,"8"],[4,"-1"],[5,null],[6,"0"]]');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
select pg_temp.expect_error(format($q$select public.aggregate_report('2026-01-01','2026-02-01',expected_revision=>%L)$q$,:'first_page'::jsonb->>'revision'),'40001');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01')->'total' @> '{"aum_usd":"119","revenue_usd":"39"}','corrección no duplica alcance ni otro custodio');
reset role;
set local role anon;
select pg_temp.expect_error($q$select public.aggregate_report('2026-01-01','2026-02-01')$q$,'42501');
reset role;
update auth.sessions set not_after=now()-interval '1 second' where user_id='00000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.expect_error($q$select public.aggregate_report('2026-01-01','2026-02-01')$q$,'42501');
reset role;
rollback;
\o
\echo 'OK: indicadores exactos, cierre, calendario, fuentes independientes, filtros/desgloses, historia, cobertura, paginación y RLS.'
