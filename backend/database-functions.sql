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
