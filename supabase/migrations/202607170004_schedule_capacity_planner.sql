alter table public.schedule_blocks
  add column if not exists actual_duration_hours numeric(7, 2) check (
    actual_duration_hours is null
    or (actual_duration_hours >= 0 and actual_duration_hours <= 24)
  ),
  add column if not exists updated_at timestamptz not null default now();
