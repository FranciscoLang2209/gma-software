-- Sólo datos sintéticos: el par REF acredita la identidad compartida AUM/REV dentro del custodio.
\set ON_ERROR_STOP on
\o /dev/null
begin;
create or replace function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$ begin
 if ok is distinct from true then raise exception 'Assertion failed: %',message; end if; end $$;
create or replace function pg_temp.expect_error(statement text,state text default 'P0001') returns void language plpgsql as $$ begin
 execute statement; raise exception 'Expected error was not raised' using errcode='XX000'; exception when others then if sqlstate<>state then raise; end if; end $$;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into auth.sessions select id,id,null from auth.users;
insert into app_private.user_profiles(id,role,enabled) values ('00000000-0000-0000-0000-000000000001','admin',true),('00000000-0000-0000-0000-000000000002','reader',true);
insert into app_private.custodians(id,code,name,created_by) values
 ('10000000-0000-0000-0000-000000000001','SYN-A','SINTETICO A','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','SYN-B','SINTETICO B','00000000-0000-0000-0000-000000000001');
insert into app_private.accounts(id,custodian_id,created_by) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001');
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by)
 select id,custodian_id,'revenue','ACCOUNT','R0001','resolved','REV SINTETICO acreditado','00000000-0000-0000-0000-000000000001' from app_private.accounts;
create function pg_temp.aum_input() returns jsonb language sql as $$
 select jsonb_build_object('file_name','SINTETICO-AUM.csv','file_hash',repeat('e',64),'file_size',100,
 'options',jsonb_build_object('source','aum','multiCustodian',true,'sheet','CSV','numericFormat','dot','delimiter',',',
  'references',jsonb_build_object('fileName','SINTETICO-REF.csv','fileHash',repeat('f',64),'fileSize',100,'sheet','CSV','headerRow',1,'errors','[]'::jsonb,
   'pairs',(select jsonb_agg(jsonb_build_object('holding','H000'||a,'account','R000'||a,'custodianCode',c.code,'row',c.n*2+a+1) order by c.n,a)
    from (values('SYN-A',0),('SYN-B',1)) c(code,n) cross join generate_series(1,2)a))),
 'manifest',jsonb_build_object('parserVersion',3,'sheet','CSV','excludedRows','[]'::jsonb,'unroutable','[]'::jsonb,'errors','[]'::jsonb,
 'partitions',(select jsonb_agg(jsonb_build_object('period',('2026-01-01'::date+m*interval '1 month')::date,'custodianId',c.id,'custodianCode',c.code,
 'coordinates',(select jsonb_agg(jsonb_build_object('sheet','CSV','row',(m*2+c.n)*2+a+2,'fingerprint',repeat('e',64))) from generate_series(0,1)a),
 'summary',jsonb_build_object('rowCount',2,'blockingErrors',0,'total','1.3','valueCount',2,'errors','[]'::jsonb,'headers','[]'::jsonb)))
 from generate_series(0,1)m cross join (values('10000000-0000-0000-0000-000000000001','SYN-A',0),('10000000-0000-0000-0000-000000000002','SYN-B',1))c(id,code,n))))
$$;
create function pg_temp.prepare_aum(upload uuid,holding_one text default 'H0001') returns void language plpgsql as $$
declare b record; p jsonb;
begin
 for b in select * from public.admin_import_batches where upload_id=upload loop
  select part into strict p from public.admin_import_uploads u,lateral jsonb_array_elements(u.manifest->'partitions')part
   where u.id=upload and (part->>'period')::date=b.period and (part->>'custodianId')::uuid=b.custodian_id;
  perform public.prepare_import_chunk(b.id,0,b.parsing_conventions->'options',
   (select jsonb_agg(jsonb_build_object('sheet_name','CSV','row_number',(c->>'row')::integer,
   'original_cells',jsonb_build_object('Holding Account Number',case when (c->>'row')::int%2=0 then holding_one else 'H0002' end,
    'Account Number bd_REV',case when (c->>'row')::int%2=0 then 'R0001' else 'R0002' end,
    'Value (USD)',case when (c->>'row')::int%2=0 then '0.1' else '1.2' end),
   'cell_metadata',jsonb_build_object('amount',case when (c->>'row')::int%2=0 then '0.1' else '1.2' end,'period',b.period,'fingerprint',repeat('e',64)),
   'status','valid','errors','[]'::jsonb)) from jsonb_array_elements(p->'coordinates')c),p->'summary');
 end loop;
