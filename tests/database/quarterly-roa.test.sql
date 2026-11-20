-- Exclusivamente datos SINTÉTICOS en clúster efímero. Todo se revierte.
\ir query-fixture.sql
select public.aggregate_report('2026-01-01','2026-02-01') baseline \gset
select md5(pg_get_functiondef('app_private.aggregate_report(date,date,uuid,uuid,uuid,uuid,uuid,text,text,integer,integer,text)'::regprocedure)) aggregate_definition \gset
-- La nueva migración no cambia el cierre 120 ni Revenue 22 del contrato existente.
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01',account=>'20000000-0000-0000-0000-000000000001')->'total' @> '{"aum_usd":"120","revenue_usd":"22"}','regresión de cierre existente');
update app_private.accounts set service=case when id in ('20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002') then 'Advisory' when id='20000000-0000-0000-0000-000000000007' then 'Brokerage' else 'sin_clasificar' end;
select pg_temp.seed('aum','2026-01-01',1,'[[1,"100000"],[2,"300000"],[4,"-100"],[5,null],[6,"0"]]');
select pg_temp.seed('aum','2026-02-01',1,'[[1,"120000"],[2,"300000"],[4,"-100"],[5,null],[6,"0"]]');
select pg_temp.seed('aum','2026-03-01',1,'[[1,"140000"],[2,"300000"],[4,"-100"],[5,null],[6,"0"]]');
select pg_temp.seed('revenue','2026-01-01',1,'[[1,"25"],[1,"25"],[2,"100"],[3,"10"],[4,"-1"],[5,null],[6,"0"]]');
select pg_temp.seed('revenue','2026-02-01',1,'[[1,"40"],[2,"100"],[3,"10"],[4,"-1"],[5,null],[6,"0"]]');
select pg_temp.seed('revenue','2026-03-01',1,'[[1,"60"],[2,"100"],[3,"10"],[4,"-1"],[5,null],[6,"0"]]');
select pg_temp.seed('aum','2026-01-01',2,'[[7,"900000"]]');
select pg_temp.seed('aum','2026-02-01',2,'[[7,"900000"]]');
select pg_temp.seed('aum','2026-03-01',2,'[[7,"900000"]]');
select pg_temp.seed('revenue','2026-01-01',2,'[[7,"75"]]');
select pg_temp.seed('revenue','2026-02-01',2,'[[7,"75"]]');
select pg_temp.seed('revenue','2026-03-01',2,'[[7,"75"]]');
select public.aggregate_report('2026-01-01','2026-03-01') original_report \gset

