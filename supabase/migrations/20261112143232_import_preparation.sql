begin;

-- Este flujo nunca puede publicar, aun invocando RPC/tablas directamente.
alter table app_private.import_batches add column preparation_only boolean not null default false;
create function app_private.guard_preparation() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' and old.preparation_only and not new.preparation_only then
    raise exception 'Preparation cannot be promoted through direct updates';
  end if;
  if new.preparation_only and (new.status in ('ready','published') or new.reviewed_at is not null) then
    raise exception 'Preparation requires the future reconciliation workflow';
  end if;
  return new;
end $$;
create trigger guard_preparation before insert or update on app_private.import_batches
for each row execute function app_private.guard_preparation();
-- El SELECT * de la vista anterior se fijó al crearla; ampliar explícitamente.
create or replace view public.admin_import_batches with (security_invoker=true) as select * from app_private.import_batches;
create index batches_file_sha256 on app_private.import_batches(file_sha256);

create function public.begin_import(request_id uuid, source_type text, target_period date, custodian uuid,
  file_name text, file_hash text, file_size integer, conventions jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare scope uuid; batch uuid; previous app_private.import_batches; next_version integer;
begin
  if app_private.current_access() is distinct from 'admin' then
    raise insufficient_privilege using message='Enabled administrator required';
  end if;
  if file_size not between 1 and 2097152 or length(file_name)>200 or file_name !~* '\.(xlsx|csv)$'
    or jsonb_typeof(conventions)<>'object' or octet_length(conventions::text)>8192 then
    raise exception 'Invalid import input';
  end if;
  insert into app_private.import_scopes(source,period,custodian_id,created_by)
    values(source_type,target_period,custodian,auth.uid()) on conflict(source,period,custodian_id) do nothing;
  select id into strict scope from app_private.import_scopes where source=source_type and period=target_period and custodian_id=custodian for update;
  select * into previous from app_private.import_batches where scope_id=scope and idempotency_key=request_id;
  if found then
    if (previous.file_sha256,previous.file_name_original,previous.file_size_bytes,previous.parsing_conventions)
      is distinct from (file_hash,file_name,file_size::bigint,conventions) then raise exception 'Retry does not match original request'; end if;
    return previous.id;
  end if;
  select coalesce(max(version),0)+1 into next_version from app_private.import_batches where scope_id=scope;
  batch := gen_random_uuid();
  insert into app_private.import_batches(id,scope_id,source,period,custodian_id,version,idempotency_key,
    storage_object_path,file_name_original,file_sha256,file_size_bytes,parsing_conventions,preparation_only,created_by)
  values(batch,scope,source_type,target_period,custodian,next_version,request_id,
    batch::text||'/original.'||lower(right(file_name,strpos(reverse(file_name),'.')-1)),file_name,file_hash,file_size,conventions,true,auth.uid());
  return batch;
end $$;

-- Cada petición persiste como máximo 250 filas y su cursor en una sola transacción.
create function public.prepare_import_chunk(target_id uuid, expected_cursor integer, configuration jsonb,
  chunk jsonb, summary jsonb) returns integer
language plpgsql security invoker set search_path='' as $$
declare b app_private.import_batches; cursor integer; item jsonb; total_rows integer; new_cursor integer;
begin
  if app_private.current_access() is distinct from 'admin' then
    raise insufficient_privilege using message='Enabled administrator required';
  end if;
  select * into strict b from app_private.import_batches where id=target_id for update;
  if not b.preparation_only or b.status='published' then raise exception 'Not a preparation batch'; end if;
  if jsonb_typeof(chunk)<>'array' or jsonb_array_length(chunk)>250 or octet_length(chunk::text)>2097152
    or jsonb_typeof(summary)<>'object' or jsonb_typeof(configuration)<>'object' then raise exception 'Invalid chunk'; end if;
  select count(*) into cursor from app_private.import_rows where batch_id=target_id;
  if b.parsing_conventions ? 'configuration' and b.parsing_conventions->'configuration' is distinct from configuration then
    raise exception 'Configuration frozen; upload a new preparation';
  end if;
  if expected_cursor < cursor then return cursor; end if;
  if expected_cursor <> cursor or b.status not in ('uploaded','validating') then raise exception 'Stale or completed preparation'; end if;
  total_rows := (summary->>'rowCount')::integer;
  if total_rows not between 0 and 5000 or cursor+jsonb_array_length(chunk)>total_rows
    or (summary->>'blockingErrors')::integer < 0 or jsonb_typeof(summary->'errors')<>'array' then raise exception 'Invalid summary'; end if;
  for item in select value from jsonb_array_elements(chunk) loop
    insert into app_private.import_rows(batch_id,sheet_name,row_number,original_cells,cell_metadata,status,errors)
    values(target_id,item->>'sheet_name',(item->>'row_number')::integer,item->'original_cells',item->'cell_metadata',item->>'status',item->'errors');
  end loop;
  new_cursor := cursor+jsonb_array_length(chunk);
  update app_private.import_batches set
    status=case when new_cursor<total_rows then 'validating' when (summary->>'blockingErrors')::integer>0 then 'failed' else 'needs_resolution' end,
    row_count=total_rows, blocking_error_count=(summary->>'blockingErrors')::integer,
    metric_total_usd=(summary->>'total')::numeric, metric_value_count=(summary->>'valueCount')::integer,
    errors=summary->'errors', totals=summary||jsonb_build_object('processed',new_cursor),
    parsing_conventions=parsing_conventions||jsonb_build_object('configuration',configuration)
    where id=target_id;
  return new_cursor;
end $$;
revoke all on function public.begin_import(uuid,text,date,uuid,text,text,integer,jsonb),
  public.prepare_import_chunk(uuid,integer,jsonb,jsonb,jsonb) from public, anon, service_role;
grant execute on function public.begin_import(uuid,text,date,uuid,text,text,integer,jsonb),
  public.prepare_import_chunk(uuid,integer,jsonb,jsonb,jsonb) to authenticated;
commit;
