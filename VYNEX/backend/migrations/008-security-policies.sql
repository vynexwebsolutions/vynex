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
