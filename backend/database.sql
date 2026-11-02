-- database.sql  — COMPLETE SETUP. Paste this whole file into Supabase > SQL Editor > Run.
-- It is the migrations in the right order + helper functions + storage policies.

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

-- database-functions.sql
-- Helper functions used by the security policies and the admin dashboard.

-- True when the signed-in user is listed in admin_profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_profiles where id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Dashboard numbers (admins only).
create or replace function public.dashboard_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  return json_build_object(
    'total_projects',     (select count(*) from public.projects),
    'published_projects', (select count(*) from public.projects where is_published),
    'draft_projects',     (select count(*) from public.projects where not is_published),
    'total_services',     (select count(*) from public.services),
    'total_inquiries',    (select count(*) from public.contact_inquiries),
    'pending_quotes',     (select count(*) from public.quote_requests where status = 'pending'),
    'pending_inquiries',  (select count(*) from public.contact_inquiries where status = 'pending')
  );
end $$;
revoke all on function public.dashboard_stats() from public;
grant execute on function public.dashboard_stats() to authenticated;

-- 002-company-settings.sql
-- A single row (id = 1) holding company details, footer details and watermark settings.
create table if not exists public.company_settings (
  id                  int primary key default 1 check (id = 1),
  name                text default 'VYNEX',
  tagline             text,
  description         text,
  about               text,
  mission             text,
  vision              text,
  email               text,
  phone               text,
  phone_secondary     text,
  whatsapp            text,
  location            text,
  logo_url            text,
  social_facebook     text,
  social_instagram    text,
  social_twitter      text,
  social_linkedin     text,
  social_github       text,
  social_tiktok       text,
  watermark_enabled   boolean not null default false,
  watermark_opacity   numeric not null default 0.35 check (watermark_opacity between 0.05 and 1),
  watermark_size      int not null default 22 check (watermark_size between 5 and 80),
  watermark_position  text not null default 'bottom-right' check (watermark_position in ('top-left','top-right','bottom-left','bottom-right','center')),
  updated_at          timestamptz not null default now()
);
insert into public.company_settings (id) values (1) on conflict (id) do nothing;
drop trigger if exists trg_company_settings_updated on public.company_settings;
create trigger trg_company_settings_updated before update on public.company_settings
  for each row execute function public.touch_updated_at();

-- 003-services.sql
create table if not exists public.services (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (char_length(title) between 2 and 160),
  short_description  text,
  full_description   text,
  icon               text,
  image_url          text,
  image_path         text,
  display_order      int not null default 0,
  is_published       boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists services_order_idx on public.services (display_order);
drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated before update on public.services
  for each row execute function public.touch_updated_at();

-- 004-projects.sql
create table if not exists public.projects (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (char_length(title) between 2 and 200),
  category           text,
  short_description  text,
  full_description   text,
  cover_image_url    text,
  cover_image_path   text,
  technologies       text[] not null default '{}',
  features           text[] not null default '{}',
  completion_info    text,
  live_url           text check (live_url is null or live_url ~* '^https?://'),
  is_featured        boolean not null default false,
  is_published       boolean not null default false,
  show_watermark     boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists projects_published_idx on public.projects (is_published, created_at desc);
drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.touch_updated_at();

-- 005-project-images.sql  (screenshots for each project)
create table if not exists public.project_images (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  image_url       text not null,
  storage_path    text,
  caption         text,
  show_watermark  boolean not null default false,
  display_order   int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists project_images_project_idx on public.project_images (project_id, display_order);

-- 006-testimonials.sql  (only real testimonials entered by the admin)
create table if not exists public.testimonials (
  id             uuid primary key default gen_random_uuid(),
  client_name    text not null,
  client_role    text,
  company        text,
  message        text not null,
  photo_url      text,
  photo_path     text,
  display_order  int not null default 0,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now()
);

-- 007-inquiries.sql  (contact messages and quote requests)
create table if not exists public.contact_inquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(email) <= 160),
  phone       text check (phone is null or char_length(phone) <= 40),
  subject     text check (subject is null or char_length(subject) <= 160),
  message     text not null check (char_length(message) between 10 and 3000),
  status      text not null default 'pending' check (status in ('pending','answered','completed')),
  created_at  timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 120),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(email) <= 160),
  phone         text check (phone is null or char_length(phone) <= 40),
  service       text check (service is null or char_length(service) <= 160),
  budget        text check (budget is null or char_length(budget) <= 80),
  timeline      text check (timeline is null or char_length(timeline) <= 80),
  requirements  text not null check (char_length(requirements) between 15 and 4000),
  status        text not null default 'pending' check (status in ('pending','answered','completed')),
  created_at    timestamptz not null default now()
);
create index if not exists contact_inquiries_created_idx on public.contact_inquiries (created_at desc);
create index if not exists quote_requests_created_idx on public.quote_requests (created_at desc);

