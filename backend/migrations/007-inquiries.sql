-- 007-inquiries.sql  (contact messages and quote requests)
create table if not exists public.contact_inquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(email) <= 160),
  phone       text check (phone is null or char_length(phone) <= 40),
  subject     text check (subject is null or char_length(subject) <= 160),
  message     text not null check (char_length(message) between 10 and 3000),
  status      text not null default 'pending' check (status in ('pending','answered','completed')),
  created_at  timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 120),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(email) <= 160),
  phone         text check (phone is null or char_length(phone) <= 40),
  service       text check (service is null or char_length(service) <= 160),
  budget        text check (budget is null or char_length(budget) <= 80),
  timeline      text check (timeline is null or char_length(timeline) <= 80),
  requirements  text not null check (char_length(requirements) between 15 and 4000),
  status        text not null default 'pending' check (status in ('pending','answered','completed')),
  created_at    timestamptz not null default now()
);
create index if not exists contact_inquiries_created_idx on public.contact_inquiries (created_at desc);
create index if not exists quote_requests_created_idx on public.quote_requests (created_at desc);
