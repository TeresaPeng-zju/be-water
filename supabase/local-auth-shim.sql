-- Local-only compatibility shim for running Supabase migrations on a plain
-- Postgres instance. This is NOT part of the real Supabase stack; it only
-- provides the minimum auth objects the migrations reference so the schema
-- can be created locally.

create extension if not exists pgcrypto;

create schema if not exists auth;

-- Minimal stand-in for Supabase's auth.users table.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  created_at timestamptz not null default now()
);

-- Minimal stand-in for Supabase's auth.uid() helper used by RLS policies.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    current_setting('request.jwt.claim.sub', true),
    ''
  )::uuid;
$$;
