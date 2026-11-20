#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Solo crea y elimina SU clúster temporal; nunca acepta una URL de conexión.
pg_bin="${APP_PAPA_PG_BIN:-$(pg_config --bindir)}"
test_root="$(mktemp -d /tmp/app-papa-db.XXXXXX)"
cleanup() {
  "$pg_bin/pg_ctl" -D "$test_root/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$test_root"
}
trap cleanup EXIT
"$pg_bin/initdb" -D "$test_root/data" --auth-local=trust --auth-host=reject --no-locale -E UTF8 >/dev/null
"$pg_bin/pg_ctl" -D "$test_root/data" -l "$test_root/postgres.log" -o "-k $test_root -c listen_addresses='' -c port=55439" -w start >/dev/null
export PGHOST="$test_root" PGPORT=55439 PGDATABASE=app_papa_synthetic PGUSER="$(id -un)"
unset PGSERVICE PGOPTIONS PGHOSTADDR PGPASSWORD
"$pg_bin/createdb" "$PGDATABASE"
echo "Base sintética temporal: $PGDATABASE (socket privado, sin TCP)"
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/bootstrap.sql
# Reproducir el operador administrado de Supabase sin privilegios de superusuario.
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -c 'create role app_papa_migration_test login createrole bypassrls;'
"$pg_bin/createdb" -O app_papa_migration_test app_papa_managed_synthetic
sed '/^create role /d' tests/database/bootstrap.sql | "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -U app_papa_migration_test -d app_papa_managed_synthetic
for migration in supabase/migrations/*.sql; do
  "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -U app_papa_migration_test -d app_papa_managed_synthetic -f "$migration"
done
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -d app_papa_managed_synthetic -f tests/database/managed-migrations.test.sql
"$pg_bin/dropdb" app_papa_managed_synthetic
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -c 'drop role app_papa_executor; drop role app_papa_migration_test;'
echo 'OK: migraciones con operador CREATEROLE/BYPASSRLS sin SUPERUSER y permiso temporal retirado.'
for migration in supabase/migrations/*.sql; do
  echo "Aplicando $migration"
  "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f "$migration"
done
# Reproducir Supabase: el operador no puede conceder USAGE de auth al ejecutor.
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -c 'revoke usage on schema auth from app_papa_executor;'
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/schema.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/auth.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/imports.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/publication.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/historical-imports.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/multicustodian-history.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/historical-capacity.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/historical-resolution.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/historical-aum-resolution.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/queries.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/report-capacity.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/accounts.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/commissions.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/master-import.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/quarterly-roa.test.sql
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/quarterly-roa-capacity.test.sql
bash scripts/test-commission-concurrency.sh "$pg_bin" "$test_root"
bash scripts/test-roa-concurrency.sh "$pg_bin" "$test_root"
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/concurrency.sql
# Dos sesiones intentan publicar versiones diferentes con la misma revisión inicial.
for version in 1 2; do
  (
    "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q > "$test_root/race-$version.log" 2>&1 <<SQL
begin;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select app_private.publish_import('60000000-0000-0000-0000-00000000000$version',null,'00000000-0000-0000-0000-000000000001');
select pg_sleep(0.5);
commit;
SQL
  ) &
  if [ "$version" = 1 ]; then first_pid=$!; else second_pid=$!; fi
done
first_status=0; second_status=0
wait "$first_pid" || first_status=$?
wait "$second_pid" || second_status=$?
if ! { [ "$first_status" = 0 ] && [ "$second_status" != 0 ]; } && ! { [ "$second_status" = 0 ] && [ "$first_status" != 0 ]; }; then
  cat "$test_root"/race-*.log
  echo 'Falló la exclusión de publicaciones concurrentes' >&2
  exit 1
fi
if ! grep -q 'Active version changed; review again' "$test_root"/race-*.log; then
  cat "$test_root"/race-*.log
  exit 1
fi
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q <<'SQL'
do $$ begin
  if (select count(*) from app_private.aum_current) <> 1
    or (select count(*) from app_private.import_batches where status='published') <> 1
    or (select count(*) from app_private.audit_events where action='publish') <> 1 then
    raise exception 'Concurrent publish produced inconsistent state';
  end if;
end $$;
SQL
echo 'OK: dos sesiones concurrentes; una publica y la revisión obsoleta se rechaza.'
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -f tests/database/publication-concurrency.sql
# Competencia entre versiones revisadas por la RPC pública (sesiones admin reales SQL).
for version in 1 2; do
  if [ "$version" = 1 ]; then publication_actor='00000000-0000-0000-0000-000000000001'; else publication_actor='00000000-0000-0000-0000-000000000003'; fi
  (
    "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q > "$test_root/workflow-$version.log" 2>&1 <<SQL
begin;
set local request.jwt.claim.sub = '$publication_actor';
set local request.jwt.claims = '{"session_id":"$publication_actor"}';
set local role authenticated;
select public.manage_import(id,'publish',jsonb_build_object('token',review->>'token')) from public.admin_import_batches where idempotency_key='71000000-0000-0000-0000-00000000000$version';
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
  cat "$test_root"/workflow-*.log
  exit 1
fi
if ! grep -q 'Active version changed; review again' "$test_root"/workflow-*.log; then cat "$test_root"/workflow-*.log; exit 1; fi
# Dos publicadores del MISMO lote: ambos reciben éxito, una única publicación.
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q <<'SQL'
\o /dev/null
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set role authenticated;
select public.manage_import(b.id,'review',jsonb_build_object('complete_scope',true,'custodian_id',b.custodian_id,'period',b.period,'expected_active_id',s.active_batch_id))
from public.admin_import_batches b join public.admin_import_scopes s on s.id=b.scope_id where b.idempotency_key='71000000-0000-0000-0000-000000000003';
SQL
for attempt in 1 2; do
  (
    "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q > "$test_root/double-$attempt.log" 2>&1 <<'SQL'
begin;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000001"}';
set local role authenticated;
select public.manage_import(id,'publish',jsonb_build_object('token',review->>'token')) from public.admin_import_batches where idempotency_key='71000000-0000-0000-0000-000000000003';
select pg_sleep(0.3);
commit;
SQL
  ) &
  if [ "$attempt" = 1 ]; then first_pid=$!; else second_pid=$!; fi
done
wait "$first_pid" || { cat "$test_root"/double-*.log; exit 1; }
wait "$second_pid" || { cat "$test_root"/double-*.log; exit 1; }
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q <<'SQL'
do $$ begin
 if (select count(*) from app_private.revenue_current where period='2026-05-01')<>1
  or (select sum(payout_broker_usd) from app_private.revenue_current where period='2026-05-01')<>3
  or (select count(*) from app_private.audit_events e join app_private.import_scopes s on s.id=e.entity_id where e.action='publish' and s.period='2026-05-01')<>2 then
  raise exception 'Workflow race or concurrent retry duplicated versions/events';
 end if;
end $$;
SQL
echo 'OK: RPC pública concurrente, revisión obsoleta y doble publicación del mismo lote.'
bash scripts/test-historical-concurrency.sh "$pg_bin" "$test_root"
"$pg_bin/pg_dump" --schema-only --no-owner --no-privileges > "$test_root/schema.sql"
"$pg_bin/createdb" app_papa_synthetic_restore
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -q -d app_papa_synthetic_restore -f "$test_root/schema.sql"
echo "OK: restricciones, permisos y restauración del esquema desde cero."
