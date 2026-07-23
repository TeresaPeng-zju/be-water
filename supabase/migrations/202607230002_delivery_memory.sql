-- Canonical delivery memory for BeWater.
-- This migration intentionally creates the new model directly; no legacy backfill is included.

alter table public.orders
  add column if not exists commercial_status text not null default 'lead',
  add column if not exists delivery_status text not null default 'not_started',
  add column if not exists payment_status text not null default 'unknown',
  add column if not exists outcome_status text not null default 'unknown';

alter table public.orders
  drop constraint if exists orders_commercial_status_check,
  drop constraint if exists orders_delivery_status_check,
  drop constraint if exists orders_payment_status_check,
  drop constraint if exists orders_outcome_status_check;

alter table public.orders
  add constraint orders_commercial_status_check check (
    commercial_status in ('lead', 'booked', 'confirmed', 'closed', 'cancelled')
  ),
  add constraint orders_delivery_status_check check (
    delivery_status in ('not_started', 'preparing', 'in_progress', 'delivered', 'accepted')
  ),
  add constraint orders_payment_status_check check (
    payment_status in ('unknown', 'pending', 'partial', 'paid', 'refunded', 'not_applicable')
  ),
  add constraint orders_outcome_status_check check (
    outcome_status in ('unknown', 'awaiting_feedback', 'reported', 'verified')
  );

alter table public.order_state_transitions
  add column if not exists dimension text,
  add column if not exists proposal_source text not null default 'bee',
  add column if not exists prompt_version text;

alter table public.order_state_transitions
  drop constraint if exists order_state_transitions_dimension_check;

alter table public.order_state_transitions
  alter column dimension set not null,
  add constraint order_state_transitions_dimension_check check (
    dimension in ('commercial', 'delivery', 'payment', 'outcome')
  );

create index if not exists order_state_transitions_dimension_idx
  on public.order_state_transitions(order_id, dimension, created_at desc);

create table if not exists public.delivery_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  sequence integer not null default 1 check (sequence > 0),
  label text not null default 'Primary delivery',
  status text not null default 'open'
    check (status in ('planned', 'open', 'completed', 'cancelled')),
  planned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, sequence)
);

create table if not exists public.delivery_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  thread_id uuid not null references public.delivery_threads(id) on delete cascade,
  stage_key text,
  role text not null check (
    role in (
      'client_input',
      'preparation',
      'planned_deliverable',
      'actual_deliverable',
      'customer_outcome',
      'reference'
    )
  ),
  format text not null check (
    format in ('text', 'image', 'document', 'link', 'other')
  ),
  title text not null check (char_length(title) between 1 and 240),
  blob_path text,
  text_content text,
  external_url text,
  metadata jsonb not null default '{}'::jsonb,
  source_asset_id uuid references public.business_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_material_has_content check (
    blob_path is not null or text_content is not null or external_url is not null
  )
);

create table if not exists public.delivery_material_record_links (
  material_id uuid not null references public.delivery_materials(id) on delete cascade,
  record_id uuid not null references public.business_records(id) on delete cascade,
  relation_type text not null default 'supports'
    check (relation_type in ('supports', 'derived_from', 'documents')),
  created_at timestamptz not null default now(),
  primary key (material_id, record_id, relation_type)
);

create table if not exists public.delivery_relation_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null references public.delivery_threads(id) on delete cascade,
  from_material_id uuid not null references public.delivery_materials(id) on delete cascade,
  to_material_id uuid not null references public.delivery_materials(id) on delete cascade,
  relation_type text not null check (relation_type in ('fulfills', 'validates')),
  created_at timestamptz not null default now(),
  unique (from_material_id, to_material_id, relation_type),
  check (from_material_id <> to_material_id)
);

alter table public.business_assets
  add column if not exists service_id uuid references public.services(id) on delete cascade,
  add column if not exists source_material_id uuid references public.delivery_materials(id) on delete set null,
  add column if not exists material_role text,
  add column if not exists material_format text,
  add column if not exists blob_path text,
  add column if not exists text_content text;

