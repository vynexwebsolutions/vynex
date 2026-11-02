# DEPLOYMENT — Render (testing) then Netlify (final launch)

Both hosts publish the **same folder**: `dist/`, created by `node scripts/build.js`.
Supabase stays the backend in both places, so moving from Render to Netlify needs **no code changes** — only the same two environment variables.

## Before you deploy

1. Finish INSTALLATION.md (database created, admin created).
2. Put the project on GitHub: create a free repository and push the VYNEX folder (the `.gitignore` already keeps `.env` and `dist/` out).

```
git init
git add .
git commit -m "VYNEX website"
git branch -M main
git remote add origin https://github.com/YOUR-USER/vynex.git
git push -u origin main
```

## Environment variables (both hosts)

| Name | Value | Secret? |
|---|---|---|
| `SUPABASE_URL` | Your Supabase Project URL | Public |
| `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`) | The **anon public** key | Public (protected by Row Level Security) |

Never add the `service_role` key. The build script refuses to run if it detects one.

## A) Render — testing (free static site)

1. https://render.com → sign up → **New + → Static Site** (or **Blueprint** to use `render.yaml`).
2. Connect your GitHub repo.
3. Settings (if not using the blueprint):
   - **Build Command:** `node scripts/build.js`
   - **Publish Directory:** `dist`
4. **Environment** → add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`).
5. **Create Static Site**. Your test URL looks like `https://vynex.onrender.com`; the admin is at `/admin/`.
6. Every `git push` redeploys automatically.

## B) Netlify — final launch

1. https://netlify.com → **Add new site → Import an existing project** → GitHub → choose the repo.
2. Netlify reads `netlify.toml` automatically (build `node scripts/build.js`, publish `dist`). Check the fields match.
3. **Site configuration → Environment variables** → add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`).
4. **Deploy site.** Redeploy after changing variables (Deploys → Trigger deploy).
5. **Custom domain:** Domain management → Add domain → follow the DNS steps. HTTPS is automatic.

## Tell Supabase your site addresses

Supabase → **Authentication → URL Configuration** → set **Site URL** to your final domain and add your Render and Netlify URLs under **Redirect URLs**.

## When do I need to redeploy?

| Change | Redeploy needed? |
|---|---|
| Add/edit projects, services, testimonials, company info, uploaded images (admin panel) | **No** — instant |
| Add a new static image to `public/images/` | **Yes** — commit & push (the build regenerates the image manifest) |
| Change code or styles | **Yes** |

## Going live checklist

- [ ] Real logo, favicon and watermark in `public/images/`
- [ ] Company information filled in (email, phone, WhatsApp, location)
- [ ] Real projects published; no placeholders left
- [ ] Privacy Policy and Terms reviewed (they are templates)
- [ ] Sign-ups disabled in Supabase Auth
- [ ] Strong admin password
- [ ] Contact and quote forms tested (submit one, find it in the admin panel)
