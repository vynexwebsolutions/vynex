# DATABASE GUIDE (Supabase PostgreSQL)

Run `backend/database.sql` once in the Supabase SQL Editor. It contains everything below.

## Tables

| Table | Purpose | Public access |
|---|---|---|
| `admin_profiles` | Users allowed to use the admin panel | none |
| `company_settings` | One row (id=1): company info, social links, watermark settings | read |
| `services` | Services (title, descriptions, icon, image, order, published) | read **published** |
| `projects` | Portfolio projects | read **published** |
| `project_images` | Screenshots of a project | read if project published |
| `testimonials` | Client testimonials | read **published** |
| `contact_inquiries` | Contact form messages (status pending/answered/completed) | **insert only** |
| `quote_requests` | Quote form requests | **insert only** |
| `media_files` | Register of uploaded images | none |

## Security (Row Level Security)
- RLS is enabled on every table (`backend/security.sql`).
- `public.is_admin()` returns true only for users in `admin_profiles`.
- Visitors (`anon`) can `select` published content and `insert` into the two form tables (always with status `pending`). They can never read, change or delete submissions.
- Administrators can do everything.
- Database `check` constraints validate lengths, email format and URLs even if someone bypasses the website.

## Storage
Bucket `website-images` (public read). Only administrators can upload, replace or delete (`backend/storage-policies.sql`). Limit 5 MB per file after browser compression.

## Functions
- `is_admin()` — used by all policies.
- `dashboard_stats()` — admin-only counts for the dashboard.

## Optional Edge Functions
`backend/functions/contact-submit` and `quote-submit` add server-side validation and rate limiting. They are optional; the website already inserts forms safely through RLS. Deploy with the Supabase CLI: `supabase functions deploy contact-submit`. These functions run on Supabase servers, where the service-role key is provided automatically — it is never in the website files.

## Backups
Supabase free plan: export regularly (Database → Backups or `pg_dump`). Keep your SQL files in Git.
