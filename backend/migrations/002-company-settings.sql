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