-- Impedir que se vuelva a consultar una asignación por fila en lugar de conjuntos.
create or replace function app_private.advisor_at(target_account uuid,target_period date)
returns uuid language plpgsql stable security invoker set search_path='' as $$
begin raise exception 'ROA debe resolver asignaciones por conjuntos'; end $$;
set local role authenticated;
select public.quarterly_roa_report(2026,1,account=>'20000000-0000-0000-0000-000000000001') a \gset
select pg_temp.assert_true(:'a'::jsonb->'total' @> '{"aum_known_sum_usd":"360000","revenue_quarter_usd":"150","revenue_rows":4,"classification":"OK","calculation_status":"calculable"}','fotos no multiplicadas por dos ingresos idénticos/aliases');
select pg_temp.assert_true((:'a'::jsonb->'total'->>'aum_average_usd')::numeric=120000 and (:'a'::jsonb->'total'->>'roa_percent')::numeric=0.5,'fórmula trimestral');
select pg_temp.assert_true(jsonb_array_length(:'a'::jsonb->'months')=3 and :'a'::jsonb->>'assessment_basis'='observed_only_provisional','tres meses y falta de validación económica explícita');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1)->'total'->>'calculation_status'='incomplete','faltantes conservados en global');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,account=>'20000000-0000-0000-0000-000000000003')->'total'->>'roa_percent' is null,'solo Revenue sin ratio ficticio');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,account=>'20000000-0000-0000-0000-000000000005')->'total' @> '{"aum_average_usd":null,"roa_percent":null,"null_aum_account_months":3,"null_revenue_account_months":3}','null no se transforma en cero');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,account=>'20000000-0000-0000-0000-000000000006')->'total' @> '{"calculation_status":"zero_aum","roa_percent":null,"revenue_quarter_usd":"0"}','cero explícito sin división por cero');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,account=>'20000000-0000-0000-0000-000000000004')->'total' @> '{"calculation_status":"negative_aum","roa_percent":null,"has_negative_aum":true}','negativos conservados');
select pg_temp.assert_true(public.quarterly_roa_report(2025,1)->'total' @> '{"calculation_status":"no_data","roa_percent":null,"aum_average_usd":null}','vacío N/D');
select pg_temp.assert_true(public.quarterly_roa_report(9998,4,account=>'20000000-0000-0000-0000-000000000001')->'period'->>'closed'='false','trimestre futuro no cerrado');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,custodian=>'10000000-0000-0000-0000-000000000002',account=>'20000000-0000-0000-0000-000000000001')->>'row_count'='0','filtros contradictorios AND');
select public.quarterly_roa_report(2026,1,custodian=>'10000000-0000-0000-0000-000000000001',team=>'50000000-0000-0000-0000-000000000001',advisor=>'30000000-0000-0000-0000-000000000001',client=>'40000000-0000-0000-0000-000000000001',account=>'20000000-0000-0000-0000-000000000001',service_filter=>'Advisory') filtered \gset
select pg_temp.assert_true((:'filtered'::jsonb->'total'->>'aum_known_sum_usd')::numeric=100000 and (:'filtered'::jsonb->'total'->>'aum_average_usd')::numeric=100000::numeric/3 and :'filtered'::jsonb->'total'->>'revenue_quarter_usd'='50','todos los filtros, equipo histórico y divisor tres');
select pg_temp.assert_true(:'filtered'::jsonb->'total'->>'missing_aum_account_months'='0','mes fuera de equipo no es snapshot faltante');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,team=>'50000000-0000-0000-0000-000000000002',account=>'20000000-0000-0000-0000-000000000001')->'total'->>'revenue_quarter_usd'='40','equipo febrero y no marzo');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,service_filter=>'Advisory')->'service_coverage_before_filter'->>'unclassified_accounts'='4','sin clasificar visible antes del filtro');
select public.quarterly_roa_report(2026,1,page_size=>1) first_page \gset
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,page_size=>1,page_offset=>1,expected_revision=>:'first_page'::jsonb->>'revision')->'total'=:'first_page'::jsonb->'total','totales independientes de página');
select pg_temp.expect_error($q$select public.quarterly_roa_report(2026,5)$q$,'22023');
select pg_temp.expect_error($q$select public.quarterly_roa_report(2026,1,service_filter=>'inventado')$q$,'22023');
select pg_temp.expect_error($q$select public.quarterly_roa_report(2026,1,page_offset=>1)$q$,'22023');
select pg_temp.expect_error($q$select public.quarterly_roa_report(2026,1,expected_revision=>'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')$q$,'40001');
-- Desgloses concilian importes antes de páginas. Los ratios se recalculan con sus bases.
do $$ declare dimension text; report jsonb; begin
 foreach dimension in array array['account','service','custodian','team','advisor','client'] loop
  report:=public.quarterly_roa_report(2026,1,group_by=>dimension,page_size=>250);
  perform pg_temp.assert_true((select sum((x->>'aum_known_sum_usd')::numeric) from jsonb_array_elements(report->'rows') x)=(report->'total'->>'aum_known_sum_usd')::numeric,'AUM aditivo '||dimension);
  perform pg_temp.assert_true((select sum((x->>'revenue_quarter_usd')::numeric) from jsonb_array_elements(report->'rows') x)=(report->'total'->>'revenue_quarter_usd')::numeric,'Revenue aditivo '||dimension);
 end loop;
