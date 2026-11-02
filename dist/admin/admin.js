/* VYNEX/admin/admin.js — shared admin helpers (window.VA)
   Layout/sidebar, toasts, modals, a generic modal form, and image upload to Supabase Storage.
   Loaded on every admin page after ../supabase.js. Page scripts use VA.onReady(fn) to
   run once auth.js has confirmed that an administrator is signed in. */
(function () {
  const VA = (window.VA = {});
  const db = window.vynexSupabase;
  VA.db = db;
  const BUCKET = window.VYNEX_BUCKET || "website-images";

  VA.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  VA.fmtDate = (d) => (d ? new Date(d).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "");

  // ---- ready queue ----
  let isReady = false; const queue = [];
  VA.onReady = (fn) => (isReady ? fn() : queue.push(fn));
  VA._fireReady = () => { isReady = true; queue.splice(0).forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); };

  // ---- toast ----
  VA.toast = (msg, type) => {
    let box = document.getElementById("toasts");
    if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = "toast" + (type === "err" ? " err" : "");
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  };

  // ---- layout ----
  const NAV = [
    ["dashboard.html", "dashboard", "Dashboard"], ["projects.html", "folder", "Portfolio"], ["services.html", "wrench", "Services"],
    ["managed-websites.html", "server", "Managed Websites"], ["testimonials.html", "message", "Testimonials"], ["inquiries.html", "mail", "Inquiries"], ["quote-requests.html", "receipt", "Quote Requests"],
    ["media-management.html", "image", "Media"], ["company-information.html", "building", "Company Info"], ["settings.html", "settings", "Settings"]
  ];
  const mark = `<img class="brand-logo" src="images/logo.png" alt="" width="61" height="38">`;
  VA.mountLayout = (email) => {
    const side = document.getElementById("sidebar");
    if (!side) return;
    const page = (location.pathname.split("/").pop() || "").toLowerCase();
    const active = page === "add-project.html" || page === "edit-project.html" ? "projects.html" : page;
    side.innerHTML = `
      <a class="side-brand" href="dashboard.html">${mark}<span>VYNEX<small>Admin Panel</small></span></a>
      <nav class="side-nav" aria-label="Admin">
        ${NAV.map(([h, i, l]) => `<a href="${h}" class="${h === active ? "active" : ""}"><span aria-hidden="true">${VX_ICON(i)}</span>${l}</a>`).join("")}
        <div class="sep"></div>
        <a href="../index.html" target="_blank" rel="noopener"><span aria-hidden="true">${VX_ICON("globe")}</span>View Website ↗</a>
      </nav>
      <div class="side-user">Signed in as<br><b style="color:#fff">${VA.esc(email || "")}</b><button class="btn btn-ghost btn-sm" id="logoutBtn">Sign out</button></div>`;
    const btn = document.getElementById("menuBtn");
    if (btn) btn.addEventListener("click", () => document.body.classList.toggle("menu-open"));
    document.addEventListener("click", (e) => { if (document.body.classList.contains("menu-open") && !e.target.closest(".sidebar") && !e.target.closest("#menuBtn")) document.body.classList.remove("menu-open"); });
    document.getElementById("logoutBtn").addEventListener("click", async () => { await db.auth.signOut(); location.href = "login.html"; });
  };

  // ---- modal ----
  VA.modal = (title, html) => {
    const bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${VA.esc(title)}"><h2>${VA.esc(title)}</h2><div class="modal-body">${html}</div></div>`;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.addEventListener("mousedown", (e) => { if (e.target === bg) close(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    return { el: bg, body: bg.querySelector(".modal-body"), close };
  };

  // ---- images: compress + upload to Supabase Storage ----
  VA.compressImage = (file, maxW = 1600, quality = 0.82) => new Promise((resolve) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file); // keep gif/svg as is
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => resolve(b && b.size < file.size ? b : file), "image/webp", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

  VA.uploadImage = async (file, folder = "general") => {
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
    if (file.size > 12 * 1024 * 1024) throw new Error("Image is too large (max 12 MB before compression).");
    const blob = await VA.compressImage(file);
    const ext = { "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/svg+xml": "svg" }[blob.type] || "jpg";
    const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${base}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
    if (error) throw error;
    const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    await db.from("media_files").insert({ name: file.name, url, storage_path: path, folder, size_bytes: blob.size });
    return { url, path };
  };

  VA.removeStorage = async (paths) => {
    const list = (paths || []).filter(Boolean);
    if (!list.length) return;
    await db.storage.from(BUCKET).remove(list);
    await db.from("media_files").delete().in("storage_path", list);
  };

  // ---- generic modal form ----
  // fields: [{name,label,type:text|textarea|number|checkbox|select|image|url|email,options,required,help,full,pathName,folder}]
  VA.openForm = ({ title, fields, values = {}, submitLabel = "Save", onSubmit }) => {
    const val = { ...values };
    const replaced = [];
    const row = (f) => {
      const v = val[f.name] ?? "";
      const id = "f_" + f.name;
      const req = f.required ? " required" : "";
      const help = f.help ? `<small>${VA.esc(f.help)}</small>` : "";
      if (f.type === "heading") return `<h3 class="form-section">${VA.esc(f.label)}</h3>`;
      if (f.type === "checkbox") return `<div class="field full"><label class="check"><input type="checkbox" id="${id}" ${val[f.name] ? "checked" : ""}> ${VA.esc(f.label)}</label>${help}</div>`;
      if (f.type === "textarea") return `<div class="field full"><label for="${id}">${VA.esc(f.label)}</label><textarea id="${id}"${req}>${VA.esc(v)}</textarea>${help}</div>`;
      if (f.type === "select") return `<div class="field"><label for="${id}">${VA.esc(f.label)}</label><select id="${id}">${f.options.map((o) => `<option value="${VA.esc(o)}" ${o === v ? "selected" : ""}>${VA.esc(o)}</option>`).join("")}</select>${help}</div>`;
      if (f.type === "image") return `<div class="field full img-field"><label>${VA.esc(f.label)}</label><div class="preview" id="${id}_prev">${v ? `<img src="${VA.esc(v)}" alt="">` : "No image"}</div><input type="file" id="${id}" accept="image/*">${help}<small id="${id}_st"></small></div>`;
      return `<div class="field ${f.full ? "full" : ""}"><label for="${id}">${VA.esc(f.label)}</label><input id="${id}" type="${f.type || "text"}" value="${VA.esc(v)}"${req}${f.type === "number" ? ` step="${f.step || 1}"` : ""}>${help}</div>`;
    };
    const m = VA.modal(title, `<form id="vaForm"><div class="form-grid">${fields.map(row).join("")}</div><p class="status" id="vaStatus"></p><div class="modal-actions"><button type="button" class="btn btn-ghost" id="vaCancel">Cancel</button><button class="btn btn-primary" type="submit">${VA.esc(submitLabel)}</button></div></form>`);
    if (fields.some((f) => f.wide)) m.body.closest(".modal").classList.add("wide");
    const form = m.body.querySelector("#vaForm");
    const status = m.body.querySelector("#vaStatus");
    m.body.querySelector("#vaCancel").onclick = m.close;

    fields.filter((f) => f.type === "image").forEach((f) => {
      const input = m.body.querySelector("#f_" + f.name);
      input.addEventListener("change", async () => {
        const file = input.files[0]; if (!file) return;
        const st = m.body.querySelector("#f_" + f.name + "_st");
        st.textContent = "Uploading…";
        try {
          const up = await VA.uploadImage(file, f.folder || "general");
          if (f.pathName && val[f.pathName]) replaced.push(val[f.pathName]);
          val[f.name] = up.url; if (f.pathName) val[f.pathName] = up.path;
          m.body.querySelector("#f_" + f.name + "_prev").innerHTML = `<img src="${VA.esc(up.url)}" alt="">`;
          st.textContent = "Uploaded ✓";
        } catch (e) { st.textContent = "Upload failed: " + (e.message || e); }
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = { ...val };
      fields.forEach((f) => {
        if (f.type === "image" || f.type === "heading") return;
        const el = m.body.querySelector("#f_" + f.name);
        data[f.name] = f.type === "checkbox" ? el.checked : f.type === "number" ? Number(el.value || 0) : el.value.trim();
      });
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; status.textContent = "Saving…"; status.className = "status";
      try {
        await onSubmit(data);
        await VA.removeStorage(replaced);
        m.close();
      } catch (err) {
        btn.disabled = false; status.className = "status err";
        const raw = String((err && err.message) || err || "");
        status.textContent = /permission denied|row-level security|not authorized|access denied|42501/i.test(raw)
          ? "Access denied by the database. In Supabase > SQL Editor run backend/migrations/013-managed-websites-grants.sql, then sign out and in again. (" + raw + ")"
          : (raw || "Could not save.");
      }
    });
    return m;
  };

  // ---- styled image pickers ----
  // Turns every plain <input type="file"> (now and later, e.g. inside modals) into a drag-and-drop zone.
  // The original input stays in the page, so every existing "change" handler keeps working untouched.
  const ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';
  VA.enhanceFilePickers = (root = document) => {
    root.querySelectorAll('input[type="file"]:not([data-vx])').forEach((input) => {
      input.dataset.vx = "1";
      const multi = input.multiple;
      const idle = multi ? "Choose images" : "Choose image";
      const zone = document.createElement("div");
      zone.className = "dropzone";
      zone.tabIndex = 0;
      zone.setAttribute("role", "button");
      zone.innerHTML = `<span class="dz-ico">${ICON_UP}</span><span class="dz-text"><b class="dz-main">${idle}</b><span class="dz-or"> or drag &amp; drop here</span></span><span class="dz-hint">PNG, JPG, WebP or GIF${multi ? " · select several at once" : ""}</span>`;
      input.parentNode.insertBefore(zone, input);
      zone.appendChild(input);
      input.classList.add("dz-input");
      const main = zone.querySelector(".dz-main");
      let timer;
      const label = () => {
        const n = input.files ? input.files.length : 0;
        if (!n) return;
        main.textContent = n === 1 ? input.files[0].name : `${n} images selected`;
        zone.classList.add("has-file");
        clearTimeout(timer);
        timer = setTimeout(() => { main.textContent = idle; zone.classList.remove("has-file"); }, 5000);
      };
      input.addEventListener("change", label);
      zone.addEventListener("click", (e) => { if (e.target !== input) input.click(); });
      zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
      ["dragenter", "dragover"].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add("drag"); }));
      ["dragleave", "dragend"].forEach((t) => zone.addEventListener(t, () => zone.classList.remove("drag")));
      zone.addEventListener("drop", (e) => {
        e.preventDefault(); zone.classList.remove("drag");
        const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith("image/"));
        if (!files.length) return VA.toast("Please drop an image file.", "err");
        const dt = new DataTransfer();
        (multi ? files : files.slice(0, 1)).forEach((f) => dt.items.add(f));
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  };
  const startPickers = () => {
    VA.enhanceFilePickers();
    new MutationObserver(() => VA.enhanceFilePickers()).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startPickers); else startPickers();

  VA.statusBadge = (s) => `<span class="badge ${s === "completed" ? "ok" : s === "answered" ? "warn" : "muted"}">${VA.esc(s)}</span>`;
})();
