create table if not exists nutrition_ai_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null check (report_type in ('daily', 'weekly')),
  period_start date not null,
  period_end date not null,
  model text not null,
  analysis jsonb not null,
  input_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_type, period_start, period_end)
);

create or replace function set_nutrition_ai_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists nutrition_ai_reports_updated_at on nutrition_ai_reports;
create trigger nutrition_ai_reports_updated_at
before update on nutrition_ai_reports
for each row execute function set_nutrition_ai_reports_updated_at();

alter table nutrition_ai_reports enable row level security;

drop policy if exists "Allow app access to nutrition ai reports" on nutrition_ai_reports;
drop policy if exists "Allow anon read nutrition ai reports" on nutrition_ai_reports;
