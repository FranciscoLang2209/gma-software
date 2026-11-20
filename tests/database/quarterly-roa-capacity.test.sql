-- SINTÉTICO: 800 cuentas × 3 meses completos, hasta 250 filas por página.
\ir query-fixture.sql
insert into app_private.accounts(id,custodian_id,service,created_by)
 select ('21000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,
 '10000000-0000-0000-0000-000000000001','Brokerage',auth.uid() from generate_series(1,800) i;
do $$ declare src text; m date; scope uuid; batch uuid; begin
 for m in select d::date from generate_series(date '2024-01-01',date '2024-03-01',interval '1 month') d loop
  foreach src in array array['aum','revenue'] loop
   insert into app_private.import_scopes(source,period,custodian_id,created_by)
    values(src,m,'10000000-0000-0000-0000-000000000001',auth.uid()) returning id into scope;
   insert into app_private.import_batches(scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,
    file_name_original,file_sha256,file_size_bytes,row_count,metric_total_usd,metric_value_count,status,reviewed_at,reviewed_by,created_by)
    values(scope,src,m,'10000000-0000-0000-0000-000000000001',1,gen_random_uuid(),'synthetic/roa.csv',
    'SINTETICO.csv',repeat('b',64),1,800,case src when 'aum' then 80000000 else 80000 end,800,'ready',now(),auth.uid(),auth.uid()) returning id into batch;
   insert into app_private.import_rows(batch_id,sheet_name,row_number,original_cells,status)
    select batch,'SINTETICO',i,'{}','valid' from generate_series(1,800) i;
   if src='aum' then
    insert into app_private.aum_monthly(account_id,custodian_id,period,batch_id,import_row_id,value_usd,value_original)
     select ('21000000-0000-0000-0000-'||lpad(row_number::text,12,'0'))::uuid,
     '10000000-0000-0000-0000-000000000001',m,batch,id,100000,'100000' from app_private.import_rows where batch_id=batch;
   else
    insert into app_private.revenue_entries(account_id,custodian_id,period,batch_id,import_row_id,payout_broker_usd,payout_broker_original)
     select ('21000000-0000-0000-0000-'||lpad(row_number::text,12,'0'))::uuid,
     '10000000-0000-0000-0000-000000000001',m,batch,id,100,'100' from app_private.import_rows where batch_id=batch;
   end if;
   perform public.publish_import(batch,null);
  end loop;
 end loop;
end $$;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
set local statement_timeout='8s';
\o
\timing on
select public.quarterly_roa_report(2024,1,service_filter=>'Brokerage',page_size=>250) report \gset
\timing off
\o /dev/null
select pg_temp.assert_true(:'report'::jsonb->>'row_count'='800' and jsonb_array_length(:'report'::jsonb->'rows')=250,'800 cuentas y paginación acotada');
select pg_temp.assert_true((:'report'::jsonb->'total'->>'aum_average_usd')::numeric=80000000 and
 (:'report'::jsonb->'total'->>'revenue_quarter_usd')::numeric=240000 and
 (:'report'::jsonb->'total'->>'roa_percent')::numeric=1.2,'ROA global sin truncar al tamaño de página');
select pg_temp.assert_true(public.quarterly_roa_report(2024,1,service_filter=>'Brokerage',page_size=>250,page_offset=>750,expected_revision=>:'report'::jsonb->>'revision')->'total'=:'report'::jsonb->'total','primera/última página concilian');
reset role;
rollback;
\o
\echo 'OK capacidad ROA: 800 cuentas, 3 meses, páginas/revisión, ratio global exacto bajo timeout local 8s.'
