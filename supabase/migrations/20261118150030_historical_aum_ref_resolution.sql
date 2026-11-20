begin;
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;
create function app_private.resolve_historical_aum(target_id uuid,child_id uuid,evidence text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u app_private.import_uploads; b app_private.import_batches; r app_private.import_rows;
 holding text; external_account text; custodian_code text; ref_row integer; destinations uuid[]; destination uuid;
 audit_evidence text; processed integer; result jsonb;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege using message='Enabled administrator required'; end if;
 if coalesce(length(btrim(evidence)),0)<10 or length(evidence)>1500 then raise exception 'Evidence required (10-1500 characters)'; end if;
 perform pg_advisory_xact_lock(71482026);
 select * into strict u from app_private.import_uploads where id=target_id for update;
 select * into strict b from app_private.import_batches where id=child_id and upload_id=u.id for update;
 if u.options->>'source' is distinct from 'aum' or b.source<>'aum' or u.status<>'preparing'
  or u.options->'multiCustodian' is distinct from 'true'::jsonb
  or jsonb_typeof(u.options->'references'->'pairs') is distinct from 'array'
  or b.status not in ('needs_resolution','ready') or b.blocking_error_count<>0 or b.errors<>'[]'
  or jsonb_array_length(u.manifest->'errors')<>0 or jsonb_array_length(u.manifest->'unroutable')<>0
  or exists(select 1 from jsonb_array_elements(u.manifest->'partitions') p where (p->'summary'->>'blockingErrors')::integer>0)
  then raise exception 'Complete valid AUM and REF preparation required'; end if;
 select p->>'custodianCode' into strict custodian_code from jsonb_array_elements(u.manifest->'partitions')p
  where (p->>'period')::date=b.period and (p->>'custodianId')::uuid=b.custodian_id;
 for r in select row_data.* from app_private.import_rows row_data
  where row_data.batch_id=b.id and not exists(select 1 from app_private.row_resolutions x where x.source_row_id=row_data.id)
  order by row_data.row_number limit 50 loop
  if r.status<>'valid' or r.errors<>'[]' then raise exception 'Row has blocking errors'; end if;
  holding:=app_private.import_cell(b,r,'Holding Account Number');
  external_account:=app_private.import_cell(b,r,'Account Number bd_REV');
  if nullif(btrim(holding),'') is null or nullif(btrim(external_account),'') is null then raise exception 'Missing reference'; end if;
  select min((p->>'row')::integer) into ref_row from jsonb_array_elements(u.options->'references'->'pairs')p
   where p->>'holding'=holding and p->>'account'=external_account
   and lower(regexp_replace(btrim(p->>'custodianCode'),'\s+',' ','g'))=lower(regexp_replace(btrim(custodian_code),'\s+',' ','g'));
  if ref_row is null or exists(select 1 from jsonb_array_elements(u.options->'references'->'pairs')p
   where lower(regexp_replace(btrim(p->>'custodianCode'),'\s+',' ','g'))=lower(regexp_replace(btrim(custodian_code),'\s+',' ','g'))
   and ((p->>'holding'=holding and p->>'account'<>external_account) or (p->>'account'=external_account and p->>'holding'<>holding)))
   then raise exception 'REF pair missing or ambiguous; resolve explicitly'; end if;
  select array_agg(distinct i.account_id) into destinations from app_private.account_identifiers i
   where i.custodian_id=b.custodian_id and i.resolution_status='resolved' and (
    (i.source='revenue' and i.namespace='ACCOUNT' and i.value_original=external_account)
    or (i.source='aum' and i.namespace='Holding Account Number' and i.value_original=holding)
    or (i.source='aum' and i.namespace='Account Number bd_REV' and i.value_original=external_account));
  if cardinality(destinations)>1 then raise exception 'References belong to conflicting accounts; preserve existing identities'; end if;
  destination:=destinations[1];
  audit_evidence:=evidence||E'\nREF original SHA-256 '||(u.options->'references'->>'fileHash')||' · hoja '
   ||(u.options->'references'->>'sheet')||' · fila '||ref_row::text
   ||'. Par literal ACC # Addepar / ACCOUNT y custodio; Account Number bd_REV corresponde a ACCOUNT de Revenue por confirmación del dueño.';
  if audit_evidence is null or length(audit_evidence)>2000 then raise exception 'Invalid REF evidence'; end if;
  result:=app_private.manage_import(b.id,'resolve',jsonb_build_object('row_id',r.id,'custodian_id',b.custodian_id,
   'account_id',destination,'evidence',audit_evidence));
  destination:=(result->>'account_id')::uuid;
  -- Registrar también la equivalencia REV acreditada por REF para evitar cuentas nuevas en futuras cargas.
  if not exists(select 1 from app_private.account_identifiers where source='revenue' and namespace='ACCOUNT'
   and custodian_id=b.custodian_id and value_original=external_account and resolution_status='resolved') then
   insert into app_private.account_identifiers(account_id,custodian_id,source,namespace,value_original,resolution_status,evidence,source_row_id,created_by)
    values(destination,b.custodian_id,'revenue','ACCOUNT',external_account,'resolved',audit_evidence,r.id,app_private.session_user_id());
  end if;
 end loop;
 select count(*) into processed from app_private.row_resolutions where batch_id=b.id;
 return jsonb_build_object('processed',processed,'total',b.row_count,'done',processed=b.row_count);
end $$;
revoke all on function app_private.resolve_historical_aum(uuid,uuid,text) from public,anon,service_role;
alter function app_private.resolve_historical_aum(uuid,uuid,text) owner to app_papa_executor;
grant execute on function app_private.resolve_historical_aum(uuid,uuid,text) to authenticated;
create function public.resolve_historical_accounts(target_id uuid,child_id uuid,evidence text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare source_type text;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege using message='Enabled administrator required'; end if;
 select options->>'source' into strict source_type from app_private.import_uploads where id=target_id;
 if source_type='aum' then return app_private.resolve_historical_aum(target_id,child_id,evidence);
 elsif source_type='revenue' then return app_private.resolve_historical_revenue(target_id,child_id,evidence);
 else raise exception 'Unsupported historical source'; end if;
end $$;
revoke all on function public.resolve_historical_accounts(uuid,uuid,text) from public,anon,service_role;
grant execute on function public.resolve_historical_accounts(uuid,uuid,text) to authenticated;
revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
commit;
