-- SINTÉTICO: volumen comparable al Master, sin datos privados.
\ir query-fixture.sql
insert into app_private.accounts(id,custodian_id,service,created_by)
 select ('c1000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001','sin_clasificar',auth.uid() from generate_series(1,180) n;
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by)
 select ('c1000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001','revenue','ACCOUNT','SYN-RANGE-'||n,'resolved','SINTETICO',auth.uid() from generate_series(1,180) n;
select jsonb_build_object('storage_path','master/SINTETICO-CAPACITY/original.xlsx','master',jsonb_build_object(
 'file','SINTETICO.xlsx','hash',repeat('c',64),'sheet','SINTETICO','balanceHeader','Balance','rows',jsonb_agg(jsonb_build_object(
 'row',n+2,'account','SYN-RANGE-'||n,'numericAccount',false,'balance',null,'annualRate','0.005','issue','Sin Balance; pendiente.',
 'cells',jsonb_build_object('Broker','SINTETICO','ACCOUNT','SYN-RANGE-'||n,'IP',null,'IP Des',null,'NAME','SINTETICO',
 'Owner Name payout','SINTETICO','Fee type','Advisory','Adv Fee / Retro','50','Status','SINTETICO','Balance',null,
 'Gross anua USD',null,'Net annual USD',null,'Payout final REP',null,'Final REP',null)))),
 'review',jsonb_build_object('rate_only',true,'quarter','2023-01-01','quarter_to','2026-10-01','cutoff','2026-09-30',
 'evidence','SINTETICO: tasas 2023-2026, identidad y clasificación revisadas. Sin usar Balance histórico.',
 'identity_confirmed',true,'validity_confirmed',true,'classify_advisory',true,'accounts','{}'::jsonb,
 'brokers',jsonb_build_object('SINTETICO','10000000-0000-0000-0000-000000000001'),'selected',jsonb_agg(n+2))) payload
 from generate_series(1,180) n \gset
set local role authenticated;
set local statement_timeout='8s';
select public.import_master_rates(gen_random_uuid(),'preview',:'payload') preview \gset
select pg_temp.assert_true(:'preview'::jsonb @> '{"ready":180,"quarter_count":16,"classifications":180}','alcance completo');
select jsonb_set(:'payload','{review,revision}',:'preview'::jsonb->'revision') reviewed \gset
\timing on
select public.import_master_rates('cc000000-0000-0000-0000-000000000001','publish',:'reviewed') published \gset
\timing off
select pg_temp.assert_true(:'published'::jsonb->>'published'='2880','180 cuentas ×16, todas publicadas');
select pg_temp.assert_true(public.import_master_rates('cc000000-0000-0000-0000-000000000001','publish',:'reviewed')=:'published'::jsonb,'retry de volumen idempotente');
reset role;
select pg_temp.assert_true((select count(*)=2880 from app_private.roa_rate_versions) and (select count(*)=0 from app_private.commission_events),'tasas completas sin obligaciones de comisiones');
select pg_temp.assert_true((select count(*)=180 from app_private.accounts where service='Advisory'),'clasificaciones completas');
select pg_temp.assert_true((select count(*)=180 from app_private.audit_events where entity_table='accounts' and reason like 'Master %Fee type=Advisory%'),'auditoría conserva cada cambio de servicio');
rollback;
\o
\echo 'OK capacidad Master: 180 cuentas ×16=2.880 tasas, clasificación y auditoría, atomicidad/retry bajo límite local 8s.'
