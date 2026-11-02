/* VYNEX/admin/inquiries.js — contact messages (inquiries.html) and quote requests (quote-requests.html).
   The page's <body data-table="contact_inquiries|quote_requests"> picks which table is shown. */
VA.onReady(() => {
  const db = VA.db;
  const table = document.body.dataset.table;
  const isQuote = table === "quote_requests";
  const body = document.getElementById("rows");
  const filter = document.getElementById("statusFilter");
  let list = [];

  // The quote form puts "[Project: …]" and "[Contact: …]" lines at the top of the requirements. Split them out.
  function parseReq(text) {
    const tags = {}; let rest = String(text || ""), m;
    while ((m = rest.match(/^\s*\[(Project|Contact):([^\]]*)\]\s*\n?/i))) { tags[m[1].toLowerCase()] = m[2].trim(); rest = rest.slice(m[0].length); }
    const pm = (tags.project || "").match(/^(.*?)(?:\s*\|\s*ref:\s*([0-9a-f-]{36}))?$/i);
    return { project: pm ? pm[1].trim() : "", ref: pm && pm[2] ? pm[2] : "", contact: tags.contact || "", text: rest.trim() };
  }
  // "Quoting for" badges: the service they picked and/or the portfolio project they were looking at.
  function quotingFor(r) {
    const q = parseReq(r.requirements), out = [];
    if (r.service) out.push(`<span class="badge svc" title="Service">${VA.esc(r.service)}</span>`);
    if (q.project) out.push(`<span class="badge prj" title="Portfolio project">Project: ${VA.esc(q.project)}</span>`);
    return out.length ? out.join(" ") : `<span class="badge muted">General enquiry</span>`;
  }

  async function load() {
    let q = db.from(table).select("*").order("created_at", { ascending: false });
    if (filter.value) q = q.eq("status", filter.value);
    const { data, error } = await q;
    if (error) { body.innerHTML = `<tr><td colspan="5" class="empty">Could not load: ${VA.esc(error.message)}</td></tr>`; return; }
    list = data;
    body.innerHTML = list.length ? list.map((r, i) => `
      <tr>
        <td><b>${VA.esc(r.name)}</b><small>${VA.esc(r.email)}${r.phone ? " · <a href=\"tel:" + VA.esc(String(r.phone).replace(/[^0-9+]/g, "")) + "\">" + VA.esc(r.phone) + "</a>" : ""}</small></td>
        <td>${isQuote ? quotingFor(r) : VA.esc(r.subject || "—")}<small>${VA.esc((isQuote ? parseReq(r.requirements).text : r.message).slice(0, 80))}…</small></td>
        <td>
          <select data-act="status" data-i="${i}" style="background:#121a33;color:#fff;border:1px solid var(--line);border-radius:8px;padding:6px 8px">
            ${["pending", "answered", "completed"].map((s) => `<option value="${s}" ${r.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td>${VA.fmtDate(r.created_at)}</td>
        <td><div class="btn-row"><button class="btn btn-ghost btn-sm" data-act="view" data-i="${i}">View</button><button class="btn btn-danger btn-sm" data-act="del" data-i="${i}">Delete</button></div></td>
      </tr>`).join("") : `<tr><td colspan="5" class="empty">Nothing here yet.</td></tr>`;
  }

  // Reply helpers. Gmail compose opens in a new tab (works even with no desktop mail app set up).
  const replySubject = (r) => "Re: " + (r.subject || (isQuote && parseReq(r.requirements).project) || r.service || "Your enquiry");
  const gmailUrl = (r) => "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(r.email) + "&su=" + encodeURIComponent(replySubject(r));
  // WhatsApp needs the number in international format, digits only. Kenyan local numbers (07…/01…) get 254.
  function waNum(phone) {
    let d = String(phone || "").replace(/[^0-9+]/g, "");
    if (!d) return "";
    if (d.startsWith("+")) d = d.slice(1);
    else if (d.startsWith("00")) d = d.slice(2);
    else if (d.startsWith("0")) d = "254" + d.slice(1);
    else if (/^[17]\d{8}$/.test(d)) d = "254" + d;
    return d.length >= 8 ? d : "";
  }
  const waUrl = (r) => "https://wa.me/" + waNum(r.phone) + "?text=" + encodeURIComponent("Hello " + (r.name || "") + ", thank you for contacting VYNEX Web Solutions" + (r.subject || r.service || (isQuote && parseReq(r.requirements).project) ? " about \"" + (r.subject || r.service || parseReq(r.requirements).project) + "\"" : "") + ". ");

  function view(r) {
    const q = isQuote ? parseReq(r.requirements) : null;
    const projHtml = q && q.project ? (q.ref ? `<a href="../project-details.html?id=${VA.esc(q.ref)}" target="_blank" rel="noopener">${VA.esc(q.project)} ↗</a>` : VA.esc(q.project)) : "";
    const rows = isQuote
      ? [["Name", r.name], ["Email", r.email], ["Phone", r.phone], ["Quoting for", quotingFor(r), true], ["Service", r.service], ["Project", projHtml, true], ["Budget", r.budget], ["Timeline", r.timeline], ["Contact via", q.contact], ["Requirements", q.text], ["Status", r.status], ["Received", VA.fmtDate(r.created_at)]]
      : [["Name", r.name], ["Email", r.email], ["Phone", r.phone], ["Subject", r.subject], ["Message", r.message], ["Status", r.status], ["Received", VA.fmtDate(r.created_at)]];
    const m = VA.modal(isQuote ? "Quote request" : "Message", rows.filter(([, v]) => v).map(([k, v, html]) => `<div class="detail-row"><b>${k}</b><span>${html ? v : k === "Phone" ? `<a href="tel:${VA.esc(String(v).replace(/[^0-9+]/g, ""))}">${VA.esc(v)}</a>` : VA.esc(v)}</span></div>`).join("") +
      `<div class="modal-actions">${r.phone ? `<a class="btn btn-primary" href="tel:${VA.esc(String(r.phone).replace(/[^0-9+]/g, ""))}">Call now</a>` : ""}<a class="btn btn-ghost" target="_blank" rel="noopener" href="${VA.esc(gmailUrl(r))}">Reply by email</a>${waNum(r.phone) ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${VA.esc(waUrl(r))}">Reply via WhatsApp</a>` : ""}<button class="btn btn-primary" id="closeV">Close</button></div>`);
    m.body.querySelector("#closeV").onclick = m.close;
  }

  body.addEventListener("change", async (e) => {
    const s = e.target.closest("select[data-act=status]"); if (!s) return;
    const r = list[Number(s.dataset.i)];
    const { error } = await db.from(table).update({ status: s.value }).eq("id", r.id);
    if (error) return VA.toast(error.message, "err");
    VA.toast("Status updated"); load();
  });
  body.addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const r = list[Number(b.dataset.i)];
    if (b.dataset.act === "view") view(r);
    if (b.dataset.act === "del") {
      if (!confirm(`Delete this ${isQuote ? "quote request" : "message"} from ${r.name}? This cannot be undone.`)) return;
      const { error } = await db.from(table).delete().eq("id", r.id);
      if (error) return VA.toast(error.message, "err");
      VA.toast("Deleted"); load();
    }
  });
  filter.addEventListener("change", load);
  load();
});
