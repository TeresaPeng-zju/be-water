create table if not exists public.business_observation_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  observation_key text not null check (
    char_length(observation_key) >= 2
    and char_length(observation_key) <= 80
  ),
  discovered_at timestamptz not null default now(),
  experiment_status text not null default 'Not Started' check (
    experiment_status in ('Not Started', 'Running', 'Completed')
  ),
  experiment_started_at timestamptz,
  experiment_completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, observation_key)
);

alter table public.business_observation_states enable row level security;

create policy "Users manage their own business observation states"
  on public.business_observation_states for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
