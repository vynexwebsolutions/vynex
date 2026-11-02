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
