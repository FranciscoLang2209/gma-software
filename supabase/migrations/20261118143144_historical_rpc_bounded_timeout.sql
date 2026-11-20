begin;
-- PostgREST aplica este límite al RPC histórico antes de iniciar su consulta; no altera roles ni otras RPC.
alter function public.manage_historical(uuid,text,jsonb) set statement_timeout to '30s';
notify pgrst, 'reload schema';
commit;
