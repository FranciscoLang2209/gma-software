#!/usr/bin/env bash
# Invocado únicamente dentro del clúster efímero de test-database.sh.
set -euo pipefail
pg_bin="$1"
test_root="$2"
"$pg_bin/createdb" app_papa_history_race
export PGDATABASE=app_papa_history_race
sed '/^create role /d' tests/database/bootstrap.sql | "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q
for migration in supabase/migrations/*.sql; do
  sed '/^create role app_papa_executor /d' "$migration" | "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q
done
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -v history_race=1 -f tests/database/historical-imports.test.sql
for version in 1 2; do
  (
    "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q > "$test_root/history-race-$version.log" 2>&1 <<SQL
begin;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select public.manage_historical(id,'publish',jsonb_build_object('token',review->>'token'))
 from public.admin_import_uploads where id='72000000-0000-0000-0000-00000000000$version';
select pg_sleep(0.3);
commit;
SQL
  ) &
  if [ "$version" = 1 ]; then first_pid=$!; else second_pid=$!; fi
done
first_status=0; second_status=0
wait "$first_pid" || first_status=$?
wait "$second_pid" || second_status=$?
if ! { [ "$first_status" = 0 ] && [ "$second_status" != 0 ]; } && ! { [ "$second_status" = 0 ] && [ "$first_status" != 0 ]; }; then
  cat "$test_root"/history-race-*.log
  exit 1
fi
if ! grep -q 'Active version changed; review again' "$test_root"/history-race-*.log; then cat "$test_root"/history-race-*.log; exit 1; fi
# Pérdida de respuesta: dos reintentos simultáneos de la ganadora no reactivan ni duplican.
for attempt in 1 2; do
  (
    "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q > "$test_root/history-retry-$attempt.log" 2>&1 <<'SQL'
begin;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select public.manage_historical(id,'publish',jsonb_build_object('token',review->>'token')) from public.admin_import_uploads
 where id in ('72000000-0000-0000-0000-000000000001','72000000-0000-0000-0000-000000000002') and status='published';
commit;
SQL
  ) &
  if [ "$attempt" = 1 ]; then first_pid=$!; else second_pid=$!; fi
done
wait "$first_pid" || { cat "$test_root"/history-retry-*.log; exit 1; }
wait "$second_pid" || { cat "$test_root"/history-retry-*.log; exit 1; }
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q <<'SQL'
do $$ begin
 assert (select count(*)=1 from app_private.import_uploads where id in ('72000000-0000-0000-0000-000000000001','72000000-0000-0000-0000-000000000002') and status='published');
 assert (select count(distinct b.upload_id)=1 and count(*)=3 from app_private.import_scopes s join app_private.import_batches b on b.id=s.active_batch_id where s.custodian_id='10000000-0000-0000-0000-000000000001');
 assert (select count(*)=15 from app_private.audit_events where action='publish');
end $$;
SQL
"$pg_bin/dropdb" app_papa_history_race
echo 'OK: cargas históricas concurrentes sin mezcla de períodos y reintentos simultáneos idempotentes.'
