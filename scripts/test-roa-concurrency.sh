#!/usr/bin/env bash
# Exclusivamente el clúster privado efímero del runner; nunca acepta URL.
set -euo pipefail
pg_bin="$1"
test_root="$2"
"$pg_bin/createdb" app_papa_roa_race
export PGDATABASE=app_papa_roa_race
sed '/^create role /d' tests/database/bootstrap.sql | "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q
for migration in supabase/migrations/*.sql; do
 sed '/^create role app_papa_executor /d' "$migration" | "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q
done
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -v roa_race=1 -f tests/database/quarterly-roa.test.sql
reviewed_rate="$("$pg_bin/psql" -X -Atq -v ON_ERROR_STOP=1 -c "select id from app_private.roa_rate_versions where account_id='20000000-0000-0000-0000-000000000001' order by revision desc limit 1")"
for attempt in 1 2; do
 (
 "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q > "$test_root/roa-$attempt.log" 2>&1 <<SQL
begin;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select public.publish_roa_rate('96000000-0000-0000-0000-00000000000$attempt','90000000-0000-0000-0000-000000000003','$reviewed_rate','Carrera SINTETICA revisada');
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
 cat "$test_root"/roa-*.log; exit 1
fi
if ! grep -q 'Rate changed; review again' "$test_root"/roa-*.log; then cat "$test_root"/roa-*.log; exit 1; fi
winning_id="$("$pg_bin/psql" -X -Atq -v ON_ERROR_STOP=1 -c "select id from app_private.roa_rate_versions where id in ('96000000-0000-0000-0000-000000000001','96000000-0000-0000-0000-000000000002')")"
for attempt in 1 2; do
 (
 "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q > "$test_root/roa-retry-$attempt.log" 2>&1 <<SQL
begin;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select public.publish_roa_rate('$winning_id','90000000-0000-0000-0000-000000000003','$reviewed_rate','Carrera SINTETICA revisada');
commit;
SQL
 ) &
 if [ "$attempt" = 1 ]; then first_pid=$!; else second_pid=$!; fi
done
wait "$first_pid" || { cat "$test_root"/roa-retry-*.log; exit 1; }
wait "$second_pid" || { cat "$test_root"/roa-retry-*.log; exit 1; }
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q <<'SQL'
do $$ begin
 assert (select count(*)=1 from app_private.roa_rate_versions where id in ('96000000-0000-0000-0000-000000000001','96000000-0000-0000-0000-000000000002'));
end $$;
SQL
"$pg_bin/dropdb" app_papa_roa_race
echo 'OK ROA concurrencia: una publicación por revisión y retries simultáneos idempotentes.'
