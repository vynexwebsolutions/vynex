-- 012-managed-websites.sql
-- ADMIN-ONLY register of the client websites VYNEX hosts / manages:
-- owner details, hosting details, payments received and the contract (deployment date + length).
-- Nothing here is readable by the public: only administrators (public.is_admin()) can see or change it.
-- Requires public.is_admin() and public.touch_updated_at() from the earlier migrations. Safe to run more than once.

create table if not exists public.managed_websites (
  id                 uuid primary key default gen_random_uuid(),
  site_name          text not null check (char_length(site_name) between 2 and 160),
  website_url        text,
  status             text not null default 'active' check (status in ('active','suspended','terminated')),

  -- owner / client
  owner_name         text not null check (char_length(owner_name) between 2 and 160),
  owner_company      text,
  owner_phone        text,
  owner_alt_phone    text,
  owner_email        text,
  owner_location     text,
  owner_notes        text,

  -- hosting & technical
  host_provider      text,
  hosting_plan       text,
  server_location    text,
  server_ip          text,
  hosting_panel_url  text,
  hosting_account    text,          -- login e-mail / username ONLY. Never store passwords here.
  domain_registrar   text,
  domain_expiry      date,
  ssl_expiry         date,
  platform           text,          -- e.g. HTML/JS + Supabase, WordPress, Laravel ...
  repo_url           text,
  admin_url          text,
  backup_info        text,

  -- contract: it runs from the exact moment of deployment for contract_months
  deployed_at        timestamptz not null,
  contract_months    int not null default 12 check (contract_months between 1 and 120),
  contract_ends_at   timestamptz,   -- filled by trigger below (same clock time, Nairobi)

  -- money
  currency           text not null default 'KES',
  agreed_amount      numeric(12,2) not null default 0 check (agreed_amount >= 0),
  renewal_fee        numeric(12,2),

  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.managed_website_payments (
  id          uuid primary key default gen_random_uuid(),
  website_id  uuid not null references public.managed_websites(id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  paid_at     timestamptz not null default now(),
  method      text,
  reference   text,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists managed_websites_end_idx on public.managed_websites (contract_ends_at);
create index if not exists managed_payments_site_idx on public.managed_website_payments (website_id, paid_at desc);

create or replace function public.set_contract_end()
returns trigger language plpgsql as $$
begin
  new.contract_ends_at := ((new.deployed_at at time zone 'Africa/Nairobi') + make_interval(months => new.contract_months)) at time zone 'Africa/Nairobi';
  return new;
end $$;
drop trigger if exists trg_managed_contract_end on public.managed_websites;
create trigger trg_managed_contract_end before insert or update of deployed_at, contract_months on public.managed_websites
  for each row execute function public.set_contract_end();

drop trigger if exists trg_managed_updated on public.managed_websites;
create trigger trg_managed_updated before update on public.managed_websites
  for each row execute function public.touch_updated_at();

-- Security: admin only. No policy for anon = the public can never read or write these tables.
alter table public.managed_websites         enable row level security;
alter table public.managed_website_payments enable row level security;
revoke all on public.managed_websites, public.managed_website_payments from anon;
-- Tables created after the earlier 'grant ... on all tables' need their own grant, or saving fails with "permission denied".
grant select, insert, update, delete on public.managed_websites, public.managed_website_payments to authenticated;
drop policy if exists "managed sites admin all" on public.managed_websites;
create policy "managed sites admin all" on public.managed_websites for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "managed payments admin all" on public.managed_website_payments;
create policy "managed payments admin all" on public.managed_website_payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
