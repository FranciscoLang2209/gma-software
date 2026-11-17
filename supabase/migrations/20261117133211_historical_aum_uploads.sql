begin;
grant app_papa_executor to current_user with inherit false, set true;
grant create on schema app_private to app_papa_executor;

create table app_private.import_uploads (
 id uuid primary key,
 file_name text not null,
 file_hash text not null check(file_hash ~ '^[0-9a-f]{64}$'),
 file_size integer not null check(file_size between 1 and 2097152),
 storage_object_path text not null,
 options jsonb not null,
 manifest jsonb not null,
 status text not null default 'preparing' check(status in ('preparing','ready','publishing','published')),
 review jsonb,
 created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 published_at timestamptz
);
alter table app_private.import_uploads enable row level security;
alter table app_private.import_uploads force row level security;
grant select on app_private.import_uploads to authenticated,app_papa_executor;
grant insert,update on app_private.import_uploads to app_papa_executor;
create policy admin_read on app_private.import_uploads for select to authenticated,app_papa_executor
 using ((select app_private.current_access())='admin');
create policy admin_write on app_private.import_uploads for all to app_papa_executor
 using ((select app_private.current_access())='admin') with check ((select app_private.current_access())='admin');
create view public.admin_import_uploads with(security_invoker=true) as select * from app_private.import_uploads;
grant select on public.admin_import_uploads to authenticated;
create index uploads_recent on app_private.import_uploads(created_at desc);
alter table app_private.import_batches add column upload_id uuid references app_private.import_uploads(id) on delete restrict;
create unique index batches_upload_scope on app_private.import_batches(upload_id,scope_id) where upload_id is not null;
create or replace view public.admin_import_batches with(security_invoker=true) as select * from app_private.import_batches;

