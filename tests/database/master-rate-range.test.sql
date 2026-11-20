-- SINTÉTICO. No usa fuentes ni identidades reales.
\ir query-fixture.sql
update app_private.accounts set service='sin_clasificar' where id in ('20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002');
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by)
 values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','revenue','ACCOUNT','000001','resolved','SINTETICO',auth.uid()),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','revenue','ACCOUNT','000002','resolved','SINTETICO',auth.uid());
create function pg_temp.rate_row(n integer,rate text) returns jsonb language sql as $$
 select jsonb_build_object('row',n+2,'account','00000'||n,'numericAccount',false,'balance',null,'annualRate',rate,'issue','Sin Balance; pendiente.',
 'cells',jsonb_build_object('Broker','SINTETICO','ACCOUNT','00000'||n,'IP',null,'IP Des',null,'NAME','SINTETICO',
 'Owner Name payout','SINTETICO','Fee type','Advisory','Adv Fee / Retro',case when rate is null then 'POR REVISAR' else '50' end,
 'Status','SINTETICO','Balance',null,'Gross anua USD',null,'Net annual USD',null,'Payout final REP',null,'Final REP',null));
$$;
create function pg_temp.range_input() returns jsonb language sql as $$
 select jsonb_build_object('storage_path','master/SINTETICO/original.xlsx','master',jsonb_build_object(
 'file','SINTETICO.xlsx','hash',repeat('b',64),'sheet','SINTETICO','balanceHeader','Balance',
 'rows',jsonb_build_array(pg_temp.rate_row(1,'0.005'),pg_temp.rate_row(2,null))),
 'review',jsonb_build_object('rate_only',true,'quarter','2023-01-01','quarter_to','2026-10-01','cutoff','2026-09-30',
 'evidence','SINTETICO: tasas vigentes en 2023-2026 confirmadas. Balance no histórico. Servicio acreditado por Fee type.',
 'identity_confirmed',true,'validity_confirmed',true,'classify_advisory',true,
 'brokers',jsonb_build_object('SINTETICO','10000000-0000-0000-0000-000000000001'),'accounts','{}'::jsonb,'selected','[3]'::jsonb));
$$;
select public.aggregate_report('2026-01-01','2026-02-01') baseline \gset
set local role authenticated;
select public.import_master_rates(gen_random_uuid(),'preview',pg_temp.range_input()) preview \gset
select pg_temp.assert_true(:'preview'::jsonb @> '{"ready":1,"quarter_count":16,"classifications":2,"published":0}','tasas sin Balance, 16 trimestres, clasificar sólo Advisory, sin escribir');
select jsonb_set(pg_temp.range_input(),'{review,revision}',:'preview'::jsonb->'revision') reviewed \gset
-- Rango invertido, excesivo, trimestre inválido y vigencia no confirmada.
select pg_temp.expect_error($q$select public.import_master_rates(gen_random_uuid(),'preview',jsonb_set(pg_temp.range_input(),'{review,quarter_to}','"2022-01-01"'))$q$,'22023');
select pg_temp.expect_error($q$select public.import_master_rates(gen_random_uuid(),'preview',jsonb_set(pg_temp.range_input(),'{review,quarter_to}','"2030-01-01"'))$q$,'22023');
select pg_temp.expect_error($q$select public.import_master_rates(gen_random_uuid(),'preview',jsonb_set(pg_temp.range_input(),'{review,quarter_to}','"2026-12-31"'))$q$,'22023');
select pg_temp.expect_error($q$select public.import_master_rates(gen_random_uuid(),'preview',jsonb_set(pg_temp.range_input(),'{review,validity_confirmed}','false'))$q$,'22023');
-- Error de segunda fila: sin clasificaciones ni tasas parciales.
select pg_temp.expect_error(format('select public.import_master_rates(gen_random_uuid(),''publish'',%L)',jsonb_set(:'reviewed','{review,selected}','[3,4]')),'22023');
reset role;
select pg_temp.assert_true((select count(*)=0 from app_private.master_publications) and
 (select count(*)=0 from app_private.roa_rate_versions) and
 (select service='sin_clasificar' from app_private.accounts where id='20000000-0000-0000-0000-000000000001'),'fallo sin cambios');
