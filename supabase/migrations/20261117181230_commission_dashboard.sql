begin;
grant app_papa_executor to current_user with inherit true, set true;
-- Una sola foto transaccional para tablas, KPIs y exportación. No publica hechos nuevos.
create function app_private.commission_dashboard(filters jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare page jsonb; dataset jsonb:='[]'; answer jsonb; cursor integer:=0;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege; end if;
 if filters is null or jsonb_typeof(filters)<>'object' or
  (filters ? 'basis' and filters->>'basis' not in ('gross','net','representative_payout')) then raise invalid_parameter_value; end if;
 loop
  page:=app_private.commission_report((filters-'offset'-'limit'-'basis')||jsonb_build_object('offset',cursor,'limit',500));
  -- shortcut: reporte acotado a 10.000 registros; ampliar con agregación SQL directa ante volumen real mayor.
  if (page->>'row_count')::integer>10000 then raise program_limit_exceeded using message='Narrow commission filters: maximum 10000 records'; end if;
  dataset:=dataset||(page->'rows'); cursor:=cursor+500;
  exit when cursor>=(page->>'row_count')::integer;
 end loop;
 with enriched as materialized (
  select j||jsonb_build_object(
   'annual_rate_original',e.input->'original_cells'->>'Adv Fee / Retro',
   'account',coalesce(e.input->'original_cells'->>'ACCOUNT',r.account_original),
   'holder',coalesce(e.input->'original_cells'->>'NAME',r.name_original),
   'source_file',coalesce(e.input->>'source_file',b.file_name_original),
   'source_sheet',coalesce(e.input->>'source_sheet',ir.sheet_name),
   'source_row',coalesce(e.input->>'source_row',ir.row_number::text),
   'source_import_id',r.batch_id,'source_hash',coalesce(e.input->>'file_sha256',b.file_sha256),
   'classification_id',rc.id,'classification_input',rc.input,
   'expected_input',e.input,'reconciliation_input',c.input,
   'reviewed_by',c.created_by,'reviewed_at',c.created_at,
   'evidence',coalesce(c.input->>'reason',rc.input->>'evidence',e.input->>'account_evidence'),
   'receipt_evidence',coalesce((select jsonb_agg(jsonb_build_object('id',ce.id,'entry_id',ce.target_id,
     'evidence',ce.input->>'evidence','reason',ce.input->>'reason',
     'source_file',rb.file_name_original,'source_sheet',ri.sheet_name,'source_row',ri.row_number,
     'source_import_id',rr.batch_id,'source_hash',rb.file_sha256))
     from app_private.commission_events ce
     left join app_private.revenue_entries rr on rr.id=ce.target_id
     left join app_private.import_batches rb on rb.id=rr.batch_id
     left join app_private.import_rows ri on ri.id=rr.import_row_id
     where ce.id::text in
     (select jsonb_array_elements_text(c.result->'receipt_ids'))),'[]')) row
  from jsonb_array_elements(dataset) j
  left join app_private.commission_events e on e.id=(j->>'expected_id')::uuid
  left join app_private.commission_events c on c.id=(j->>'reconciliation_id')::uuid
  left join app_private.revenue_current r on r.id=(j->>'entry_id')::uuid
  left join app_private.commission_current rc on rc.operation='receipt' and rc.target_id=r.id
  left join app_private.import_batches b on b.id=r.batch_id
  left join app_private.import_rows ir on ir.id=r.import_row_id
  where not filters ? 'basis' or j->>'basis'=filters->>'basis'
 ), grouped as (
  select case when grouping(row->>'owner')=0 then 'owner' when grouping(row->>'quarter')=0 then 'quarter' else 'summary' end kind,
   row->>'basis' basis,row->>'owner' owner,row->>'quarter' quarter,
   count(*) records,count(distinct row->>'account_id') accounts,
   count(distinct row->>'account_id') filter(where row->>'status' in ('matched','variance')) reconciled_accounts,
   count(*) filter(where row->>'status' not in ('matched','variance')) pending,
   count(*) filter(where row->>'status' in ('matched','variance')) comparable,
   count(*) filter(where row->>'obligation_id' is not null and row->>'verified'='true') verified,
   sum((row->>'expected_quarterly')::numeric) filter(where row->>'verified'='true') expected,
   sum((row->>'expected_quarterly')::numeric) filter(where row->>'status' in ('matched','variance')) comparable_expected,
   sum((row->>'actual_received')::numeric) filter(where row->>'status' in ('matched','variance')) actual,
   sum((row->>'variance')::numeric) filter(where row->>'status' in ('matched','variance')) variance,
   -- Balance sólo aditivo en una misma foto, sin repetir componentes por cuenta.
   case when count(distinct (row->>'quarter',row->>'cutoff'))=1
    and count(distinct row->>'account_id')=count(*) filter(where row->>'balance' is not null)
    then sum((row->>'balance')::numeric) end balance
  from enriched group by grouping sets ((row->>'basis',row->>'owner'),(row->>'basis',row->>'quarter'),(row->>'basis'))
 ), aggregates as (
  select kind,jsonb_build_object('basis',basis,'owner',owner,'quarter',quarter,'records',records,'accounts',accounts,
   'reconciled_accounts',reconciled_accounts,'pending',pending,'comparable',comparable,'verified',verified,
   'balance',balance::text,'expected',expected::text,'comparable_expected',comparable_expected::text,
   'actual',actual::text,'variance',variance::text,
   'variance_percentage',case when comparable_expected<>0 then (variance*100/comparable_expected)::text end) row
  from grouped
 ) select jsonb_build_object('rows',coalesce((select jsonb_agg(row order by row->>'quarter',row->>'account_id',row->>'obligation_id',row->>'entry_id') from enriched),'[]'),
  'summary',coalesce((select jsonb_agg(row order by row->>'basis') from aggregates where kind='summary'),'[]'),
  'owners',coalesce((select jsonb_agg(row order by row->>'owner',row->>'basis') from aggregates where kind='owner'),'[]'),
  'quarters',coalesce((select jsonb_agg(row order by row->>'quarter',row->>'basis') from aggregates where kind='quarter'),'[]'),
  'row_count',(select count(*) from enriched)) into answer;
 return answer||jsonb_build_object('revision',md5(answer::text));
end $$;
grant create on schema app_private to app_papa_executor;
alter function app_private.commission_dashboard(jsonb) owner to app_papa_executor;
revoke create on schema app_private from app_papa_executor;
revoke all on function app_private.commission_dashboard(jsonb) from public,anon,service_role;
grant execute on function app_private.commission_dashboard(jsonb) to authenticated;
create function public.commission_dashboard(filters jsonb default '{}') returns jsonb
language sql stable security invoker set search_path='' as $$ select app_private.commission_dashboard(filters) $$;
revoke all on function public.commission_dashboard(jsonb) from public,anon,service_role;
grant execute on function public.commission_dashboard(jsonb) to authenticated;
revoke app_papa_executor from current_user;
commit;