end $$;
reset role;
-- Fuentes reemplazadas/candidatas no activas no alteran finanzas; una revisión sí detecta cambios.
select pg_temp.seed('revenue','2026-03-01',1,'[[1,"999999"]]',false);
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2026,1)=public.quarterly_roa_report(2026,1,expected_revision=>:'first_page'::jsonb->>'revision'),'preparación no modifica reporte');
reset role;
-- Helper de entrada revisada de Comisiones, con originales SINTÉTICOS completos.
create function pg_temp.rate_input(a integer,rate text default '0.005') returns jsonb language sql as $$
 select jsonb_build_object('account_id',('20000000-0000-0000-0000-00000000000'||a),'custodian_id','10000000-0000-0000-0000-000000000001',
 'component_key','base','quarter','2026-01-01','cutoff','2025-12-31','cutoff_evidence','SINTÉTICO: foto aplicable Q1',
 'broker','Broker SINTETICO','owner','Beneficiario SINTETICO','fee_type','Advisory SINTETICO','basis','gross','balance','100000','annual_rate',rate,
 'rate_evidence_status','confirmed_for_quarter','rate_evidence','SINTÉTICO Q1 completo','fee_rule','balance_annual_div4_v1','fee_rule_evidence','SINTÉTICO',
 'eligibility_confirmed',true,'source_file','SINTETICO.xlsx','source_sheet','SINTETICO','source_row',1,'file_sha256',repeat('a',64),
 'balance_header','Balance','normalization_evidence','SINTÉTICO proporción anual','account_evidence','SINTÉTICO UUID/custodio','reason','Revisión SINTÉTICA',
 'original_cells',jsonb_build_object('Balance','100000','Adv Fee / Retro',rate,'Owner Name payout','Beneficiario SINTETICO','Broker','Broker SINTETICO',
 'Fee type','Advisory SINTETICO','Gross anua USD',null,'ACCOUNT','000001','IP',null,'IP Des',null,'NAME','SINTETICO','Status','SINTETICO',
 'Net annual USD',null,'Payout final REP',null,'Final REP',null));
$$;
set local role authenticated;
select public.manage_commission('90000000-0000-0000-0000-000000000009','expected','91000000-0000-0000-0000-000000000009',
 pg_temp.rate_input(1)||'{"component_key":"sin-verificar","rate_evidence_status":"unconfirmed"}');
select pg_temp.expect_error($q$select public.publish_roa_rate(gen_random_uuid(),'90000000-0000-0000-0000-000000000009',null,'SINTETICO: evidencia adicional no reemplaza verificación de fuente')$q$,'22023');
select public.manage_commission('90000000-0000-0000-0000-000000000001','expected','91000000-0000-0000-0000-000000000001',pg_temp.rate_input(1));
select public.manage_commission('90000000-0000-0000-0000-000000000002','expected','91000000-0000-0000-0000-000000000002',pg_temp.rate_input(2,'0.01'));
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,service_filter=>'Advisory')->'total'->>'advisory_fee_percent' is null,'verified de Comisiones no publica tasa ROA automáticamente');
select public.publish_roa_rate('92000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',null,'SINTÉTICO: comparable con Payout broker Q1 completo') published \gset
select pg_temp.assert_true(public.publish_roa_rate('92000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',null,'SINTÉTICO: comparable con Payout broker Q1 completo')=:'published'::jsonb,'publicación idempotente');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'advisory_rate_version_id'='92000000-0000-0000-0000-000000000001','versión pública recuperable para una revisión posterior sin exponer evento fuente');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,service_filter=>'Advisory')->'total' @> '{"advisory_fee_percent":null,"advisory_difference_pp":null,"missing_rate_account_months":3}','no mezclar tasa de subconjunto con ROA total');
select public.publish_roa_rate('92000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000002',null,'SINTÉTICO: base y tasa comparables Q1');
select public.quarterly_roa_report(2026,1,service_filter=>'Advisory') advisory \gset
select pg_temp.assert_true((:'advisory'::jsonb->'total'->>'advisory_fee_percent')::numeric=1080000::numeric/1260000 and
 (:'advisory'::jsonb->'total'->>'roa_percent')::numeric=450*1200::numeric/1260000,'Fee ponderado por exposición mensual y ROA de sumandos');
