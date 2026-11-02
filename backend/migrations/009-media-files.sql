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
