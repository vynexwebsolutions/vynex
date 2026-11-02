/* VYNEX/admin/managed-websites.js
   Admin-only register of the client websites VYNEX hosts / manages.
   - Each site stores owner details, hosting details, the contract and every payment received.
   - The contract runs from the EXACT deployment moment for N months and ends at that same clock time (Nairobi, UTC+3).
   - The countdown is shown in months (plus days/hours/minutes/seconds in the detail view) and ticks live.
   Tables: managed_websites, managed_website_payments (see backend/migrations/012-managed-websites.sql). */
VA.onReady(() => {
  const db = VA.db;
  const body = document.getElementById("rows");
  const $ = (id) => document.getElementById(id);
  const EAT = 3 * 3600 * 1000;              // Nairobi is UTC+3 all year (no daylight saving)
  const SOON_DAYS = 30;
  let sites = [], pays = {};                // pays: website_id -> [payments]

  /* ---------- time helpers (calendar-correct months, Nairobi clock) ---------- */
  // add N calendar months in Nairobi time, clamping the day (31 Jan + 1 month = 28/29 Feb) exactly like the database does
  function addMonths(date, n) {
    const d = new Date(new Date(date).getTime() + EAT);
    const day = d.getUTCDate();
    d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
    return new Date(d.getTime() - EAT);
  }
  const endOf = (s) => s.contract_ends_at ? new Date(s.contract_ends_at) : addMonths(s.deployed_at, s.contract_months);

  // time remaining split into whole months + days/hours/min/sec
  function remaining(s, now = new Date()) {
    const end = endOf(s);
    if (now >= end) return { ended: true, ms: 0, months: 0, days: 0, h: 0, m: 0, s: 0 };
    let months = (end.getUTCFullYear() - now.getUTCFullYear()) * 12 + (end.getUTCMonth() - now.getUTCMonth());
    while (months > 0 && addMonths(now, months) > end) months--;
    let rest = end - addMonths(now, Math.max(months, 0));
    const days = Math.floor(rest / 864e5); rest -= days * 864e5;
    const h = Math.floor(rest / 36e5); rest -= h * 36e5;
    const m = Math.floor(rest / 6e4); rest -= m * 6e4;
    return { ended: false, ms: end - now, months, days, h, m, s: Math.floor(rest / 1000) };
  }
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  function leftText(s) {
    const r = remaining(s);
    if (r.ended) return "Contract ended";
    if (r.months > 0) return plural(r.months, "month") + (r.days ? " " + plural(r.days, "day") : "");
    if (r.days > 0) return plural(r.days, "day") + " " + plural(r.h, "hour");
    return `${r.h}h ${r.m}m ${r.s}s`;
  }

  /* ---------- status ---------- */
  function state(s) {
    if (s.status === "terminated") return { key: "terminated", label: "Terminated", cls: "muted" };
    if (s.status === "suspended") return { key: "suspended", label: "Suspended", cls: "warn" };
    const r = remaining(s);
    if (r.ended) return { key: "ended", label: "Contract ended", cls: "bad" };
    if (r.ms <= SOON_DAYS * 864e5) return { key: "soon", label: "Expiring soon", cls: "warn" };
    return { key: "active", label: "Active", cls: "ok" };
  }

  /* ---------- money ---------- */
  const paidOf = (s) => (pays[s.id] || []).reduce((t, p) => t + Number(p.amount), 0);
  const money = (n, cur) => {
    const v = Number(n || 0);
    try { return new Intl.NumberFormat("en-KE", { style: "currency", currency: cur || "KES", maximumFractionDigits: 2 }).format(v); }
    catch { return `${cur || "KES"} ${v.toLocaleString()}`; }
  };

  /* ---------- small formatters ---------- */
  const fmt = (d) => d ? new Date(d).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }) : "";
  const fmtDay = (d) => d ? new Date(d + (String(d).length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-KE", { dateStyle: "medium" }) : "";
  const toInput = (iso) => { if (!iso) return ""; const d = new Date(new Date(iso).getTime() + EAT); return d.toISOString().slice(0, 16); };      // Nairobi wall-clock for <input type=datetime-local>
  const fromInput = (v) => new Date(v + ":00+03:00").toISOString();
  const digits = (p) => { let d = String(p || "").replace(/\D/g, ""); if (d.startsWith("0")) d = "254" + d.slice(1); return d; };
  const link = (u) => { const t = String(u || "").trim(); if (!t) return ""; const href = /^https?:\/\//i.test(t) ? t : "https://" + t; return `<a href="${VA.esc(href)}" target="_blank" rel="noopener noreferrer">${VA.esc(t)}</a>`; };

  /* ---------- load ---------- */
  async function load() {
    const [a, b] = await Promise.all([
      db.from("managed_websites").select("*").order("contract_ends_at", { ascending: true }),
      db.from("managed_website_payments").select("*").order("paid_at", { ascending: false })
    ]);
    if (a.error || b.error) {
      const msg = (a.error || b.error).message;
      body.innerHTML = `<tr><td colspan="7" class="empty">Could not load: ${VA.esc(msg)}<br><small>Run backend/migrations/012-managed-websites.sql in the Supabase SQL Editor first.</small></td></tr>`;
      return;
    }
    sites = a.data; pays = {};
    b.data.forEach((p) => (pays[p.website_id] = pays[p.website_id] || []).push(p));
    render();
  }

  /* ---------- list ---------- */
  function render() {
    const q = $("q").value.trim().toLowerCase(), f = $("f").value;
    const rows = sites.filter((s) => {
      const hay = [s.site_name, s.website_url, s.owner_name, s.owner_company, s.owner_phone, s.owner_email, s.host_provider].join(" ").toLowerCase();
      return (!q || hay.includes(q)) && (!f || state(s).key === f);
    });

    // summary cards (always over ALL sites)
    const st = sites.map(state);
    $("sTotal").textContent = sites.length;
    $("sActive").textContent = st.filter((x) => x.key === "active" || x.key === "soon").length;
    $("sSoon").textContent = st.filter((x) => x.key === "soon").length;
    $("sEnded").textContent = st.filter((x) => x.key === "ended").length;
    const cur = sites.length && sites.every((s) => s.currency === sites[0].currency) ? sites[0].currency : "KES";
    const paid = sites.reduce((t, s) => t + paidOf(s), 0);
    const bal = sites.reduce((t, s) => t + Math.max(0, Number(s.agreed_amount) - paidOf(s)), 0);
    $("sPaid").textContent = money(paid, cur); $("sBal").textContent = money(bal, cur);

    const ended = sites.filter((s) => state(s).key === "ended"), soon = sites.filter((s) => state(s).key === "soon");
    const al = $("expAlert");
    al.hidden = !(ended.length || soon.length);
    al.innerHTML = [
      ended.length ? `<b>${plural(ended.length, "contract")} ended</b> — ${ended.map((s) => VA.esc(s.site_name)).join(", ")}. Renew or terminate hosting.` : "",
      soon.length ? `<b>${plural(soon.length, "contract")} ending within ${SOON_DAYS} days</b> — ${soon.map((s) => VA.esc(s.site_name)).join(", ")}.` : ""
    ].filter(Boolean).join("<br>");

    body.innerHTML = rows.length ? rows.map((s) => {
      const i = sites.indexOf(s), t = state(s), p = paidOf(s), owed = Math.max(0, Number(s.agreed_amount) - p);
      return `<tr>
        <td class="left-cell"><b>${VA.esc(s.site_name)}</b><small>${VA.esc(s.owner_name)}${s.owner_phone ? " · " + VA.esc(s.owner_phone) : ""}</small></td>
        <td>${VA.esc(s.host_provider || "—")}<small>${VA.esc(s.hosting_plan || "")}</small></td>
        <td>${VA.esc(fmt(s.deployed_at))}</td>
        <td>${VA.esc(fmt(endOf(s)))}<small>${plural(s.contract_months, "month")} contract</small></td>
        <td><span class="badge ${t.cls}" data-left="${i}">${VA.esc(leftText(s))}</span><small>${VA.esc(t.label)}</small></td>
        <td>${VA.esc(money(p, s.currency))}<small class="${owed ? "money-bad" : "money-ok"}">${owed ? "Balance " + VA.esc(money(owed, s.currency)) : "Fully paid"}</small></td>
        <td><div class="btn-row">
          <button class="btn btn-primary btn-sm" data-act="view" data-i="${i}">Manage</button>
          <button class="btn btn-ghost btn-sm" data-act="edit" data-i="${i}">Edit</button>
          <button class="btn btn-ghost btn-sm" data-act="print" data-i="${i}">Print / PDF</button>
          <button class="btn btn-danger btn-sm" data-act="del" data-i="${i}">Delete</button>
        </div></td></tr>`;
    }).join("") : `<tr><td colspan="7" class="empty">${sites.length ? "No websites match your search." : "No managed websites yet. Click “+ Add website” to register your first one."}</td></tr>`;
  }
  // keep the "time left" badges fresh without re-rendering
  setInterval(() => document.querySelectorAll("[data-left]").forEach((el) => { const s = sites[Number(el.dataset.left)]; if (s) el.textContent = leftText(s); }), 30000);
  $("q").addEventListener("input", render); $("f").addEventListener("change", render);

  /* ---------- add / edit form ---------- */
  const CURRENCIES = ["KES", "USD", "EUR", "GBP", "UGX", "TZS"];
  const fields = [
    { type: "heading", label: "Website" },
    { name: "site_name", label: "Website / project name", required: true, wide: true },
    { name: "website_url", label: "Website address (URL)", type: "text", help: "e.g. https://clientbusiness.co.ke" },
    { name: "status", label: "Account status", type: "select", options: ["active", "suspended", "terminated"], help: "Leave as active — contract end is detected automatically." },
    { name: "platform", label: "Built with (platform / stack)", help: "e.g. HTML/JS + Supabase, WordPress, Laravel" },
    { name: "admin_url", label: "Website admin / login page" },
    { name: "repo_url", label: "Code repository (GitHub etc.)" },
    { type: "heading", label: "Owner / client" },
    { name: "owner_name", label: "Owner full name", required: true },
    { name: "owner_company", label: "Business / company" },
    { name: "owner_phone", label: "Phone / WhatsApp", type: "tel" },
    { name: "owner_alt_phone", label: "Alternative phone", type: "tel" },
    { name: "owner_email", label: "Email", type: "email" },
    { name: "owner_location", label: "Location / address" },
    { name: "owner_notes", label: "Owner notes (preferences, who to call, etc.)", type: "textarea" },
    { type: "heading", label: "Hosting & domain" },
    { name: "host_provider", label: "Hosted where (provider)", help: "e.g. Netlify, Render, Truehost, Hostinger, AWS" },
    { name: "hosting_plan", label: "Hosting plan" },
    { name: "server_location", label: "Server region / location" },
    { name: "server_ip", label: "Server IP address" },
    { name: "hosting_panel_url", label: "Hosting control panel link" },
    { name: "hosting_account", label: "Hosting account email / username", help: "Do NOT type passwords here — keep them in a password manager." },
    { name: "domain_registrar", label: "Domain registrar" },
    { name: "domain_expiry", label: "Domain expires on", type: "date" },
    { name: "ssl_expiry", label: "SSL certificate expires on", type: "date" },
    { name: "backup_info", label: "Backups (how often, where)" },
    { type: "heading", label: "Contract & deployment" },
    { name: "deployed_at", label: "Deployed (date & time)", type: "datetime-local", required: true, help: "The contract starts at this exact moment and ends at the same time of day." },
    { name: "contract_months", label: "Contract length (months)", type: "number", required: true },
    { type: "heading", label: "Money" },
    { name: "currency", label: "Currency", type: "select", options: CURRENCIES },
    { name: "agreed_amount", label: "Total agreed amount", type: "number", step: "0.01", help: "Payments received are added separately inside Manage → Payments." },
    { name: "renewal_fee", label: "Renewal fee (per contract)", type: "number", step: "0.01" },
    { type: "heading", label: "Notes" },
    { name: "notes", label: "Internal notes", type: "textarea" }
  ];
  const TEXT = ["site_name", "website_url", "platform", "admin_url", "repo_url", "owner_name", "owner_company", "owner_phone", "owner_alt_phone", "owner_email", "owner_location", "owner_notes", "host_provider", "hosting_plan", "server_location", "server_ip", "hosting_panel_url", "hosting_account", "domain_registrar", "backup_info", "notes"];
  function clean(d) {
    const row = { status: d.status, currency: d.currency, contract_months: Math.max(1, Math.min(120, Math.round(Number(d.contract_months) || 12))), agreed_amount: Number(d.agreed_amount) || 0, renewal_fee: d.renewal_fee ? Number(d.renewal_fee) : null, deployed_at: fromInput(d.deployed_at), domain_expiry: d.domain_expiry || null, ssl_expiry: d.ssl_expiry || null };
    TEXT.forEach((k) => (row[k] = d[k] || null));
    return row;
  }
  function openEdit(s) {
    const values = s ? { ...s, deployed_at: toInput(s.deployed_at) } : { status: "active", currency: "KES", contract_months: 12, agreed_amount: 0, deployed_at: toInput(new Date().toISOString()) };
    VA.openForm({
      title: s ? "Edit managed website" : "Add managed website", fields, values,
      onSubmit: async (d) => {
        if (!d.deployed_at) throw new Error("Please set the deployment date and time.");
        const row = clean(d);
        const { error } = s ? await db.from("managed_websites").update(row).eq("id", s.id) : await db.from("managed_websites").insert(row);
        if (error) throw error;
        VA.toast(s ? "Saved" : "Website added"); await load();
      }
    });
  }
  $("addBtn").onclick = () => openEdit(null);

  /* ---------- detail / manage view ---------- */
  function openDetail(id) {
    const m = VA.modal("Manage website", `<div id="dt"></div>`);
    m.body.closest(".modal").classList.add("wide");
    const box = m.body.querySelector("#dt");
    let tick = null;

    const row = (k, v) => v ? `<div class="detail-row"><b>${k}</b><span>${v}</span></div>` : "";
    const txt = (k, v) => row(k, VA.esc(v));

    async function paint() {
      const s = sites.find((x) => x.id === id);
      if (!s) { m.close(); return; }
      const t = state(s), end = endOf(s), start = new Date(s.deployed_at);
      const list = pays[s.id] || [], paid = paidOf(s), owed = Math.max(0, Number(s.agreed_amount) - paid);
      const wa = digits(s.owner_phone);
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:6px">
          <div><h3 style="margin:0;font-size:1.25rem">${VA.esc(s.site_name)}</h3><small style="color:var(--muted)">${s.website_url ? link(s.website_url) : "No website address saved"}</small></div>
          <span class="badge ${t.cls}">${VA.esc(t.label)}</span>
        </div>

        <div class="countdown ${t.key === "ended" ? "ended" : ""}" id="cd">
          <div><strong data-u="months">0</strong><span>Months</span></div><div><strong data-u="days">0</strong><span>Days</span></div>
          <div><strong data-u="h">0</strong><span>Hours</span></div><div><strong data-u="m">0</strong><span>Minutes</span></div>
          <div><strong data-u="s">0</strong><span>Seconds</span></div><div><strong>${s.contract_months}</strong><span>Month contract</span></div>
        </div>
        <div class="cd-bar"><i id="cdBar" style="width:0%"></i></div>
        <div class="cd-meta"><span>Deployed: ${VA.esc(fmt(start))}</span><span id="cdPct"></span><span>Terminates: ${VA.esc(fmt(end))}</span></div>

        <div class="dt-actions">
          ${s.owner_phone ? `<a class="btn btn-primary btn-sm" href="tel:${VA.esc(String(s.owner_phone).replace(/[^0-9+]/g, ""))}">Call owner</a>` : ""}
          ${wa ? `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent("Hello " + s.owner_name + ", regarding your website " + s.site_name + " (VYNEX Web Solutions).")}">WhatsApp</a>` : ""}
          ${s.owner_email ? `<a class="btn btn-ghost btn-sm" href="mailto:${VA.esc(s.owner_email)}?subject=${encodeURIComponent("Your website " + s.site_name)}">Email</a>` : ""}
          <button class="btn btn-ghost btn-sm" id="bExtend">Extend / renew contract</button>
          <button class="btn btn-ghost btn-sm" id="bPrint">Print / PDF</button>
          <button class="btn btn-ghost btn-sm" id="bEdit">Edit details</button>
        </div>

        <div class="money-strip">
          <div><span>Agreed</span><strong>${VA.esc(money(s.agreed_amount, s.currency))}</strong></div>
          <div><span>Paid so far</span><strong class="money-ok">${VA.esc(money(paid, s.currency))}</strong></div>
          <div><span>Balance</span><strong class="${owed ? "money-bad" : "money-ok"}">${owed ? VA.esc(money(owed, s.currency)) : "Fully paid"}</strong></div>
        </div>

        <div class="dt-grid">
          <h3>Payments received</h3>
          <div style="grid-column:1/-1">
            ${list.length ? `<table class="pay-list"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th></th></tr></thead><tbody>${list.map((p) => `<tr><td>${VA.esc(fmt(p.paid_at))}</td><td><b>${VA.esc(money(p.amount, s.currency))}</b></td><td>${VA.esc(p.method || "")}</td><td>${VA.esc(p.reference || "")}${p.note ? `<small>${VA.esc(p.note)}</small>` : ""}</td><td><button class="btn btn-danger btn-sm" data-pdel="${p.id}">Remove</button></td></tr>`).join("")}</tbody></table>` : `<p style="color:var(--muted);margin:6px 0">No payments recorded yet.</p>`}
            <div class="dt-actions"><button class="btn btn-primary btn-sm" id="bPay">+ Record payment</button></div>
          </div>

          <h3>Owner</h3><div>${txt("Name", s.owner_name)}${txt("Business", s.owner_company)}${txt("Location", s.owner_location)}</div>
          <div>${row("Phone", s.owner_phone ? `<a href="tel:${VA.esc(String(s.owner_phone).replace(/[^0-9+]/g, ""))}">${VA.esc(s.owner_phone)}</a>` : "")}${row("Alt. phone", s.owner_alt_phone ? `<a href="tel:${VA.esc(String(s.owner_alt_phone).replace(/[^0-9+]/g, ""))}">${VA.esc(s.owner_alt_phone)}</a>` : "")}${row("Email", s.owner_email ? `<a href="mailto:${VA.esc(s.owner_email)}">${VA.esc(s.owner_email)}</a>` : "")}</div>
          ${s.owner_notes ? `<div style="grid-column:1/-1">${txt("Notes", s.owner_notes)}</div>` : ""}

          <h3>Hosting &amp; domain</h3>
          <div>${txt("Hosted on", s.host_provider)}${txt("Plan", s.hosting_plan)}${txt("Region", s.server_location)}${txt("Server IP", s.server_ip)}${row("Control panel", link(s.hosting_panel_url))}</div>
          <div>${txt("Account", s.hosting_account)}${txt("Registrar", s.domain_registrar)}${txt("Domain expires", fmtDay(s.domain_expiry))}${txt("SSL expires", fmtDay(s.ssl_expiry))}${txt("Backups", s.backup_info)}</div>

          <h3>Technical</h3>
          <div>${txt("Built with", s.platform)}${row("Admin login", link(s.admin_url))}</div><div>${row("Repository", link(s.repo_url))}</div>

          <h3>Contract</h3>
          <div>${txt("Deployed", fmt(start))}${txt("Length", plural(s.contract_months, "month"))}</div>
          <div>${txt("Terminates", fmt(end))}${txt("Renewal fee", s.renewal_fee ? money(s.renewal_fee, s.currency) : "")}</div>
          ${s.notes ? `<h3>Notes</h3><div style="grid-column:1/-1">${txt("Internal", s.notes)}</div>` : ""}
        </div>
        <div class="modal-actions"><button class="btn btn-primary" id="bClose">Close</button></div>`;

      box.querySelector("#bClose").onclick = m.close;
      box.querySelector("#bPrint").onclick = () => openReport(s);
      box.querySelector("#bEdit").onclick = () => { m.close(); openEdit(s); };
      box.querySelector("#bPay").onclick = () => VA.openForm({
        title: "Record payment — " + s.site_name, submitLabel: "Save payment",
        values: { paid_at: toInput(new Date().toISOString()), method: "M-Pesa" },
        fields: [
          { name: "amount", label: "Amount received (" + s.currency + ")", type: "number", step: "0.01", required: true },
          { name: "paid_at", label: "Date & time paid", type: "datetime-local", required: true },
          { name: "method", label: "Method", type: "select", options: ["M-Pesa", "Bank transfer", "Cash", "Cheque", "Card", "Other"] },
          { name: "reference", label: "Reference (M-Pesa code, receipt no.)" },
          { name: "note", label: "Note", type: "textarea" }
        ],
        onSubmit: async (d) => {
          if (!(d.amount > 0)) throw new Error("Enter an amount greater than 0.");
          const { error } = await db.from("managed_website_payments").insert({ website_id: s.id, amount: d.amount, paid_at: fromInput(d.paid_at), method: d.method || null, reference: d.reference || null, note: d.note || null });
          if (error) throw error;
          VA.toast("Payment recorded"); await load(); await paint();
        }
      });
      box.querySelectorAll("[data-pdel]").forEach((b) => (b.onclick = async () => {
        if (!confirm("Remove this payment record?")) return;
        const { error } = await db.from("managed_website_payments").delete().eq("id", b.dataset.pdel);
        if (error) return VA.toast(error.message, "err");
        VA.toast("Payment removed"); await load(); await paint();
      }));
      box.querySelector("#bExtend").onclick = () => VA.openForm({
        title: "Extend / renew contract", submitLabel: "Extend",
        values: { add: 12 },
        fields: [{ name: "add", label: "Add how many months to the contract?", type: "number", required: true, help: `Currently ${s.contract_months} months, ending ${fmt(end)}. The new end keeps the same time of day.` }],
        onSubmit: async (d) => {
          const add = Math.round(d.add);
          if (!(add >= 1)) throw new Error("Enter at least 1 month.");
          const { error } = await db.from("managed_websites").update({ contract_months: Math.min(120, s.contract_months + add), status: s.status === "terminated" ? "active" : s.status }).eq("id", s.id);
          if (error) throw error;
          VA.toast("Contract extended"); await load(); await paint();
        }
      });

      // live countdown
      clearInterval(tick);
      const cd = box.querySelector("#cd"), bar = box.querySelector("#cdBar"), pct = box.querySelector("#cdPct");
      const upd = () => {
        if (!document.body.contains(box)) return clearInterval(tick);
        const r = remaining(s);
        ["months", "days", "h", "m", "s"].forEach((u) => (cd.querySelector(`[data-u="${u}"]`).textContent = String(r[u]).padStart(u === "months" || u === "days" ? 1 : 2, "0")));
        const total = end - start, used = Math.min(Math.max(Date.now() - start, 0), total);
        bar.style.width = (total > 0 ? (used / total) * 100 : 100).toFixed(1) + "%";
        pct.textContent = r.ended ? "Contract ended — terminate hosting or renew" : (total > 0 ? Math.round((used / total) * 100) : 100) + "% of contract used";
        cd.classList.toggle("ended", r.ended);
      };
      upd(); tick = setInterval(upd, 1000);
    }
    paint();
  }

  /* ---------- printable report (Print / Download PDF) ----------
     Opens a clean A4 report for one website: logo, VYNEX contact details and the important details.
     Tick or untick sections to choose what appears. "Hosting plan" and "Internal notes" start hidden.
     Print uses the browser print dialog: choose a printer, or "Save as PDF" to download a file. */
  const REPORT_KEY = "vynex-report-options";
  const REPORT_SECTIONS = [
    { k: "owner", label: "Owner details", on: true },
    { k: "site", label: "Website & technical", on: true },
    { k: "hosting", label: "Hosting & domain", on: true },
    { k: "plan", label: "Hosting plan", on: false },
    { k: "contract", label: "Contract", on: true },
    { k: "money", label: "Payments & balance", on: true },
    { k: "notes", label: "Internal notes", on: false }
  ];
  const COMPANY_FALLBACK = { name: "VYNEX Web Solutions", tagline: "Your Vision | Our Code | Your Success", email: "vynexwebsolutions@gmail.com", phone: "+254 742 210 239", whatsapp: "+254 181 971 409", location: "Kenya · serving clients worldwide" };
  let companyCache = null;
  async function company() {
    if (companyCache) return companyCache;
    let c = { ...COMPANY_FALLBACK };
    try {
      const { data } = await db.from("company_settings").select("*").eq("id", 1).maybeSingle();
      if (data) ["email", "phone", "whatsapp", "location", "tagline"].forEach((k) => { if (data[k]) c[k] = data[k]; });
    } catch { /* keep fallback */ }
    return (companyCache = c);
  }
  function reportStyles() {
    if (document.getElementById("rptStyle")) return;
    const st = document.createElement("style"); st.id = "rptStyle";
    st.textContent = `
.rpt-bg{position:fixed;inset:0;z-index:2000;background:rgba(3,5,12,.88);overflow:auto;display:flex;flex-direction:column}
.rpt-bar{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;padding:12px 18px;background:#0d1224;border-bottom:1px solid rgba(255,255,255,.12)}
.rpt-bar b{color:#fff;font-size:.95rem;margin-right:4px}
.rpt-opts{display:flex;flex-wrap:wrap;gap:6px 14px;flex:1;min-width:220px}
.rpt-opts label{display:flex;align-items:center;gap:6px;color:#cfd6f2;font-size:.82rem;cursor:pointer}
.rpt-btns{display:flex;gap:8px;flex-wrap:wrap}
.rpt-sheet{background:#fff;color:#1b2140;width:210mm;max-width:calc(100% - 24px);margin:18px auto 40px;box-shadow:0 20px 60px rgba(0,0,0,.5);font:13px/1.5 Inter,system-ui,Arial,sans-serif;position:relative}
.rpt-head{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:16px 26px;background:linear-gradient(135deg,#0a1030,#1c2a6b);color:#fff}
.rpt-brand{display:flex;align-items:center;gap:14px}
.rpt-brand img{width:62px;height:auto;display:block}
.rpt-brand h2{margin:0;font-size:1.3rem;letter-spacing:.02em;color:#fff}
.rpt-brand small{display:block;color:#ffcf5a;font-size:.72rem;letter-spacing:.06em;margin-top:2px}
.rpt-contact{text-align:right;font-size:.78rem;line-height:1.6;color:#dfe5ff}
.rpt-contact b{color:#fff}
.rpt-body{padding:18px 26px 14px}
.rpt-title{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;border-bottom:2px solid #e3e7f5;padding-bottom:12px;margin-bottom:16px}
.rpt-title small{display:block;color:#6b7391;text-transform:uppercase;letter-spacing:.1em;font-size:.68rem;font-weight:600}
.rpt-title h1{margin:2px 0 2px;font-size:1.55rem;line-height:1.2;color:#0a1030}
.rpt-title a,.rpt-title span.u{color:#2f4fd8;font-size:.85rem;word-break:break-all}
.rpt-meta{text-align:right;color:#6b7391;font-size:.75rem;white-space:nowrap}
.rpt-pill{display:inline-block;padding:3px 12px;border-radius:999px;font-weight:700;font-size:.72rem;border:1px solid;margin-bottom:6px}
.rpt-pill.ok{color:#0b7a55;background:#e5f8f0;border-color:#9fdcc6}.rpt-pill.warn{color:#9a6700;background:#fff4d6;border-color:#f0d58a}.rpt-pill.bad{color:#b42318;background:#fde8e6;border-color:#f3b4ae}.rpt-pill.muted{color:#475069;background:#eef0f7;border-color:#d3d8e8}
.rpt-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-bottom:14px}
.rpt-card{border:1px solid #dfe3f2;border-radius:10px;padding:10px 12px;background:#f7f8fd}
.rpt-card span{display:block;font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:#6b7391;font-weight:600}
.rpt-card strong{display:block;font-size:.84rem;color:#0a1030;margin-top:2px}
.rpt-card strong.good{color:#0b7a55}.rpt-card strong.bad{color:#b42318}
.rpt-sec{margin-bottom:11px;break-inside:avoid;page-break-inside:avoid}
.rpt-sec h3{margin:0 0 8px;font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:#1c2a6b;border-left:4px solid #ffb400;padding-left:9px}
.rpt-kv{display:grid;grid-template-columns:1fr 1fr;gap:3px 24px}
.rpt-kv div{display:flex;gap:8px;border-bottom:1px dotted #d3d8e8;padding:3px 0}
.rpt-kv b{flex:none;width:38%;color:#6b7391;font-weight:600;font-size:.78rem}
.rpt-kv span{color:#10163a;word-break:break-word;font-size:.85rem}
.rpt-kv .full{grid-column:1/-1}
.rpt-pay{width:100%;border-collapse:collapse;margin-top:8px;font-size:.8rem}
.rpt-pay th{background:#eef0f9;color:#1c2a6b;text-align:left;padding:6px 8px;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em}
.rpt-pay td{padding:6px 8px;border-bottom:1px solid #e3e7f5}
.rpt-pay tr{break-inside:avoid;page-break-inside:avoid}
.rpt-pay td:nth-child(2){font-weight:700;white-space:nowrap}
.rpt-foot{border-top:2px solid #e3e7f5;margin:0 26px;padding:10px 0 16px;color:#6b7391;font-size:.72rem;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.rpt-empty{color:#6b7391;font-style:italic;font-size:.82rem}
@media (max-width:760px){.rpt-kv{grid-template-columns:1fr}.rpt-head{flex-direction:column;align-items:flex-start}.rpt-contact{text-align:left}.rpt-title{flex-direction:column}.rpt-meta{text-align:left}}
@media print{
  @page{size:A4;margin:10mm}
  html,body{background:#fff!important}
  body>*:not(.rpt-bg){display:none!important}
  .rpt-bg{position:static!important;display:block!important;background:none!important;overflow:visible!important}
  .rpt-bar{display:none!important}
  .rpt-sheet{width:auto!important;max-width:none!important;margin:0!important;box-shadow:none!important}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .rpt-kv{grid-template-columns:1fr 1fr!important}
}`;
    document.head.appendChild(st);
  }

  async function openReport(s) {
    reportStyles();
    const co = await company();
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(REPORT_KEY) || "{}"); } catch { /* ignore */ }
    const opt = {}; REPORT_SECTIONS.forEach((x) => (opt[x.k] = typeof saved[x.k] === "boolean" ? saved[x.k] : x.on));

    const bg = document.createElement("div"); bg.className = "rpt-bg";
    bg.innerHTML = `
      <div class="rpt-bar">
        <b>Print / PDF report</b>
        <div class="rpt-opts">${REPORT_SECTIONS.map((x) => `<label><input type="checkbox" data-k="${x.k}" ${opt[x.k] ? "checked" : ""}> ${x.label}</label>`).join("")}</div>
        <div class="rpt-btns">
          <button class="btn btn-primary btn-sm" id="rptPrint">Print</button>
          <button class="btn btn-ghost btn-sm" id="rptPdf">Download PDF</button>
          <button class="btn btn-ghost btn-sm" id="rptClose">Close</button>
        </div>
      </div>
      <div class="rpt-sheet" id="rptSheet"></div>`;
    document.body.appendChild(bg);
    const sheet = bg.querySelector("#rptSheet");

    const E = VA.esc;
    const kv = (k, v, full) => (v ? `<div class="${full ? "full" : ""}"><b>${E(k)}</b><span>${E(v)}</span></div>` : "");
    const sec = (title, inner) => (inner.trim() ? `<div class="rpt-sec"><h3>${E(title)}</h3>${inner}</div>` : "");

    function paint() {
      const t = state(s), end = endOf(s), start = new Date(s.deployed_at), list = pays[s.id] || [], paid = paidOf(s), owed = Math.max(0, Number(s.agreed_amount) - paid);
      const cards = [
        `<div class="rpt-card"><span>Status</span><strong>${E(t.label)}</strong></div>`,
        opt.contract ? `<div class="rpt-card"><span>Deployed</span><strong>${E(fmt(start))}</strong></div><div class="rpt-card"><span>Contract ends</span><strong>${E(fmt(end))}</strong></div><div class="rpt-card"><span>Time left</span><strong class="${remaining(s).ended ? "bad" : ""}">${E(leftText(s))}</strong></div>` : "",
        opt.money ? `<div class="rpt-card"><span>Balance</span><strong class="${owed ? "bad" : "good"}">${owed ? E(money(owed, s.currency)) : "Fully paid"}</strong></div>` : ""
      ].join("");
      const tel = (v) => v || "";
      sheet.innerHTML = `
        <div class="rpt-head">
          <div class="rpt-brand"><img src="images/logo.png" alt="VYNEX logo"><div><h2>${E(co.name)}</h2><small>${E(co.tagline)}</small></div></div>
          <div class="rpt-contact">
            ${co.phone ? `Phone: <b>${E(tel(co.phone))}</b><br>` : ""}${co.whatsapp ? `WhatsApp: <b>${E(co.whatsapp)}</b><br>` : ""}${co.email ? `Email: <b>${E(co.email)}</b><br>` : ""}${co.location ? E(co.location) : ""}
          </div>
        </div>
        <div class="rpt-body">
          <div class="rpt-title">
            <div><small>Website management report</small><h1>${E(s.site_name)}</h1>${s.website_url ? `<span class="u">${E(s.website_url)}</span>` : ""}</div>
            <div class="rpt-meta"><span class="rpt-pill ${t.cls}">${E(t.label)}</span><br>Prepared: ${E(fmt(new Date().toISOString()))}<br>Ref: ${E(String(s.id).slice(0, 8).toUpperCase())}</div>
          </div>
          <div class="rpt-cards">${cards}</div>
          ${opt.owner ? sec("Owner / client", `<div class="rpt-kv">${kv("Name", s.owner_name)}${kv("Business", s.owner_company)}${kv("Phone", s.owner_phone)}${kv("Alt. phone", s.owner_alt_phone)}${kv("Email", s.owner_email)}${kv("Location", s.owner_location)}${kv("Notes", s.owner_notes, true)}</div>`) : ""}
          ${opt.site ? sec("Website & technical", `<div class="rpt-kv">${kv("Website", s.website_url)}${kv("Built with", s.platform)}${kv("Admin login", s.admin_url)}${kv("Repository", s.repo_url)}</div>`) : ""}
          ${opt.hosting ? sec("Hosting & domain", `<div class="rpt-kv">${kv("Hosted on", s.host_provider)}${opt.plan ? kv("Hosting plan", s.hosting_plan) : ""}${kv("Server region", s.server_location)}${kv("Server IP", s.server_ip)}${kv("Control panel", s.hosting_panel_url)}${kv("Account", s.hosting_account)}${kv("Domain registrar", s.domain_registrar)}${kv("Domain expires", fmtDay(s.domain_expiry))}${kv("SSL expires", fmtDay(s.ssl_expiry))}${kv("Backups", s.backup_info)}</div>`) : (opt.plan ? sec("Hosting plan", `<div class="rpt-kv">${kv("Hosting plan", s.hosting_plan)}${kv("Hosted on", s.host_provider)}</div>`) : "")}
          ${opt.contract ? sec("Contract", `<div class="rpt-kv">${kv("Deployed", fmt(start))}${kv("Contract length", plural(s.contract_months, "month"))}${kv("Contract ends", fmt(end))}${kv("Time left", leftText(s))}${s.renewal_fee && opt.money ? kv("Renewal fee", money(s.renewal_fee, s.currency)) : ""}</div>`) : ""}
          ${opt.money ? sec("Payments & balance", `<div class="rpt-kv">${kv("Agreed amount", money(s.agreed_amount, s.currency))}${kv("Paid so far", money(paid, s.currency))}${kv("Balance", owed ? money(owed, s.currency) : "Fully paid")}</div>` +
            (list.length ? `<table class="rpt-pay"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead><tbody>${list.map((p) => `<tr><td>${E(fmt(p.paid_at))}</td><td>${E(money(p.amount, s.currency))}</td><td>${E(p.method || "")}</td><td>${E(p.reference || "")}${p.note ? ` — ${E(p.note)}` : ""}</td></tr>`).join("")}</tbody></table>` : `<p class="rpt-empty">No payments recorded yet.</p>`)) : ""}
          ${opt.notes ? sec("Internal notes", `<div class="rpt-kv">${kv("Notes", s.notes, true)}</div>`) : ""}
        </div>
        <div class="rpt-foot"><span>${E(co.name)} · ${E([co.phone, co.email].filter(Boolean).join(" · "))}</span><span>Confidential · ${E(s.site_name)}</span></div>`;
    }
    paint();

    bg.querySelector(".rpt-opts").addEventListener("change", (e) => {
      const k = e.target.dataset.k; if (!k) return;
      opt[k] = e.target.checked; paint();
      try { localStorage.setItem(REPORT_KEY, JSON.stringify(opt)); } catch { /* ignore */ }
    });
    const oldTitle = document.title;
    const printNow = () => {
      // the file name offered by "Save as PDF" comes from the page title
      document.title = `VYNEX - ${s.site_name} - report`.replace(/[\\/:*?"<>|]+/g, " ");
      setTimeout(() => { window.print(); }, 50);
    };
    window.addEventListener("afterprint", () => { document.title = oldTitle; });
    bg.querySelector("#rptPrint").onclick = printNow;
    bg.querySelector("#rptPdf").onclick = () => { VA.toast("In the print window, choose “Save as PDF” as the destination."); printNow(); };
    const close = () => { document.title = oldTitle; bg.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    bg.querySelector("#rptClose").onclick = close;
  }

  /* ---------- table actions ---------- */
  body.addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const s = sites[Number(b.dataset.i)]; if (!s) return;
    if (b.dataset.act === "view") openDetail(s.id);
    if (b.dataset.act === "edit") openEdit(s);
    if (b.dataset.act === "print") openReport(s);
    if (b.dataset.act === "del") {
      if (!confirm(`Delete "${s.site_name}" and all its payment records? This cannot be undone.`)) return;
      const { error } = await db.from("managed_websites").delete().eq("id", s.id);
      if (error) return VA.toast(error.message, "err");
      VA.toast("Deleted"); load();
    }
  });

  load();
});
