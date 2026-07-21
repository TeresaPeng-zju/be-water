create table if not exists public.customer_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  event_type text not null check (
    event_type in (
      'Inquiry',
      'Conversation',
      'Paid',
      'Delivery',
      'Revision',
      'Follow-up',
      'Customer action',
      'Repeat purchase',
      'Referral',
      'Question',
      'Note'
    )
  ),
  title text not null check (char_length(title) >= 2),
  detail text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  note_type text not null check (
    note_type in ('Customer quote', 'Outcome', 'Response', 'General note')
  ),
  body text not null check (char_length(body) >= 2),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  note text not null check (char_length(note) >= 2),
  scheduled_for timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_events_customer_date_idx
  on public.customer_events(customer_id, occurred_at desc);
create index if not exists customer_feedback_customer_date_idx
  on public.customer_feedback(customer_id, occurred_at desc);
create index if not exists customer_follow_ups_customer_date_idx
  on public.customer_follow_ups(customer_id, scheduled_for desc);

alter table public.customer_events enable row level security;
alter table public.customer_feedback enable row level security;
alter table public.customer_follow_ups enable row level security;

create policy "Users manage their own customer events"
  on public.customer_events for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own customer feedback"
  on public.customer_feedback for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own customer follow-ups"
  on public.customer_follow_ups for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
