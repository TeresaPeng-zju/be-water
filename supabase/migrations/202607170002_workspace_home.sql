alter table public.schedule_blocks
  add column if not exists completed_at timestamptz;

create table if not exists public.workspace_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_capacity_hours numeric(7, 2) check (
    weekly_capacity_hours > 0 and weekly_capacity_hours <= 168
  ),
  updated_at timestamptz not null default now()
);

alter table public.workspace_settings enable row level security;

create policy "Users manage their own workspace settings"
  on public.workspace_settings for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