select pg_temp.assert_true((:'advisory'::jsonb->'total'->>'advisory_difference_pp')::numeric=(450*1200::numeric-1080000)/1260000,'diferencia real menos fee en pp sin doble redondeo');
select pg_temp.assert_true(public.quarterly_roa_report(2026,2,service_filter=>'Advisory')->'total'->>'advisory_fee_percent' is null,'sin tasa histórica arrastrada a Q2');
select public.quarterly_roa_report(2026,1) admin_report \gset
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-03-01')=:'original_report'::jsonb,'ROA/tasas no cambian aggregate_report');
reset role;
select pg_temp.assert_true(md5(pg_get_functiondef('app_private.aggregate_report(date,date,uuid,uuid,uuid,uuid,uuid,text,text,integer,integer,text)'::regprocedure))=:'aggregate_definition','definición aggregate intacta');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}';
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2026,1)=:'admin_report'::jsonb,'lector/admin misma proyección publicada');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1)::text not like '%SINTÉTICO: comparable%' and public.quarterly_roa_report(2026,1)::text not like '%source_event_id%','sin evidencia cruda/IDs de comisiones');
select pg_temp.expect_error($q$select public.publish_roa_rate(gen_random_uuid(),'90000000-0000-0000-0000-000000000001',null,'intentando elevar rol')$q$,'42501');
select pg_temp.expect_error($q$select * from app_private.roa_rate_versions$q$,'42501');
select pg_temp.assert_true((select count(*)=0 from app_private.commission_events),'RLS sigue ocultando todos los eventos al lector');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select pg_temp.expect_error($q$select public.publish_roa_rate(gen_random_uuid(),'90000000-0000-0000-0000-000000000001',null,'otra versión')$q$,'40001');
select pg_temp.expect_error($q$select public.publish_roa_rate('92000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',null,'cambio en retry')$q$,'22023');
select public.manage_commission('90000000-0000-0000-0000-000000000003','expected','91000000-0000-0000-0000-000000000001',pg_temp.rate_input(1,'0.006')||'{"previous_id":"90000000-0000-0000-0000-000000000001"}');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,service_filter=>'Advisory')->'total' @> '{"advisory_fee_status":"obsolete","advisory_fee_percent":null,"advisory_difference_pp":null}','corrección invalida atómicamente tasa, no fallback a otra');
select pg_temp.expect_error(format('select public.quarterly_roa_report(2026,1,service_filter=>''Advisory'',expected_revision=>%L)',:'advisory'::jsonb->>'revision'),'40001');
select public.publish_roa_rate('92000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',null,'SINTÉTICO: comparable con Payout broker Q1 completo');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,service_filter=>'Advisory')->'total'->>'advisory_fee_status'='obsolete','retry de publicación vieja no reactiva tasa');
select pg_temp.expect_error($q$select public.quarterly_roa_report(2026,1,service_filter=>'Advisory',expected_revision=>'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')$q$,'40001');
select pg_temp.expect_error($q$select public.publish_roa_rate(gen_random_uuid(),'90000000-0000-0000-0000-000000000001','92000000-0000-0000-0000-000000000001','viejo expected')$q$,'22023');
select public.publish_roa_rate(gen_random_uuid(),'90000000-0000-0000-0000-000000000003','92000000-0000-0000-0000-000000000001','SINTÉTICO: revisión nueva tasa comparable');
select pg_temp.assert_true(public.quarterly_roa_report(2026,1,service_filter=>'Advisory')->'total'->>'advisory_fee_status'='verified_reference','republicación recupera comparación');
-- Inmutabilidad y grants efectivos.
select pg_temp.expect_error($q$delete from app_private.roa_rate_versions$q$,'42501');
reset role;
select pg_temp.expect_error($q$update app_private.roa_rate_versions set annual_rate=0$q$,'P0001');
select pg_temp.assert_true(not has_function_privilege('anon','public.quarterly_roa_report(integer,integer,uuid,uuid,uuid,uuid,uuid,text,text,integer,integer,text)','EXECUTE'),'anon sin RPC');
select pg_temp.assert_true(not has_function_privilege('service_role','public.publish_roa_rate(uuid,uuid,uuid,text)','EXECUTE'),'service_role sin publicación');
-- Agregado distinto del promedio de ratios, umbrales exactos y ajustes sobre base positiva.
do $$ declare m date; begin
 for m in select d::date from generate_series(date '2024-01-01',date '2024-03-01',interval '1 month') d loop
  perform pg_temp.seed('aum',m,1,'[[1,"100000"],[2,"900000"]]');
  perform pg_temp.seed('revenue',m,1,case when m=date '2024-01-01' then '[[1,"250"],[2,"225"]]'::jsonb else '[[1,"0"],[2,"0"]]'::jsonb end);
 end loop;
