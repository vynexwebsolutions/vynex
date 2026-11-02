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
