begin;
-- El diagnóstico publicado sólo necesita estas coordenadas, no el payload Excel.
create index import_rows_quality_origin on app_private.import_rows(id) include(batch_id,sheet_name,row_number);
grant app_papa_executor to current_user with inherit true, set true;
do $migration$
declare definition text;
begin
 select pg_get_functiondef('app_private.quality_report(jsonb)'::regprocedure) into definition;
 if strpos(definition,'select md5(string_agg(md5(b::text),'''' order by key)) from base b')=0 then raise exception 'Unexpected quality fingerprint'; end if;
 -- Ordenar clave + hash evita volcar todas las columnas de 60.000 filas a disco.
 definition:=replace(definition,'select md5(string_agg(md5(b::text),'''' order by key)) from base b',
 'select md5(string_agg(h.row_hash,'''' order by h.key)) from (select key,md5(b::text) row_hash from base b offset 0)h');
 execute definition;
end $migration$;
revoke app_papa_executor from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
