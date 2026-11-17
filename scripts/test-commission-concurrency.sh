#!/usr/bin/env bash
# Exclusivamente el clúster privado efímero del runner; nunca acepta URL.
set -euo pipefail
pg_bin="$1"
test_root="$2"
"$pg_bin/createdb" app_papa_commission_race
export PGDATABASE=app_papa_commission_race
sed '/^create role /d' tests/database/bootstrap.sql | "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q
for migration in supabase/migrations/*.sql; do
  sed '/^create role app_papa_executor /d' "$migration" | "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q
done
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -v commission_race=1 -f tests/database/commissions.test.sql
for attempt in 1 2; do
 (
  "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q > "$test_root/commission-$attempt.log" 2>&1 <<SQL
begin;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select public.manage_commission('96000000-0000-0000-0000-00000000000$attempt','reconcile','95000000-0000-0000-0000-00000000000$attempt',
 '{"expected_id":"94000000-0000-0000-0000-00000000000$attempt","receipt_ids":["92000000-0000-0000-0000-000000000001"],"review_complete":true,"reason":"Carrera SINTETICA"}');
select pg_sleep(0.3);
commit;
SQL
 ) &
 if [ "$attempt" = 1 ]; then first_pid=$!; else second_pid=$!; fi
done
first_status=0; second_status=0
wait "$first_pid" || first_status=$?
wait "$second_pid" || second_status=$?
if ! { [ "$first_status" = 0 ] && [ "$second_status" != 0 ]; } && ! { [ "$second_status" = 0 ] && [ "$first_status" != 0 ]; }; then
 cat "$test_root"/commission-*.log; exit 1
fi
if ! grep -q 'Revenue already assigned to another obligation' "$test_root"/commission-*.log; then cat "$test_root"/commission-*.log; exit 1; fi
# Reintentos simultáneos del mismo evento no crean versiones nuevas.
for attempt in 1 2; do
 (
 "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q > "$test_root/commission-retry-$attempt.log" 2>&1 <<'SQL'
begin;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select public.manage_commission(id,operation,target_id,input) from app_private.commission_events where id in ('96000000-0000-0000-0000-000000000001','96000000-0000-0000-0000-000000000002');
commit;
SQL
 ) &
 if [ "$attempt" = 1 ]; then first_pid=$!; else second_pid=$!; fi
done
wait "$first_pid" || { cat "$test_root"/commission-retry-*.log; exit 1; }
wait "$second_pid" || { cat "$test_root"/commission-retry-*.log; exit 1; }
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q <<'SQL'
do $$ begin
 assert (select count(*)=1 from app_private.commission_events where id in ('96000000-0000-0000-0000-000000000001','96000000-0000-0000-0000-000000000002'));
end $$;
SQL
"$pg_bin/dropdb" app_papa_commission_race
echo 'OK: dos conciliaciones concurrentes no asignan dos veces Revenue; retries concurrentes idempotentes.'