create or replace function public.manage_import(target_id uuid,operation text,input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 result:=app_private.manage_import(target_id,operation,input);
 if operation='inspect' then
  result:=jsonb_set(result,'{batch,upload_id}',coalesce((select to_jsonb(upload_id) from app_private.import_batches where id=target_id),'null'::jsonb));
 end if;
 return result;
end $$;

create function app_private.guard_upload() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'Import history cannot be deleted'; end if;
 if tg_op='UPDATE' and (old.status='published' or
  (to_jsonb(new)-'status'-'review'-'published_at') is distinct from (to_jsonb(old)-'status'-'review'-'published_at')) then
  raise exception 'Upload identity and manifest are immutable';
 end if;
 return new;
end $$;
create trigger guard_upload before update or delete on app_private.import_uploads for each row execute function app_private.guard_upload();
create trigger audit_change after insert or update on app_private.import_uploads for each row execute function app_private.record_change();

-- Persistent parent state is writable only by the executor, never a client flag/GUC.
create function app_private.guard_upload_batch() returns trigger language plpgsql set search_path='' as $$
declare u app_private.import_uploads;
begin
 if tg_op='UPDATE' and new.upload_id is distinct from old.upload_id then raise exception 'Upload association is immutable'; end if;
 if new.upload_id is not null then
  select * into strict u from app_private.import_uploads where id=new.upload_id;
  if new.source<>'aum' or (new.file_name_original,new.file_sha256,new.file_size_bytes,new.storage_object_path)
   is distinct from (u.file_name,u.file_hash,u.file_size::bigint,u.storage_object_path)
   or new.custodian_id is distinct from (u.options->>'custodianId')::uuid
   or not exists(select 1 from jsonb_array_elements(u.manifest->'partitions') p where (p->>'period')::date=new.period) then
   raise exception 'Batch differs from upload manifest';
  end if;
  if new.status='published' and u.status<>'publishing' then raise exception 'Publish the complete historical upload'; end if;
 end if;
 return new;
end $$;
create trigger guard_upload_batch before insert or update on app_private.import_batches for each row execute function app_private.guard_upload_batch();
create function app_private.guard_upload_row() returns trigger language plpgsql set search_path='' as $$
declare b app_private.import_batches; u app_private.import_uploads;
begin
 select * into strict b from app_private.import_batches where id=new.batch_id;
 if b.upload_id is not null then
  -- Manifest coordinates are unique and immutable; batch coordinates have their own UNIQUE.
  select * into strict u from app_private.import_uploads where id=b.upload_id;
  if not exists(select 1 from jsonb_array_elements(u.manifest->'partitions') p,
   jsonb_array_elements(p->'coordinates') c where (p->>'period')::date=b.period and c->>'sheet'=new.sheet_name
    and (c->>'row')::integer=new.row_number and c->>'fingerprint'=new.cell_metadata->>'fingerprint')
   or new.cell_metadata->>'period' is distinct from b.period::text then raise exception 'Row outside frozen manifest'; end if;
  if exists(select 1 from app_private.import_rows r join app_private.import_batches other on other.id=r.batch_id
   where other.upload_id=b.upload_id and r.sheet_name=new.sheet_name and r.row_number=new.row_number) then raise exception 'Repeated upload coordinate'; end if;
 end if;
 return new;
end $$;
create trigger guard_upload_row before insert on app_private.import_rows for each row execute function app_private.guard_upload_row();

create function app_private.manage_historical(target_id uuid, operation text, input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u app_private.import_uploads; b app_private.import_batches; p jsonb; c jsonb; s uuid; child uuid;
 actual jsonb; expected jsonb; token uuid; children jsonb; reviewed jsonb; active uuid;
begin
 if app_private.current_access() is distinct from 'admin' then raise insufficient_privilege using message='Enabled administrator required'; end if;
 if input is null or jsonb_typeof(input)<>'object' or octet_length(input::text)>2097152 then raise exception 'Invalid request'; end if;
 perform pg_advisory_xact_lock(71482026);
 if operation='begin' then
  select * into u from app_private.import_uploads where id=target_id for update;
  if found then
   if (u.file_name,u.file_hash,u.file_size,u.options,u.manifest) is distinct from
    (input->>'file_name',input->>'file_hash',(input->>'file_size')::integer,input->'options',input->'manifest') then raise exception 'Retry does not match original request'; end if;
  else
   if (input->>'file_size')::integer not between 1 and 2097152 or length(input->>'file_name')>200
    or input->>'file_name' !~* '\.(xlsx|csv)$' or input->'options'->>'source' is distinct from 'aum'
    or input->'manifest'->>'parserVersion' is distinct from '2'
    or jsonb_typeof(input->'manifest'->'partitions') is distinct from 'array'
    or jsonb_array_length(input->'manifest'->'partitions')>120
    or jsonb_typeof(input->'manifest'->'errors') is distinct from 'array'
    or jsonb_typeof(input->'manifest'->'unroutable') is distinct from 'array'
    or input->'manifest'->>'sheet' is distinct from input->'options'->>'sheet' then raise exception 'Invalid historical input'; end if;
   if (select coalesce(sum(jsonb_array_length(part_doc->'coordinates')),0) from jsonb_array_elements(input->'manifest'->'partitions') part_doc)
     +jsonb_array_length(input->'manifest'->'unroutable')>5000 then raise exception 'Segment by complete months: maximum 5000 rows'; end if;
   if exists(select 1 from jsonb_array_elements(input->'manifest'->'partitions') part_doc group by part_doc->>'period' having count(*)>1) then raise exception 'Repeated partition'; end if;
   if exists(select 1 from (
    select coord->>'sheet' sheet,coord->>'row' row_no from jsonb_array_elements(input->'manifest'->'partitions') part_doc,jsonb_array_elements(part_doc->'coordinates') coord
    union all select r->>'sheet',r->>'row' from jsonb_array_elements(input->'manifest'->'unroutable') r
   ) coords group by sheet,row_no having count(*)>1) then raise exception 'Repeated upload coordinate'; end if;
   insert into app_private.import_uploads(id,file_name,file_hash,file_size,storage_object_path,options,manifest,created_by)
    values(target_id,input->>'file_name',input->>'file_hash',(input->>'file_size')::integer,
    target_id::text||'/original.'||lower(right(input->>'file_name',strpos(reverse(input->>'file_name'),'.')-1)),input->'options',input->'manifest',auth.uid()) returning * into u;
   for p in select value from jsonb_array_elements(u.manifest->'partitions') order by value->>'period' loop
    if p->>'period' !~ '^(19[0-9]{2}|20[0-9]{2}|21[0-9]{2}|2200)-(0[1-9]|1[0-2])-01$'
     or jsonb_array_length(p->'coordinates') not between 1 and 5000
     or jsonb_array_length(p->'coordinates') is distinct from (p->'summary'->>'rowCount')::integer then raise exception 'Invalid partition'; end if;
    for c in select value from jsonb_array_elements(p->'coordinates') loop
     if c->>'sheet' is distinct from u.options->>'sheet' or (c->>'row')::integer<2 or c->>'fingerprint' !~ '^[0-9a-f]{64}$' then raise exception 'Invalid coordinate'; end if;
    end loop;
    insert into app_private.import_scopes(source,period,custodian_id,created_by)
     values('aum',(p->>'period')::date,(u.options->>'custodianId')::uuid,auth.uid()) on conflict(source,period,custodian_id) do nothing;
    select id into strict s from app_private.import_scopes where source='aum' and period=(p->>'period')::date and custodian_id=(u.options->>'custodianId')::uuid for update;
    child:=gen_random_uuid();
    insert into app_private.import_batches(id,scope_id,source,period,custodian_id,version,idempotency_key,storage_object_path,
     file_name_original,file_sha256,file_size_bytes,parsing_conventions,preparation_only,created_by,upload_id)
     select child,s,'aum',(p->>'period')::date,(u.options->>'custodianId')::uuid,coalesce(max(version),0)+1,target_id,u.storage_object_path,
      u.file_name,u.file_hash,u.file_size,jsonb_build_object('options',u.options||jsonb_build_object('period',p->>'period')),true,auth.uid(),target_id
     from app_private.import_batches where scope_id=s;
   end loop;
  end if;
 elsif operation not in ('inspect','review','publish') then raise exception 'Unknown operation';
 end if;
 select * into strict u from app_private.import_uploads where id=target_id for update;
 if operation in ('review','publish') then
  if u.status='published' then return jsonb_build_object('id',u.id,'status','published'); end if;
  if jsonb_array_length(u.manifest->'errors')<>0 or jsonb_array_length(u.manifest->'unroutable')<>0
   or jsonb_array_length(u.manifest->'partitions')=0 then raise exception 'Historical upload has blocking errors'; end if;
  reviewed:='[]';
  for p in select value from jsonb_array_elements(u.manifest->'partitions') order by value->>'period' loop
   select * into strict b from app_private.import_batches where upload_id=u.id and period=(p->>'period')::date for update;
   select active_batch_id into active from app_private.import_scopes where id=b.scope_id for update;
   if b.status<>'ready' or b.review is null or b.blocking_error_count<>0 or b.errors<>'[]' or b.row_count=0 then raise exception 'Review every partition before publication'; end if;
   if active is distinct from (b.review->>'expected_active_id')::uuid then raise exception 'Active version changed; review again'; end if;
   select coalesce(jsonb_agg(jsonb_build_object('sheet',r.sheet_name,'row',r.row_number,'fingerprint',r.cell_metadata->>'fingerprint') order by r.row_number),'[]') into actual
    from app_private.import_rows r where r.batch_id=b.id;
   select jsonb_agg(value order by (value->>'row')::integer) into expected from jsonb_array_elements(p->'coordinates');
   if actual is distinct from expected or (b.totals-'processed') is distinct from p->'summary'
    or (select sum((cell_metadata->>'amount')::numeric) from app_private.import_rows where batch_id=b.id) is distinct from b.metric_total_usd
    or exists(select 1 from app_private.import_rows where batch_id=b.id and (status<>'valid' or errors<>'[]')) then raise exception 'Prepared rows differ from frozen manifest'; end if;
   reviewed:=reviewed||jsonb_build_array(jsonb_build_object('id',b.id,'token',b.review->>'token','active',active));
  end loop;
  if operation='review' then
   if input->'confirm_all' is distinct from 'true'::jsonb then raise exception 'Confirm every complete monthly snapshot and replacement'; end if;
   token:=gen_random_uuid();
   update app_private.import_uploads set status='ready',review=jsonb_build_object('token',token,'children',reviewed,'actor',auth.uid()) where id=u.id;
  else
   if u.status<>'ready' or input->>'token' is distinct from u.review->>'token' or reviewed is distinct from u.review->'children' then raise exception 'Review token required for complete upload'; end if;
   update app_private.import_uploads set status='publishing' where id=u.id;
   for b in select * from app_private.import_batches where upload_id=u.id order by period,custodian_id loop
    perform app_private.publish_import(b.id,(b.review->>'expected_active_id')::uuid,auth.uid());
   end loop;
   update app_private.import_uploads set status='published',published_at=clock_timestamp() where id=u.id;
  end if;
 end if;
 select * into strict u from app_private.import_uploads where id=target_id;
 select coalesce(jsonb_agg(jsonb_build_object('id',batch.id,'period',batch.period,'custodian_id',batch.custodian_id,'version',batch.version,
  'status',case when batch.status='published' and scope.active_batch_id is distinct from batch.id then 'superseded' else batch.status end,
  'processed',coalesce((batch.totals->>'processed')::integer,0),'rows',batch.row_count,'errors',batch.blocking_error_count,
  'comparison',app_private.import_comparison(batch.id)) order by batch.period),'[]') into children
 from app_private.import_batches batch join app_private.import_scopes scope on scope.id=batch.scope_id where batch.upload_id=u.id;
 return jsonb_build_object('upload',to_jsonb(u),'children',children);
end $$;
revoke all on function app_private.manage_historical(uuid,text,jsonb) from public,anon,service_role;
grant execute on function app_private.manage_historical(uuid,text,jsonb) to authenticated;
alter function app_private.manage_historical(uuid,text,jsonb) owner to app_papa_executor;
create function public.manage_historical(target_id uuid,operation text,input jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select app_private.manage_historical(target_id,operation,input) $$;
revoke all on function public.manage_historical(uuid,text,jsonb) from public,anon,service_role;
grant execute on function public.manage_historical(uuid,text,jsonb) to authenticated;
revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
commit;
