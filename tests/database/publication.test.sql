\set ON_ERROR_STOP on
\o /dev/null
begin;
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$ begin
 if ok is distinct from true then raise exception 'Assertion failed: %',message; end if; end $$;
create function pg_temp.expect_error(statement text,state text default 'P0001') returns void language plpgsql as $$ begin
 execute statement; raise exception 'Expected error'; exception when others then if sqlstate<>state then raise; end if; end $$;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into auth.sessions select id,id,null from auth.users;
insert into app_private.user_profiles(id,role,enabled) values ('00000000-0000-0000-0000-000000000001','admin',true),('00000000-0000-0000-0000-000000000002','reader',true);
insert into app_private.custodians(id,code,name,created_by) values
 ('10000000-0000-0000-0000-000000000001','SYN-A','SINTETICO A','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','SYN-B','SINTETICO B','00000000-0000-0000-0000-000000000001');
create function pg_temp.new_batch(src text, cust uuid, month date, cells jsonb, total text, hash text default repeat('a',64)) returns uuid language plpgsql as $$
declare id uuid; rows jsonb; begin
 id:=public.begin_import(gen_random_uuid(),src,month,cust,'SINTETICO.csv',hash,100,'{}');
 select jsonb_agg(jsonb_build_object('sheet_name','SINTETICO','row_number',n+1,'original_cells',v->'cells',
  'cell_metadata',jsonb_build_object('amount',v->>'amount'),'status','valid','errors','[]'::jsonb)) into rows from jsonb_array_elements(cells) with ordinality as x(v,n);
 perform public.prepare_import_chunk(id,0,'{}',coalesce(rows,'[]'),jsonb_build_object('rowCount',jsonb_array_length(cells),'blockingErrors',0,'total',total,'valueCount',case when src='fa' then 0 else jsonb_array_length(cells) end,'errors','[]'::jsonb));
 return id; end $$;
create function pg_temp.resolve_all(batch uuid,account uuid default null,advisor uuid default null) returns uuid language plpgsql as $$
declare row_id uuid; cust uuid; begin
 select custodian_id into cust from public.admin_import_batches where id=batch;
 for row_id in select id from public.admin_import_rows where batch_id=batch order by row_number loop
  account:=(public.manage_import(batch,'resolve',jsonb_build_object('row_id',row_id,'custodian_id',cust,'account_id',account,'advisor_id',advisor,'evidence','EVIDENCIA SINTETICA EXPLICITA'))->>'account_id')::uuid;
 end loop;
 return account; end $$;
create function pg_temp.review_batch(batch uuid, expected uuid default null,fa jsonb default '{}') returns jsonb language plpgsql as $$
declare input jsonb; begin
 select jsonb_build_object('complete_scope',true,'period',period,'custodian_id',custodian_id,'expected_active_id',expected)||fa into input from public.admin_import_batches where id=batch;
 return public.manage_import(batch,'review',input); end $$;
create function pg_temp.publish_batch(batch uuid) returns jsonb language sql as $$
 select public.manage_import(batch,'publish',jsonb_build_object('token',review->>'token')) from public.admin_import_batches where id=batch $$;
set local role anon;
select pg_temp.expect_error($q$select public.manage_import(null,'inspect','{}')$q$,'42501');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;
select pg_temp.new_batch('revenue','10000000-0000-0000-0000-000000000001','2026-01-01',
 '[{"cells":{"ACCOUNT":"00077","Payout broker":"0.1","Owner Name payout":"PRIVADO"},"amount":"0.1"},{"cells":{"ACCOUNT":"00077","Payout broker":"0.1","Owner Name payout":"PRIVADO"},"amount":"0.1"},{"cells":{"ACCOUNT":"00077","Payout broker":"-0.05"},"amount":"-0.05"}]','0.15') as b1 \gset
