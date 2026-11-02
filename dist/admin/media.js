/* VYNEX/admin/media.js — media management: upload, preview, organise (folders) and remove images.
   Images are stored in Supabase Storage (bucket "website-images") and listed from the media_files table. */
VA.onReady(() => {
  const db = VA.db;
  const grid = document.getElementById("mediaGrid");
  const folderSel = document.getElementById("folderFilter");
  const upFolder = document.getElementById("uploadFolder");
  let list = [];

  async function load() {
    let q = db.from("media_files").select("*").order("created_at", { ascending: false });
    if (folderSel.value) q = q.eq("folder", folderSel.value);
    const { data, error } = await q;
    if (error) { grid.innerHTML = `<div class="empty">Could not load media: ${VA.esc(error.message)}</div>`; return; }
    list = data;
    grid.innerHTML = list.length ? list.map((m, i) => `
      <div class="media-item"><img src="${VA.esc(m.url)}" alt="${VA.esc(m.name)}" loading="lazy">
        <div><b title="${VA.esc(m.name)}">${VA.esc(m.name)}</b><span>${VA.esc(m.folder)} · ${m.size_bytes ? Math.round(m.size_bytes / 1024) + " KB" : ""}</span>
          <div class="btn-row"><button class="btn btn-ghost btn-sm" data-act="copy" data-i="${i}">Copy URL</button><button class="btn btn-danger btn-sm" data-act="del" data-i="${i}">Delete</button></div>
        </div></div>`).join("") : `<div class="empty" style="grid-column:1/-1">No images in this folder yet.</div>`;
  }

  document.getElementById("mediaFile").addEventListener("change", async (e) => {
    const files = [...e.target.files]; if (!files.length) return;
    const st = document.getElementById("mediaSt");
    for (let n = 0; n < files.length; n++) {
      st.textContent = `Uploading ${n + 1} of ${files.length}…`;
      try { await VA.uploadImage(files[n], upFolder.value); } catch (err) { VA.toast(`${files[n].name}: ${err.message || err}`, "err"); }
    }
    st.textContent = "Done ✓"; e.target.value = ""; load();
  });

  grid.addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const m = list[Number(b.dataset.i)];
    if (b.dataset.act === "copy") {
      try { await navigator.clipboard.writeText(m.url); VA.toast("Image URL copied"); } catch { prompt("Copy this URL:", m.url); }
    }
    if (b.dataset.act === "del") {
      if (!confirm(`Delete “${m.name}”? If a project or service still uses it, that image will disappear from the website.`)) return;
      await VA.removeStorage([m.storage_path]); VA.toast("Image deleted"); load();
    }
  });
  folderSel.addEventListener("change", load);
  load();
});
