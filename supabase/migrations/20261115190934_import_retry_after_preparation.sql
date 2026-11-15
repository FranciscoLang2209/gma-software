begin;

create or replace function app_private.begin_import(request_id uuid, source_type text, target_period date, custodian uuid,
  file_name text, file_hash text, file_size integer, conventions jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
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
    -- El parser agrega configuration; un retry compara solamente las convenciones originales de carga.
    if (previous.file_sha256,previous.file_name_original,previous.file_size_bytes,previous.parsing_conventions - 'configuration')
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

commit;