select pg_temp.expect_error(format('select pg_temp.review_batch(%L)',:'b1'));
select id as first_row from public.admin_import_rows where batch_id=:'b1' order by row_number limit 1 \gset
select pg_temp.expect_error(format($q$select public.manage_import(%L,'resolve',jsonb_build_object('row_id',%L,'evidence','SIN CUSTODIO'))$q$,:'b1',:'first_row'));
select pg_temp.resolve_all(:'b1') as account \gset
select pg_temp.resolve_all(:'b1',:'account');
select pg_temp.assert_true((select count(*)=1 from public.admin_accounts),'retry de resolución no crea cuenta duplicada');
select pg_temp.assert_true((public.manage_import(:'b1','inspect','{}')->'rows'->0->'cells'->>'ACCOUNT')='00077','original y ceros visibles');
select pg_temp.expect_error(format($q$select public.manage_import(%L,'review','{"complete_scope":false}')$q$,:'b1'));
select pg_temp.review_batch(:'b1');
select pg_temp.assert_true((select count(*)=3 and sum(payout_broker_usd)=0.15 from public.admin_revenue_entries where batch_id=:'b1'),'Revenue idéntico y ajuste negativo conservados');
select pg_temp.assert_true((public.manage_import(:'b1','inspect','{}')->'comparison'->'candidate'->>'unassigned_total')='0.15','sin asignación conserva total exacto');
select pg_temp.assert_true((public.manage_import(:'b1','inspect','{}')->'comparison'->'candidate'->>'unassigned_accounts')='1','cobertura sin duplicar cuentas');
select pg_temp.expect_error(format('select pg_temp.resolve_all(%L,%L)',:'b1',:'account'));
select pg_temp.expect_error(format($q$update public.admin_import_batches set preparation_only=false where id=%L$q$,:'b1'),'42501');
select pg_temp.expect_error(format($q$select public.manage_import(%L,'publish','{"token":"00000000-0000-0000-0000-000000000099"}')$q$,:'b1'));
reset role;
-- Fallo después de actualizar estado y puntero: toda la publicación revierte.
create function pg_temp.fail_publication() returns trigger language plpgsql as $$ begin
 if current_setting('app_papa.synthetic_fail',true)='yes' then raise exception 'Synthetic publication failure'; end if; return new; end $$;
create trigger synthetic_fail after update on app_private.import_scopes for each row execute function pg_temp.fail_publication();
select set_config('app_papa.synthetic_fail','yes',true);
set local role authenticated;
select pg_temp.expect_error(format('select pg_temp.publish_batch(%L)',:'b1'));
select pg_temp.assert_true((select status='ready' from public.admin_import_batches where id=:'b1'),'fallo conserva ready');
select pg_temp.assert_true((select count(*)=0 from public.published_metrics()),'fallo no filtra publicados');
reset role;
select pg_temp.assert_true((select count(*)=0 from app_private.audit_events where action='publish'),'fallo revierte auditoría parcial');
select set_config('app_papa.synthetic_fail','no',true);
set local role authenticated;
select pg_temp.publish_batch(:'b1');
select pg_temp.publish_batch(:'b1');
select pg_temp.assert_true((select total_usd='0.15' and row_count=3 from public.published_totals()),'doble clic y retry no duplican');
reset role;
select pg_temp.assert_true((select count(*)=1 from app_private.audit_events where action='publish'),'auditoría una vez');
set local role authenticated;
-- Mismo archivo, distinto request: otra versión, nunca otro alcance activo solapado.
select pg_temp.new_batch('revenue','10000000-0000-0000-0000-000000000001','2026-01-01',
 '[{"cells":{"ACCOUNT":"00077","Payout broker":"0.1","Owner Name payout":"PRIVADO"},"amount":"0.1"},{"cells":{"ACCOUNT":"00077","Payout broker":"0.1","Owner Name payout":"PRIVADO"},"amount":"0.1"},{"cells":{"ACCOUNT":"00077","Payout broker":"-0.05"},"amount":"-0.05"}]','0.15') as b2 \gset
