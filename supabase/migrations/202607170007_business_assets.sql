create table if not exists public.business_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_key text,
  title text not null check (char_length(title) >= 2),
  category text not null check (
    category in ('Checklists', 'Templates', 'SOPs', 'Knowledge', 'Potential Products')
  ),
  description text not null,
  origin text not null,
  origin_order_id uuid references public.orders(id) on delete set null,
  maturity text not null default 'Seed' check (
    maturity in ('Seed', 'Growing', 'Validated', 'Product Ready')
  ),
  current_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists business_assets_user_source_idx
  on public.business_assets(user_id, source_key)
  where source_key is not null;

create table if not exists public.business_asset_usages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.business_assets(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  usage_source text not null default 'Recorded' check (
    usage_source in ('Detected', 'Recorded')
  ),
  note text,
  used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (asset_id, order_id)
);

create table if not exists public.business_asset_evolution (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.business_assets(id) on delete cascade,
  event_type text not null check (
    event_type in ('Origin', 'Maturity change', 'Improvement', 'Productization')
  ),
  title text not null check (char_length(title) >= 2),
  detail text,
  version text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists business_asset_usages_asset_date_idx
  on public.business_asset_usages(asset_id, used_at desc);
create index if not exists business_asset_evolution_asset_date_idx
  on public.business_asset_evolution(asset_id, occurred_at desc);

alter table public.business_assets enable row level security;
alter table public.business_asset_usages enable row level security;
alter table public.business_asset_evolution enable row level security;

create policy "Users manage their own business assets"
  on public.business_assets for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own business asset usages"
  on public.business_asset_usages for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.business_assets
      where business_assets.id = business_asset_usages.asset_id
        and business_assets.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.orders
      where orders.id = business_asset_usages.order_id
        and orders.user_id = (select auth.uid())
    )
  );

create policy "Users manage their own business asset evolution"
  on public.business_asset_evolution for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.business_assets
      where business_assets.id = business_asset_evolution.asset_id
        and business_assets.user_id = (select auth.uid())
    )
  );

create or replace function public.record_business_asset_origin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_asset_evolution (
    user_id,
    asset_id,
    event_type,
    title,
    detail,
    version,
    occurred_at
  ) values (
    new.user_id,
    new.id,
    'Origin',
    'Started from repeated customer work',
    new.origin,
    new.current_version,
    new.created_at
  );
  return new;
end;
$$;

drop trigger if exists business_asset_origin_trigger on public.business_assets;
create trigger business_asset_origin_trigger
after insert on public.business_assets
for each row execute function public.record_business_asset_origin();

create or replace function public.refresh_business_asset_maturity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_count integer;
  customer_count integer;
  previous_maturity text;
  next_maturity text;
begin
  select maturity into previous_maturity
  from public.business_assets
  where id = new.asset_id;

  select count(*), count(distinct customer_id)
  into usage_count, customer_count
  from public.business_asset_usages
  where asset_id = new.asset_id;

  next_maturity := case
    when usage_count >= 12 and customer_count >= 5 then 'Product Ready'
    when usage_count >= 8 and customer_count >= 4 then 'Validated'
    when usage_count >= 3 then 'Growing'
    else 'Seed'
  end;

  update public.business_assets
  set maturity = next_maturity,
      updated_at = now()
  where id = new.asset_id;

  if previous_maturity is distinct from next_maturity then
    insert into public.business_asset_evolution (
      user_id,
      asset_id,
      event_type,
      title,
      detail,
      occurred_at
    ) values (
      new.user_id,
      new.asset_id,
      'Maturity change',
      'Moved from ' || previous_maturity || ' to ' || next_maturity,
      usage_count || ' recorded uses across ' || customer_count || ' customers.',
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists business_asset_maturity_trigger on public.business_asset_usages;
create trigger business_asset_maturity_trigger
after insert on public.business_asset_usages
for each row execute function public.refresh_business_asset_maturity();