-- Fallo dentro de la escritura: revierte snapshot, clasificación y primer trimestre.
create function pg_temp.fail_second_rate() returns trigger language plpgsql as $$ begin
 if new.quarter='2023-04-01' then raise exception 'SINTETICO escritura interrumpida'; end if; return new;
end $$;
create trigger synthetic_rate_failure before insert on app_private.roa_rate_versions for each row execute function pg_temp.fail_second_rate();
set local role authenticated;
select pg_temp.expect_error(format('select public.import_master_rates(gen_random_uuid(),''publish'',%L)',:'reviewed'),'P0001');
reset role;
select pg_temp.assert_true((select count(*)=0 from app_private.master_publications) and
 (select count(*)=0 from app_private.roa_rate_versions) and
 (select service='sin_clasificar' from app_private.accounts where id='20000000-0000-0000-0000-000000000001'),'rollback de cambios de modelo y primera tasa ante fallo durante publicación');
drop trigger synthetic_rate_failure on app_private.roa_rate_versions;
set local role authenticated;
select public.import_master_rates('bb000000-0000-0000-0000-000000000001','publish',:'reviewed') published \gset
select pg_temp.assert_true(:'published'::jsonb @> '{"published":16,"classifications":2,"snapshot_rows":2}','publicación y clasificación conjuntas, pendiente conservado');
select pg_temp.assert_true(public.import_master_rates('bb000000-0000-0000-0000-000000000001','publish',:'reviewed')=:'published'::jsonb,'retry exacto');
select pg_temp.expect_error(format('select public.import_master_rates(gen_random_uuid(),''publish'',%L)',:'reviewed'),'40001');
reset role;
select pg_temp.assert_true((select count(*)=0 from app_private.commission_events),'no fabrica obligaciones ni esperado histórico');
select pg_temp.assert_true((select count(*)=16 and min(quarter)='2023-01-01' and max(quarter)='2026-10-01' and bool_and(annual_rate=0.005 and source_event_id is null and master_source_row=3) from app_private.roa_rate_versions),'cobertura y referencia fuente exactas');
select pg_temp.assert_true((select count(*)=2 from app_private.accounts where service='Advisory'),'clasifica también cuenta con tasa pendiente, por autorización explícita');
select pg_temp.assert_true((select count(*)=0 from app_private.roa_rate_versions where account_id='20000000-0000-0000-0000-000000000002'),'tasa ausente nunca cero');
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01')->'total'->>'aum_usd'=:'baseline'::jsonb->'total'->>'aum_usd' and
 public.aggregate_report('2026-01-01','2026-02-01')->'total'->>'revenue_usd'=:'baseline'::jsonb->'total'->>'revenue_usd','cifras no modificadas');
-- Validar que ROA consume la referencia sin requerir eventos de comisiones.
select pg_temp.seed('aum','2023-01-01',1,'[[1,"100000"]]');
select pg_temp.seed('aum','2023-02-01',1,'[[1,"100000"]]');
select pg_temp.seed('aum','2023-03-01',1,'[[1,"100000"]]');
select pg_temp.seed('revenue','2023-01-01',1,'[[1,"50"]]');
select pg_temp.seed('revenue','2023-02-01',1,'[[1,"50"]]');
select pg_temp.seed('revenue','2023-03-01',1,'[[1,"50"]]');
set local role authenticated;
select pg_temp.assert_true((public.quarterly_roa_report(2023,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'advisory_fee_percent')::numeric=0.5,'fee comparable de fuente Master en reporte');
-- Una tasa publicada sigue asociada sin AUM; nunca fabrica la base ni el Fee ponderado.
select pg_temp.assert_true(public.quarterly_roa_report(2023,1,account=>'20000000-0000-0000-0000-000000000001')->'total' @>
 '{"advisory_reference_percent":"0.500","advisory_accounts":1,"advisory_rate_accounts":1}', 'referencia individual distinta del ponderado');
reset role;
select pg_temp.seed('revenue','2023-04-01',1,'[[1,"50"]]');
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report(2023,2,account=>'20000000-0000-0000-0000-000000000001')->'total' @>
 '{"advisory_reference_percent":"0.500","advisory_fee_percent":null,"advisory_difference_pp":null,"advisory_accounts":1,"advisory_rate_accounts":1}', 'sin AUM conserva tasa vinculada sin fabricar ponderación');
