create table if not exists public.business_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  raw_text text not null check (char_length(raw_text) between 5 and 50000),
  occurred_at timestamptz,
  customer_id uuid,
  order_id uuid references public.orders(id) on delete set null,
  extraction_status text not null default 'pending' check (extraction_status in ('pending','processing','needs_confirmation','confirmed','failed')),
  extraction_json jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid not null references public.business_records(id) on delete cascade,
  customer_id uuid,
  order_id uuid references public.orders(id) on delete set null,
  fact_type text not null,
  value_json jsonb not null,
  evidence_text text not null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  status text not null default 'inferred' check (status in ('inferred','confirmed','rejected','superseded')),
  occurred_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  record_id uuid references public.business_records(id) on delete set null,
  event_type text not null,
  title text not null,
  summary text,
  evidence_json jsonb not null default '[]'::jsonb,
  occurred_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists business_records_user_created_idx on public.business_records(user_id, created_at desc);
create index if not exists business_facts_order_idx on public.business_facts(order_id, created_at);
create index if not exists activity_events_order_idx on public.activity_events(order_id, occurred_at);

alter table public.business_records enable row level security;
alter table public.business_facts enable row level security;
alter table public.activity_events enable row level security;

create policy "Users manage their records" on public.business_records for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their facts" on public.business_facts for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their activity events" on public.activity_events for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
