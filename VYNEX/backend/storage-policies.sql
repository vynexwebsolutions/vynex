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
