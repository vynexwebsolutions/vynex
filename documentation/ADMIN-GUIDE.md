# ADMIN GUIDE

Open `https://YOUR-SITE/admin/` and sign in with the administrator account you created.

## Dashboard
Totals for projects (published/draft), services, inquiries, pending quote requests and a recent-activity list.

## Portfolio
- **Add Project**: name, category, short + full description, cover image, screenshots (select many at once), technologies (comma separated), features (one per line), completion info, live URL, Featured, Published.
- **Published** projects appear on the public portfolio immediately; **Unpublish** hides them again.
- **Featured** projects appear on the homepage (up to 3 newest).
- Screenshots: reorder with ◀ ▶, tick **Watermark** per image, **Remove** to delete.
- The public site shows a **View Live Project** button when a live URL is set (opens in a new tab).

## Services
Add, edit, delete, publish/hide, upload an image, and reorder with ↑ ↓. Until you add services, the website shows its built-in default list.

## Testimonials
Add only real testimonials from real clients. Nothing shows until you tick **Published**.

## Inquiries and Quote Requests
View details (name, contact info, requirements), set status **pending / answered / completed**, reply by email, or delete.

## Media
Upload many images, choose a folder, copy the public URL, delete.

## Company Information
Name, tagline, description, About text, mission, vision, email, phones, WhatsApp, location, social links, optional logo. The header, footer, contact pages and About page update automatically. Empty social links are hidden in the footer.

## Settings
- Watermark on/off, opacity, size, position (with live preview).
- Change your password.

## Security notes
- Only users listed in `admin_profiles` can sign in.
- Public visitors can only read published content and submit forms.
- Keep your password private; turn off public sign-ups in Supabase.


## Contact & social icons
Admin → **Company Info → Contact & social links**. Fill in Call, WhatsApp, Email, Instagram, TikTok and X.
Each icon on the website opens exactly what you enter (phone dialler, WhatsApp chat, email app, or the profile link). An empty box hides that icon.
One-time setup for the TikTok box: run `backend/migrations/010-contact-links.sql` in Supabase → SQL Editor.
