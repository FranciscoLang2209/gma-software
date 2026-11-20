-- SOLO SINTÉTICO: volumen de manifiesto comparable a los archivos, con el presupuesto real de 8 s.
\set ON_ERROR_STOP on
\o /dev/null
begin;
insert into auth.users values ('00000000-0000-0000-0000-000000000001');
insert into auth.sessions values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',null);
insert into app_private.user_profiles(id,role,enabled) values ('00000000-0000-0000-0000-000000000001','admin',true);
insert into app_private.custodians(id,code,name,created_by) values
 ('10000000-0000-0000-0000-000000000001','SYN-A','SINTETICO A','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','SYN-B','SINTETICO B','00000000-0000-0000-0000-000000000001');
create function pg_temp.capacity_input() returns jsonb language sql as $$
 select jsonb_build_object('file_name','SINTETICO-capacidad.csv','file_hash',repeat('c',64),'file_size',100,
 'options',jsonb_build_object('source','revenue','multiCustodian',true,'sheet','CSV','numericFormat','dot','delimiter',','),
 'manifest',jsonb_build_object('parserVersion',3,'sheet','CSV','excludedRows','[]'::jsonb,'excludedSheets','[]'::jsonb,'blankRows',0,'unroutable','[]'::jsonb,'errors','[]'::jsonb,
 'partitions',(select jsonb_agg(jsonb_build_object('period',('2020-01-01'::date+m*interval '1 month')::date,'custodianId',c.id,'custodianCode',c.code,
 'coordinates',(select jsonb_agg(jsonb_build_object('sheet','CSV','row',(m*2+c.n)*80+a+2,'fingerprint',md5(((m*2+c.n)*80+a+2)::text)||md5('SINTETICO-'||((m*2+c.n)*80+a+2)::text))) from generate_series(0,79) a),
 'summary',jsonb_build_object('rowCount',80,'blockingErrors',0,'total','8','valueCount',80,'errors','[]'::jsonb,'headers','[]'::jsonb,'syntheticPadding',repeat('SINTETICO ',50))))
 from generate_series(0,112) m cross join (values('10000000-0000-0000-0000-000000000001','SYN-A',0),('10000000-0000-0000-0000-000000000002','SYN-B',1)) c(id,code,n))))
$$;
select pg_temp.capacity_input() payload \gset
select gen_random_uuid() upload \gset
-- La regresión no depende de la velocidad del equipo: el padre no debe recalcular cada hijo.
select pg_get_functiondef('app_private.import_comparison(uuid)'::regprocedure) original_comparison \gset
create or replace function app_private.import_comparison(target_id uuid) returns jsonb
language plpgsql stable security invoker set search_path='' as $$ begin
 raise exception 'Heavy comparison must not run while registering or inspecting the parent';
end $$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
set local statement_timeout='8s';
\timing on
select public.manage_historical(:'upload','begin',:'payload');
select public.manage_historical(:'upload','begin',:'payload');
select public.manage_historical(:'upload','inspect','{}');
\timing off
reset role;
select :'original_comparison' \gexec
set local role authenticated;
-- Primer bloque de tamaño máximo de un alcance; su guard no recorre todo el JSON por fila.
select id child from public.admin_import_batches where upload_id=:'upload' order by period,custodian_id limit 1 \gset
select public.prepare_import_chunk(:'child',0,b.parsing_conventions->'options',
 (select jsonb_agg(jsonb_build_object('sheet_name','CSV','row_number',a+2,
  'original_cells',jsonb_build_object('CUSTODIO','SYN-A','MES','1','AÑO','2020','ACCOUNT','SYN-REPEATED','Payout broker','0.1'),
  'cell_metadata',jsonb_build_object('amount','0.1','period',b.period,'fingerprint',md5((a+2)::text)||md5('SINTETICO-'||(a+2)::text)),
  'status','valid','errors','[]'::jsonb)) from generate_series(0,79) a),
 jsonb_build_object('rowCount',80,'blockingErrors',0,'total','8','valueCount',80,'errors','[]'::jsonb,'headers','[]'::jsonb,'syntheticPadding',repeat('SINTETICO ',50)))
 from public.admin_import_batches b where b.id=:'child';
