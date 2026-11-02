/* VYNEX/public/pro.js — small progressive enhancements (no dependencies):
   1. fills <i data-vx-icon="name"> with the line icons from icons.js
   2. draws the small mobile graphics ([data-gfx])
   3. types out the hero code window
   4. optional "ranking" badge (only shows if you set RANKING_BADGE in config.js)
   5. sticky Call / Quote bar on phones (the Call button appears once the phone number loads)
   6. pre-selects the service on the quote form from ?service= */
(function () {
  /* ---- 1. icons ---- */
  function icons() {
    document.querySelectorAll("[data-vx-icon]").forEach(function (el) {
      if (el.dataset.done || !window.VX_ICON) return;
      el.innerHTML = VX_ICON(el.dataset.vxIcon); el.dataset.done = "1";
    });
  }

  /* ---- 2. mobile graphics (tiny inline SVGs, brand colours) ---- */
  var B = "#3b82f6", V = "#8b5cf6", Y = "#ffcd00", O = "#ff8a00", G = "#34d399", L = "rgba(255,255,255,.28)";
  var GFX = {
    web: '<svg class="gfx" viewBox="0 0 64 48" aria-hidden="true"><rect x="4" y="6" width="56" height="36" rx="5" fill="#0b1226" stroke="' + L + '"/><path d="M4 14h56" stroke="' + L + '"/><circle cx="10" cy="10" r="1.6" fill="#ff5f57"/><circle cx="15" cy="10" r="1.6" fill="#febc2e"/><circle cx="20" cy="10" r="1.6" fill="#28c840"/><rect class="fl" x="10" y="19" width="22" height="4" rx="2" fill="' + Y + '"/><rect x="10" y="27" width="34" height="3" rx="1.5" fill="' + B + '"/><rect x="10" y="33" width="26" height="3" rx="1.5" fill="' + V + '"/><rect class="fl2" x="40" y="18" width="14" height="10" rx="2" fill="none" stroke="' + G + '"/></svg>',
    android: '<svg class="gfx" viewBox="0 0 64 48" aria-hidden="true"><rect x="22" y="3" width="20" height="42" rx="5" fill="#0b1226" stroke="' + L + '"/><rect x="25" y="9" width="14" height="4" rx="2" fill="' + G + '"/><rect class="fl" x="25" y="16" width="14" height="10" rx="2" fill="' + B + '"/><rect x="25" y="29" width="14" height="3" rx="1.5" fill="' + L + '"/><rect x="25" y="34" width="9" height="3" rx="1.5" fill="' + L + '"/><path d="M12 24l-6 5 6 5M52 24l6 5-6 5" fill="none" stroke="' + Y + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ios: '<svg class="gfx" viewBox="0 0 64 48" aria-hidden="true"><rect x="22" y="3" width="20" height="42" rx="6" fill="#0b1226" stroke="' + L + '"/><rect x="28" y="5.5" width="8" height="2.4" rx="1.2" fill="' + L + '"/><circle class="fl" cx="32" cy="22" r="6" fill="none" stroke="' + Y + '" stroke-width="2.4"/><path d="M32 19v6M29 22h6" stroke="' + Y + '" stroke-width="2" stroke-linecap="round"/><rect x="26" y="33" width="12" height="3" rx="1.5" fill="' + V + '"/><circle cx="12" cy="14" r="2" fill="' + G + '"/><circle cx="54" cy="34" r="2" fill="' + O + '"/></svg>',
    systems: '<svg class="gfx" viewBox="0 0 64 48" aria-hidden="true"><rect x="6" y="6" width="22" height="14" rx="3" fill="#0b1226" stroke="' + B + '"/><rect x="36" y="6" width="22" height="14" rx="3" fill="#0b1226" stroke="' + V + '"/><rect x="21" y="30" width="22" height="14" rx="3" fill="#0b1226" stroke="' + Y + '"/><path class="dash" d="M17 20v5h15v5M47 20v5H32" fill="none" stroke="' + G + '" stroke-width="1.6"/><circle class="fl" cx="17" cy="13" r="2.4" fill="' + B + '"/><circle class="fl2" cx="47" cy="13" r="2.4" fill="' + V + '"/><circle class="fl" cx="32" cy="37" r="2.4" fill="' + Y + '"/></svg>',
    code: '<svg class="gfx" viewBox="0 0 92 60" aria-hidden="true"><rect x="4" y="6" width="84" height="48" rx="7" fill="#0b1226" stroke="' + L + '"/><path d="M4 16h84" stroke="' + L + '"/><circle cx="11" cy="11" r="1.8" fill="#ff5f57"/><circle cx="17" cy="11" r="1.8" fill="#febc2e"/><circle cx="23" cy="11" r="1.8" fill="#28c840"/><path d="M14 26l-5 5 5 5" fill="none" stroke="' + Y + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="22" y="28" width="30" height="3.4" rx="1.7" fill="' + B + '"/><rect x="22" y="36" width="44" height="3.4" rx="1.7" fill="' + V + '"/><rect class="fl" x="22" y="44" width="18" height="3.4" rx="1.7" fill="' + G + '"/></svg>',
    rocket: '<svg class="gfx" viewBox="0 0 92 60" aria-hidden="true"><path class="dash" d="M6 52C26 50 36 36 56 22" fill="none" stroke="' + L + '" stroke-width="1.6"/><g class="fl"><path d="M58 8c10-3 20-1 24 2 2 5 0 15-5 22l-14 8-9-9 4-23z" fill="' + B + '"/><circle cx="68" cy="22" r="4" fill="#0b1226" stroke="' + Y + '" stroke-width="2"/><path d="M50 40l-8 2 4-8M62 46l-2 8-6-6" fill="' + O + '"/></g><circle cx="14" cy="20" r="1.6" fill="' + Y + '"/><circle cx="30" cy="10" r="1.2" fill="' + G + '"/><circle cx="22" cy="34" r="1.2" fill="' + V + '"/></svg>',
    chart: '<svg class="gfx" viewBox="0 0 92 60" aria-hidden="true"><path d="M8 52h76M8 8v44" stroke="' + L + '" fill="none"/><rect x="16" y="36" width="10" height="16" rx="2" fill="' + B + '"/><rect x="32" y="28" width="10" height="24" rx="2" fill="' + V + '"/><rect x="48" y="20" width="10" height="32" rx="2" fill="' + O + '"/><rect class="fl" x="64" y="10" width="10" height="42" rx="2" fill="' + Y + '"/><path class="dash" d="M18 30l16-8 16-8 22-6" fill="none" stroke="' + G + '" stroke-width="1.8"/></svg>',
    phone: '<svg class="gfx" viewBox="0 0 92 60" aria-hidden="true"><rect x="32" y="3" width="28" height="54" rx="7" fill="#0b1226" stroke="' + L + '"/><path d="M42 14h8M40 20h12" stroke="' + L + '" stroke-linecap="round"/><g class="fl"><circle cx="46" cy="36" r="9" fill="' + Y + '"/><path d="M42 32l2-1 2 3-1.4 1a5 5 0 0 0 2.4 2.4l1-1.4 3 2-1 2c-3 .5-8-3-8.5-8z" fill="#1a1200"/></g><path class="dash" d="M16 22a14 14 0 0 1 0 20M10 16a22 22 0 0 1 0 32M76 22a14 14 0 0 0 0 20M82 16a22 22 0 0 0 0 32" fill="none" stroke="' + G + '" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };
  function gfx() {
    document.querySelectorAll("[data-gfx]").forEach(function (el) {
      if (el.dataset.done) return;
      var names = el.dataset.gfx.split(",");
      if (el.classList.contains("m-gfx")) {
        var labels = { web: "Websites", android: "Android", ios: "iOS", systems: "Systems" };
        el.innerHTML = names.map(function (n) { return '<div class="tile">' + GFX[n] + labels[n] + "</div>"; }).join("");
      } else el.innerHTML = GFX[names[0]] || "";
      el.dataset.done = "1";
    });
  }

  /* ---- 3. typed hero code ---- */
  function typeHero() {
    var box = document.getElementById("heroCode");
    if (!box) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lines = [
      '<span class="c">// your idea → a live product</span>',
      '<span class="k">import</span> { <span class="f">vynex</span> } <span class="k">from</span> <span class="s">"@vynex/studio"</span>;',
      '',
      '<span class="k">const</span> project = <span class="k">await</span> <span class="f">vynex</span>.<span class="f">build</span>({',
      '  platforms: [<span class="s">"web"</span>, <span class="s">"android"</span>, <span class="s">"ios"</span>],',
      '  design:    <span class="s">"custom, mobile-first"</span>,',
      '  payments:  <span class="s">"M-Pesa"</span>,',
      '  security:  <span class="n">true</span>,',
      '  support:   <span class="s">"after launch"</span>',
      '});',
      '',
      'project.<span class="f">launch</span>();  <span class="c">// ✓ live. let\'s talk →</span>'
    ];
    function render(n) { box.innerHTML = lines.slice(0, n).map(function (l) { return '<span class="l">' + (l || " ") + "</span>"; }).join("") + (n < lines.length ? "" : '<span class="l"><span class="caret"></span></span>'); }
    if (reduce) return render(lines.length);
    var i = 0; render(0);
    var t = setInterval(function () { i++; render(i); if (i >= lines.length) clearInterval(t); }, 260);
  }

  /* ---- 4. optional ranking badge ---- */
  function badge() {
    var text = (window.VYNEX_CONFIG || {}).RANKING_BADGE;
    var el = document.getElementById("rankBadge");
    if (el && text) { el.textContent = "★ " + text; el.hidden = false; }
  }

  /* ---- 5. mobile call bar ---- */
  function callBar() {
    if (document.querySelector(".call-bar") || /get-quote/.test(location.pathname)) return;
    var bar = document.createElement("div");
    bar.className = "call-bar"; bar.setAttribute("data-nocall", "");
    bar.innerHTML = '<a class="cb-call" href="#"><i data-vx-icon="phone" class="ico-wrap"></i> Call us</a><a class="cb-quote" href="get-quote.html">Get a free quote</a>';
    document.body.appendChild(bar);
    var tries = 0;
    var t = setInterval(function () {
      var a = document.querySelector(".ci-call");
      if (a && a.getAttribute("href")) { var c = bar.querySelector(".cb-call"); c.href = a.getAttribute("href"); bar.removeAttribute("data-nocall"); clearInterval(t); }
      if (++tries > 20) clearInterval(t);
    }, 600);
    icons();
  }

  /* ---- 6. quote form: preselect service ---- */
  function preselect() {
    var sel = document.getElementById("qService"); if (!sel) return;
    var qs = new URLSearchParams(location.search);
    var want = (qs.get("service") || "").trim().slice(0, 100);
    var proj = (qs.get("project") || "").trim().slice(0, 120), pid = (qs.get("pid") || "").trim();
    if (want) {
      var found = false;
      for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text.toLowerCase() === want.toLowerCase()) { sel.selectedIndex = i; found = true; break; }
      if (!found) { var o = document.createElement("option"); o.textContent = want; sel.insertBefore(o, sel.options[sel.options.length - 1]); sel.value = want; }  // service not in the list: keep it
    }
    var ref = document.getElementById("quoteRef"), fp = document.getElementById("qProject"), fr = document.getElementById("qProjectRef");
    if (fp) { fp.value = proj; if (fr) fr.value = /^[0-9a-f-]{36}$/i.test(pid) ? pid : ""; }
    function paint() {
      if (!ref) return;
      ref.textContent = "";
      var s = sel.value, parts = [];
      if (proj) parts.push(["Project", proj]);
      if (s) parts.push(["Service", s]);
      ref.hidden = !parts.length; if (!parts.length) return;
      var lead = document.createElement("span"); lead.textContent = "Your quote request is for:"; ref.appendChild(lead);
      parts.forEach(function (p) { var c = document.createElement("span"); c.className = "qr-chip"; var k = document.createElement("i"); k.textContent = p[0]; c.appendChild(k); c.appendChild(document.createTextNode(p[1])); ref.appendChild(c); });
      if (proj) { var x = document.createElement("button"); x.type = "button"; x.className = "qr-clear"; x.textContent = "Not this project"; x.onclick = function () { proj = ""; fp.value = ""; if (fr) fr.value = ""; paint(); }; ref.appendChild(x); }
    }
    sel.addEventListener("change", paint); paint();
  }

  function init() { icons(); gfx(); typeHero(); badge(); callBar(); preselect(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.addEventListener("load", function () { icons(); gfx(); });
})();
