/* VYNEX/scripts/build.js
   Builds the deployable site into dist/ :
     public/*                → dist/*            (the website)
     admin/*                 → dist/admin/*      (the admin panel)
     backend/supabase.js     → dist/supabase.js  (Supabase client used by the admin)
     dist/config.js          ← written from environment variables (public values only)
   Same output is used by Render (testing) and Netlify (final), so you never rebuild the site to move hosts.
   Environment variables: SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY  (or a local .env file). */
const fs = require("fs");
const path = require("path");
const { generate } = require("./generate-image-manifest");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

// --- tiny .env reader (no dependencies) ---
function loadEnv() {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const url = (process.env.SUPABASE_URL || "").trim();
// Accept the old "anon" name AND Supabase's new "publishable" key name (both are the public browser key).
const key = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "").trim();

// --- SAFETY: refuse to publish a service-role key ---
function jwtRole(token) {
  try { return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8")).role; } catch { return null; }
}
if (jwtRole(key) === "service_role" || /service_role/i.test(key) || key.startsWith("sb_secret_")) {
  console.error("\nSTOP: SUPABASE_ANON_KEY looks like a SERVICE-ROLE key. That key must NEVER be used in the website.");
  console.error("Use the 'anon public' / 'publishable' key from Supabase → Project Settings → API Keys.\n");
  process.exit(1);
}

generate();

fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, "public"), dist, { recursive: true });
fs.cpSync(path.join(root, "admin"), path.join(dist, "admin"), { recursive: true });
fs.copyFileSync(path.join(root, "backend", "supabase.js"), path.join(dist, "supabase.js"));

// ---------- SEO files (need SITE_URL, e.g. https://vynex.co.ke — no trailing slash) ----------
// Writes dist/robots.txt and dist/sitemap.xml, and adds a canonical link, og:url, an absolute og:image and (home page)
// business structured data to every public page in dist/. Without SITE_URL only a basic robots.txt is written,
// because a wrong address would hurt more than help.
const site = (process.env.SITE_URL || "").trim().replace(/\/+$/, "");
const publicPages = fs.readdirSync(dist).filter((f) => f.endsWith(".html") && f !== "404.html" && f !== "project-details.html");
if (site) {
  if (!/^https?:\/\/[^/\s]+\.[^/\s]+/.test(site)) { console.error("\nSTOP: SITE_URL must look like https://vynex.co.ke\n"); process.exit(1); }
  const urlOf = (f) => (f === "index.html" ? site + "/" : site + "/" + f);
  const jsonld = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "ProfessionalService", name: "VYNEX Web Solutions", url: site + "/", logo: site + "/images/logo.png",
    description: "Website development, Android and iOS mobile apps, M-Pesa payment integration and business software for customers in Kenya and abroad.",
    areaServed: ["Kenya", "Worldwide"], serviceType: ["Website development", "Mobile app development", "M-Pesa integration", "Business software"]
  })}</script>`;
  for (const f of publicPages) {
    const file = path.join(dist, f); let html = fs.readFileSync(file, "utf8");
    html = html.replace(/(<meta property="og:image" content=")(?!https?:)([^"]*)"/, (_, a, b) => a + site + "/" + b.replace(/^\//, "") + '"');
    let add = "";
    if (!/rel="canonical"/.test(html)) add += `  <link rel="canonical" href="${urlOf(f)}">\n`;
    if (!/property="og:url"/.test(html)) add += `  <meta property="og:url" content="${urlOf(f)}">\n`;
    if (f === "index.html" && !/ld\+json/.test(html)) add += "  " + jsonld + "\n";
    html = html.replace("</head>", add + "</head>"); fs.writeFileSync(file, html);
  }
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPages.map((f) => `  <url><loc>${urlOf(f)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
}
fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nDisallow: /admin/\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ""}`);
console.log(site ? `SEO files written for ${site} (robots.txt, sitemap.xml, canonical links, structured data)` : "SEO: SITE_URL not set — only a basic robots.txt was written. Add SITE_URL=https://your-domain to .env for sitemap.xml and canonical links.");

const config = `/* Generated by scripts/build.js — public values only. */\nwindow.VYNEX_CONFIG = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key, RANKING_BADGE: (process.env.RANKING_BADGE || "").trim() }, null, 2)};\n`;
fs.writeFileSync(path.join(dist, "config.js"), config);

if (!url || !key) console.warn(`WARNING: missing ${!url ? "SUPABASE_URL " : ""}${!key ? "SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEY" : ""} — check your .env file.`);
console.log(`Build complete → dist/   (Supabase ${url && key ? "CONNECTED" : "NOT configured — site runs with placeholders"})`);