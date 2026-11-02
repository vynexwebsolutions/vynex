/* VYNEX/backend/supabase.js
   Creates the Supabase browser client used by the admin panel.
   Needs config.js (SUPABASE_URL + SUPABASE_ANON_KEY) and the supabase-js CDN script loaded first.
   The anon key is public by design; security is enforced by Row Level Security (see security.sql).
   NEVER put the service-role key in any frontend file. scripts/build.js copies this file to dist/supabase.js. */
(function () {
  const cfg = window.VYNEX_CONFIG || {};
  window.VYNEX_BUCKET = "website-images";
  window.vynexProblem = !cfg.SUPABASE_URL ? "SUPABASE_URL is empty in config.js"
    : !cfg.SUPABASE_ANON_KEY ? "The public key is empty in config.js (set SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY in .env, then run npm run dev again)"
    : !window.supabase ? "The Supabase library could not load from the CDN (check your internet connection / ad-blocker)"
    : "";
  window.vynexConfigured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  window.vynexSupabase = window.vynexConfigured
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;
})();
