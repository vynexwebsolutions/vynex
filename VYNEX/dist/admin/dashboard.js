/* VYNEX/admin/dashboard.js — dashboard numbers + recent activity (all real data from Supabase) */
const projectOf = (t) => { const m = String(t || "").match(/^\s*\[Project:\s*([^\]|]*)/i); return m ? m[1].trim() : ""; };
VA.onReady(async () => {
  const db = VA.db;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  const { data: s, error } = await db.rpc("dashboard_stats");
  if (error) {
    document.getElementById("dashAlert").hidden = false;
    document.getElementById("dashAlert").textContent = "Could not load statistics. Make sure you ran database.sql in Supabase (it creates dashboard_stats).";
  } else {
    set("sProjects", s.total_projects); set("sPublished", s.published_projects); set("sDrafts", s.draft_projects);
    set("sServices", s.total_services); set("sInquiries", s.total_inquiries); set("sQuotes", s.pending_quotes);
  }

  // Managed (hosted) websites: count + contracts about to end or already ended. Fails quietly if the table is not created yet.
  try {
    const { data: ms, error: me } = await db.from("managed_websites").select("site_name,status,contract_ends_at");
    if (!me && ms) {
      const live = ms.filter((x) => x.status === "active"), now = Date.now(), in30 = now + 30 * 864e5;
      const soon = live.filter((x) => x.contract_ends_at && new Date(x.contract_ends_at) > now && new Date(x.contract_ends_at) <= in30);
      const ended = live.filter((x) => x.contract_ends_at && new Date(x.contract_ends_at) <= now);
      set("sManaged", ms.length); set("sExpiring", soon.length + ended.length);
      if (soon.length || ended.length) {
        const al = document.getElementById("dashAlert"); al.hidden = false;
        al.innerHTML = `Hosting contracts need attention: ${ended.length ? "<b>" + ended.length + " ended</b>" : ""}${ended.length && soon.length ? ", " : ""}${soon.length ? "<b>" + soon.length + " ending within 30 days</b>" : ""}. <a href="managed-websites.html" style="color:inherit;text-decoration:underline">Open Managed Websites</a>`;
      }
    }
  } catch (e) { /* optional feature */ }

  const [c, q, p] = await Promise.all([
    db.from("contact_inquiries").select("name,subject,created_at").order("created_at", { ascending: false }).limit(5),
    db.from("quote_requests").select("name,service,requirements,created_at").order("created_at", { ascending: false }).limit(5),
    db.from("projects").select("title,is_published,updated_at").order("updated_at", { ascending: false }).limit(5)
  ]);
  const items = [
    ...(c.data || []).map((x) => ({ t: x.created_at, h: `${VX_ICON("mail","ico ico-inline")} New message from <b>${VA.esc(x.name)}</b>${x.subject ? " — " + VA.esc(x.subject) : ""}` })),
    ...(q.data || []).map((x) => ({ t: x.created_at, h: `${VX_ICON("receipt","ico ico-inline")} Quote request from <b>${VA.esc(x.name)}</b>${x.service ? " — " + VA.esc(x.service) : ""}${projectOf(x.requirements) ? " — project: " + VA.esc(projectOf(x.requirements)) : ""}` })),
    ...(p.data || []).map((x) => ({ t: x.updated_at, h: `${VX_ICON("folder","ico ico-inline")} Project <b>${VA.esc(x.title)}</b> updated (${x.is_published ? "published" : "draft"})` }))
  ].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 10);

  document.getElementById("activity").innerHTML = items.length
    ? items.map((i) => `<li><span>${i.h}</span><time>${VA.fmtDate(i.t)}</time></li>`).join("")
    : `<li><span style="color:var(--muted)">No activity yet. It will appear here as messages, quotes and projects come in.</span></li>`;
});
