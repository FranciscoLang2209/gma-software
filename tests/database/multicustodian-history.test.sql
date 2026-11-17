-- SOLO DATOS SINTÉTICOS. Dos custodios por mes, ambos tipos de fuente y >120 alcances.
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
create function pg_temp.multi_input(source text,months integer default 2) returns jsonb language sql as $$
 select jsonb_build_object('file_name','SINTETICO-multi.csv','file_hash',repeat('a',64),'file_size',100,
 'options',jsonb_build_object('source',source,'multiCustodian',true,'sheet','CSV','numericFormat','dot','delimiter',',',
   'references',jsonb_build_object('fileName','SINTETICO-REF.csv','fileHash',repeat('b',64),'fileSize',100,'pairs','[]'::jsonb)),
 'manifest',jsonb_build_object('parserVersion',3,'sheet','CSV','excludedRows','[]'::jsonb,'excludedSheets','[]'::jsonb,'blankRows',0,'unroutable','[]'::jsonb,'errors','[]'::jsonb,
  'partitions',(select jsonb_agg(jsonb_build_object('period',('2023-01-01'::date+m*interval '1 month')::date,'custodianId',c.id,'custodianCode',c.code,
    'coordinates',jsonb_build_array(jsonb_build_object('sheet','CSV','row',m*2+c.n+1,'fingerprint',repeat('a',64))),
    'summary',jsonb_build_object('rowCount',1,'blockingErrors',0,'total','0.1','valueCount',1,'errors','[]'::jsonb)))
   from generate_series(0,months-1) m cross join (values('10000000-0000-0000-0000-000000000001','SYN-A',1),('10000000-0000-0000-0000-000000000002','SYN-B',2)) c(id,code,n))))
$$;
create function pg_temp.populate_multi(upload uuid) returns void language plpgsql as $$
declare b record; p jsonb; r uuid; account uuid; original jsonb;
begin
 for b in select * from public.admin_import_batches where upload_id=upload order by period,custodian_id loop
  select value into strict p from public.admin_import_uploads u,jsonb_array_elements(u.manifest->'partitions')
   where u.id=upload and (value->>'period')::date=b.period and (value->>'custodianId')::uuid=b.custodian_id;
  original:=case when b.source='aum' then jsonb_build_object('Holding Account Number','00001','Account Number bd_REV','R00001','Value (USD)','0.1','mes',extract(month from b.period)::text,'año',extract(year from b.period)::text)
    else jsonb_build_object('CUSTODIO',p->>'custodianCode','ACCOUNT','R00001','Payout broker','0.1','MES',extract(month from b.period)::text,'AÑO',extract(year from b.period)::text) end;
  perform public.prepare_import_chunk(b.id,0,b.parsing_conventions->'options',jsonb_build_array(jsonb_build_object(
    'sheet_name','CSV','row_number',(p->'coordinates'->0->>'row')::integer,'original_cells',original,
    'cell_metadata',jsonb_build_object('amount','0.1','period',b.period,'fingerprint',repeat('a',64)),'status','valid','errors','[]'::jsonb)),p->'summary');
  select id into strict r from public.admin_import_rows where batch_id=b.id;
  select account_id into account from public.admin_account_identifiers where source='aum' and namespace='Holding Account Number' and custodian_id=b.custodian_id and value_original='00001';
  perform public.manage_import(b.id,'resolve',jsonb_build_object('row_id',r,'custodian_id',b.custodian_id,'account_id',account,'evidence','Par revisado SINTETICO'));
  perform public.manage_import(b.id,'review',jsonb_build_object('complete_scope',true,'period',b.period,'custodian_id',b.custodian_id,'expected_active_id',(select active_batch_id from public.admin_import_scopes where id=b.scope_id)));
 end loop;
end $$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select gen_random_uuid() as aum \gset
select public.manage_historical(:'aum','begin',pg_temp.multi_input('aum'));
select public.manage_historical(:'aum','begin',pg_temp.multi_input('aum'));
select pg_temp.assert_true((select count(*)=4 and count(distinct custodian_id)=2 from public.admin_import_batches where upload_id=:'aum'),'mismos meses en dos custodios sin duplicar retry');
select pg_temp.populate_multi(:'aum');
select public.manage_historical(:'aum','review','{"confirm_all":true}') as reviewed \gset
select pg_temp.expect_error(format($q$select public.publish_import(id,null) from public.admin_import_batches where upload_id=%L limit 1$q$,:'aum'));
-- Bloqueo por manifiesto obsoleto, nota sin motivo y catálogo falso.
select pg_temp.expect_error($q$select public.manage_historical(gen_random_uuid(),'begin',jsonb_set(pg_temp.multi_input('aum'),'{manifest,partitions,0,custodianCode}','"NO EXISTE"'))$q$);
select pg_temp.expect_error($q$select public.manage_historical(gen_random_uuid(),'begin',jsonb_set(pg_temp.multi_input('aum'),'{manifest,excludedRows}','[{"number":99,"cells":[]}]'))$q$);
reset role;
create function pg_temp.fail_multi() returns trigger language plpgsql as $$ begin
 if new.custodian_id='10000000-0000-0000-0000-000000000002' and current_setting('gma.synthetic_multi_fail',true)='yes' then raise exception 'Synthetic multi rollback'; end if; return new; end $$;
create trigger synthetic_multi_failure after update on app_private.import_scopes for each row execute function pg_temp.fail_multi();
set local gma.synthetic_multi_fail='yes';
set local role authenticated;
select pg_temp.expect_error(format($q$select public.manage_historical(%L,'publish',jsonb_build_object('token',%L::jsonb->'upload'->'review'->>'token'))$q$,:'aum',:'reviewed'));
select pg_temp.assert_true((select count(*)=0 from public.published_metrics()),'fallo entre custodios revierte todos');
reset role;
set local gma.synthetic_multi_fail='no';
set local role authenticated;
select public.manage_historical(:'aum','publish',jsonb_build_object('token',:'reviewed'::jsonb->'upload'->'review'->>'token'));
select public.manage_historical(:'aum','publish',jsonb_build_object('token',:'reviewed'::jsonb->'upload'->'review'->>'token'));
select pg_temp.assert_true((select count(*)=4 and count(distinct account_id)=2 from public.published_metrics()),'mismo número en dos custodios conserva identidades distintas');
select gen_random_uuid() as revenue \gset
select public.manage_historical(:'revenue','begin',pg_temp.multi_input('revenue',65));
select pg_temp.assert_true((select count(*)=130 from public.admin_import_batches where upload_id=:'revenue'),'más de 120 alcances Revenue admitidos');
select pg_temp.populate_multi(:'revenue');
select public.manage_historical(:'revenue','review','{"confirm_all":true}') as revenue_review \gset
select public.manage_historical(:'revenue','publish',jsonb_build_object('token',:'revenue_review'::jsonb->'upload'->'review'->>'token'));
select pg_temp.assert_true((select sum(amount_usd::numeric)=13 from public.published_metrics() where source='revenue'),'Revenue exacto en 130 alcances');
select pg_temp.assert_true((select count(*)=4 from public.published_metrics() where source='aum'),'Revenue no reemplaza AUM');
reset role;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}';
set local role authenticated;
select pg_temp.expect_error($q$select public.manage_historical(gen_random_uuid(),'begin',pg_temp.multi_input('revenue'))$q$,'42501');
select pg_temp.assert_true((select count(*)=0 from public.admin_import_uploads),'lector sin manifiesto o referencias');
reset role;
rollback;
\o
\echo 'OK multi: pares mes/custodio, AUM/Revenue, 130 alcances, retry, rollback conjunto, historia y permisos.'
