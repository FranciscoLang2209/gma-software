begin;
grant app_papa_executor,app_papa_quality_reader to current_user with inherit true,set true;
grant create on schema app_private to app_papa_quality_reader;
grant execute on function app_private.commission_decimal(jsonb) to app_papa_quality_reader;
do $migration$
declare definition text; original text;
begin
 -- Variante interna acotada: la RPC pública conserva su límite de 500 por página.
 select pg_get_functiondef('app_private.commission_report(jsonb)'::regprocedure) into definition;
 if strpos(definition,'not between 1 and 500')=0 then raise exception 'Unexpected commission report limit'; end if;
 definition:=replace(definition,'FUNCTION app_private.commission_report(','FUNCTION app_private.commission_report_dataset(');
 definition:=replace(definition,'not between 1 and 500','not between 1 and 10001');
 definition:=replace(definition,'coalesce((filters->>''limit'')::integer,100)','coalesce((filters->>''limit'')::integer,10001)');
 execute definition;
 select pg_get_functiondef('app_private.commission_dashboard(jsonb)'::regprocedure) into definition;
 original:=$part$ loop
  page:=app_private.commission_report((filters-'offset'-'limit'-'basis')||jsonb_build_object('offset',cursor,'limit',500));
  -- shortcut: reporte acotado a 10.000 registros; ampliar con agregación SQL directa ante volumen real mayor.
  if (page->>'row_count')::integer>10000 then raise program_limit_exceeded using message='Narrow commission filters: maximum 10000 records'; end if;
  dataset:=dataset||(page->'rows'); cursor:=cursor+500;
  exit when cursor>=(page->>'row_count')::integer;
 end loop;$part$;
 if strpos(definition,original)=0 then raise exception 'Unexpected commission pagination'; end if;
 definition:=replace(definition,original,$part$ page:=app_private.commission_report_dataset((filters-'offset'-'limit'-'basis')||jsonb_build_object('offset',0,'limit',10001));
 if (page->>'row_count')::integer>10000 then raise program_limit_exceeded using message='Narrow commission filters: maximum 10000 records'; end if;
 dataset:=page->'rows';$part$);
 definition:=replace(definition,'; cursor integer:=0','');
 -- Disponibilidad también usa la lectura interna, sin las proyecciones recursivas de lectores.
 definition:=replace(definition,'app_private.commission_report(','app_private.commission_report_dataset(');
 original:=$part$(app_private.commission_report_dataset((filters-'broker'-'account_id'-'owner'-'fee_type'-'status'-'basis'-'min_absolute_variance'-'min_absolute_percentage'-'offset'-'limit')||'{"limit":1,"offset":0}'::jsonb)->>'row_count')::integer$part$;
 if strpos(definition,original)=0 then raise exception 'Unexpected commission availability'; end if;
 definition:=replace(definition,original,'case when not (filters ?| array[''broker'',''account_id'',''owner'',''fee_type'',''status'',''min_absolute_variance'',''min_absolute_percentage'']) then (page->>''row_count'')::integer else '||original||' end');
 execute definition;
end $migration$;
alter function app_private.commission_report_dataset(jsonb) owner to app_papa_quality_reader;
alter function app_private.commission_dashboard(jsonb) owner to app_papa_quality_reader;
alter function app_private.commission_report_dataset(jsonb) set enable_nestloop to off;
alter function app_private.commission_dashboard(jsonb) set enable_nestloop to off;
revoke all on function app_private.commission_report_dataset(jsonb) from public,anon,authenticated,service_role;
revoke create on schema app_private from app_papa_quality_reader;
revoke app_papa_executor,app_papa_quality_reader from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
