-- backend/seed-business.sql
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- Puts the services and contact details from the VYNEX business card into the database,
-- so the website and admin panel show the same information.

-- 1) Contact details + tagline
update public.company_settings set
  name        = 'VYNEX',
  tagline     = 'Your Vision | Our Code | Your Success',
  description = 'VYNEX Web Solutions builds quality websites at affordable prices for clients in Kenya and internationally.',
  email       = 'vynexwebsolutions@gmail.com',
  phone       = '+254 742 210 239',
  whatsapp    = '+254 181 971 409',
  location    = 'Kenya · serving clients worldwide'
where id = 1;

-- 2) The ten website services from the business card (icon = icon name used by the site)
delete from public.services where title in (select title from (values

  ('Website Design & Development'),
  ('Business & Corporate Websites'),
  ('E-Commerce Websites'),
  ('Responsive & Mobile-Friendly Websites'),
  ('Website Redesign & Updates'),
  ('Domain & Hosting Setup'),
  ('Website Deployment'),
  ('Website Maintenance & Support'),
  ('Website Security & Optimization'),
  ('SEO & Performance Optimization')
) as t(title));

insert into public.services (title, short_description, icon, display_order, is_published) values
  ('Website Design & Development', 'Custom-designed, fast websites built around your brand and goals.', 'code', 1, true),
  ('Business & Corporate Websites', 'Professional company sites that build trust with your clients.', 'building', 2, true),
  ('E-Commerce Websites', 'Online stores with secure checkout and easy product management.', 'cart', 3, true),
  ('Responsive & Mobile-Friendly Websites', 'Sites that look and work great on phones, tablets and desktops.', 'devices', 4, true),
  ('Website Redesign & Updates', 'Give an old website a fresh, modern look and keep content current.', 'refresh', 5, true),
  ('Domain & Hosting Setup', 'We register your domain and set up reliable, fast hosting.', 'server', 6, true),
  ('Website Deployment', 'Your finished website taken live smoothly, tested and ready.', 'rocket', 7, true),
  ('Website Maintenance & Support', 'Ongoing updates, fixes and help so your site stays healthy.', 'wrench', 8, true),
  ('Website Security & Optimization', 'Protection against threats plus tuning for speed and stability.', 'shield', 9, true),
  ('SEO & Performance Optimization', 'Rank better on search engines and load faster for every visitor.', 'search', 10, true);
