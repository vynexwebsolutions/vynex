# FOLDER STRUCTURE

```
VYNEX/
├── public/                  ← the PUBLIC website (what visitors see)
│   ├── index.html … 404.html   11 pages
│   ├── style.css  responsive.css  animations.css
│   ├── script.js           Supabase data → pages (company info, services, projects, testimonials)
│   ├── navigation.js       reusable header + footer
│   ├── animations.js       GSAP animations
│   ├── portfolio.js        portfolio list, filters, project details, watermark overlay
│   ├── forms.js            contact + quote form submission (validation, spam protection)
│   ├── image-loader.js     reads image-manifest.json and places static images
│   ├── image-manifest.json auto-generated list of static images
│   ├── config.js           Supabase URL + anon key (overwritten at build from env vars)
│   └── images/             static images (flat, no subfolders)
├── admin/                   ← the private ADMIN PANEL
│   ├── login.html dashboard.html projects.html add-project.html edit-project.html
│   ├── services.html testimonials.html inquiries.html quote-requests.html
│   ├── company-information.html settings.html media-management.html index.html
│   ├── admin.css admin-responsive.css
│   ├── admin.js (shared helpers) auth.js (login + guard)
│   ├── dashboard.js projects.js services.js testimonials.js inquiries.js settings.js media.js
│   └── images/             admin graphics
├── backend/                 ← Supabase: database, security, storage
│   ├── supabase.js         browser client used by the admin
│   ├── database.sql        EVERYTHING in one file (run this)
│   ├── security.sql storage-policies.sql database-functions.sql
│   ├── migrations/         the same SQL in numbered steps 001–009
│   └── functions/          optional Edge Functions (contact-submit, quote-submit)
├── scripts/
│   ├── generate-image-manifest.js
│   ├── build.js            creates dist/ for hosting
│   └── dev-server.js       local preview server
├── documentation/          guides (this folder)
├── README.md INSTALLATION.md DEPLOYMENT.md IMAGE-GUIDE.md ADMIN-GUIDE.md
├── package.json netlify.toml render.yaml .gitignore .env.example
└── dist/                   (created by the build — never edit)
```

## How the parts connect

```
Visitor ──► public/*.html ──► script.js / portfolio.js ──► Supabase (read published rows, insert forms)
Admin  ──► admin/*.html  ──► auth.js ──► Supabase Auth ──► admin.js / page scripts ──► Supabase (full access for admins)
                                              └──► Supabase Storage (uploaded images)
Build:  public/ + admin/ + backend/supabase.js + env vars ──► dist/ ──► Render (test) / Netlify (final)
```

- The browser only ever holds the **anon** key. Row Level Security decides what each person can do.
- `dist/` puts `config.js` and `supabase.js` at the site root, which is why the admin pages load `../config.js` and `../supabase.js`.