create table if not exists public.retrieval_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  source_type text not null check (
    source_type in ('case', 'evidence', 'event', 'outcome', 'material', 'asset')
  ),
  source_id uuid not null,
  source_ref text not null,
  chunk_text text not null,
  content_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz,
  embedding_model text,
  embedding_json jsonb,
  search_document tsvector generated always as (
    to_tsvector('simple', coalesce(chunk_text, ''))
  ) stored,
  status text not null default 'active'
    check (status in ('active', 'stale', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_type, source_id, content_hash)
);

create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_type text not null default 'notebook_observation',
  input_signature text not null,
  prompt_version text not null,
  retrieval_strategy text not null,
  model text,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed', 'fallback')),
  output_json jsonb,
  usage_json jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.analysis_sources (
  run_id uuid not null references public.analysis_runs(id) on delete cascade,
  retrieval_document_id uuid references public.retrieval_documents(id) on delete set null,
  source_ref text not null,
  retrieval_score numeric(6, 5),
  citation_role text not null default 'retrieved'
    check (citation_role in ('retrieved', 'cited', 'excluded')),
  created_at timestamptz not null default now(),
  primary key (run_id, source_ref)
);

create index if not exists delivery_threads_order_idx
  on public.delivery_threads(order_id, sequence);
create index if not exists delivery_materials_order_role_idx
  on public.delivery_materials(order_id, role, created_at);
create index if not exists delivery_materials_service_idx
  on public.delivery_materials(service_id, created_at);
create index if not exists delivery_relation_edges_thread_idx
  on public.delivery_relation_edges(thread_id, relation_type);
create index if not exists retrieval_documents_scope_idx
  on public.retrieval_documents(user_id, service_id, order_id, status);
create index if not exists retrieval_documents_search_idx
  on public.retrieval_documents using gin(search_document);
create index if not exists analysis_runs_user_date_idx
  on public.analysis_runs(user_id, created_at desc);

alter table public.delivery_threads enable row level security;
alter table public.delivery_materials enable row level security;
alter table public.delivery_material_record_links enable row level security;
alter table public.delivery_relation_edges enable row level security;
alter table public.retrieval_documents enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.analysis_sources enable row level security;

create policy "Users manage their delivery threads"
  on public.delivery_threads for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.orders
      where orders.id = delivery_threads.order_id
        and orders.user_id = (select auth.uid())
    )
  );

create policy "Users manage their delivery materials"
  on public.delivery_materials for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.services
      where services.id = delivery_materials.service_id
        and services.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.orders
      where orders.id = delivery_materials.order_id
        and orders.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.delivery_threads
      where delivery_threads.id = delivery_materials.thread_id
        and delivery_threads.user_id = (select auth.uid())
    )
  );

create policy "Users manage their material record links"
  on public.delivery_material_record_links for all
  using (
    exists (
      select 1 from public.delivery_materials
      where delivery_materials.id = delivery_material_record_links.material_id
        and delivery_materials.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.delivery_materials
      where delivery_materials.id = delivery_material_record_links.material_id
        and delivery_materials.user_id = (select auth.uid())
    )
  );

create policy "Users manage their delivery relation edges"
  on public.delivery_relation_edges for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.delivery_materials
      where delivery_materials.id = delivery_relation_edges.from_material_id
        and delivery_materials.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.delivery_materials
      where delivery_materials.id = delivery_relation_edges.to_material_id
        and delivery_materials.user_id = (select auth.uid())
    )
  );

create policy "Users manage their retrieval documents"
  on public.retrieval_documents for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their analysis runs"
  on public.analysis_runs for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their analysis sources"
  on public.analysis_sources for all
  using (
    exists (
      select 1 from public.analysis_runs
      where analysis_runs.id = analysis_sources.run_id
        and analysis_runs.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.analysis_runs
      where analysis_runs.id = analysis_sources.run_id
        and analysis_runs.user_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public, file_size_limit)
values ('delivery-materials', 'delivery-materials', false, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

create policy "Users manage their delivery material files"
  on storage.objects for all
  using (
    bucket_id = 'delivery-materials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'delivery-materials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
