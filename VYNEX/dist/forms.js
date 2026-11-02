/* VYNEX/public/forms.js
   Safe form submission for the contact and quote forms.
   - Validates on the client (the database re-validates with constraints + RLS).
   - Honeypot field + minimum fill time block simple bots (free spam protection).
   - Inserts straight into Supabase (public may INSERT only; they can never read submissions). */
(function () {
  const loadedAt = Date.now();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const clean = (v, max) => String(v || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

  document.querySelectorAll("form[data-form]").forEach((form) => {
    const status = form.querySelector(".form-status");
    const btn = form.querySelector("button[type=submit]");
    const say = (msg, ok) => { status.textContent = msg; status.className = "form-status " + (ok ? "ok" : "err"); };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get("website")) return say("Thank you!", true);            // honeypot filled → bot
      if (Date.now() - loadedAt < 3000) return say("Please take a moment to complete the form.", false);

      const kind = form.dataset.form;
      const row = {
        name: clean(fd.get("name"), 120),
        email: clean(fd.get("email"), 160),
        phone: clean(fd.get("phone"), 40) || null
      };
      if (row.name.length < 2) return say("Please enter your name.", false);
      if (!emailRe.test(row.email)) return say("Please enter a valid email address.", false);
      // Quote requests must include a phone number so we can call the customer back.
      if (form.dataset.form === "quote") {
        const digits = (row.phone || "").replace(/\D/g, "");
        if (digits.length < 9 || digits.length > 15 || !/^\+?[0-9\s().-]+$/.test(row.phone || "")) return say("Please enter a valid phone number so we can call you (e.g. 0712 345 678).", false);
      }

      let table;
      if (kind === "contact") {
        row.subject = clean(fd.get("subject"), 160) || null;
        row.message = clean(fd.get("message"), 3000);
        if (row.message.length < 10) return say("Please write a message of at least 10 characters.", false);
        table = "contact_inquiries";
      } else {
        row.service = clean(fd.get("service"), 160) || null;
        row.budget = clean(fd.get("budget"), 80) || null;
        row.timeline = clean(fd.get("timeline"), 80) || null;
        row.requirements = clean(fd.get("requirements"), 3700);
        if (row.requirements.length < 15) return say("Please describe your project in a little more detail.", false);
        // How/when to reach them goes at the top of the request, so it shows in the admin panel without a database change.
        const via = clean(fd.get("contact_via"), 30), when = clean(fd.get("call_time"), 30);
        // The project the customer was looking at (if any) is saved the same way, so the admin sees exactly what they are quoting for.
        const proj = clean(fd.get("project"), 120).replace(/[\[\]|\r\n]+/g, " ").trim(), ref = clean(fd.get("project_ref"), 40);
        const tags = [];
        if (proj) tags.push("[Project: " + proj + (/^[0-9a-f-]{36}$/i.test(ref) ? " | ref: " + ref : "") + "]");
        if (via || when) tags.push("[Contact: " + (via || "Phone call") + (when ? " · Best time: " + when : "") + "]");
        if (tags.length) row.requirements = (tags.join("\n") + "\n" + row.requirements).slice(0, 4000);
        table = "quote_requests";
      }

      if (!window.vynexDb) return say("The site database is not connected yet. Add your Supabase keys in config.js.", false);

      btn.disabled = true; say("Sending…", true);
      const { error } = await window.vynexDb.from(table).insert(row);
      btn.disabled = false;
      if (error) return say("Sorry, we couldn't send that. Please try again or contact us directly.", false);
      form.reset();
      say(kind === "quote" ? "Thank you! We have your request and will call you on the number you gave us." : "Thank you! Your message has been received and we'll be in touch soon.", true);
    });
  });
})();
