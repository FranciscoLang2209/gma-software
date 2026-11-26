begin;
grant app_papa_executor to current_user with inherit true,set true;
-- RLS estima 3 hechos frente a 36.693: los recorridos anidados multiplican conjuntos grandes.
-- Sólo esta RPC favorece hash/merge; los laterales por lote conservan sus accesos indexados.
alter function app_private.quality_report(jsonb) set enable_nestloop to off;
revoke app_papa_executor from current_user granted by current_user;
notify pgrst,'reload schema';
commit;
