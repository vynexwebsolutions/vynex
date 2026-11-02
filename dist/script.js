/* VYNEX/public/script.js
   Connects the public site to Supabase (read-only, published content only — enforced by RLS)
   and fills in company settings, services, featured projects and testimonials.
   If config.js has no keys, the page simply shows its placeholders. */
(function () {
  const cfg = window.VYNEX_CONFIG || {};
  const hasDb = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const db = hasDb ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  window.vynexDb = db;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  window.vynexEsc = esc;

  // ---- Watermark (shared by the home page and the portfolio pages) ----
  // Reads the settings saved in Admin → Settings → Portfolio watermark and draws public/images/watermark.png
  // over any image whose project / screenshot has "Watermark" ticked. The original image is never changed.
  const wmCfg = { enabled: false, opacity: 0.35, size: 22, position: "bottom-right" };
  window.VX_WM = {
    async load(client) {
      try {
        const { data } = await (client || db).from("company_settings").select("watermark_enabled,watermark_opacity,watermark_size,watermark_position").limit(1).maybeSingle();
        if (data) Object.assign(wmCfg, { enabled: !!data.watermark_enabled, opacity: Number(data.watermark_opacity ?? 0.35), size: Number(data.watermark_size ?? 22), position: data.watermark_position || "bottom-right" });
      } catch (_) { /* no settings yet: watermark stays off */ }
      return wmCfg;
    },
    wrap(imgHtml, show) {
      if (!show || !wmCfg.enabled) return `<span class="wm-wrap" style="width:100%">${imgHtml}</span>`;
      const style = `--wm-opacity:${wmCfg.opacity};--wm-size:${wmCfg.size}%`;
      return `<span class="wm-wrap" style="width:100%;${style}">${imgHtml}<img class="wm ${esc(wmCfg.position)}" src="images/watermark.png" alt="" aria-hidden="true"></span>`;
    }
  };

  // ---- Company settings -> header/footer/contact fields ----
  async function loadCompany() {
    if (!db) return;
    const { data, error } = await db.from("company_settings").select("*").limit(1).maybeSingle();
    if (error || !data) return;
    document.querySelectorAll("[data-company]").forEach((el) => {
      const v = data[el.dataset.company];
      if (v) el.textContent = v;
    });
    // Contact icons: built from whatever the admin saved (call, WhatsApp, email, Instagram, TikTok, X).
    document.querySelectorAll("[data-contact-icons]").forEach((box) => {
      box.innerHTML = window.VX_CONTACT ? VX_CONTACT.html(data) : "";
      box.classList.toggle("is-empty", !box.children.length);
    });
    // Location is plain text; shown only when the admin has filled it in.
    document.querySelectorAll("[data-company='location']").forEach((el) => { el.hidden = !data.location; });
  }

  // ---- Services (homepage grid + footer links) ----
  async function loadServices() {
    if (!db) return;
    const { data, error } = await db.from("services").select("id,title,short_description,icon,image_url").eq("is_published", true).order("display_order");
    if (error || !data || !data.length) return;
    const grid = document.getElementById("servicesGrid");
    if (grid) {
      const limit = grid.dataset.limit ? Number(grid.dataset.limit) : data.length;
      grid.innerHTML = data.slice(0, limit).map((s) => `
        <a class="card svc-link" href="services.html"><div class="icon" aria-hidden="true">${window.VX_ICON ? VX_ICON.resolve(s.icon, s.title) : ""}</div>
        <h3>${esc(s.title)}</h3><p>${esc(s.short_description || "")}</p><span class="more">Details</span></a>`).join("");
      // the services page lists extra static groups; when the database provides the list, show only that
      document.querySelectorAll("#moreServices, .grid-title").forEach((el) => (el.hidden = true));
      if (window.vynexAnimate) window.vynexAnimate.refresh();
    }
    const fs = document.getElementById("footerServices");
    if (fs) fs.innerHTML = data.slice(0, 6).map((s) => `<li><a href="services.html">${esc(s.title)}</a></li>`).join("");
  }

  // ---- Featured projects ----
  async function loadFeatured() {
    const grid = document.getElementById("featuredGrid");
    if (!db || !grid) return;
    const [{ data, error }] = await Promise.all([
      db.from("projects").select("id,title,category,short_description,cover_image_url,show_watermark").eq("is_published", true).order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(6),
      window.VX_WM.load(db)
    ]);
    if (error || !data || !data.length) return;
    grid.innerHTML = data.map((p) => `
      <a class="card project-card" href="project-details.html?id=${encodeURIComponent(p.id)}">
        <div class="project-thumb">${p.cover_image_url ? window.VX_WM.wrap(`<img src="${esc(p.cover_image_url)}" alt="${esc(p.title)}" loading="lazy" width="640" height="400">`, p.show_watermark) : ""}</div>
        <div class="project-body"><span class="tag">${esc(p.category || "Project")}</span>
        <h3>${esc(p.title)}</h3><p>${esc(p.short_description || "")}</p></div>
      </a>`).join("");
    if (window.vynexAnimate) window.vynexAnimate.refresh();
  }

  // ---- Testimonials ----
  async function loadTestimonials() {
    const grid = document.getElementById("testimonialsGrid");
    if (!db || !grid) return;
    const { data, error } = await db.from("testimonials").select("*").eq("is_published", true).order("display_order").limit(6);
    if (error || !data || !data.length) return;
    grid.innerHTML = data.map((t) => `
      <figure class="card quote-card"><blockquote>“${esc(t.message)}”</blockquote>
      <figcaption class="quote-author"><div class="avatar">${t.photo_url ? `<img src="${esc(t.photo_url)}" alt="" loading="lazy">` : esc((t.client_name || "?")[0])}</div>
      <div><strong>${esc(t.client_name)}</strong><span>${esc([t.client_role, t.company].filter(Boolean).join(", "))}</span></div></figcaption></figure>`).join("");
    if (window.vynexAnimate) window.vynexAnimate.refresh();
  }

  // Cursor-follow glow on cards
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest && e.target.closest(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  }, { passive: true });

  document.addEventListener("DOMContentLoaded", () => {
    loadCompany(); loadServices(); loadFeatured(); loadTestimonials();
  });
})();
