-- 013-managed-websites-grants.sql
-- FIX for "access denied" / "permission denied for table managed_websites" when saving in Admin > Managed Websites.
-- The earlier "grant ... on all tables" only covered tables that existed at that moment, so the tables created by
-- 012 never received permission for signed-in users. Row Level Security still limits everything to administrators.
-- Safe to run more than once.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.managed_websites, public.managed_website_payments to authenticated;

-- Make sure the admin check exists and the policies are in place (harmless if they already are).
grant execute on function public.is_admin() to authenticated;
