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