-- 008-security-policies.sql
-- Row Level Security: the public may read PUBLISHED content and submit forms (insert only).
-- Only administrators (rows in admin_profiles) can manage anything.
-- Requires public.is_admin() from database-functions.sql.

alter table public.admin_profiles   enable row level security;
alter table public.company_settings enable row level security;
alter table public.services         enable row level security;
alter table public.projects         enable row level security;
alter table public.project_images   enable row level security;
alter table public.testimonials     enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.quote_requests   enable row level security;

-- admin_profiles: an admin can read their own row (needed for login check); only admins manage rows
drop policy if exists "profiles read own" on public.admin_profiles;
create policy "profiles read own" on public.admin_profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles admin all" on public.admin_profiles;
create policy "profiles admin all" on public.admin_profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- company_settings: public read, admin write
drop policy if exists "settings public read" on public.company_settings;
create policy "settings public read" on public.company_settings for select to anon, authenticated using (true);
drop policy if exists "settings admin write" on public.company_settings;
create policy "settings admin write" on public.company_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- services
drop policy if exists "services public read" on public.services;
create policy "services public read" on public.services for select to anon, authenticated using (is_published = true or public.is_admin());
drop policy if exists "services admin write" on public.services;
create policy "services admin write" on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- projects
drop policy if exists "projects public read" on public.projects;
create policy "projects public read" on public.projects for select to anon, authenticated using (is_published = true or public.is_admin());
drop policy if exists "projects admin write" on public.projects;
create policy "projects admin write" on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- project_images: visible only when the parent project is published
drop policy if exists "project images public read" on public.project_images;
create policy "project images public read" on public.project_images for select to anon, authenticated
  using (public.is_admin() or exists (select 1 from public.projects p where p.id = project_id and p.is_published = true));
drop policy if exists "project images admin write" on public.project_images;
create policy "project images admin write" on public.project_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- testimonials
drop policy if exists "testimonials public read" on public.testimonials;
create policy "testimonials public read" on public.testimonials for select to anon, authenticated using (is_published = true or public.is_admin());
drop policy if exists "testimonials admin write" on public.testimonials;
create policy "testimonials admin write" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- contact_inquiries / quote_requests: public INSERT only (always as 'pending'); admin does the rest
drop policy if exists "inquiries public insert" on public.contact_inquiries;
create policy "inquiries public insert" on public.contact_inquiries for insert to anon, authenticated with check (status = 'pending');
drop policy if exists "inquiries admin all" on public.contact_inquiries;
create policy "inquiries admin all" on public.contact_inquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quotes public insert" on public.quote_requests;
create policy "quotes public insert" on public.quote_requests for insert to anon, authenticated with check (status = 'pending');
drop policy if exists "quotes admin all" on public.quote_requests;
create policy "quotes admin all" on public.quote_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Table privileges (RLS still applies on top of these)
grant usage on schema public to anon, authenticated;
grant select on public.company_settings, public.services, public.projects, public.project_images, public.testimonials to anon;
grant insert on public.contact_inquiries, public.quote_requests to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- 009-media-files.sql  (register of images uploaded through the admin panel)
create table if not exists public.media_files (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  url           text not null,
  storage_path  text not null unique,
  folder        text not null default 'general',
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);
alter table public.media_files enable row level security;
grant select, insert, update, delete on public.media_files to authenticated;
drop policy if exists "media admin all" on public.media_files;
create policy "media admin all" on public.media_files for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- storage-policies.sql
-- Creates the public "website-images" bucket (anyone can VIEW images; only admins can upload/change/delete).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('website-images', 'website-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update set public = true, file_size_limit = 5242880;

drop policy if exists "website-images public read" on storage.objects;
create policy "website-images public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'website-images');

drop policy if exists "website-images admin insert" on storage.objects;
create policy "website-images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'website-images' and public.is_admin());

drop policy if exists "website-images admin update" on storage.objects;
create policy "website-images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'website-images' and public.is_admin());

drop policy if exists "website-images admin delete" on storage.objects;
create policy "website-images admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'website-images' and public.is_admin());

-- 010-contact-links.sql
-- Adds the TikTok link used by the public contact icons (Call, WhatsApp, Email, Instagram, TikTok, X).
-- Safe to run more than once.
alter table public.company_settings add column if not exists social_tiktok text;

-- 012-managed-websites.sql (admin-only hosted websites register)
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