end $$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select gen_random_uuid() upload \gset
select public.manage_historical(:'upload','begin',pg_temp.aum_input());
select pg_temp.prepare_aum(:'upload');
select public.resolve_historical_accounts(:'upload',id,'Pares exactos REF SINTETICOS revisados por custodio') from public.admin_import_batches where upload_id=:'upload';
select public.resolve_historical_accounts(:'upload',id,'Pares exactos REF SINTETICOS revisados por custodio') from public.admin_import_batches where upload_id=:'upload';
select pg_temp.assert_true((select count(*)=4 from public.admin_accounts),'reutiliza los dos UUID de REV y crea sólo dos AUM propios');
select pg_temp.assert_true((select count(*)=8 and bool_and(evidence like '%REF original SHA-256%') from app_private.row_resolutions),'cada fila tiene procedencia REF y retry sin duplicados');
select pg_temp.assert_true((select count(*)=12 from public.admin_account_identifiers),'dos namespaces AUM y el alias REV exacto por cuenta');
select pg_temp.assert_true((select bool_and(account_id in ('20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002')) from public.admin_account_identifiers where source='aum' and namespace='Holding Account Number' and value_original='H0001'),'enlace exacto al UUID de REV existente');
-- Par ambiguo en la segunda fila: revierte también la primera resolución del bloque.
select gen_random_uuid() ambiguous \gset
select public.manage_historical(:'ambiguous','begin',jsonb_set(pg_temp.aum_input(),'{options,references,pairs}',
 (pg_temp.aum_input()->'options'->'references'->'pairs')||'[{"holding":"H0002","account":"R-OTHER","custodianCode":"SYN-A","row":99}]'));
select pg_temp.prepare_aum(:'ambiguous');
select pg_temp.expect_error(format('select public.resolve_historical_accounts(%L,id,''REF SINTETICO ambiguo'') from public.admin_import_batches where upload_id=%L order by period,custodian_id limit 1',:'ambiguous',:'ambiguous'));
select pg_temp.assert_true((select count(*)=0 from app_private.row_resolutions x join public.admin_import_batches b on b.id=x.batch_id where b.upload_id=:'ambiguous'),'rollback del bloque ambiguo');
-- Dos UUID contradictorios: no fusionar ni reemplazar aliases ya acreditados.
reset role;
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by)
 select account_id,custodian_id,'aum','Holding Account Number','H-CONFLICT','resolved','Conflicto SINTETICO','00000000-0000-0000-0000-000000000001'
 from app_private.account_identifiers where source='revenue' and namespace='ACCOUNT' and value_original='R0002' and custodian_id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select gen_random_uuid() conflicting \gset
select public.manage_historical(:'conflicting','begin',jsonb_set(pg_temp.aum_input(),'{options,references,pairs,0,holding}','"H-CONFLICT"'));
select pg_temp.prepare_aum(:'conflicting','H-CONFLICT');
select pg_temp.expect_error(format('select public.resolve_historical_accounts(%L,id,''Conflicto SINTETICO de UUID'') from public.admin_import_batches where upload_id=%L order by period,custodian_id limit 1',:'conflicting',:'conflicting'));
select pg_temp.assert_true((select count(*)=4 from public.admin_accounts),'conflicto no crea cuentas ni fusiona las existentes');
select public.manage_import(id,'review',jsonb_build_object('complete_scope',true,'custodian_id',custodian_id,'period',period,'expected_active_id',null)) from public.admin_import_batches where upload_id=:'upload';
select public.manage_historical(:'upload','review','{"confirm_all":true}') complete_review \gset
select public.manage_historical(:'upload','publish',jsonb_build_object('token',:'complete_review'::jsonb->'upload'->'review'->>'token'));
select pg_temp.assert_true(public.aggregate_report('2026-01-01','2026-02-01')->'total'->>'aum_usd'='2.6','cierre AUM exacto sin sumar meses ni mezclar custodios');
reset role;
select pg_temp.assert_true((select count(*)=0 from app_private.revenue_entries),'no inventa ni altera movimientos REV');
select pg_temp.assert_true((select count(*)=0 from app_private.account_assignments),'no crea asignaciones comerciales');
-- Snapshot REF: operación del operador SQL, sin fingir una sesión de administrador.
create function pg_temp.ref_entries(upload uuid) returns jsonb language sql as $$
 select jsonb_agg(p||jsonb_build_object('client','=CLIENTE SINTETICO','advisor','COMERCIAL REF SINTETICO',
  'team','EQUIPO REF SINTETICO','old_owner','ANTERIOR SINTETICO','group_error',false) order by (p->>'row')::integer)
 from app_private.import_uploads u,lateral jsonb_array_elements(u.options->'references'->'pairs')p where u.id=upload
