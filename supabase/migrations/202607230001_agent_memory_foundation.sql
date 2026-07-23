-- Agent-ready business memory. This remains relational and evidence-first;
-- vector retrieval can be added later without changing the source-of-truth model.

create table if not exists public.customer_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  source text,
  external_label text not null,
  normalized_label text not null,
  status text not null default 'confirmed'
    check (status in ('candidate', 'confirmed', 'rejected', 'superseded')),
  confidence numeric(4,3) not null default 1
    check (confidence between 0 and 1),
  evidence_record_id uuid references public.business_records(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customer_identities_confirmed_unique_idx
  on public.customer_identities(user_id, source, normalized_label)
  where status = 'confirmed';
create index if not exists customer_identities_customer_idx
  on public.customer_identities(customer_id, created_at);

alter table public.business_records
  add column if not exists source_type_hint text,
  add column if not exists detected_source_type text,
  add column if not exists source_hint_conflict boolean not null default false,
  add column if not exists extraction_prompt_version text;

alter table public.activity_events
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists scheduled_start_at timestamptz,
  add column if not exists scheduled_end_at timestamptz,
  add column if not exists confidence numeric(4,3) check (confidence between 0 and 1),
  add column if not exists next_actions_json jsonb not null default '[]'::jsonb,
  add column if not exists status text not null default 'inferred'
    check (status in ('inferred', 'confirmed', 'rejected', 'superseded'));

create table if not exists public.outcome_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid not null references public.business_records(id) on delete cascade,
  event_id uuid references public.activity_events(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete cascade,
  theme text not null,
  statement text not null,
  verification text not null
    check (verification in ('self_reported', 'observed', 'verified')),
  evidence_text text not null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  status text not null default 'inferred'
    check (status in ('inferred', 'confirmed', 'rejected', 'superseded')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_state_transitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  record_id uuid references public.business_records(id) on delete set null,
  from_state text,
  to_state text not null,
  reason text not null,
  evidence_json jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  status text not null default 'proposed'
    check (status in ('proposed', 'confirmed', 'rejected', 'superseded')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists outcome_claims_order_idx
  on public.outcome_claims(order_id, created_at);
create index if not exists order_state_transitions_order_idx
  on public.order_state_transitions(order_id, created_at);

alter table public.customer_identities enable row level security;
alter table public.outcome_claims enable row level security;
alter table public.order_state_transitions enable row level security;

create policy "Users manage their customer identities"
  on public.customer_identities for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their outcome claims"
  on public.outcome_claims for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their order state transitions"
  on public.order_state_transitions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
