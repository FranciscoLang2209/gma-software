-- Fixture SINTÉTICO común de consultas y recorrido de navegador; solo clúster temporal.
\set ON_ERROR_STOP on
\o /dev/null
begin;
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$ begin
 if ok is distinct from true then raise exception 'Assertion failed: %',message; end if; end $$;
create function pg_temp.expect_error(statement text,state text) returns void language plpgsql as $$ begin
 execute statement; raise exception 'Expected error'; exception when others then if sqlstate<>state then raise; end if; end $$;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into auth.sessions select id,id,null from auth.users;
insert into app_private.user_profiles(id,role,enabled) values ('00000000-0000-0000-0000-000000000001','admin',true),('00000000-0000-0000-0000-000000000002','reader',true);
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
insert into app_private.custodians(id,code,name,created_by) select ('10000000-0000-0000-0000-00000000000'||i)::uuid,'SYN'||i,'Custodio SINTETICO '||i,auth.uid() from generate_series(1,2) i;
insert into app_private.clients(id,name,created_by) values ('40000000-0000-0000-0000-000000000001','Cliente SINTETICO',auth.uid());
insert into app_private.accounts(id,custodian_id,client_id,service,created_by)
 select ('20000000-0000-0000-0000-00000000000'||i)::uuid,('10000000-0000-0000-0000-00000000000'||case when i=7 then 2 else 1 end)::uuid,
 case when i in (1,2) then '40000000-0000-0000-0000-000000000001'::uuid end,
 case when i=1 then 'Servicio SINTETICO' else 'sin_clasificar' end,auth.uid() from generate_series(1,7) i;
insert into app_private.commercial_advisors(id,name,created_by) values ('30000000-0000-0000-0000-000000000001','Comercial SINTETICO',auth.uid());
insert into app_private.commercial_groups(id,name,created_by)
 select ('50000000-0000-0000-0000-00000000000'||i)::uuid,'Equipo SINTETICO '||i,auth.uid() from generate_series(1,2) i;
insert into app_private.advisor_group_memberships(advisor_id,group_id,valid_from,valid_to,evidence,created_by) values
 ('30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','2026-01-01','2026-02-15','SINTETICO',auth.uid()),
 ('30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','2026-02-15','2026-03-01','SINTETICO',auth.uid());
insert into app_private.account_assignments(account_id,advisor_id,valid_from,valid_to,evidence,created_by) values
 ('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','2026-01-01','2026-03-01','SINTETICO',auth.uid());
-- Fixture interno: carga hechos mínimos y publica con las restricciones y permisos existentes.
create function pg_temp.seed(src text,month date,cust integer,entries jsonb,activate boolean default true) returns uuid language plpgsql as $$
declare scope uuid; batch uuid; total numeric; vals integer; v jsonb; n integer:=0; rid uuid; aid uuid; previous uuid; begin
 select sum((x->>1)::numeric),count(x->>1) into total,vals from jsonb_array_elements(entries) x;
 select id,active_batch_id into scope,previous from app_private.import_scopes where source=src and period=month and custodian_id=('10000000-0000-0000-0000-00000000000'||cust)::uuid;
 if scope is null then
  insert into app_private.import_scopes(source,period,custodian_id,created_by) values(src,month,('10000000-0000-0000-0000-00000000000'||cust)::uuid,auth.uid()) returning id into scope;
 end if;
 insert into app_private.import_batches(scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,file_name_original,file_sha256,file_size_bytes,row_count,metric_total_usd,metric_value_count,status,reviewed_at,reviewed_by,created_by)
 select scope,src,month,('10000000-0000-0000-0000-00000000000'||cust)::uuid,coalesce(max(version),0)+1,gen_random_uuid(),'synthetic/query.csv','SINTETICO.csv',repeat('a',64),1,jsonb_array_length(entries),total,vals,'ready',now(),auth.uid(),auth.uid()
 from app_private.import_batches where scope_id=scope returning id into batch;
 for v in select * from jsonb_array_elements(entries) loop
  n:=n+1; aid:=('20000000-0000-0000-0000-00000000000'||(v->>0))::uuid;
  insert into app_private.import_rows(batch_id,sheet_name,row_number,original_cells,status) values(batch,'SINTETICO',n,'{"PRIVADO":"SECRETO SINTETICO"}','valid') returning id into rid;
  if src='aum' then
   insert into app_private.aum_monthly(account_id,custodian_id,period,batch_id,import_row_id,value_usd,value_original)
    values(aid,('10000000-0000-0000-0000-00000000000'||cust)::uuid,month,batch,rid,(v->>1)::numeric,v->>1);
  elsif src='fa' then
   insert into app_private.fa_rows(batch_id,import_row_id,account_id,advisor_id,valid_from,valid_to,commercial_column)
    values(batch,rid,aid,'30000000-0000-0000-0000-000000000001','2026-01-15','2026-02-01','Broker');
  else
   insert into app_private.revenue_entries(account_id,custodian_id,period,batch_id,import_row_id,payout_broker_usd,payout_broker_original)
    values(aid,('10000000-0000-0000-0000-00000000000'||cust)::uuid,month,batch,rid,(v->>1)::numeric,v->>1);
  end if;
 end loop;
 if activate then perform public.publish_import(batch,previous); end if;
 return batch;
end $$;
select pg_temp.seed('aum','2026-01-01',1,'[[1,"100"],[2,"50"],[4,"-20"],[5,null],[6,"0"]]');
select pg_temp.seed('revenue','2026-01-01',1,'[[1,"2"],[1,"3"],[1,"5"],[3,"7"],[4,"-2"],[5,null],[6,"0"]]');
select pg_temp.seed('aum','2026-02-01',1,'[[1,"120"],[4,"-10"],[5,null],[6,"0"]]');
select pg_temp.seed('revenue','2026-02-01',1,'[[1,"12"],[3,"8"],[4,"-1"],[5,null],[6,"0"]]');
select pg_temp.seed('aum','2026-02-01',2,'[[7,"9"]]');
select pg_temp.seed('revenue','2026-02-01',2,'[[7,"4"]]');
select pg_temp.seed('fa','2026-01-01',1,'[[2,null]]');
select pg_temp.seed('aum','2026-05-01',1,'[[1,"100.123456789123456789"]]');
select pg_temp.seed('revenue','2026-05-01',1,'[[1,"0.1"],[1,"0.1"],[1,"-0.05"]]');
-- Reemplazo y candidato no activo no se suman.
select pg_temp.seed('revenue','2026-02-01',1,'[[1,"12"],[3,"8"],[4,"-1"],[5,null],[6,"0"]]');
select pg_temp.seed('revenue','2026-02-01',1,'[[1,"999"]]',false);
-- Muchos aliases de la misma cuenta no cambian el grano.
insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,created_by)
 select '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','aum','SINTETICO','000'||i,'resolved','SINTETICO',auth.uid() from generate_series(1,3) i;
