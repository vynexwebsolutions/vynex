/* VYNEX/public/portfolio.js
   Portfolio listing (with category filters) and project details page.
   All data comes from Supabase (published projects only — enforced by RLS).
   Watermarks are drawn as an overlay using public/images/watermark.png and the
   settings saved in company_settings. Original images are never modified.
   Styles live in portfolio.css. */
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // small inline icons (no external dependency)
  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    ext: svg('<path d="M7 17L17 7M8 7h9v9"/>'),
    zoom: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M11 8v6M8 11h6"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    prev: svg('<path d="M15 5l-7 7 7 7"/>'),
    next: svg('<path d="M9 5l7 7-7 7"/>'),
    image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>')
  };

  // Watermark drawing + settings loading live in script.js (window.VX_WM) so the home page uses the same code.
  const wm = (imgHtml, show) => window.VX_WM.wrap(imgHtml, show);
  const loadWm = (db) => window.VX_WM.load(db);

  function showSetup(el) {
    el.innerHTML = `<div class="empty-state"><strong>Database not connected yet</strong>Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env (or your host settings), then run npm run dev again.</div>`;
  }

  // ---------- Listing ----------
  async function listing(db) {
    const grid = document.getElementById("portfolioGrid");
    const filters = document.getElementById("portfolioFilters");
    if (!db) return showSetup(grid);
    await loadWm(db);
    const { data, error } = await db.from("projects").select("id,title,category,short_description,cover_image_url,show_watermark,technologies").eq("is_published", true).order("created_at", { ascending: false });
    if (error) { grid.innerHTML = `<div class="empty-state"><strong>Couldn't load projects</strong>Please try again later.</div>`; return; }
    if (!data.length) { grid.innerHTML = `<div class="empty-state"><strong>New projects coming soon</strong>We are adding our latest work. Check back shortly.</div>`; return; }

    const cats = [...new Set(data.map((p) => p.category).filter(Boolean))].sort();
    const countOf = (c) => (c === "All" ? data.length : data.filter((p) => p.category === c).length);
    filters.innerHTML = ["All", ...cats].map((c, i) => `<button class="filter-btn ${i ? "" : "active"}" data-cat="${esc(c)}" aria-pressed="${i ? "false" : "true"}">${esc(c)}<span class="count">${countOf(c)}</span></button>`).join("");
    if (!cats.length) filters.style.display = "none";

    const card = (p) => {
      const techs = (p.technologies || []).slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join("");
      const thumb = p.cover_image_url
        ? wm(`<img src="${esc(p.cover_image_url)}" alt="${esc(p.title)}" loading="lazy" width="640" height="400">`, p.show_watermark)
        : `<div class="pf-noimg">${IC.image}</div>`;
      return `
        <a class="card project-card pf-card" href="project-details.html?id=${encodeURIComponent(p.id)}" aria-label="${esc(p.title)} — view project">
          <div class="project-thumb">
            ${thumb}
            <span class="pf-cat">${esc(p.category || "Project")}</span>
            <span class="pf-view">View project ${IC.arrow}</span>
          </div>
          <div class="project-body">
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.short_description || "")}</p>
            ${techs ? `<div class="pf-techs">${techs}</div>` : ""}
          </div>
        </a>`;
    };

    const render = (cat) => {
      const items = cat === "All" ? data : data.filter((p) => p.category === cat);
      grid.innerHTML = items.map(card).join("");
      if (window.vynexAnimate) window.vynexAnimate.refresh();
    };
    render("All");
    filters.addEventListener("click", (e) => {
      const b = e.target.closest(".filter-btn"); if (!b) return;
      filters.querySelectorAll(".filter-btn").forEach((x) => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      render(b.dataset.cat);
    });
  }

  // ---------- Details ----------
  async function details(db) {
    const root = document.getElementById("projectDetail");
    const id = new URLSearchParams(location.search).get("id");
    if (!db) return showSetup(root);
    if (!id) { root.innerHTML = `<div class="empty-state"><strong>No project selected</strong><a class="btn btn-ghost" style="margin-top:14px" href="portfolio.html">Back to portfolio</a></div>`; return; }
    await loadWm(db);
    const { data: p, error } = await db.from("projects").select("*").eq("id", id).eq("is_published", true).maybeSingle();
    if (error || !p) { root.innerHTML = `<div class="empty-state"><strong>Project not found</strong>It may have been unpublished.<br><a class="btn btn-ghost" style="margin-top:14px" href="portfolio.html">Back to portfolio</a></div>`; return; }
    const { data: imgs } = await db.from("project_images").select("*").eq("project_id", id).order("display_order");
    const shots = imgs || [];

    document.title = `${p.title} | VYNEX Web Solutions`;
    const techs = (p.technologies || []).map((t) => `<span>${esc(t)}</span>`).join("");
    const feats = (p.features || []).map((f) => `<li>${esc(f)}</li>`).join("");

    // bento-style layout: work out how wide each screenshot should be (grid has 6 columns)
    const n = shots.length;
    const spans = shots.map(() => "");
    if (n === 1) spans[0] = "s6";
    else if (n === 2) spans.fill("s3");
    else if (n >= 4) {
      spans[0] = "s6";
      const r = (n - 1) % 3;
      if (r === 1) spans[n - 1] = "s6";
      if (r === 2) { spans[n - 1] = "s3"; spans[n - 2] = "s3"; }
    }
    const gallery = shots.map((i, k) => `
      <button type="button" class="g-item ${spans[k]}" data-k="${k}" aria-label="Open screenshot ${k + 1} of ${n}">
        ${wm(`<img src="${esc(i.image_url)}" alt="${esc(i.caption || p.title)}" loading="lazy" width="640" height="400">`, i.show_watermark)}
        <span class="g-zoom">${IC.zoom}</span>
      </button>`).join("");

    let host = "";
    try { if (p.live_url) host = new URL(p.live_url).host.replace(/^www\./, ""); } catch (_) {}
    const cover = p.cover_image_url ? `
      <div class="detail-cover browser">
        <div class="browser-bar"><span class="dots"><i></i><i></i><i></i></span><span class="url">${esc(host || p.title)}</span></div>
        ${wm(`<img src="${esc(p.cover_image_url)}" alt="${esc(p.title)}" width="1200" height="750">`, p.show_watermark)}
      </div>` : "";

    root.innerHTML = `
      <a class="back-link" href="portfolio.html">${IC.back.replace("<svg", '<svg width="18" height="18"')} Back to portfolio</a>
      <div class="detail-grid">
        <div>
          <span class="tag">${esc(p.category || "Project")}</span>
          <h1 class="detail-title">${esc(p.title)}</h1>
          ${cover}
          <p class="detail-lead">${esc(p.full_description || p.short_description || "").replace(/\n/g, "<br>")}</p>
          ${n ? `<h3 class="detail-h">Screenshots <small>${n}</small></h3><div class="gallery" id="gallery">${gallery}</div>` : ""}
        </div>
        <aside>
          ${p.live_url ? `<div class="side-box"><a class="btn btn-primary" href="${esc(p.live_url)}" target="_blank" rel="noopener noreferrer">View Live Project ${IC.ext}</a></div>` : ""}
          ${p.completion_info ? `<div class="side-box"><h3>Project info</h3><p style="margin:0">${esc(p.completion_info)}</p></div>` : ""}
          ${techs ? `<div class="side-box"><h3>Technologies</h3><div class="chips">${techs}</div></div>` : ""}
          ${feats ? `<div class="side-box"><h3>Key features</h3><ul class="feature-list">${feats}</ul></div>` : ""}
          <div class="side-box"><h3>Want something similar?</h3><p>Tell us about your project.</p><a class="btn btn-primary" href="get-quote.html?project=${encodeURIComponent(p.title)}&pid=${encodeURIComponent(p.id)}">Get a quote for a similar project</a></div>
        </aside>
      </div>`;

    // ---------- Lightbox (prev / next / close, keyboard + swipe) ----------
    const lb = document.getElementById("lightbox");
    const g = document.getElementById("gallery");
    if (g && lb) {
      document.body.appendChild(lb); // <main> has its own stacking layer; the overlay must sit above the header/footer
      let cur = 0, touchX = null;
      const show = (k) => {
        cur = (k + n) % n;
        const s = shots[cur];
        lb.innerHTML = `
          <button class="lb-btn lb-close" type="button" aria-label="Close">${IC.close}</button>
          ${n > 1 ? `<button class="lb-btn lb-prev" type="button" aria-label="Previous">${IC.prev}</button><button class="lb-btn lb-next" type="button" aria-label="Next">${IC.next}</button>` : ""}
          <div class="lb-stage">${wm(`<img src="${esc(s.image_url)}" alt="${esc(s.caption || "Project screenshot")}">`, s.show_watermark)}</div>
          ${s.caption ? `<div class="lb-caption">${esc(s.caption)}</div>` : ""}
          ${n > 1 ? `<div class="lb-count">${cur + 1} / ${n}</div>` : ""}`;
        lb.classList.add("open");
        document.body.style.overflow = "hidden";
      };
      const close = () => { lb.classList.remove("open"); document.body.style.overflow = ""; };
      g.addEventListener("click", (e) => { const t = e.target.closest("[data-k]"); if (t) show(Number(t.dataset.k)); });
      lb.addEventListener("click", (e) => {
        if (e.target.closest(".lb-prev")) return show(cur - 1);
        if (e.target.closest(".lb-next")) return show(cur + 1);
        if (e.target.closest(".lb-stage, .lb-caption, .lb-count")) return;
        close();
      });
      document.addEventListener("keydown", (e) => {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(cur - 1);
        if (e.key === "ArrowRight") show(cur + 1);
      });
      lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener("touchend", (e) => {
        if (touchX === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - touchX; touchX = null;
        if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
      });
    }
    if (window.vynexAnimate) window.vynexAnimate.refresh();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const db = window.vynexDb;
    if (document.getElementById("portfolioGrid")) listing(db);
    if (document.getElementById("projectDetail")) details(db);
  });
})();
