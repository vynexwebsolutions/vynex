# INSTALLATION — VYNEX Web Solutions website

This guide takes you from zero to a running website on your computer. No prior experience needed.

## 1. Install the tools (one time)

1. **Node.js** (LTS version) — https://nodejs.org → download and install. Check: open a terminal and type `node -v`.
2. **Visual Studio Code** — https://code.visualstudio.com
3. A free **Supabase** account — https://supabase.com (sign up with email or GitHub).

## 2. Open the project in Visual Studio Code

1. Unzip the project so you have a folder named **VYNEX**.
2. Open VS Code → **File → Open Folder…** → choose **VYNEX**.
3. Open the terminal inside VS Code: **Terminal → New Terminal**.

## 3. Preview the website right away (no Supabase needed)

In the VS Code terminal:

```
npm run dev
```

Then open **http://localhost:3000** (website) and **http://localhost:3000/admin/** (admin login).
Without Supabase the website shows placeholders and the admin shows a "not connected" message. That is expected.
Stop the server with **Ctrl + C**.

> Tip: always use `npm run dev` rather than double-clicking HTML files. It builds the site into the `dist/` folder, which is exactly what Render and Netlify publish.

## 4. Create your Supabase project

1. Supabase → **New project**. Choose a name (e.g. `vynex`), a strong database password (save it), and the region closest to your visitors. Wait ~2 minutes.
2. Go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key  ← this one is safe for websites
   - ⚠️ Do **not** use the `service_role` key anywhere in this project.

## 5. Create the database

1. Supabase → **SQL Editor → New query**.
2. Open `backend/database.sql` in VS Code, copy **everything**, paste it into the SQL Editor and click **Run**.
3. You should see "Success". This creates all tables, security rules (Row Level Security), helper functions and the `website-images` storage bucket.

(`backend/migrations/` contains the same SQL split into small numbered steps if you prefer running them one by one in order 001 → 009, with `database-functions.sql` after 001 and `storage-policies.sql` last.)

## 6. Create the administrator

1. Supabase → **Authentication → Users → Add user → Create new user**. Enter your email and a strong password. Tick **Auto Confirm User**.
2. Copy the new user's **UID** (click the user row).
3. SQL Editor → run (replace the UID and name):

```sql
insert into public.admin_profiles (id, full_name)
values ('PASTE-THE-USER-UID-HERE', 'Your Name');
```

Only users listed in `admin_profiles` can use the admin panel. Anyone else is rejected, even with a valid account.

4. Recommended: Authentication → **Providers → Email** → turn **off** "Allow new users to sign up" so nobody else can create accounts.

## 7. Connect the website to Supabase

1. In the VYNEX folder, copy `.env.example` and rename the copy to **.env**.
2. Fill in:

```
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key   # (SUPABASE_ANON_KEY also works)
```

3. Run `npm run dev` again. The terminal should say **Supabase CONNECTED**.
4. Open http://localhost:3000/admin/ and sign in.

## 8. First steps in the admin panel

1. **Company Information** → add your real email, phone, WhatsApp, location, description, mission, vision and social links. The footer and contact sections update automatically.
2. **Services** → add your services (or leave the built-in list shown until you do).
3. **Portfolio → Add Project** → add a real project, mark it **Published** (and **Featured** for the homepage).
4. Replace the placeholder logo images in `public/images/` (see IMAGE-GUIDE.md).

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm` not found | Reinstall Node.js, then reopen VS Code. |
| Admin says "not connected" | `.env` missing/misspelled. Re-run `npm run dev`. |
| "This account is not an administrator" | Run the `insert into admin_profiles` SQL from step 6. |
| Images fail to upload | Make sure `backend/database.sql` ran fully (it creates the storage bucket and policies). |
| Dashboard says it cannot load stats | Re-run `backend/database-functions.sql`. |
| Port 3000 busy | Run `PORT=3100 npm run dev` (Mac/Linux) or change the port in `scripts/dev-server.js`. |
