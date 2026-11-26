begin;
grant app_papa_quality_reader to current_user with inherit true,set true;
do $migration$
declare definition text; original text;
begin
 select pg_get_functiondef('app_private.quality_report(jsonb)'::regprocedure) into definition;
 original:=$part$coalesce((select md5(string_agg(h.row_hash,'' order by h.key)) from (select key,md5(b::text) row_hash from base b offset 0)h),'')$part$;
 if strpos(definition,original)=0 then raise exception 'Unexpected quality base fingerprint'; end if;
 -- La revisión de un historial sigue sus propias filas; los controles se siguen calculando.
 definition:=replace(definition,original,'case when mode=''issues'' then '||original||' else '''' end');
 original:=$part$select md5(string_agg(md5(to_jsonb(a)::text),'' order by id)) from audits a$part$;
 if strpos(definition,original)=0 then raise exception 'Unexpected quality audit fingerprint'; end if;
 -- Ordenar id + hash de metadata/versionado, sin payload ni filas completas.
 definition:=replace(definition,original,$part$select md5(string_agg(h.row_hash,'' order by h.id)) from (select id,md5(a::text) row_hash from audits a offset 0)h$part$);
 execute definition;
end $migration$;
revoke app_papa_quality_reader from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
