begin;
-- La publicación AUM de 433 alcances llegó al cierre, pero excedió los 30 s.
-- Mantener un presupuesto acotado sólo para esta RPC; sin cambiar roles ni otras consultas.
alter function public.manage_historical(uuid,text,jsonb) set statement_timeout to '60s';
notify pgrst, 'reload schema';
commit;
