/* VYNEX/admin/services.js — add / edit / delete / publish / reorder services */
VA.onReady(() => {
  const db = VA.db;
  const body = document.getElementById("rows");
  let list = [];

  const fields = [
    { name: "title", label: "Service title", required: true },
    { name: "icon", label: "Icon", type: "select", options: VX_ICON.names, help: "Shown on the service card (pick the closest match)." },
    { name: "short_description", label: "Short description", type: "textarea", help: "Shown on cards (one or two sentences)." },
    { name: "full_description", label: "Full description", type: "textarea" },
    { name: "image_url", pathName: "image_path", label: "Service image", type: "image", folder: "services" },
    { name: "is_published", label: "Published (visible on the website)", type: "checkbox" }
  ];

  async function load() {
    const { data, error } = await db.from("services").select("*").order("display_order").order("created_at");
    if (error) { body.innerHTML = `<tr><td colspan="5" class="empty">Could not load services: ${VA.esc(error.message)}</td></tr>`; return; }
    list = data;
    render();
  }

  function render() {
    if (!list.length) { body.innerHTML = `<tr><td colspan="5" class="empty">No services yet. Click “Add Service”.</td></tr>`; return; }
    body.innerHTML = list.map((s, i) => `
      <tr>
        <td>${s.image_url ? `<img class="thumb" src="${VA.esc(s.image_url)}" alt="">` : `<span class="tbl-ico">${VX_ICON.resolve(s.icon, s.title)}</span>`}</td>
        <td><b>${VA.esc(s.title)}</b><small>${VA.esc(s.short_description || "")}</small></td>
        <td><span class="badge ${s.is_published ? "ok" : "muted"}">${s.is_published ? "Published" : "Hidden"}</span></td>
        <td class="btn-row">
          <button class="btn btn-ghost btn-sm" data-act="up" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
          <button class="btn btn-ghost btn-sm" data-act="down" data-i="${i}" ${i === list.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
        </td>
        <td><div class="btn-row">
          <button class="btn btn-ghost btn-sm" data-act="toggle" data-i="${i}">${s.is_published ? "Unpublish" : "Publish"}</button>
          <button class="btn btn-ghost btn-sm" data-act="edit" data-i="${i}">Edit</button>
          <button class="btn btn-danger btn-sm" data-act="del" data-i="${i}">Delete</button>
        </div></td>
      </tr>`).join("");
  }

  const clean = (d) => ({
    title: d.title, icon: d.icon || null, short_description: d.short_description || null, full_description: d.full_description || null,
    image_url: d.image_url || null, image_path: d.image_path || null, is_published: !!d.is_published
  });

  document.getElementById("addBtn").onclick = () => VA.openForm({
    title: "Add service", fields, values: { is_published: true },
    onSubmit: async (d) => {
      const max = list.reduce((m, s) => Math.max(m, s.display_order || 0), 0);
      const { error } = await db.from("services").insert({ ...clean(d), display_order: max + 1 });
      if (error) throw error; VA.toast("Service added"); load();
    }
  });

  body.addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const i = Number(b.dataset.i), s = list[i];
    if (b.dataset.act === "edit") {
      VA.openForm({ title: "Edit service", fields, values: s, onSubmit: async (d) => {
        const { error } = await db.from("services").update(clean(d)).eq("id", s.id);
        if (error) throw error; VA.toast("Service updated"); load();
      } });
    }
    if (b.dataset.act === "toggle") {
      const { error } = await db.from("services").update({ is_published: !s.is_published }).eq("id", s.id);
      if (error) return VA.toast(error.message, "err");
      VA.toast(s.is_published ? "Service hidden" : "Service published"); load();
    }
    if (b.dataset.act === "del") {
      if (!confirm(`Delete “${s.title}”? This cannot be undone.`)) return;
      const { error } = await db.from("services").delete().eq("id", s.id);
      if (error) return VA.toast(error.message, "err");
      await VA.removeStorage([s.image_path]); VA.toast("Service deleted"); load();
    }
    if (b.dataset.act === "up" || b.dataset.act === "down") {
      const j = b.dataset.act === "up" ? i - 1 : i + 1; const o = list[j]; if (!o) return;
      // renumber everything so duplicates can never break the order
      const order = list.map((x) => x.id); [order[i], order[j]] = [order[j], order[i]];
      const results = await Promise.all(order.map((id, n) => db.from("services").update({ display_order: n + 1 }).eq("id", id)));
      if (results.some((r) => r.error)) return VA.toast("Could not reorder", "err");
      load();
    }
  });

  load();
});
