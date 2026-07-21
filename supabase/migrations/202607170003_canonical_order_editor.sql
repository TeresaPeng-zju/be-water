create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) >= 2),
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_name_idx
  on public.customers(user_id, name);

alter table public.customers enable row level security;

create policy "Users manage their own customers"
  on public.customers for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.orders
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists status text not null default 'Not Started',
  add column if not exists currency text,
  add column if not exists estimated_work_hours numeric(7, 2),
  add column if not exists rush boolean not null default false,
  add column if not exists rush_fee numeric(12, 2) not null default 0,
  add column if not exists next_action text,
  add column if not exists internal_notes text,
  add column if not exists client_request_id uuid,
  add column if not exists updated_at timestamptz not null default now();

update public.orders
set status = case result
  when 'Completed' then 'Completed'
  when 'Cancelled' then 'Cancelled'
  when 'Did not proceed' then 'Lost'
  else 'In Progress'
end
where customer_id is null;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check check (
    status in (
      'Not Started',
      'In Progress',
      'Waiting Customer',
      'Completed',
      'Cancelled',
      'Lost'
    )
  );

create unique index if not exists orders_client_request_id_idx
  on public.orders(client_request_id)
  where client_request_id is not null;

create index if not exists orders_customer_id_idx
  on public.orders(customer_id);