end $$;
set local role authenticated;
select pg_temp.assert_true((public.quarterly_roa_report(2024,1,service_filter=>'Advisory')->'total'->>'roa_percent')::numeric=0.19,'global no promedia ROA 1% y 0.1%');
reset role;
select pg_temp.seed('revenue','2024-01-01',1,'[[1,"100"],[2,"0"]]');
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2024,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'classification'='OK','0.40 inclusivo');
reset role;
select pg_temp.seed('revenue','2024-01-01',1,'[[1,"99.9999999999999999999999999"],[2,"0"]]');
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2024,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'classification'='Bajo','justo debajo de 0.40, incluso si la división redondea');
reset role;
select pg_temp.seed('revenue','2024-01-01',1,'[[1,"100.0000000000000000000000001"],[2,"0"]]');
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2024,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'classification'='OK','justo encima de 0.40');
reset role;
select pg_temp.seed('revenue','2024-01-01',1,'[[1,"149.9999999999999999999999999"],[2,"0"]]');
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2024,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'classification'='OK','justo debajo de 0.60');
reset role;
select pg_temp.seed('revenue','2024-01-01',1,'[[1,"150"],[2,"0"]]');
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2024,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'classification'='OK','0.60 inclusivo');
reset role;
select pg_temp.seed('revenue','2024-01-01',1,'[[1,"150.0000000000000000000000001"],[2,"0"]]');
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2024,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'classification'='Muy bien','umbral sin redondear división ni número binario');
reset role;
select pg_temp.seed('revenue','2024-01-01',1,'[[1,"-25"],[2,"0"]]');
set local role authenticated;
select pg_temp.assert_true((public.quarterly_roa_report(2024,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'roa_percent')::numeric=-0.1,'ajuste negativo con base positiva');
reset role;
select pg_temp.seed('revenue','2024-01-01',1,'[[1,"0"],[2,"0"]]');
set local role authenticated;
select pg_temp.assert_true((public.quarterly_roa_report(2024,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'roa_percent')::numeric=0,'Revenue cero presente produce ratio cero');
reset role;
-- Una foto intermedia ausente no se arrastra ni se divide entre dos.
select pg_temp.seed('aum','2024-02-01',1,'[[2,"900000"]]');
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2024,1,account=>'20000000-0000-0000-0000-000000000001')->'total' @>
 '{"aum_known_sum_usd":"200000","aum_average_divisor":3,"aum_average_usd":null,"missing_aum_account_months":1,"roa_percent":null,"classification":null,"calculation_status":"incomplete"}',
 'foto intermedia faltante: subtotal conocido, promedio/ROA N/D');
