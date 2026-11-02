-- 010-contact-links.sql
-- Adds the TikTok link used by the public contact icons (Call, WhatsApp, Email, Instagram, TikTok, X).
-- Safe to run more than once.
alter table public.company_settings add column if not exists social_tiktok text;
