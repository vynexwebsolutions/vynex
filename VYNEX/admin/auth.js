/* VYNEX/admin/auth.js — Supabase Auth login + page guard.
   - On login.html: signs in with email + password and checks the user is listed in admin_profiles.
   - On every other admin page: redirects to login.html unless an administrator is signed in,
     then builds the sidebar and releases the page scripts (VA.onReady). */
(function () {
  const db = window.vynexSupabase;
  const page = document.body.dataset.page;

  function notConfigured() {
    const msg = "Supabase is not connected: " + (window.vynexProblem || "unknown reason") + ".";
    const st = document.getElementById("loginStatus");
    if (st) { st.className = "status err"; st.textContent = msg; }
    else document.body.innerHTML = `<div class="login-wrap"><div class="login-card"><p class="status err">${msg}</p><a class="back-site" href="login.html">Go to login</a></div></div>`;
  }

  async function isAdmin(userId) {
    const { data, error } = await db.from("admin_profiles").select("id").eq("id", userId).maybeSingle();
    return !error && !!data;
  }

  // ---------- Login page ----------
  async function loginPage() {
    document.body.classList.add("ready");
    if (!db) return notConfigured();
    const { data } = await db.auth.getSession();
    if (data.session && (await isAdmin(data.session.user.id))) return (location.href = "dashboard.html");

    const form = document.getElementById("loginForm");
    const st = document.getElementById("loginStatus");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      btn.disabled = true; st.className = "status"; st.textContent = "Signing in…";
      const { data: r, error } = await db.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value });
      if (error) { btn.disabled = false; st.className = "status err"; st.textContent = "Incorrect email or password."; return; }
      if (!(await isAdmin(r.user.id))) {
        await db.auth.signOut();
        btn.disabled = false; st.className = "status err";
        st.textContent = "This account is not an administrator. See documentation/INSTALLATION.md (step: create the admin).";
        return;
      }
      location.href = "dashboard.html";
    });
  }

  // ---------- Protected pages ----------
  async function guard() {
    if (!db) return notConfigured();
    const { data } = await db.auth.getSession();
    const session = data.session;
    if (!session || !(await isAdmin(session.user.id))) { location.replace("login.html"); return; }
    window.VA.mountLayout(session.user.email);
    document.body.classList.add("ready");
    window.VA._fireReady();
    db.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_OUT") location.replace("login.html"); });
  }

  if (page === "login") loginPage(); else guard();
})();