reset role;
-- Cambiar de comercial distribuye los meses, sin duplicar la cuenta ni inventar historia.
insert into app_private.commercial_advisors(id,name,created_by)
 values('30000000-0000-0000-0000-000000000002','Otro comercial SINTETICO',auth.uid());
insert into app_private.account_assignments(account_id,advisor_id,valid_from,evidence,created_by)
 values('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','2026-03-01','SINTETICO: cambio explícito',auth.uid());
set local role authenticated;
select public.quarterly_roa_report(2026,1,account=>'20000000-0000-0000-0000-000000000001',group_by=>'advisor') changed_advisor \gset
select pg_temp.assert_true(:'changed_advisor'::jsonb->'total' @> '{"aum_known_sum_usd":"360000","revenue_quarter_usd":"150","unassigned_advisor_account_months":0,"unassigned_team_account_months":1}',
 'cambio de comercial conserva total y marzo sin membresía de equipo');
select pg_temp.assert_true((select x @> '{"aum_known_sum_usd":"220000","revenue_quarter_usd":"90","account_months":2}'
 from jsonb_array_elements(:'changed_advisor'::jsonb->'rows') x where x->>'key'='30000000-0000-0000-0000-000000000001'), 'comercial anterior recibe enero y febrero');
select pg_temp.assert_true((select x @> '{"aum_known_sum_usd":"140000","revenue_quarter_usd":"60","account_months":1}'
 from jsonb_array_elements(:'changed_advisor'::jsonb->'rows') x where x->>'key'='30000000-0000-0000-0000-000000000002'), 'comercial nuevo recibe solo marzo');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-03-01',account=>'20000000-0000-0000-0000-000000000001')->'total' @> '{"aum_usd":"140000","revenue_usd":"150"}',
 'Resumen sigue mostrando cierre 140000, no promedio ROA 120000');
select pg_temp.assert_true(public.quarterly_roa_report(2024,2,account=>'20000000-0000-0000-0000-000000000001')->'total' @>
 '{"accounts":1,"calculation_status":"no_data","aum_known_sum_usd":null,"revenue_quarter_usd":null,"missing_aum_account_months":3,"missing_revenue_account_months":3}',
 'cuenta observada en mes previo permanece visible sin arrastrar fotos ni Revenue');
reset role;
do $$ declare m date; begin
 for m in select d::date from generate_series(date '2022-01-01',date '2022-03-01',interval '1 month') d loop
  perform pg_temp.seed('aum',m,1,'[[1,"100000"]]');
 end loop;
end $$;
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2022,1,account=>'20000000-0000-0000-0000-000000000001')->'total' @>
 '{"revenue_quarter_usd":null,"missing_revenue_account_months":3,"calculation_status":"incomplete","roa_percent":null}',
 'solo AUM: ausencia de Revenue no acredita cero movimientos');
reset role;
-- Trimestre abierto aun con tres fotos cargadas por adelantado: sin anualizarlo.
do $$ declare m date; begin
 for m in select d::date from generate_series(make_date(extract(year from current_date)::integer+1,1,1),make_date(extract(year from current_date)::integer+1,3,1),interval '1 month') d loop
  perform pg_temp.seed('aum',m,1,'[[1,"100000"]]');
  perform pg_temp.seed('revenue',m,1,'[[1,"100"]]');
 end loop;
end $$;
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(extract(year from current_date)::integer+1,1,account=>'20000000-0000-0000-0000-000000000001')->'total' @> '{"calculation_status":"open_quarter","roa_percent":null,"classification":null}','trimestre abierto sin ROA/semáforo');
reset role;
set local request.jwt.claims='{"session_id":"ffffffff-ffff-ffff-ffff-ffffffffffff"}';
set local role authenticated;
select pg_temp.expect_error($q$select public.quarterly_roa_report(2026,1)$q$,'42501');
reset role;
\if :{?roa_race}
commit;
\else
rollback;
\endif
\o
\echo 'OK ROA sintético: fórmula, filtros, cobertura, vigencias, RLS, tasas publicadas/obsoletas y aggregate intacto.'
