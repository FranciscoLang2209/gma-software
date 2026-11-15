begin;

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
create schema app_private;
revoke all on schema app_private from public, anon, authenticated, service_role;
alter default privileges in schema app_private revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema app_private revoke execute on functions from public, anon, authenticated, service_role;
set local search_path = app_private, extensions, pg_catalog;

create domain month_start as date check (isfinite(value) and extract(day from value) = 1);
-- Sin escala fija: no redondear silenciosamente valores importados.
create domain exact_decimal as numeric check (value not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric));

create table user_profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  role text not null check (role in ('admin', 'reader')),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete restrict
);

create table custodians (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);
create table commercial_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);
create table commercial_advisors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);
create table accounts (
  id uuid primary key default gen_random_uuid(),
  custodian_id uuid not null references custodians(id) on delete restrict,
  client_id uuid references clients(id) on delete restrict,
  service text not null default 'sin_clasificar' check (btrim(service) <> ''),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (id, custodian_id)
);

-- La unidad de reemplazo es un mes completo de UNA fuente y UN custodio.
create table import_scopes (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('aum', 'revenue', 'fa')),
  period month_start not null,
  custodian_id uuid not null references custodians(id) on delete restrict,
  active_batch_id uuid,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (source, period, custodian_id),
  unique (id, source, period, custodian_id)
);
create table import_batches (
  id uuid primary key default gen_random_uuid(),
  scope_id uuid not null,
  source text not null,
  period month_start not null,
  custodian_id uuid not null,
  version integer not null check (version > 0),
  idempotency_key uuid not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'validating', 'needs_resolution', 'ready', 'failed', 'published')),
  storage_bucket text not null default 'app-papa-imports' check (storage_bucket = 'app-papa-imports'),
  storage_object_path text not null check (btrim(storage_object_path) <> '' and storage_object_path !~ '^[a-zA-Z]+://'),
  file_name_original text not null,
  file_sha256 text not null check (file_sha256 ~ '^[0-9a-f]{64}$'),
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  row_count integer not null default 0 check (row_count >= 0),
  blocking_error_count integer not null default 0 check (blocking_error_count >= 0),
  metric_total_usd exact_decimal,
  metric_value_count integer check (metric_value_count >= 0),
  totals jsonb not null default '{}' check (jsonb_typeof(totals) = 'object'),
  errors jsonb not null default '[]' check (jsonb_typeof(errors) = 'array'),
  parsing_conventions jsonb not null default '{}' check (jsonb_typeof(parsing_conventions) = 'object'),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete restrict,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  foreign key (scope_id, source, period, custodian_id) references import_scopes(id, source, period, custodian_id) on delete restrict,
  unique (scope_id, version),
  unique (scope_id, idempotency_key),
  unique (id, scope_id),
  unique (id, source, period, custodian_id),
  check ((reviewed_at is null) = (reviewed_by is null)),
  check ((status = 'published' and published_at is not null and published_by is not null)
    or (status <> 'published' and published_at is null and published_by is null))
);
alter table import_scopes add foreign key (active_batch_id, id) references import_batches(id, scope_id) on delete restrict;

create function cells_are_text(cells jsonb) returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(cells) = 'object' and not exists (
    select 1 from jsonb_each(cells) where jsonb_typeof(value) not in ('string', 'null')
  )
$$;

create table import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references import_batches(id) on delete restrict,
  sheet_name text not null check (btrim(sheet_name) <> ''),
  row_number integer not null check (row_number > 0),
  original_cells jsonb not null check (cells_are_text(original_cells)),
  cell_metadata jsonb not null default '{}' check (jsonb_typeof(cell_metadata) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'valid', 'error')),
  errors jsonb not null default '[]' check (jsonb_typeof(errors) = 'array'),
  created_at timestamptz not null default now(),
  unique (batch_id, sheet_name, row_number),
  unique (id, batch_id)
);

