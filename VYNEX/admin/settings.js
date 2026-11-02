/* VYNEX/admin/settings.js — company information (company-information.html) and
   watermark / account settings (settings.html). Both save to the single row company_settings (id = 1). */
VA.onReady(async () => {
  const db = VA.db;
  const page = document.body.dataset.page;
  const $ = (id) => document.getElementById(id);
  const { data } = await db.from("company_settings").select("*").eq("id", 1).maybeSingle();
  const cur = data || {};

  async function save(patch, statusEl, okMsg) {
    statusEl.className = "status"; statusEl.textContent = "Saving…";
    const { error } = await db.from("company_settings").upsert({ id: 1, ...patch });
    if (error) {
      statusEl.className = "status err";
      statusEl.textContent = /social_tiktok/i.test(error.message)
        ? "The database needs one small update for the TikTok link: run backend/migrations/010-contact-links.sql in Supabase → SQL Editor, then save again."
        : error.message;
      return false;
    }
    statusEl.className = "status ok"; statusEl.textContent = okMsg || "Saved ✓ The website now shows your changes.";
    VA.toast("Saved"); return true;
  }

  // ================= COMPANY INFORMATION =================
  if (page === "company") {
    const keys = ["name", "tagline", "description", "about", "mission", "vision", "email", "phone", "whatsapp", "location", "social_instagram", "social_tiktok", "social_twitter"];
    keys.forEach((k) => { if ($("c_" + k)) $("c_" + k).value = cur[k] || ""; });
    // ---- live preview of the contact icons + what each one will open ----
    document.querySelectorAll(".lbl-ico").forEach((el) => { el.innerHTML = VX_BRAND(el.dataset.ico, "ico brand-ico"); });
    function paintContacts() {
      const row = {};
      VX_CONTACT.items.forEach((it) => { row[it.field] = $("c_" + it.field).value; });
      $("contactPrev").innerHTML = VX_CONTACT.html(row) || '<span class="muted">No icons yet — fill in a box below and it appears here.</span>';
      VX_CONTACT.items.forEach((it) => {
        const out = document.querySelector('.resolved[data-for="' + it.field + '"]'), v = row[it.field].trim();
        const href = VX_CONTACT.link(it.key, v);
        out.className = "resolved" + (v && !href ? " bad" : "");
        out.textContent = !v ? "" : href ? "Opens: " + href : "That doesn't look valid — please check it.";
      });
    }
    VX_CONTACT.items.forEach((it) => $("c_" + it.field).addEventListener("input", paintContacts));
    paintContacts();
    let logoUrl = cur.logo_url || "";
    $("logoPrev").innerHTML = logoUrl ? `<img src="${VA.esc(logoUrl)}" alt="Logo" style="object-fit:contain">` : "No logo uploaded (the site uses public/images/logo.png)";
    $("logoFile").addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      $("logoSt").textContent = "Uploading…";
      try { const up = await VA.uploadImage(f, "branding"); logoUrl = up.url; $("logoPrev").innerHTML = `<img src="${VA.esc(up.url)}" alt="Logo" style="object-fit:contain">`; $("logoSt").textContent = "Uploaded ✓ — click Save to apply."; }
      catch (err) { $("logoSt").textContent = "Upload failed: " + (err.message || err); }
    });
    $("companyForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const bad = VX_CONTACT.items.filter((it) => $("c_" + it.field).value.trim() && !VX_CONTACT.link(it.key, $("c_" + it.field).value));
      if (bad.length) { $("cStatus").className = "status err"; $("cStatus").textContent = "Please fix: " + bad.map((b) => b.label).join(", ") + " (the link or number isn't valid)."; return; }
      const patch = { logo_url: logoUrl || null };
      keys.forEach((k) => { patch[k] = $("c_" + k).value.trim() || null; });
      if (!patch.name) patch.name = "VYNEX";
      const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true;
      await save(patch, $("cStatus")); btn.disabled = false;
    });
    return;
  }

  // ================= SETTINGS (watermark + account) =================
  const pos = $("wmPos"), op = $("wmOpacity"), sz = $("wmSize"), on = $("wmOn");
  on.checked = !!cur.watermark_enabled;
  op.value = Math.round(Number(cur.watermark_opacity ?? 0.35) * 100);
  sz.value = cur.watermark_size ?? 22;
  pos.value = cur.watermark_position || "bottom-right";
  const prev = $("wmPrevImg");
  function paint() {
    $("opVal").textContent = op.value + "%"; $("szVal").textContent = sz.value + "%";
    prev.style.opacity = op.value / 100; prev.style.width = sz.value + "%";
    prev.className = pos.value; prev.style.display = on.checked ? "block" : "none";
  }
  [on, op, sz, pos].forEach((el) => el.addEventListener("input", paint)); paint();
  $("wmForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await save({ watermark_enabled: on.checked, watermark_opacity: Number(op.value) / 100, watermark_size: Number(sz.value), watermark_position: pos.value }, $("wmStatus"),
      on.checked
        ? "Saved ✓ The watermark now appears on every cover / screenshot that has “Watermark” ticked. To tick them all at once, use “Apply to all images” below."
        : "Saved ✓ The watermark is switched OFF on the website.");
  });

  // Tick / un-tick "Watermark" on every project cover and screenshot at once
  async function setAll(value) {
    const st = $("wmAllStatus");
    if (!confirm(value ? "Put the watermark on ALL project covers and screenshots?" : "Remove the watermark from ALL project covers and screenshots?")) return;
    st.className = "status"; st.textContent = "Working…";
    const a = await db.from("projects").update({ show_watermark: value }).not("id", "is", null);
    const b = a.error ? a : await db.from("project_images").update({ show_watermark: value }).not("id", "is", null);
    if (a.error || b.error) { st.className = "status err"; st.textContent = (a.error || b.error).message; return; }
    st.className = "status ok";
    st.textContent = value
      ? "Done ✓ Every project cover and screenshot is now ticked." + (on.checked ? "" : " Remember to switch on “Enable watermark” above and save, or nothing will show.")
      : "Done ✓ The watermark tick was removed from every project cover and screenshot.";
    VA.toast("Saved");
  }
  $("wmAllOn").addEventListener("click", () => setAll(true));
  $("wmAllOff").addEventListener("click", () => setAll(false));

  $("pwForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const st = $("pwStatus"), p1 = $("pw1").value, p2 = $("pw2").value;
    if (p1.length < 8) { st.className = "status err"; st.textContent = "Use at least 8 characters."; return; }
    if (p1 !== p2) { st.className = "status err"; st.textContent = "The two passwords don't match."; return; }
    const { error } = await db.auth.updateUser({ password: p1 });
    if (error) { st.className = "status err"; st.textContent = error.message; return; }
    st.className = "status ok"; st.textContent = "Password updated ✓"; e.target.reset();
  });
});