select pg_temp.assert_true(public.quarterly_roa_report(2023,1,account=>'20000000-0000-0000-0000-000000000002')->'total'->>'advisory_reference_percent' is null,'tasa pendiente nunca cero');
select pg_temp.assert_true(public.quarterly_roa_report(2023,1,account=>'20000000-0000-0000-0000-000000000001')->'rows'->0->>'label' like '% · 000001','etiqueta conserva identificador textual y custodio');
select public.import_master_rates(gen_random_uuid(),'preview',pg_temp.range_input()) fresh \gset
select pg_temp.assert_true(jsonb_array_length(:'fresh'::jsonb->'rows'->0->'previous_rates')=16,'revisión de reemplazos por trimestre');
select jsonb_set(jsonb_set(jsonb_set(pg_temp.range_input(),'{review,quarter_to}','"2023-04-01"'),'{master,rows,0,annualRate}','"0.006"'),'{review,revision}',:'fresh'::jsonb->'revision') correction \gset
select public.import_master_rates('bb000000-0000-0000-0000-000000000002','publish',:'correction');
reset role;
select pg_temp.assert_true((select count(*)=18 from app_private.roa_rate_versions),'historia conserva 16 más dos correcciones');
select pg_temp.assert_true((select annual_rate=0.005 from app_private.roa_rate_versions where quarter='2026-10-01'),'otros trimestres intactos');
-- Conflictos de servicio, Retrocession, identidad y cuentas numéricas no se fuerzan.
update app_private.accounts set service='Brokerage' where id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.assert_true(public.import_master_rates(gen_random_uuid(),'preview',pg_temp.range_input())->>'ready'='0','no sobrescribir Brokerage');
select pg_temp.assert_true(public.import_master_rates(gen_random_uuid(),'preview',jsonb_set(pg_temp.range_input(),'{master,rows,0,cells,Fee type}','"Retrocession"'))->>'ready'='0','Retrocession no es Advisory');
select pg_temp.assert_true(public.import_master_rates(gen_random_uuid(),'preview',jsonb_set(pg_temp.range_input(),'{master,rows,0,numericAccount}','true'))->>'ready'='0','cuenta numérica exige confirmación');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
select pg_temp.expect_error($q$select public.import_master_rates(gen_random_uuid(),'preview',pg_temp.range_input())$q$,'42501');
select pg_temp.expect_error($q$select * from app_private.master_publications$q$,'42501');
select pg_temp.assert_true((public.quarterly_roa_report(2023,1,account=>'20000000-0000-0000-0000-000000000001')->'total'->>'advisory_fee_percent') is null,'reader no compara fee Advisory con cuenta Brokerage');
reset role;
select pg_temp.assert_true(not has_function_privilege('anon','public.import_master_rates(uuid,text,jsonb)','EXECUTE') and
 not has_function_privilege('service_role','public.import_master_rates(uuid,text,jsonb)','EXECUTE'),'RPC sin acceso anon/service_role');
rollback;
\o
\echo 'OK Master tasas: 2023-2026, ausencia de Balance, sin comisiones ficticias, clasificación, corrección acotada, retry y roles.'
