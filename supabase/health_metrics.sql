create table if not exists health_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('google_health', 'fitbit')),
  provider_user_id text,
  access_token text not null,
  refresh_token text not null,
  scope text,
  expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider)
);

create table if not exists health_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('google_health', 'fitbit')),
  date date not null,
  steps integer,
  calories_out integer,
  activity_calories integer,
  lightly_active_minutes integer,
  fairly_active_minutes integer,
  very_active_minutes integer,
  active_minutes integer,
  active_zone_minutes integer,
  resting_heart_rate integer,
  sleep_minutes integer,
  sleep_efficiency integer,
  readiness_score integer,
  readiness_note text,
  weight_kg numeric,
  body_fat_pct numeric,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, date)
);

do $$
begin
  alter table health_connections drop constraint if exists health_connections_provider_check;
  alter table health_connections
    add constraint health_connections_provider_check
    check (provider in ('google_health', 'fitbit'));

  alter table health_daily_metrics drop constraint if exists health_daily_metrics_provider_check;
  alter table health_daily_metrics
    add constraint health_daily_metrics_provider_check
    check (provider in ('google_health', 'fitbit'));
end $$;

alter table health_daily_metrics
  add column if not exists readiness_score integer,
  add column if not exists readiness_note text;

create or replace function set_health_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists health_connections_updated_at on health_connections;
create trigger health_connections_updated_at
before update on health_connections
for each row execute function set_health_updated_at();

drop trigger if exists health_daily_metrics_updated_at on health_daily_metrics;
create trigger health_daily_metrics_updated_at
before update on health_daily_metrics
for each row execute function set_health_updated_at();

alter table health_connections enable row level security;
alter table health_daily_metrics enable row level security;

drop policy if exists "Allow app read health metrics" on health_daily_metrics;
create policy "Allow app read health metrics"
on health_daily_metrics
for select
to anon
using (true);
