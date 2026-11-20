begin;
grant app_papa_executor to current_user with inherit true, set true;
grant create on schema app_private to app_papa_executor;
-- Conservar contrato, revisión, RLS, permisos y auditoría; reducir inicializaciones Auth por sentencia.
do $migration$
declare definition text:=pg_get_functiondef('app_private.import_master_rates(uuid,text,jsonb)'::regprocedure);
 old_classification text:=$old$  foreach account in array class_ids loop
   perform app_private.change_model('accounts',account,'{"service":"Advisory"}');
  end loop;$old$;
 new_classification text:=$new$  update app_private.accounts a set service='Advisory'
   where a.id=any(class_ids) and a.service='sin_clasificar';$new$;
 old_rates text:=$old$  for plan in select * from jsonb_array_elements(planned) loop
   for q in select d::date from generate_series(first_quarter,last_quarter,interval '3 months') d loop
    select id into previous_rate from app_private.roa_rate_versions v
     where v.account_id=(plan->>'account_id')::uuid and v.quarter=q order by revision desc limit 1;
    insert into app_private.roa_rate_versions(id,account_id,quarter,previous_id,annual_rate,evidence,created_by,master_publication_id,master_source_row)
     values(gen_random_uuid(),(plan->>'account_id')::uuid,q,previous_rate,(plan->>'annual_rate')::numeric,
      cfg->>'evidence',app_private.session_user_id(),request_id,(plan->>'row')::integer);
   end loop;
  end loop;$old$;
 new_rates text:=$new$  with previous as materialized (
   select distinct on(v.account_id,v.quarter) v.account_id,v.quarter,v.id
   from app_private.roa_rate_versions v
   where v.account_id=any(selected_accounts) and v.quarter between first_quarter and last_quarter
   order by v.account_id,v.quarter,v.revision desc
  )
  insert into app_private.roa_rate_versions(id,account_id,quarter,previous_id,annual_rate,evidence,created_by,master_publication_id,master_source_row)
   select gen_random_uuid(),(p->>'account_id')::uuid,d::date,v.id,(p->>'annual_rate')::numeric,
    cfg->>'evidence',app_private.session_user_id(),request_id,(p->>'row')::integer
   from jsonb_array_elements(planned) p cross join generate_series(first_quarter,last_quarter,interval '3 months') d
   left join previous v on v.account_id=(p->>'account_id')::uuid and v.quarter=d::date;$new$;
begin
 if strpos(definition,old_classification)=0 or strpos(definition,old_rates)=0 then
  raise exception 'Unexpected Master rate function; review before replacing'; end if;
 execute replace(replace(definition,old_classification,new_classification),old_rates,new_rates);
end $migration$;
revoke create on schema app_private from app_papa_executor;
revoke app_papa_executor from current_user granted by current_user;
commit;
