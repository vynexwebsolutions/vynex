-- 001-admin-profiles.sql
-- Admin profiles: a user listed here (and signed in with Supabase Auth) is an administrator.
create extension if not exists "pgcrypto";

-- Shared trigger function: keeps updated_at current
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.admin_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'admin',
  created_at  timestamptz not null default now()
);
