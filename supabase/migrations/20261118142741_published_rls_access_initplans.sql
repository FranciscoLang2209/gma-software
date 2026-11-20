begin;
-- El acceso depende de la sesión, no de cada fila; conservar todos los predicados de publicación.
alter policy published_scopes on app_private.import_scopes using (
 (select app_private.current_access()) in ('admin','reader') and active_batch_id is not null);
alter policy published_batches on app_private.import_batches using (
 (select app_private.current_access()) in ('admin','reader') and status='published'
 and exists(select 1 from app_private.import_scopes s where s.active_batch_id=import_batches.id));
alter policy published_aum on app_private.aum_monthly using (
 (select app_private.current_access()) in ('admin','reader')
 and exists(select 1 from app_private.import_batches b where b.id=batch_id));
alter policy published_revenue on app_private.revenue_entries using (
 (select app_private.current_access()) in ('admin','reader')
 and exists(select 1 from app_private.import_batches b where b.id=batch_id));
commit;
