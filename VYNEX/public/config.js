/* VYNEX/public/config.js
   Public Supabase settings. The anon key is SAFE to expose (security comes from Row Level Security).
   NEVER put the service-role key here. scripts/build.js regenerates this file from environment variables.
   Leave both values empty to preview the site with placeholders and no database. */
window.VYNEX_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  // Optional badge shown on the homepage. Leave EMPTY unless you can prove it (e.g. "Ranked #7 by <source>, 2026").
  RANKING_BADGE: ""
};