select pg_temp.resolve_all(:'b2',:'account');
select pg_temp.review_batch(:'b2',:'b1');
select pg_temp.assert_true((public.manage_import(:'b2','inspect','{}')->'comparison'->>'same_file')='true','hash repetido visible');
select pg_temp.assert_true((public.manage_import(:'b2','inspect','{}')->'comparison'->'row_changes')='{"added":0,"removed":0}'::jsonb,'comparación multiset conserva repeticiones');
select pg_temp.publish_batch(:'b2');
select pg_temp.assert_true((public.manage_import(:'b1','inspect','{}')->'batch'->>'status')='superseded','anterior reemplazada visible');
select pg_temp.expect_error(format('select pg_temp.publish_batch(%L)',:'b1'));
-- Custodio ajeno con ACCOUNT idéntico permanece separado.
select pg_temp.new_batch('revenue','10000000-0000-0000-0000-000000000002','2026-01-01','[{"cells":{"ACCOUNT":"00077","Payout broker":"9"},"amount":"9"}]','9') as other \gset
select pg_temp.resolve_all(:'other') as other_account \gset
select pg_temp.assert_true(:'other_account'<>:'account','custodios diferentes nunca se fusionan por número');
select pg_temp.review_batch(:'other'); select pg_temp.publish_batch(:'other');
select pg_temp.new_batch('revenue','10000000-0000-0000-0000-000000000001','2026-01-01','[{"cells":{"ACCOUNT":"00077","Payout broker":"2"},"amount":"2"}]','2',repeat('b',64)) as correction \gset
select pg_temp.resolve_all(:'correction',:'account'); select pg_temp.review_batch(:'correction',:'b2');
select pg_temp.assert_true((public.manage_import(:'correction','inspect','{}')->'comparison'->'active'->>'total')='0.15','comparación anterior exacta');
select pg_temp.publish_batch(:'correction');
select pg_temp.assert_true((select total_usd='11' and row_count=2 from public.published_totals()),'corrección solo reemplaza custodio revisado');
select pg_temp.assert_true((select count(*)=8 from public.admin_revenue_entries),'versiones anteriores conservadas');
-- Cuenta con alias ya acreditado no se redirige a otra UUID.
select pg_temp.new_batch('revenue','10000000-0000-0000-0000-000000000001','2026-02-01','[{"cells":{"ACCOUNT":"00077","Payout broker":"1"},"amount":"1"}]','999') as bad_total \gset
select pg_temp.resolve_all(:'bad_total',:'account');
select pg_temp.expect_error(format('select pg_temp.review_batch(%L)',:'bad_total'));
select pg_temp.assert_true((select count(*)=0 from public.admin_revenue_entries where batch_id=:'bad_total'),'conciliación fallida revierte hechos candidatos');
-- Las 29 columnas se materializan por header/posición, aun con el orden invertido.
do $$ declare batch uuid; cols text[]:=array['CUSTODIO','MES','AÑO','ACCOUNT','NAME','Advisor Name','ADV NAME SEC','Rel. 2nd','Nacho GMA','IP','IP PAYMENT','PAGO OK','B/S','ASSET','QUANTITY','DESCRIPTION','CUSIP','PRICE','TICKET','TICKET (O)','SERVICE CHARGE','GROSS','TOTAL','Payout broker','Payout Medina base','Final payout Medina %','Payout Medina','% Payout REP','NET Payout REP']; db_cols text[]:=array['custodian_original','month_original','year_original','account_original','name_original','advisor_name_original','adv_name_sec_original','rel_2nd_original','nacho_gma_original','ip_original','ip_payment_original','pago_ok_original','buy_sell_original','asset_original','quantity_original','description_original','cusip_original','price_original','ticket_original','ticket_o_original','service_charge_original','gross_original','total_original','payout_broker_original','payout_medina_base_original','final_payout_medina_percent_original','payout_medina_original','payout_rep_percent_original','net_payout_rep_original']; cells jsonb:='{}'; headers jsonb:='[]'; expected jsonb:='{}'; idx integer; val text; rid uuid; begin
 for idx in 1..29 loop
  val:=case when idx=4 then '00077' when idx=24 then '0.123456789123456789' else 'SINTETICO-'||idx end;
  cells:=cells||jsonb_build_object((30-idx)::text,val);
  headers:=headers||jsonb_build_array(jsonb_build_object('position',30-idx,'canonical',cols[idx]));
  expected:=expected||jsonb_build_object(db_cols[idx],val);
 end loop;
 batch:=public.begin_import(gen_random_uuid(),'revenue','2026-06-01','10000000-0000-0000-0000-000000000001','SINTETICO.csv',repeat('e',64),100,'{}');
 perform public.prepare_import_chunk(batch,0,'{}',jsonb_build_array(jsonb_build_object('sheet_name','SINTETICO','row_number',2,'original_cells',cells,'cell_metadata',jsonb_build_object('amount','0.123456789123456789'),'status','valid','errors','[]'::jsonb)),
  jsonb_build_object('rowCount',1,'blockingErrors',0,'total','0.123456789123456789','valueCount',1,'errors','[]'::jsonb,'headers',headers));
 perform pg_temp.resolve_all(batch,(select account_id from public.admin_account_identifiers where source='revenue' and namespace='ACCOUNT' and custodian_id='10000000-0000-0000-0000-000000000001' and value_original='00077'));
 perform pg_temp.review_batch(batch);
 perform pg_temp.assert_true((select to_jsonb(r) @> expected and payout_broker_usd=0.123456789123456789 from public.admin_revenue_entries r where batch_id=batch),'29 originales exactos con columnas reordenadas');
