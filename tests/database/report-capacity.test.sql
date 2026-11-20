-- SINTÉTICO: 800 cuentas × 33 meses (incluye el mes previo), sin datos remotos.
\ir query-fixture.sql
insert into app_private.accounts(id,custodian_id,service,created_by)
 select ('21000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,
 '10000000-0000-0000-0000-000000000001','SINTETICO capacidad',auth.uid()
 from generate_series(1,800) i;
do $$ declare src text; scope uuid; batch uuid; begin
 foreach src in array array['aum','revenue'] loop
  insert into app_private.import_scopes(source,period,custodian_id,created_by)
   values(src,'2026-08-01','10000000-0000-0000-0000-000000000001',auth.uid()) returning id into scope;
  insert into app_private.import_batches(scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,
   file_name_original,file_sha256,file_size_bytes,row_count,metric_total_usd,metric_value_count,status,reviewed_at,reviewed_by,created_by)
   values(scope,src,'2026-08-01','10000000-0000-0000-0000-000000000001',1,gen_random_uuid(),'synthetic/capacity.csv',
   'SINTETICO.csv',repeat('b',64),1,800,case src when 'aum' then 80000 else 800 end,800,'ready',now(),auth.uid(),auth.uid()) returning id into batch;
  insert into app_private.import_rows(batch_id,sheet_name,row_number,original_cells,status)
   select batch,'SINTETICO',i,'{}','valid' from generate_series(1,800) i;
  if src='aum' then
   insert into app_private.aum_monthly(account_id,custodian_id,period,batch_id,import_row_id,value_usd,value_original)
    select ('21000000-0000-0000-0000-'||lpad(row_number::text,12,'0'))::uuid,
    '10000000-0000-0000-0000-000000000001','2026-08-01',batch,id,100,'100'
    from app_private.import_rows where batch_id=batch;
  else
   insert into app_private.revenue_entries(account_id,custodian_id,period,batch_id,import_row_id,payout_broker_usd,payout_broker_original)
    select ('21000000-0000-0000-0000-'||lpad(row_number::text,12,'0'))::uuid,
    '10000000-0000-0000-0000-000000000001','2026-08-01',batch,id,1,'1'
    from app_private.import_rows where batch_id=batch;
  end if;
  perform public.publish_import(batch,null);
 end loop;
end $$;
-- Comparar la proyección completa con el algoritmo anterior; sólo cambia el token opaco.
do $$ declare definition text; begin
 select pg_get_functiondef('app_private.aggregate_report(date,date,uuid,uuid,uuid,uuid,uuid,text,text,integer,integer,text)'::regprocedure) into definition;
 perform pg_temp.assert_true(position('md5(string_agg(md5(to_jsonb(f)::text)' in definition)>0,'huella acotada por fila');
 definition:=replace(definition,'app_private.aggregate_report(', 'pg_temp.previous_report(');
 definition:=replace(definition,'md5(string_agg(md5(to_jsonb(f)::text),'''' order by period,account_id))','jsonb_agg(to_jsonb(f) order by period,account_id)');
 execute definition;
end $$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
select public.aggregate_report('2024-01-01','2026-08-01',service_filter=>'SINTETICO capacidad',group_by=>'custodian') report \gset
select pg_temp.assert_true(:'report'::jsonb->'total' @> '{"aum_usd":"80000","revenue_usd":"800","accounts_with_aum":800}', '32 meses conserva cierre y Revenue exactos');
select pg_temp.assert_true(jsonb_array_length(:'report'::jsonb->'months')=32,'serie completa enero 2024–agosto 2026');
select pg_temp.assert_true(:'report'::jsonb->'months'->0->>'aum_usd' is null,'no inventa saldos en meses ausentes');
select pg_temp.assert_true(:'report'::jsonb-'revision'=pg_temp.previous_report('2024-01-01','2026-08-01',service_filter=>'SINTETICO capacidad',group_by=>'custodian')-'revision','misma proyección que antes de optimizar');
select public.aggregate_report('2024-01-01','2026-08-01',service_filter=>'SINTETICO capacidad',page_size=>1) first_page \gset
select pg_temp.assert_true(public.aggregate_report('2024-01-01','2026-08-01',service_filter=>'SINTETICO capacidad',page_size=>1,page_offset=>799,expected_revision=>:'first_page'::jsonb->>'revision')->>'revision'=:'first_page'::jsonb->>'revision','huella estable entre páginas distantes');
reset role;
rollback;
\o
\echo 'OK: 800 cuentas y 32 meses, proyección equivalente y revisión estable.'
