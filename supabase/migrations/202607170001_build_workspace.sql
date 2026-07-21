create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_type text,
  name text not null check (char_length(name) >= 2),
  standard_price numeric(12, 2) not null check (standard_price > 0),
  currency text not null check (currency in ('CNY', 'USD', 'HKD', 'SGD')),
  standard_delivery_days integer not null check (standard_delivery_days > 0),
  estimated_work_hours numeric(7, 2) not null check (estimated_work_hours > 0),
  rush_supported boolean not null default false,
  rush_delivery_days integer check (rush_delivery_days > 0),
  rush_price numeric(12, 2) check (rush_price > 0),
  created_at timestamptz not null default now(),
  constraint rush_fields_when_supported check (
    (rush_supported and rush_delivery_days is not null and rush_price is not null)
    or
    (not rush_supported and rush_delivery_days is null and rush_price is null)
  )
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  customer_name text not null check (char_length(customer_name) >= 2),
  actual_price numeric(12, 2) not null check (actual_price >= 0),
  order_date date not null,
  delivery_date date not null,
  result text not null check (
    result in ('Completed', 'Still in progress', 'Cancelled', 'Did not proceed')
  ),
  loss_reason text check (
    loss_reason is null
    or loss_reason in ('Delivery time', 'Price', 'Stopped replying', 'Chose another', 'Reason unknown')
  ),
  created_at timestamptz not null default now(),
  constraint delivery_after_order check (delivery_date >= order_date)
);

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  title text not null check (char_length(title) >= 2),
  work_type text not null check (
    work_type in (
      'Preparation',
      'Customer communication',
      'Service delivery',
      'Revision',
      'Follow-up',
      'Content work',
      'Unavailable time'
    )
  ),
  scheduled_date date not null,
  estimated_duration_hours numeric(7, 2) not null check (
    estimated_duration_hours > 0 and estimated_duration_hours <= 24
  ),
  created_at timestamptz not null default now()
);

create index if not exists services_user_id_idx on public.services(user_id);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_service_id_idx on public.orders(service_id);
create index if not exists schedule_blocks_user_date_idx
  on public.schedule_blocks(user_id, scheduled_date);

alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.schedule_blocks enable row level security;

create policy "Users manage their own services"
  on public.services for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own orders"
  on public.orders for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own schedule blocks"
  on public.schedule_blocks for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
