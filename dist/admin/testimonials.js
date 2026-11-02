/* VYNEX/admin/testimonials.js — add / edit / delete / publish real client testimonials */
VA.onReady(() => {
  const db = VA.db;
  const body = document.getElementById("rows");
  let list = [];

  const fields = [
    { name: "client_name", label: "Client name", required: true },
    { name: "client_role", label: "Role / title" },
    { name: "company", label: "Company" },
    { name: "message", label: "Testimonial (what the client actually said)", type: "textarea", required: true },
    { name: "photo_url", pathName: "photo_path", label: "Client photo (optional)", type: "image", folder: "testimonials" },
    { name: "display_order", label: "Display order (1 = first)", type: "number" },
    { name: "is_published", label: "Published (visible on the website)", type: "checkbox" }
  ];

  async function load() {
    const { data, error } = await db.from("testimonials").select("*").order("display_order").order("created_at", { ascending: false });
    if (error) { body.innerHTML = `<tr><td colspan="4" class="empty">Could not load: ${VA.esc(error.message)}</td></tr>`; return; }
    list = data;
    body.innerHTML = list.length ? list.map((t, i) => `
      <tr>
        <td><b>${VA.esc(t.client_name)}</b><small>${VA.esc([t.client_role, t.company].filter(Boolean).join(", "))}</small></td>
        <td style="max-width:420px">${VA.esc(t.message.length > 140 ? t.message.slice(0, 140) + "…" : t.message)}</td>
        <td><span class="badge ${t.is_published ? "ok" : "muted"}">${t.is_published ? "Published" : "Hidden"}</span></td>
        <td><div class="btn-row">
          <button class="btn btn-ghost btn-sm" data-act="toggle" data-i="${i}">${t.is_published ? "Unpublish" : "Publish"}</button>
          <button class="btn btn-ghost btn-sm" data-act="edit" data-i="${i}">Edit</button>
          <button class="btn btn-danger btn-sm" data-act="del" data-i="${i}">Delete</button>
        </div></td>
      </tr>`).join("") : `<tr><td colspan="4" class="empty">No testimonials yet. Only add real feedback from real clients.</td></tr>`;
  }

  const clean = (d) => ({
    client_name: d.client_name, client_role: d.client_role || null, company: d.company || null, message: d.message,
    photo_url: d.photo_url || null, photo_path: d.photo_path || null, display_order: Number(d.display_order) || 0, is_published: !!d.is_published
  });

  document.getElementById("addBtn").onclick = () => VA.openForm({
    title: "Add testimonial", fields, values: { is_published: false, display_order: list.length + 1 },
    onSubmit: async (d) => { const { error } = await db.from("testimonials").insert(clean(d)); if (error) throw error; VA.toast("Testimonial added"); load(); }
  });

  body.addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const t = list[Number(b.dataset.i)];
    if (b.dataset.act === "edit") VA.openForm({ title: "Edit testimonial", fields, values: t, onSubmit: async (d) => {
      const { error } = await db.from("testimonials").update(clean(d)).eq("id", t.id); if (error) throw error; VA.toast("Saved"); load();
    } });
    if (b.dataset.act === "toggle") {
      const { error } = await db.from("testimonials").update({ is_published: !t.is_published }).eq("id", t.id);
      if (error) return VA.toast(error.message, "err"); load();
    }
    if (b.dataset.act === "del") {
      if (!confirm(`Delete the testimonial from ${t.client_name}?`)) return;
      const { error } = await db.from("testimonials").delete().eq("id", t.id);
      if (error) return VA.toast(error.message, "err");
      await VA.removeStorage([t.photo_path]); VA.toast("Deleted"); load();
    }
  });
  load();
});
