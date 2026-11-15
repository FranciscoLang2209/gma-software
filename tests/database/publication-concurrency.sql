-- Fixtures exclusivamente sintéticos para competir mediante la API real de publicación.
\o /dev/null
insert into auth.users values('00000000-0000-0000-0000-000000000003');
insert into app_private.user_profiles(id,role,enabled) values('00000000-0000-0000-0000-000000000003','admin',true);
insert into auth.sessions(id,user_id) values('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003');
insert into auth.sessions(id,user_id) values('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000001"}',false);
set role authenticated;
do $$ declare version integer; batch uuid; row_id uuid; begin
 for version in 1..3 loop
  batch:=public.begin_import(('71000000-0000-0000-0000-00000000000'||version)::uuid,'revenue','2026-05-01','10000000-0000-0000-0000-000000000001','SINTETICO.csv',repeat(version::text,64),100,'{}');
  perform public.prepare_import_chunk(batch,0,'{}',jsonb_build_array(jsonb_build_object('sheet_name','SINTETICO','row_number',2,'original_cells',jsonb_build_object('ACCOUNT','RACE-0001','Payout broker',version::text),'cell_metadata',jsonb_build_object('amount',version::text),'status','valid','errors','[]'::jsonb)),jsonb_build_object('rowCount',1,'blockingErrors',0,'total',version::text,'valueCount',1,'errors','[]'::jsonb));
  select id into row_id from public.admin_import_rows where batch_id=batch;
  perform public.manage_import(batch,'resolve',jsonb_build_object('row_id',row_id,'custodian_id','10000000-0000-0000-0000-000000000001','account_id','20000000-0000-0000-0000-000000000001','evidence','SINTETICO competencia'));
  perform public.manage_import(batch,'review','{"complete_scope":true,"custodian_id":"10000000-0000-0000-0000-000000000001","period":"2026-05-01"}');
 end loop;
end $$;
reset role;
