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