create table account_identifiers (
  id uuid primary key default gen_random_uuid(),
  account_id uuid,
  custodian_id uuid references custodians(id) on delete restrict,
  source text not null check (source in ('aum', 'revenue', 'fa', 'manual')),
  namespace text not null check (btrim(namespace) <> ''),
  value_original text not null check (btrim(value_original) <> ''),
  -- Normalización v1 = identidad. No quitar espacios, signos ni ceros sin contrato.
  value_normalized text generated always as (value_original) stored,
  resolution_status text not null default 'pending' check (resolution_status in ('pending', 'resolved')),
  evidence text,
  source_row_id uuid references import_rows(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  foreign key (account_id, custodian_id) references accounts(id, custodian_id) on delete restrict,
  check ((resolution_status = 'resolved' and account_id is not null and custodian_id is not null and nullif(btrim(evidence), '') is not null)
    or (resolution_status = 'pending' and account_id is null))
);
create unique index identifiers_resolved_key on account_identifiers(source, namespace, custodian_id, value_normalized) where resolution_status = 'resolved';

create table advisor_group_memberships (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references commercial_advisors(id) on delete restrict,
  group_id uuid not null references commercial_groups(id) on delete restrict,
  valid_from date not null check (isfinite(valid_from)),
  valid_to date check (isfinite(valid_to)),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  is_primary boolean not null default true,
  evidence text not null check (btrim(evidence) <> ''),
  source_row_id uuid references import_rows(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (advisor_id with =, valid_during with &&) where (is_primary)
);
create table account_assignments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete restrict,
  advisor_id uuid not null references commercial_advisors(id) on delete restrict,
  valid_from date not null check (isfinite(valid_from)),
  valid_to date check (isfinite(valid_to)),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  is_primary boolean not null default true,
  evidence text not null check (btrim(evidence) <> ''),
  source_row_id uuid references import_rows(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (account_id with =, valid_during with &&) where (is_primary)
);

create table aum_monthly (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  custodian_id uuid not null,
  period month_start not null,
  source text generated always as ('aum'::text) stored,
  batch_id uuid not null,
  import_row_id uuid not null unique,
  value_usd exact_decimal,
  value_original text,
  created_at timestamptz not null default now(),
  foreign key (account_id, custodian_id) references accounts(id, custodian_id) on delete restrict,
  foreign key (batch_id, source, period, custodian_id) references import_batches(id, source, period, custodian_id) on delete restrict,
  foreign key (import_row_id, batch_id) references import_rows(id, batch_id) on delete restrict,
  unique (batch_id, account_id, period),
  check (value_usd is null or nullif(btrim(value_original), '') is not null)
);
create table revenue_entries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  custodian_id uuid not null,
  period month_start not null,
  source text generated always as ('revenue'::text) stored,
  batch_id uuid not null,
  import_row_id uuid not null unique,
  custodian_original text,
  month_original text,
  year_original text,
  account_original text,
  name_original text,
  advisor_name_original text,
  adv_name_sec_original text,
  rel_2nd_original text,
  nacho_gma_original text,
  ip_original text,
  ip_payment_original text,
  pago_ok_original text,
  buy_sell_original text,
  asset_original text,
  quantity_original text,
  description_original text,
  cusip_original text,
  price_original text,
  ticket_original text,
  ticket_o_original text,
  service_charge_original text,
  gross_original text,
  total_original text,
  payout_broker_original text,
  payout_medina_base_original text,
  final_payout_medina_percent_original text,
  payout_medina_original text,
  payout_rep_percent_original text,
  net_payout_rep_original text,
  payout_broker_usd exact_decimal,
  created_at timestamptz not null default now(),
  foreign key (account_id, custodian_id) references accounts(id, custodian_id) on delete restrict,
  foreign key (batch_id, source, period, custodian_id) references import_batches(id, source, period, custodian_id) on delete restrict,
  foreign key (import_row_id, batch_id) references import_rows(id, batch_id) on delete restrict,
  check (payout_broker_usd is null or nullif(btrim(payout_broker_original), '') is not null)
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default clock_timestamp(),
  actor_id uuid references auth.users(id) on delete restrict,
  database_role text not null default current_user,
  action text not null,
  entity_table text not null,
  entity_id uuid not null,
  before_data jsonb,
  after_data jsonb
);

create index accounts_custodian on accounts(custodian_id);
create index accounts_client on accounts(client_id);
create index identifiers_account on account_identifiers(account_id);
create index identifiers_pending on account_identifiers(source, namespace, value_normalized) where resolution_status = 'pending';
create index assignments_advisor on account_assignments(advisor_id);
create index memberships_group on advisor_group_memberships(group_id);
create index aum_account_period on aum_monthly(account_id, period);
create index aum_period_custodian on aum_monthly(period, custodian_id, batch_id);
create index revenue_account_period on revenue_entries(account_id, period);
create index revenue_period_custodian on revenue_entries(period, custodian_id, batch_id);
create index revenue_batch on revenue_entries(batch_id);
create index audit_entity on audit_events(entity_table, entity_id, occurred_at);
create index batches_custodian_period on import_batches(custodian_id, period);

-- Toda modificación de filas toma el mismo lock que la publicación.
create function guard_import_detail() returns trigger language plpgsql set search_path = '' as $$
declare target_batch uuid; batch_status text;
begin
  if tg_op = 'DELETE' then raise exception 'Import history cannot be deleted'; end if;
  if tg_op = 'UPDATE' and (new.batch_id <> old.batch_id or new.id <> old.id) then
    raise exception 'Import provenance cannot be moved';
  end if;
  if tg_table_name = 'import_rows' and tg_op = 'UPDATE' then
    if (new.sheet_name, new.row_number, new.original_cells, new.cell_metadata, new.created_at)
      is distinct from (old.sheet_name, old.row_number, old.original_cells, old.cell_metadata, old.created_at) then
      raise exception 'Original cells and provenance are immutable; create another import';
    end if;
  end if;
  target_batch := new.batch_id;
  select status into batch_status from app_private.import_batches where id = target_batch for update;
  if batch_status = 'published' then raise exception 'Published import is immutable'; end if;
  return new;
end $$;
create trigger guard_rows before insert or update or delete on import_rows for each row execute function guard_import_detail();
create trigger guard_aum before insert or update or delete on aum_monthly for each row execute function guard_import_detail();
create trigger guard_revenue before insert or update or delete on revenue_entries for each row execute function guard_import_detail();

create function guard_batch() returns trigger language plpgsql set search_path = '' as $$
declare actual_total numeric; actual_values integer;
begin
  if tg_op = 'DELETE' then raise exception 'Import history cannot be deleted'; end if;
  if tg_op = 'INSERT' and new.status = 'published' then raise exception 'Publish explicitly after validation'; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'published' then raise exception 'Published batch is immutable'; end if;
    if (new.id, new.scope_id, new.source, new.period, new.custodian_id, new.version, new.idempotency_key,
        new.storage_bucket, new.storage_object_path, new.file_name_original, new.file_sha256, new.file_size_bytes, new.created_by, new.created_at)
      is distinct from
       (old.id, old.scope_id, old.source, old.period, old.custodian_id, old.version, old.idempotency_key,
        old.storage_bucket, old.storage_object_path, old.file_name_original, old.file_sha256, old.file_size_bytes, old.created_by, old.created_at) then
      raise exception 'Batch identity and source file are immutable';
    end if;
    if new.status = 'published' then
      if old.status <> 'ready' or new.reviewed_by is null or new.blocking_error_count <> 0 or new.errors <> '[]'::jsonb or new.row_count = 0 then
        raise exception 'Batch must be reviewed, nonempty and free of blocking errors';
      end if;
      if (select count(*) from app_private.import_rows where batch_id = new.id) <> new.row_count
        or exists (select 1 from app_private.import_rows where batch_id = new.id and (status <> 'valid' or errors <> '[]'::jsonb)) then
        raise exception 'All rows must be reconciled and valid';
      end if;
      if new.source = 'aum' and (select count(*) from app_private.aum_monthly where batch_id = new.id) <> new.row_count then
        raise exception 'Every AUM row requires a resolved account';
      elsif new.source = 'revenue' and (select count(*) from app_private.revenue_entries where batch_id = new.id) <> new.row_count then
        raise exception 'Every Revenue row requires a resolved account';
      elsif new.source = 'fa' then
        raise exception 'FA publication requires the future reviewed assignment workflow';
      end if;
      if new.source = 'aum' then
        select sum(value_usd), count(value_usd) into actual_total, actual_values from app_private.aum_monthly where batch_id = new.id;
      else
        select sum(payout_broker_usd), count(payout_broker_usd) into actual_total, actual_values from app_private.revenue_entries where batch_id = new.id;
      end if;
      if new.metric_total_usd is distinct from actual_total or new.metric_value_count is distinct from actual_values then
        raise exception 'Reviewed metric total and coverage must match stored rows';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger guard_batches before insert or update or delete on import_batches for each row execute function guard_batch();

create function guard_scope() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'Import scope history cannot be deleted'; end if;
  if tg_op = 'UPDATE' and (new.id, new.source, new.period, new.custodian_id, new.created_at, new.created_by)
    is distinct from (old.id, old.source, old.period, old.custodian_id, old.created_at, old.created_by) then
    raise exception 'Scope identity is immutable';
  end if;
  if new.active_batch_id is null then
    if tg_op = 'UPDATE' and old.active_batch_id is not null then raise exception 'Cannot unpublish by clearing scope'; end if;
  elsif not exists (select 1 from app_private.import_batches where id = new.active_batch_id and scope_id = new.id and status = 'published') then
    raise exception 'Active batch must be published in this scope';
  end if;
  return new;
end $$;
create trigger guard_scopes before insert or update or delete on import_scopes for each row execute function guard_scope();

-- API interna del modelo, sin permisos de ejecución para roles de aplicación.
create function publish_import(target_id uuid, expected_active_id uuid, actor uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare target_scope uuid; current_id uuid; target_status text;
begin
  if auth.uid() is distinct from actor or not exists (select 1 from app_private.user_profiles where id = actor and role = 'admin' and enabled) then
    raise exception 'Enabled administrator required';
  end if;
  select scope_id into strict target_scope from app_private.import_batches where id = target_id;
  select active_batch_id into current_id from app_private.import_scopes where id = target_scope for update;
  select status into target_status from app_private.import_batches where id = target_id for update;
  if current_id = target_id then return target_id; end if;
  if current_id is distinct from expected_active_id then raise exception 'Active version changed; review again'; end if;
  if target_status <> 'ready' then raise exception 'Ready batch required; restore history as a new version'; end if;
  update app_private.import_batches set status = 'published', published_at = clock_timestamp(), published_by = actor where id = target_id;
  update app_private.import_scopes set active_batch_id = target_id where id = target_scope;
  insert into app_private.audit_events(actor_id, action, entity_table, entity_id, before_data, after_data)
    values (actor, 'publish', 'import_scopes', target_scope,
      jsonb_build_object('active_batch_id', current_id), jsonb_build_object('active_batch_id', target_id));
  return target_id;
end $$;

create function record_change() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into app_private.audit_events(actor_id, action, entity_table, entity_id, before_data, after_data)
    values (auth.uid(), tg_op, tg_table_name, coalesce(new.id, old.id),
      case when tg_op <> 'INSERT' then to_jsonb(old) end,
      case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
create function deny_history_change() returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'History is append-only';
end $$;
create trigger audit_append_only before update or delete on audit_events for each row execute function deny_history_change();
create trigger assignment_no_delete before delete on account_assignments for each row execute function deny_history_change();
create trigger membership_no_delete before delete on advisor_group_memberships for each row execute function deny_history_change();

do $$
declare t text;
begin
  foreach t in array array['user_profiles','custodians','clients','commercial_groups','commercial_advisors','accounts',
    'account_identifiers','advisor_group_memberships','account_assignments','import_scopes','import_batches'] loop
    execute format('create trigger audit_change after insert or update or delete on app_private.%I for each row execute function app_private.record_change()', t);
  end loop;
  for t in select tablename from pg_tables where schemaname = 'app_private' loop
    execute format('alter table app_private.%I enable row level security', t);
    execute format('alter table app_private.%I force row level security', t);
  end loop;
end $$;

create view aum_current with (security_invoker = true) as
select a.* from aum_monthly a join import_batches b on b.id = a.batch_id
join import_scopes s on s.id = b.scope_id and s.active_batch_id = b.id;
create view revenue_current with (security_invoker = true) as
select r.* from revenue_entries r join import_batches b on b.id = r.batch_id
join import_scopes s on s.id = b.scope_id and s.active_batch_id = b.id;

revoke all on all tables in schema app_private from public, anon, authenticated, service_role;
revoke all on all functions in schema app_private from public, anon, authenticated, service_role;
commit;
