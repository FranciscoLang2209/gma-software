begin;
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;

-- Sólo identidad exacta dentro de Revenue/custodio; no vincula otras fuentes ni asigna comerciales.
create function app_private.resolve_historical_revenue(target_id uuid, child_id uuid, evidence text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u app_private.import_uploads; b app_private.import_batches; r app_private.import_rows;
 destination uuid; reference text; processed integer;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege using message='Enabled administrator required'; end if;
 if coalesce(length(btrim(evidence)),0)<10 or length(evidence)>2000 then raise exception 'Evidence required'; end if;
 perform pg_advisory_xact_lock(71482026);
 select * into strict u from app_private.import_uploads where id=target_id for update;
 select * into strict b from app_private.import_batches where id=child_id and upload_id=u.id for update;
 if u.options->>'source' is distinct from 'revenue' or b.source<>'revenue' or u.status<>'preparing'
  or b.status not in ('needs_resolution','ready') or b.blocking_error_count<>0 or b.errors<>'[]'
  or jsonb_array_length(u.manifest->'errors')<>0 or jsonb_array_length(u.manifest->'unroutable')<>0
  or exists(select 1 from jsonb_array_elements(u.manifest->'partitions') p where (p->'summary'->>'blockingErrors')::integer>0)
  then raise exception 'Complete valid Revenue preparation required'; end if;
 for r in select row_data.* from app_private.import_rows row_data
  where row_data.batch_id=b.id and not exists(select 1 from app_private.row_resolutions x where x.source_row_id=row_data.id)
  order by row_data.row_number limit 50 loop
  if r.status<>'valid' or r.errors<>'[]' then raise exception 'Row has blocking errors'; end if;
  reference:=app_private.import_cell(b,r,'ACCOUNT');
  if nullif(btrim(reference),'') is null then raise exception 'Missing reference'; end if;
  destination:=null;
  select account_id into destination from app_private.account_identifiers where source='revenue' and namespace='ACCOUNT'
   and custodian_id=b.custodian_id and value_original=reference and resolution_status='resolved';
  perform app_private.manage_import(b.id,'resolve',jsonb_build_object('row_id',r.id,'custodian_id',b.custodian_id,
   'account_id',destination,'evidence',evidence));
 end loop;
 select count(*) into processed from app_private.row_resolutions where batch_id=b.id;
 return jsonb_build_object('processed',processed,'total',b.row_count,'done',processed=b.row_count);
end $$;
revoke all on function app_private.resolve_historical_revenue(uuid,uuid,text) from public,anon,service_role;
alter function app_private.resolve_historical_revenue(uuid,uuid,text) owner to app_papa_executor;
grant execute on function app_private.resolve_historical_revenue(uuid,uuid,text) to authenticated;
create function public.resolve_historical_revenue(target_id uuid,child_id uuid,evidence text) returns jsonb
language sql security invoker set search_path='' as $$ select app_private.resolve_historical_revenue(target_id,child_id,evidence) $$;
revoke all on function public.resolve_historical_revenue(uuid,uuid,text) from public,anon,service_role;
grant execute on function public.resolve_historical_revenue(uuid,uuid,text) to authenticated;
revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
commit;