$$;
select gen_random_uuid() snapshot \gset
select app_private.apply_reference_snapshot(:'snapshot',:'upload',repeat('f',64),pg_temp.ref_entries(:'upload'),'Aplicar snapshot SINTETICO revisado sin vigencias');
select app_private.apply_reference_snapshot(:'snapshot',:'upload',repeat('f',64),pg_temp.ref_entries(:'upload'),'Aplicar snapshot SINTETICO revisado sin vigencias');
select pg_temp.assert_true((select count(*)=1 from app_private.reference_snapshots),'retry idempotente');
select pg_temp.assert_true((select count(*)=4 from app_private.reference_snapshot_rows),'sin fusión por etiquetas iguales ni custodios');
select pg_temp.assert_true((select count(*)=1 from app_private.audit_events where action='publish_reference_snapshot'),'única auditoría de publicación');
select pg_temp.expect_error(format('select app_private.apply_reference_snapshot(gen_random_uuid(),%L,repeat(''f'',64),jsonb_set(pg_temp.ref_entries(%L),''{0,holding}'',''"OTRA"''),''REF SINTETICO conflictivo'',%L)',:'upload',:'upload',:'snapshot'));
select pg_temp.expect_error(format('select app_private.apply_reference_snapshot(gen_random_uuid(),%L,repeat(''f'',64),jsonb_set(pg_temp.ref_entries(%L),''{0,group_error}'',''true''),''REF SINTETICO con error'',%L)',:'upload',:'upload',:'snapshot'));
select pg_temp.assert_true((select count(*)=1 from app_private.reference_snapshots),'error revierte cabecera y filas');
set local role authenticated;
select public.aggregate_report('2026-01-01','2026-02-01') ref_report \gset
select pg_temp.assert_true(:'ref_report'::jsonb->'reference_classification'->>'matched_accounts'='4','referencias por UUID en el universo filtrado');
select pg_temp.assert_true(:'ref_report'::jsonb->'reference_classification'->'groups'->0->>'aum_usd'='2.6','AUM no se multiplica por referencias ni meses');
select pg_temp.assert_true(:'ref_report'::jsonb->'total'->>'aum_usd'='2.6','total financiero conservado');
select pg_temp.assert_true(:'ref_report'::jsonb->'total'->>'aum_accounts_without_advisor'='4','sin atribución histórica inventada');
select pg_temp.assert_true(public.account_directory('2026-01-01','2026-02-01')->'rows'->0->>'ref_advisor'='COMERCIAL REF SINTETICO','directorio muestra snapshot separado');
select pg_temp.assert_true(public.account_directory('2026-01-01','2026-02-01',search_text=>'=CLIENTE SINTETICO')->>'row_count'='4','búsqueda por etiqueta Client REF conserva ambas cuentas/custodios');
select pg_temp.expect_error(format('select app_private.apply_reference_snapshot(%L,%L,repeat(''f'',64),''[]'',''SINTETICO sin permiso'')',:'snapshot',:'upload'),'42501');
reset role;
select gen_random_uuid() snapshot2 \gset
select app_private.apply_reference_snapshot(:'snapshot2',:'upload',repeat('f',64),jsonb_set(pg_temp.ref_entries(:'upload'),'{0,advisor}','"CORRECCION SINTETICA"'),'Corrección SINTETICA revisada sin vigencias',:'snapshot');
select pg_temp.assert_true((select count(*)=2 from app_private.reference_snapshots),'versión anterior recuperable');
select pg_temp.assert_true((select count(*)=4 from app_private.reference_snapshot_rows where snapshot_id=:'snapshot'),'historia inmutable');
set local role authenticated;
select pg_temp.expect_error(format('select public.aggregate_report(''2026-01-01'',''2026-02-01'',expected_revision=>%L)',:'ref_report'::jsonb->>'revision'),'40001');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}';
set local role authenticated;
select pg_temp.expect_error(format('select public.resolve_historical_accounts(%L,gen_random_uuid(),''REF SINTETICO'')',:'upload'),'42501');
reset role;
select pg_temp.assert_true(not has_function_privilege('anon','public.resolve_historical_accounts(uuid,uuid,text)','EXECUTE'),'anon sin acceso al helper');
rollback;
\o
\echo 'OK AUM+REF: UUID de REV reutilizado, cuentas propias, ceros/custodios, aliases explícitos, conflictos/rollback, procedencia, roles y cierre mensual.'
