/* VYNEX/admin/projects.js — portfolio management.
   projects.html       → list with publish / feature / edit / delete
   add-project.html    → create form
   edit-project.html   → edit form (?id=...)
   Published projects appear on the public portfolio immediately (no redeploy). */
VA.onReady(() => {
  const db = VA.db;
  const page = document.body.dataset.page;
  if (page === "projects") listPage(); else formPage(page === "edit-project");

  // ================= LIST =================
  async function listPage() {
    const body = document.getElementById("rows");
    let list = [];
    async function load() {
      const { data, error } = await db.from("projects").select("id,title,category,cover_image_url,cover_image_path,is_published,is_featured,created_at").order("created_at", { ascending: false });
      if (error) { body.innerHTML = `<tr><td colspan="5" class="empty">Could not load: ${VA.esc(error.message)}</td></tr>`; return; }
      list = data;
      body.innerHTML = list.length ? list.map((p, i) => `
        <tr>
          <td>${p.cover_image_url ? `<img class="thumb" src="${VA.esc(p.cover_image_url)}" alt="">` : `<div class="thumb"></div>`}</td>
          <td><b>${VA.esc(p.title)}</b><small>${VA.esc(p.category || "No category")}</small></td>
          <td><span class="badge ${p.is_published ? "ok" : "muted"}">${p.is_published ? "Published" : "Draft"}</span> ${p.is_featured ? '<span class="badge warn">Featured</span>' : ""}</td>
          <td>${VA.fmtDate(p.created_at)}</td>
          <td><div class="btn-row">
            <button class="btn btn-ghost btn-sm" data-act="pub" data-i="${i}">${p.is_published ? "Unpublish" : "Publish"}</button>
            <button class="btn btn-ghost btn-sm" data-act="feat" data-i="${i}">${p.is_featured ? "Unfeature" : "Feature"}</button>
            <a class="btn btn-ghost btn-sm" href="edit-project.html?id=${p.id}">Edit</a>
            <button class="btn btn-danger btn-sm" data-act="del" data-i="${i}">Delete</button>
          </div></td>
        </tr>`).join("") : `<tr><td colspan="5" class="empty">No projects yet. Click “Add Project”.</td></tr>`;
    }
    body.addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-act]"); if (!b) return;
      const p = list[Number(b.dataset.i)];
      if (b.dataset.act === "pub") {
        const { error } = await db.from("projects").update({ is_published: !p.is_published }).eq("id", p.id);
        if (error) return VA.toast(error.message, "err");
        VA.toast(p.is_published ? "Project unpublished" : "Project published"); load();
      }
      if (b.dataset.act === "feat") {
        const { error } = await db.from("projects").update({ is_featured: !p.is_featured }).eq("id", p.id);
        if (error) return VA.toast(error.message, "err"); load();
      }
      if (b.dataset.act === "del") {
        if (!confirm(`Delete “${p.title}” and all its screenshots? This cannot be undone.`)) return;
        const { data: imgs } = await db.from("project_images").select("storage_path").eq("project_id", p.id);
        const { error } = await db.from("projects").delete().eq("id", p.id);
        if (error) return VA.toast(error.message, "err");
        await VA.removeStorage([p.cover_image_path, ...(imgs || []).map((i) => i.storage_path)]);
        VA.toast("Project deleted"); load();
      }
    });
    load();
  }

  // ================= FORM =================
  async function formPage(isEdit) {
    const mount = document.getElementById("projectFormMount");
    const id = new URLSearchParams(location.search).get("id");
    let project = { is_published: false, is_featured: false, show_watermark: false, technologies: [], features: [] };
    let images = []; // {id?, url, path, show_watermark, deleted?}

    if (isEdit) {
      if (!id) { mount.innerHTML = `<div class="empty">No project selected. <a href="projects.html" style="color:var(--cyan)">Back to projects</a></div>`; return; }
      const { data, error } = await db.from("projects").select("*").eq("id", id).maybeSingle();
      if (error || !data) { mount.innerHTML = `<div class="empty">Project not found. <a href="projects.html" style="color:var(--cyan)">Back to projects</a></div>`; return; }
      project = data;
      const { data: imgs } = await db.from("project_images").select("*").eq("project_id", id).order("display_order");
      images = (imgs || []).map((i) => ({ id: i.id, url: i.image_url, path: i.storage_path, show_watermark: i.show_watermark, caption: i.caption }));
    }
    // Is the site-wide watermark switched on (Settings)? New covers/screenshots then start with "Watermark" ticked.
    let wmOn = false;
    try { const { data: ws } = await db.from("company_settings").select("watermark_enabled").eq("id", 1).maybeSingle(); wmOn = !!(ws && ws.watermark_enabled); } catch (_) {}
    if (!isEdit && wmOn) project.show_watermark = true;
    let coverUrl = project.cover_image_url || "", coverPath = project.cover_image_path || "", oldCoverPath = "";
    const E = VA.esc;

    mount.innerHTML = `
      <form id="pForm" class="panel">
        <div class="form-grid">
          <div class="field full"><label for="pTitle">Project name *</label><input id="pTitle" type="text" required maxlength="200" value="${E(project.title || "")}"></div>
          <div class="field"><label for="pCat">Category</label><input id="pCat" type="text" maxlength="60" list="catList" value="${E(project.category || "")}" placeholder="e.g. Website, Mobile App, E-commerce"><datalist id="catList"></datalist><small>Visitors can filter the portfolio by category.</small></div>
          <div class="field"><label for="pLive">Live project URL</label><input id="pLive" type="text" value="${E(project.live_url || "")}" placeholder="https://example.com"><small>Shown as a “View Live Project” button.</small></div>
          <div class="field full"><label for="pShort">Short description</label><textarea id="pShort" maxlength="300" style="min-height:70px">${E(project.short_description || "")}</textarea></div>
          <div class="field full"><label for="pFull">Full description</label><textarea id="pFull" style="min-height:160px">${E(project.full_description || "")}</textarea></div>
          <div class="field"><label for="pTech">Technologies used</label><input id="pTech" type="text" value="${E((project.technologies || []).join(", "))}" placeholder="HTML, CSS, JavaScript, Supabase"><small>Separate with commas.</small></div>
          <div class="field"><label for="pDone">Completion information</label><input id="pDone" type="text" maxlength="200" value="${E(project.completion_info || "")}" placeholder="e.g. Completed March 2026 (optional)"></div>
          <div class="field full"><label for="pFeat">Key features</label><textarea id="pFeat" style="min-height:110px" placeholder="One feature per line">${E((project.features || []).join("\n"))}</textarea><small>One feature per line.</small></div>

          <div class="field full img-field"><label>Cover image</label>
            <div class="preview" id="coverPrev">${coverUrl ? `<img src="${E(coverUrl)}" alt="">` : "No cover image"}</div>
            <input type="file" id="coverFile" accept="image/*"><small id="coverSt">Images are compressed automatically before upload.</small>
            <label class="check"><input type="checkbox" id="pCoverWm" ${project.show_watermark ? "checked" : ""}> Show watermark on the cover image</label>
            <small>${wmOn ? "The site-wide watermark is ON (Settings), so ticked images show it." : "The site-wide watermark is OFF in Settings — ticking this does nothing until you enable it there."}</small>
          </div>

          <div class="field full"><label>Screenshots</label>
            <input type="file" id="shotFile" accept="image/*" multiple><small id="shotSt">You can select several images at once.</small>
            <div class="shots" id="shots"></div>
          </div>

          <div class="field"><label class="check"><input type="checkbox" id="pFeatured" ${project.is_featured ? "checked" : ""}> Featured (show on homepage)</label></div>
          <div class="field"><label class="check"><input type="checkbox" id="pPub" ${project.is_published ? "checked" : ""}> Published (visible on the website)</label></div>
        </div>
        <p class="status" id="pStatus"></p>
        <div class="btn-row"><button class="btn btn-primary" type="submit" id="pSave">${isEdit ? "Save changes" : "Create project"}</button><a class="btn btn-ghost" href="projects.html">Cancel</a></div>
      </form>`;

    // category suggestions from existing projects
    db.from("projects").select("category").then(({ data }) => {
      const cats = [...new Set((data || []).map((x) => x.category).filter(Boolean))];
      document.getElementById("catList").innerHTML = cats.map((c) => `<option value="${E(c)}">`).join("");
    });

    const st = document.getElementById("pStatus");
    const say = (m, ok) => { st.textContent = m; st.className = "status " + (ok ? "ok" : "err"); };

    // ---- cover ----
    document.getElementById("coverFile").addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const s = document.getElementById("coverSt"); s.textContent = "Uploading…";
      try {
        const up = await VA.uploadImage(f, "projects");
        if (coverPath && !oldCoverPath) oldCoverPath = coverPath; else if (coverPath) await VA.removeStorage([coverPath]);
        coverUrl = up.url; coverPath = up.path;
        document.getElementById("coverPrev").innerHTML = `<img src="${E(up.url)}" alt="">`;
        s.textContent = "Cover uploaded ✓";
      } catch (err) { s.textContent = "Upload failed: " + (err.message || err); }
    });

    // ---- screenshots ----
    function renderShots() {
      const box = document.getElementById("shots");
      const vis = images.filter((i) => !i.deleted);
      box.innerHTML = vis.map((im, n) => `
        <div class="shot"><div class="shot-img"><img src="${E(im.url)}" alt=""><span class="shot-n">${n + 1}</span></div>
          <label class="check toggle"><input type="checkbox" data-wm="${images.indexOf(im)}" ${im.show_watermark ? "checked" : ""}><span>Watermark</span></label>
          <div class="shot-actions"><button type="button" class="icon-btn" data-mv="-1" data-k="${images.indexOf(im)}" aria-label="Move earlier" title="Move earlier" ${n === 0 ? "disabled" : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="icon-btn" data-mv="1" data-k="${images.indexOf(im)}" aria-label="Move later" title="Move later" ${n === vis.length - 1 ? "disabled" : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button><button type="button" class="icon-btn danger" data-rm="${images.indexOf(im)}" aria-label="Remove screenshot" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button></div>
        </div>`).join("") || `<small>No screenshots yet.</small>`;
    }
    document.getElementById("shots").addEventListener("click", async (e) => {
      const rm = e.target.closest("[data-rm]"), mv = e.target.closest("[data-mv]");
      if (rm) {
        const im = images[Number(rm.dataset.rm)];
        if (im.id) im.deleted = true; else { await VA.removeStorage([im.path]); images.splice(images.indexOf(im), 1); }
        renderShots();
      }
      if (mv) {
        const vis = images.filter((i) => !i.deleted); const im = images[Number(mv.dataset.k)];
        const a = vis.indexOf(im), b = a + Number(mv.dataset.mv); if (!vis[b]) return;
        const ia = images.indexOf(vis[a]), ib = images.indexOf(vis[b]); [images[ia], images[ib]] = [images[ib], images[ia]];
        renderShots();
      }
    });
    document.getElementById("shots").addEventListener("change", (e) => {
      const c = e.target.closest("[data-wm]"); if (c) images[Number(c.dataset.wm)].show_watermark = c.checked;
    });
    document.getElementById("shotFile").addEventListener("change", async (e) => {
      const files = [...e.target.files]; if (!files.length) return;
      const s = document.getElementById("shotSt");
      for (let n = 0; n < files.length; n++) {
        s.textContent = `Uploading ${n + 1} of ${files.length}…`;
        try { const up = await VA.uploadImage(files[n], "projects"); images.push({ url: up.url, path: up.path, show_watermark: wmOn }); renderShots(); }
        catch (err) { VA.toast(`${files[n].name}: ${err.message || err}`, "err"); }
      }
      s.textContent = "Done ✓"; e.target.value = "";
    });
    renderShots();

    // ---- save ----
    document.getElementById("pForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("pSave");
      let live = document.getElementById("pLive").value.trim();
      if (live && !/^https?:\/\//i.test(live)) live = "https://" + live;
      const payload = {
        title: document.getElementById("pTitle").value.trim(),
        category: document.getElementById("pCat").value.trim() || null,
        short_description: document.getElementById("pShort").value.trim() || null,
        full_description: document.getElementById("pFull").value.trim() || null,
        technologies: document.getElementById("pTech").value.split(",").map((s) => s.trim()).filter(Boolean),
        features: document.getElementById("pFeat").value.split("\n").map((s) => s.trim()).filter(Boolean),
        completion_info: document.getElementById("pDone").value.trim() || null,
        live_url: live || null,
        cover_image_url: coverUrl || null, cover_image_path: coverPath || null,
        show_watermark: document.getElementById("pCoverWm").checked,
        is_featured: document.getElementById("pFeatured").checked,
        is_published: document.getElementById("pPub").checked
      };
      if (payload.title.length < 2) return say("Please enter a project name.", false);
      btn.disabled = true; say("Saving…", true);
      try {
        let pid = id;
        if (isEdit) { const { error } = await db.from("projects").update(payload).eq("id", id); if (error) throw error; }
        else { const { data, error } = await db.from("projects").insert(payload).select("id").single(); if (error) throw error; pid = data.id; }

        const removed = images.filter((i) => i.deleted && i.id);
        if (removed.length) {
          const { error } = await db.from("project_images").delete().in("id", removed.map((i) => i.id)); if (error) throw error;
          await VA.removeStorage(removed.map((i) => i.path));
        }
        const keep = images.filter((i) => !i.deleted);
        for (let n = 0; n < keep.length; n++) {
          const im = keep[n];
          if (im.id) { const { error } = await db.from("project_images").update({ show_watermark: im.show_watermark, display_order: n }).eq("id", im.id); if (error) throw error; }
          else { const { error } = await db.from("project_images").insert({ project_id: pid, image_url: im.url, storage_path: im.path, show_watermark: im.show_watermark, display_order: n }); if (error) throw error; }
        }
        if (oldCoverPath) await VA.removeStorage([oldCoverPath]);
        say("Saved ✓ Redirecting…", true);
        setTimeout(() => (location.href = "projects.html"), 700);
      } catch (err) { btn.disabled = false; say(err.message || "Could not save the project.", false); }
    });
  }
});