-- Completar todos los alcances: el fallo real aparecía recién después de 7.889 filas.
-- Cada comando conserva su presupuesto de 8 s, como una petición de preparación.
select format('select public.prepare_import_chunk(%L,0,%L,%L,%L);',b.id,b.parsing_conventions->'options',
 (select jsonb_agg(jsonb_build_object('sheet_name',c->>'sheet','row_number',(c->>'row')::integer,
  'original_cells',jsonb_build_object('CUSTODIO',p->>'custodianCode','ACCOUNT','SYN-REPEATED','Payout broker','0.1'),
  'cell_metadata',jsonb_build_object('amount','0.1','period',b.period,'fingerprint',c->>'fingerprint'),
  'status','valid','errors','[]'::jsonb)) from jsonb_array_elements(p->'coordinates') c),p->'summary')
 from public.admin_import_batches b join public.admin_import_uploads u on u.id=b.upload_id,
 lateral jsonb_array_elements(u.manifest->'partitions') p
 where u.id=:'upload' and b.id<>:'child' and (p->>'period')::date=b.period and (p->>'custodianId')::uuid=b.custodian_id
 order by b.period,b.custodian_id
\gexec
-- Reintentar el último bloque no añade filas ni altera el cursor.
select public.prepare_import_chunk(id,0,parsing_conventions->'options','[]','{}') from public.admin_import_batches
 where upload_id=:'upload' order by period desc,custodian_id desc limit 1;
reset role;
do $$ begin
 assert (select count(*)=1 from app_private.import_uploads);
 assert (select count(*)=226 from app_private.import_batches);
 assert (select count(*)=18080 from app_private.import_rows);
 assert (select sum((cell_metadata->>'amount')::numeric)=1808 from app_private.import_rows);
 assert (select bool_and(status='needs_resolution' and (totals->>'processed')::integer=80) from app_private.import_batches);
 assert (select count(*)=0 from app_private.import_scopes where active_batch_id is not null);
end $$;
-- Fixture ya acreditado de dos identidades REV; el helper por bloques tiene su prueba propia.
insert into app_private.accounts(id,custodian_id,created_by) select
 case when code='SYN-A' then '20000000-0000-0000-0000-000000000001'::uuid else '20000000-0000-0000-0000-000000000002'::uuid end,
 id,'00000000-0000-0000-0000-000000000001' from app_private.custodians;
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by)
 select id,custodian_id,'revenue','ACCOUNT','SYN-REPEATED','resolved','Identidad SINTETICA exacta por custodio','00000000-0000-0000-0000-000000000001' from app_private.accounts;
insert into app_private.row_resolutions(batch_id,source_row_id,account_id,custodian_id,evidence,created_by)
 select r.batch_id,r.id,a.id,b.custodian_id,'Identidad SINTETICA exacta por custodio','00000000-0000-0000-0000-000000000001'
 from app_private.import_rows r join app_private.import_batches b on b.id=r.batch_id join app_private.accounts a on a.custodian_id=b.custodian_id;
set local role authenticated;
select format('select public.manage_import(%L,''review'',%L);',id,
 jsonb_build_object('complete_scope',true,'custodian_id',custodian_id,'period',period,'expected_active_id',null))
 from public.admin_import_batches where upload_id=:'upload' order by period,custodian_id
\gexec
\timing on
select public.manage_historical(:'upload','review','{"confirm_all":true}') complete_review \gset
select public.manage_historical(:'upload','publish',jsonb_build_object('token',:'complete_review'::jsonb->'upload'->'review'->>'token'));
select public.manage_historical(:'upload','publish',jsonb_build_object('token',:'complete_review'::jsonb->'upload'->'review'->>'token'));
\timing off
reset role;
do $$ begin
 assert (select count(*)=226 from app_private.import_scopes where active_batch_id is not null);
 assert (select count(*)=18080 and sum(payout_broker_usd)=1808 from app_private.revenue_current);
 assert (select count(*)=226 from app_private.audit_events where action='publish');
end $$;
rollback;
\o
\echo 'OK capacidad SQL: 18.080 filas / 226 alcances, preparación, conciliación y publicación sintética atómica/retry bajo 8 s por petición.'
