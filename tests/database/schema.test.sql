\set ON_ERROR_STOP on
\o /dev/null
begin;
set local search_path = app_private, extensions, public;

create function pg_temp.expect_error(statement text, expected_state text) returns void language plpgsql as $$
begin
  execute statement;
  raise exception 'Expected SQLSTATE % for %', expected_state, statement;
exception when others then
  if sqlstate <> expected_state then raise; end if;
end $$;
create function pg_temp.assert_true(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'Assertion failed: %', message; end if;
end $$;

insert into auth.users values ('00000000-0000-0000-0000-000000000001');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
insert into user_profiles(id,role,enabled) values ('00000000-0000-0000-0000-000000000001','admin',true);
insert into custodians(id,code,name,created_by) values
('10000000-0000-0000-0000-000000000001','SYN-A','Custodio sintético A','00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000002','SYN-B','Custodio sintético B','00000000-0000-0000-0000-000000000001');
insert into accounts(id,custodian_id,created_by) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001');
insert into account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by)
select id,custodian_id,'revenue','ACCOUNT','00123','resolved','Prueba sintética explícita','00000000-0000-0000-0000-000000000001' from accounts;
insert into account_identifiers(source,namespace,value_original,created_by) values
('fa','ACCOUNT','00123','00000000-0000-0000-0000-000000000001'),
('fa','ACCOUNT','00123','00000000-0000-0000-0000-000000000001');
select pg_temp.assert_true((select count(*) = 2 and bool_and(value_normalized = '00123') from account_identifiers where resolution_status='resolved'), 'mismo número en custodios diferentes y ceros conservados');
select pg_temp.expect_error($q$insert into account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by)
select id,custodian_id,'revenue','ACCOUNT','00123','resolved','Duplicado','00000000-0000-0000-0000-000000000001' from accounts limit 1$q$,'23505');
select pg_temp.expect_error($q$update account_identifiers set resolution_status='resolved',account_id='20000000-0000-0000-0000-000000000001',evidence='Ambiguo' where resolution_status='pending'$q$,'23514');

insert into clients(name,created_by) values ('Nombre sintético repetido','00000000-0000-0000-0000-000000000001'),('Nombre sintético repetido','00000000-0000-0000-0000-000000000001');
insert into commercial_advisors(id,name,created_by) values ('30000000-0000-0000-0000-000000000001','Comercial sintético','00000000-0000-0000-0000-000000000001');
insert into commercial_groups(id,name,created_by) values ('40000000-0000-0000-0000-000000000001','Equipo sintético','00000000-0000-0000-0000-000000000001');
insert into account_assignments(account_id,advisor_id,valid_from,valid_to,evidence,created_by) values
('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','2026-01-01','2026-02-01','Sintética','00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','2026-02-01',null,'Sintética','00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($q$insert into account_assignments(account_id,advisor_id,valid_from,valid_to,evidence,created_by) values
('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','2026-01-31','2026-02-02','Solapada','00000000-0000-0000-0000-000000000001')$q$,'23P01');
insert into advisor_group_memberships(advisor_id,group_id,valid_from,valid_to,evidence,created_by) values
('30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','2026-01-01','2026-02-01','Sintética','00000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','2026-02-01',null,'Sintética','00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($q$insert into advisor_group_memberships(advisor_id,group_id,valid_from,evidence,created_by) values
('30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','2026-01-31','Solapada','00000000-0000-0000-0000-000000000001')$q$,'23P01');
select pg_temp.assert_true((select count(*)=1 from account_assignments where valid_during @> '2026-02-01'::date), 'límite adyacente inequívoco');

