begin;

create or replace function app_private.guard_upload_row() returns trigger language plpgsql set search_path='' as $$
declare b app_private.import_batches; u app_private.import_uploads;
begin
 select * into strict b from app_private.import_batches where id=new.batch_id;
 if b.upload_id is not null then
  select * into strict u from app_private.import_uploads where id=b.upload_id;
  if not exists(select 1 from jsonb_array_elements(u.manifest->'partitions') p,
   jsonb_array_elements(p->'coordinates') c where (p->>'period')::date=b.period and coalesce(p->>'custodianId',u.options->>'custodianId')::uuid=b.custodian_id and c->>'sheet'=new.sheet_name
    and (c->>'row')::integer=new.row_number and c->>'fingerprint'=new.cell_metadata->>'fingerprint')
   or new.cell_metadata->>'period' is distinct from b.period::text then raise exception 'Row outside frozen manifest'; end if;
  -- begin rechaza coordenadas repetidas en el manifiesto inmutable y sólo hay un hijo por alcance.
  -- La pertenencia anterior impide repetirlas en otro hijo; UNIQUE(batch_id,sheet_name,row_number) cubre éste.
 end if;
 return new;
end $$;

commit;