end $$;
-- Vacío aun declarado sin errores: bloqueado por el revisor.
select pg_temp.new_batch('revenue','10000000-0000-0000-0000-000000000001','2026-03-01','[]',null) as empty_batch \gset
select pg_temp.expect_error(format('select pg_temp.review_batch(%L)',:'empty_batch'));
-- AUM con diferentes aliases que resuelven a la misma cuenta no se suma.
select pg_temp.new_batch('aum','10000000-0000-0000-0000-000000000001','2026-01-01','[{"cells":{"Holding Account Number":"AA","Account Number bd_REV":"B1","Value (USD)":"5"},"amount":"5"},{"cells":{"Holding Account Number":"AB","Account Number bd_REV":"B2","Value (USD)":"6"},"amount":"6"}]','11') as bad_aum \gset
select pg_temp.resolve_all(:'bad_aum',:'account');
select pg_temp.expect_error(format('select pg_temp.review_batch(%L)',:'bad_aum'),'23505');
select pg_temp.assert_true((select count(*)=0 from public.admin_aum_monthly),'duplicado AUM revierte todas las filas');
-- FA: campo comercial y fechas explícitas, sin historia derivada de OLD Owner.
select pg_temp.new_batch('fa','10000000-0000-0000-0000-000000000001','2026-02-01',
 '[{"cells":{"ACC # Addepar":"AD001","ACCOUNT":"00077","Owner Name payout":"Owner SINTETICO","Broker":"Broker SINTETICO","OLD Owner Name payout":"OLD SINTETICO","Grupo":"GRUPO SINTETICO"}}]',null) as fa \gset
select id as fa_row from public.admin_import_rows where batch_id=:'fa' \gset
select pg_temp.resolve_all(:'fa',:'account');
select public.manage_import(:'fa','resolve',jsonb_build_object('row_id',:'fa_row','account_id',:'account','custodian_id','10000000-0000-0000-0000-000000000001','new_advisor','Broker SINTETICO','evidence','FA SINTETICO confirmado'));
select public.manage_import(:'fa','resolve',jsonb_build_object('row_id',:'fa_row','account_id',:'account','custodian_id','10000000-0000-0000-0000-000000000001','new_advisor','Broker SINTETICO','evidence','FA SINTETICO confirmado'));
select pg_temp.assert_true((select count(*)=1 from public.admin_commercial_advisors),'retry FA no duplica comercial');
select pg_temp.expect_error(format('select pg_temp.review_batch(%L)',:'fa'));
select pg_temp.review_batch(:'fa',null,'{"commercial_column":"Broker","valid_from":"2026-02-15","valid_to":"2026-04-01"}');
select pg_temp.publish_batch(:'fa');
reset role;
select pg_temp.assert_true(app_private.advisor_at(:'account','2026-01-01') is null,'FA no se aplica retroactivamente');
select pg_temp.assert_true(app_private.advisor_at(:'account','2026-02-01') is not null,'asignación vigente al cierre mensual');
select pg_temp.assert_true(app_private.advisor_at(:'account','2026-04-01') is null,'hasta exclusivo');
select pg_temp.assert_true((select count(*)=0 from app_private.account_assignments),'OLD Owner no crea historia');
select pg_temp.assert_true((select count(*)>0 from app_private.audit_events where entity_table='row_resolutions'),'resolución auditada');
select pg_temp.assert_true((select original_cells->>'Broker'='Broker SINTETICO' and original_cells->>'Owner Name payout'='Owner SINTETICO' from app_private.import_rows where id=:'fa_row'),'referencias comerciales conservadas');
set local role authenticated;
select pg_temp.new_batch('fa','10000000-0000-0000-0000-000000000001','2026-03-01','[{"cells":{"ACC # Addepar":"AD001","ACCOUNT":"00077","Broker":"Broker SINTETICO"}}]',null) as fa_overlap \gset
select pg_temp.resolve_all(:'fa_overlap',:'account');
select pg_temp.review_batch(:'fa_overlap',null,'{"commercial_column":"Broker","valid_from":"2026-03-01"}');
select pg_temp.expect_error(format('select pg_temp.publish_batch(%L)',:'fa_overlap'));
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-0000-0000-000000000002","user_metadata":{"role":"admin"}}',true);
set local role authenticated;
select pg_temp.expect_error(format($q$select public.manage_import(%L,'inspect','{}')$q$,:'fa'),'42501');
select pg_temp.expect_error(format($q$select public.manage_import(%L,'resolve','{}')$q$,:'fa'),'42501');
select pg_temp.expect_error(format($q$select public.manage_import(%L,'review','{}')$q$,:'fa'),'42501');
select pg_temp.expect_error(format($q$select public.manage_import(%L,'publish','{}')$q$,:'fa'),'42501');
select pg_temp.assert_true((select total_usd='11' from public.published_totals()),'lector conserva total global sin asignación');
reset role;
rollback;
\o
\echo 'OK: resolución, alcance, conciliación exacta, repetidos, fallo transaccional/retry, corrección, FA al cierre y permisos.'