insert into import_scopes(id,source,period,custodian_id,created_by) values
('50000000-0000-0000-0000-000000000001','aum','2026-01-01','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
('50000000-0000-0000-0000-000000000002','revenue','2026-01-01','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
('50000000-0000-0000-0000-000000000003','aum','2026-01-01','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($q$insert into import_scopes(source,period,custodian_id,created_by) values
('aum','2026-01-02','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001')$q$,'23514');

-- Versiones 1, 2 y 3 preparadas de AUM; la tercera prueba revisión obsoleta.
insert into import_batches(id,scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,file_name_original,file_sha256,file_size_bytes,row_count,status,reviewed_at,reviewed_by,created_by)
select ('60000000-0000-0000-0000-00000000000'||v)::uuid,s.id,s.source,s.period,s.custodian_id,v,gen_random_uuid(),
'synthetic/aum-v'||v||'.xlsx','SINTETICO.xlsx',repeat('a',64),1,1,'ready',now(),'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'
from import_scopes s cross join generate_series(1,3) v where s.source='aum' and s.custodian_id='10000000-0000-0000-0000-000000000001';
insert into import_batches(id,scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,file_name_original,file_sha256,file_size_bytes,row_count,status,reviewed_at,reviewed_by,created_by)
select '60000000-0000-0000-0000-000000000004',s.id,s.source,s.period,s.custodian_id,1,gen_random_uuid(),
'synthetic/revenue.xlsx','SINTETICO.xlsx',repeat('b',64),1,4,'ready',now(),'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'
from import_scopes s where s.source='revenue';
insert into import_batches(id,scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,file_name_original,file_sha256,file_size_bytes,row_count,status,reviewed_at,reviewed_by,created_by)
select '60000000-0000-0000-0000-000000000005',s.id,s.source,s.period,s.custodian_id,1,gen_random_uuid(),
'synthetic/b.xlsx','SINTETICO.xlsx',repeat('c',64),1,1,'ready',now(),'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'
from import_scopes s where s.custodian_id='10000000-0000-0000-0000-000000000002';
insert into import_rows(batch_id,sheet_name,row_number,original_cells,status)
select id,'SINTETICO',1,jsonb_build_object('Value (USD)',case when version=2 then '120' else '100.000000000000000001' end),'valid' from import_batches where source='aum';
insert into aum_monthly(account_id,custodian_id,period,batch_id,import_row_id,value_usd,value_original)
select a.id,b.custodian_id,b.period,b.id,r.id,case when b.version=2 then 120 else 100.000000000000000001 end,
case when b.version=2 then '120' else '100.000000000000000001' end
from import_batches b join import_rows r on r.batch_id=b.id join accounts a on a.custodian_id=b.custodian_id where b.source='aum';
insert into import_rows(batch_id,sheet_name,row_number,original_cells,status)
select '60000000-0000-0000-0000-000000000004','SINTETICO',n,jsonb_build_object('Payout broker',case when n=3 then '-1.1' when n=4 then null else '2' end,'TICKET','001'),'valid' from generate_series(1,4) n;
insert into revenue_entries(account_id,custodian_id,period,batch_id,import_row_id,payout_broker_usd,payout_broker_original,ticket_original)
select '20000000-0000-0000-0000-000000000001',b.custodian_id,b.period,b.id,r.id,
case when r.row_number=3 then -1.1 when r.row_number=4 then null else 2 end,
case when r.row_number=3 then '-1.1' when r.row_number=4 then null else '2' end,'001'
from import_batches b join import_rows r on r.batch_id=b.id where b.source='revenue';
update import_batches b set metric_total_usd=(select sum(value_usd) from aum_monthly where batch_id=b.id), metric_value_count=(select count(value_usd) from aum_monthly where batch_id=b.id) where source='aum';
update import_batches b set metric_total_usd=(select sum(payout_broker_usd) from revenue_entries where batch_id=b.id), metric_value_count=(select count(payout_broker_usd) from revenue_entries where batch_id=b.id) where source='revenue';
select pg_temp.assert_true((select count(*)=4 and sum(payout_broker_usd)=2.9 and count(payout_broker_usd)=3 from revenue_entries),'Revenue repetido, negativo y ausente sin cero');

select pg_temp.expect_error($q$insert into import_rows(batch_id,sheet_name,row_number,original_cells) values ('60000000-0000-0000-0000-000000000001','SINTETICO',99,'{"ACCOUNT":123}')$q$,'23514');
select pg_temp.expect_error($q$update import_rows set row_number=99 where batch_id='60000000-0000-0000-0000-000000000001'$q$,'P0001');
update import_batches set metric_total_usd=999 where id='60000000-0000-0000-0000-000000000002';
select pg_temp.expect_error($q$select publish_import('60000000-0000-0000-0000-000000000002',null,'00000000-0000-0000-0000-000000000001')$q$,'P0001');
select pg_temp.assert_true((select status='ready' and published_at is null from import_batches where id='60000000-0000-0000-0000-000000000002'),'fallo de conciliación es atómico');
update import_batches set metric_total_usd=120 where id='60000000-0000-0000-0000-000000000002';
insert into import_rows(batch_id,sheet_name,row_number,original_cells,status) values ('60000000-0000-0000-0000-000000000001','SINTETICO',2,'{}','valid');
select pg_temp.expect_error($q$insert into aum_monthly(account_id,custodian_id,period,batch_id,import_row_id,value_usd,value_original)
select account_id,custodian_id,period,a.batch_id,r.id,1,'1' from aum_monthly a join import_rows r on r.batch_id=a.batch_id and r.row_number=2 where a.batch_id='60000000-0000-0000-0000-000000000001'$q$,'23505');
select pg_temp.expect_error($q$select publish_import('60000000-0000-0000-0000-000000000001',null,'00000000-0000-0000-0000-000000000001')$q$,'P0001');
-- No se borra historia para corregir el fixture: queda la fila extra en error y se usa otra versión válida.
update import_rows set status='error',errors='["Duplicado sintético"]' where batch_id='60000000-0000-0000-0000-000000000001' and row_number=2;
select pg_temp.assert_true((select count(*)=0 from aum_current),'preparación inválida no publica');
select publish_import('60000000-0000-0000-0000-000000000003',null,'00000000-0000-0000-0000-000000000001');
select publish_import('60000000-0000-0000-0000-000000000003',null,'00000000-0000-0000-0000-000000000001');
select publish_import('60000000-0000-0000-0000-000000000005',null,'00000000-0000-0000-0000-000000000001');
select publish_import('60000000-0000-0000-0000-000000000004',null,'00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($q$select publish_import('60000000-0000-0000-0000-000000000002',null,'00000000-0000-0000-0000-000000000001')$q$,'P0001');
select publish_import('60000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001');
select pg_temp.assert_true((select count(*)=2 and sum(value_usd)=220.000000000000000001 from aum_current),'corrección limitada al custodio, una versión activa y decimal exacto');
select pg_temp.assert_true((select value_usd=100.000000000000000001 from aum_monthly where batch_id='60000000-0000-0000-0000-000000000003'),'historia anterior recuperable');
select pg_temp.expect_error($q$update aum_monthly set value_usd=999 where batch_id='60000000-0000-0000-0000-000000000003'$q$,'P0001');
select pg_temp.expect_error($q$update import_rows set original_cells='{}' where batch_id='60000000-0000-0000-0000-000000000003'$q$,'P0001');
select pg_temp.expect_error($q$delete from import_batches$q$,'P0001');
select pg_temp.expect_error($q$delete from audit_events$q$,'P0001');
select pg_temp.expect_error($q$delete from custodians$q$,'P0001');
select pg_temp.expect_error($q$update import_scopes set active_batch_id=null where active_batch_id is not null$q$,'P0001');
select pg_temp.expect_error($q$update aum_monthly set custodian_id='10000000-0000-0000-0000-000000000002' where batch_id='60000000-0000-0000-0000-000000000001'$q$,'23503');
select pg_temp.expect_error($q$update aum_monthly set period='2026-02-01' where batch_id='60000000-0000-0000-0000-000000000001'$q$,'23503');
select pg_temp.expect_error($q$update aum_monthly set value_usd='NaN' where batch_id='60000000-0000-0000-0000-000000000001'$q$,'23514');
select pg_temp.assert_true((select count(*)=0 from (select account_id,period from aum_current group by account_id,period having count(*)>1) x),'unicidad global AUM vigente');
select pg_temp.assert_true((select count(*)=4 from audit_events where action='publish'),'reintento no repite publicación ni auditoría');

select pg_temp.assert_true((select count(*)=29 from information_schema.columns where table_schema='app_private' and table_name='revenue_entries' and column_name like '%\_original' escape '\'),'29 campos originales de Revenue');
select pg_temp.assert_true(not has_schema_privilege('service_role','app_private','USAGE'),'service_role sin grants implícitos');

-- Agregación separada: el detalle Revenue nunca multiplica el AUM.
with r as (select account_id,period,sum(payout_broker_usd) revenue,count(*) rows,count(payout_broker_usd) present from revenue_current group by account_id,period)
select pg_temp.assert_true((select sum(a.value_usd)=220.000000000000000001 and sum(r.revenue)=2.9 from aum_current a full join r using(account_id,period)),'agregación por fuente antes del join');

select pg_temp.assert_true((select bool_and(relrowsecurity and relforcerowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app_private' and relkind='r'),'RLS habilitado y forzado');
select pg_temp.assert_true(not has_table_privilege('authenticated','app_private.user_profiles','UPDATE') and not has_table_privilege('anon','app_private.import_rows','SELECT'),'sin escritura de roles ni originales anónimos');
select pg_temp.assert_true(not has_function_privilege('authenticated','app_private.publish_import(uuid,uuid,uuid)','EXECUTE'),'publicación no invocable');
select pg_temp.assert_true((select bool_and('security_invoker=true'=any(reloptions)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app_private' and relkind='v'),'vistas con security_invoker');
set local role anon;
do $$ begin
  begin perform * from app_private.aum_current; raise exception 'Anonymous access allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin update app_private.user_profiles set role='admin'; raise exception 'Role escalation allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Incluso ante un GRANT accidental de lectura, RLS sin políticas niega las filas.
grant usage on schema app_private to authenticated;
grant select on all tables in schema app_private to authenticated;
set local role authenticated;
do $$ begin
  if exists(select 1 from app_private.aum_current) or exists(select 1 from app_private.import_rows) then raise exception 'RLS leaked data'; end if;
end $$;
reset role;
rollback;
\o
\echo 'OK: assertions sintéticas de identidad, vigencias, finanzas, versiones, trazabilidad y denegación por rol.'
