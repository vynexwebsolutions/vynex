# VYNEX Web Solutions — Website & Admin Panel

Premium, animated company website with a private admin panel.
**Stack:** HTML5 · CSS3 · JavaScript · GSAP · Supabase (PostgreSQL, Auth, Storage) · Render (testing) · Netlify (final).

## Quick start

```bash
npm run dev          # builds dist/ and serves it
# Website → http://localhost:3000
# Admin   → http://localhost:3000/admin/
```

The site runs immediately with placeholders. To enable the database, admin login, forms and uploads, follow **INSTALLATION.md** (about 15 minutes).

## What's inside
- 11 public pages: Home, About, Services, Portfolio, Project Details, Contact, Quote, FAQ, Privacy, Terms, 404
- Admin: Dashboard, Portfolio, Services, Testimonials, Inquiries, Quote Requests, Media, Company Info, Settings
- Supabase database with Row Level Security, secure admin login, image storage
- Automatic static image manifest, optional non-destructive watermark, reusable header/footer
- GSAP animations (respects reduced-motion), responsive, SEO + Open Graph tags

## Guides
- [INSTALLATION.md](INSTALLATION.md) — set up and run locally
- [DEPLOYMENT.md](DEPLOYMENT.md) — Render (testing) and Netlify (final)
- [IMAGE-GUIDE.md](IMAGE-GUIDE.md) — static images, manifest, watermark
- [ADMIN-GUIDE.md](ADMIN-GUIDE.md) — using the admin panel
- [documentation/DATABASE-GUIDE.md](documentation/DATABASE-GUIDE.md) and [documentation/FOLDER-STRUCTURE.md](documentation/FOLDER-STRUCTURE.md)

## Placeholders to replace
Logo, favicon and watermark images in `public/images/`; company contact details (admin → Company Information); privacy/terms text; real projects and testimonials. Nothing in this project is invented company data.

## Security
Never put the Supabase `service_role` key in the website. Only the public `anon` key is used; the build refuses to publish a service-role key.
