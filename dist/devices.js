/* VYNEX/public/devices.js
   Builds the hero device scene inside #devices and animates it:
     laptop  – an online-shop dashboard (sales rising after the website launched, enquiries, traffic sources)
     tablet  – five VYNEX service ads, one after another
     phone   – new enquiries and M-Pesa payments arriving live
   The figures are illustrative sample data (the page shows a note saying so).
   Animations run only while the hero is on screen and the tab is visible; reduced-motion users get a still version. */
(function () {
  var root = document.getElementById("devices");
  if (!root) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ icons */
  var P = {
    home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
    bag: "M6 7h12l1 13H5zM9 7a3 3 0 0 1 6 0",
    users: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8",
    card: "M3 6h18v12H3zM3 10h18M7 15h3",
    chat: "M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z",
    call: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
    form: "M4 5h16v14H4zM4 7l8 6 8-6",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
    cart: "M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01",
    mobile: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
    layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    check: "M5 12l5 5 9-10",
    arrow: "M5 12h14M13 6l6 6-6 6",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
  };
  function ico(n, sw) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + P[n] + '"/></svg>'; }
  function $(s, c) { return (c || root).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); }

  /* ------------------------------------------------------------ sample data */
  var MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  var SALES = [412, 438, 471, 655, 842, 1128];          // KSh thousands per month
  var LAUNCH = 2, YMAX = 1250;
  var KPIS = [
    { k: "Sales this month", to: 1128400, fmt: function (v) { return "<small>KSh</small>" + (v / 1e6).toFixed(2) + "M"; }, d: "34%", s: [4, 5, 5, 7, 9, 12, 16] },
    { k: "Orders", to: 496, fmt: function (v) { return Math.round(v); }, d: "29%", s: [6, 7, 7, 9, 11, 12, 14] },
    { k: "Website visitors", to: 21600, fmt: function (v) { return (v / 1000).toFixed(1) + "K"; }, d: "71%", s: [3, 4, 6, 6, 10, 13, 17] },
    { k: "Enquiries", to: 164, fmt: function (v) { return Math.round(v); }, d: "58%", s: [5, 5, 8, 7, 11, 14, 15] }
  ];
  var SOURCES = [
    { n: "Google search", v: 46, c: ["#3b82f6", "#22d3ee"] },
    { n: "WhatsApp", v: 24, c: ["#16a34a", "#34d399"] },
    { n: "Facebook & Instagram", v: 18, c: ["#8b5cf6", "#c084fc"] },
    { n: "Direct", v: 12, c: ["#f59e0b", "#fbbf24"] }
  ];
  var ADS = [
    { ac: "#3b82f6", ic: "globe", tag: "Business websites", h: "Get found on Google. Get more calls.", p: "Fast, mobile-first websites for Kenyan businesses.", art: "web" },
    { ac: "#22c55e", ic: "cart", tag: "Online shops + M-Pesa", h: "Sell online. Get paid by M-Pesa.", p: "Your shop, STK Push checkout and order tracking.", art: "shop" },
    { ac: "#8b5cf6", ic: "mobile", tag: "Android & iOS apps", h: "Your business in every customer’s pocket.", p: "Custom apps built around how you work.", art: "app" },
    { ac: "#f59e0b", ic: "layers", tag: "POS & business systems", h: "Run stock, sales and staff in one place.", p: "POS, inventory and reports that save you hours.", art: "pos" },
    { ac: "#22d3ee", ic: "search", tag: "Local SEO & Google", h: "Be the first name customers see.", p: "Show up when people nearby search for you.", art: "seo" }
  ];
  var AD_MS = 4800;
  var FEED = [
    { t: "wa", n: "Wanjiku M. · Nairobi", m: "How much for a website for my salon?" },
    { t: "pay", n: "M-Pesa payment", m: "KSh 4,850 received · Order #2419" },
    { t: "form", n: "Brian O. · Kisumu", m: "Quote request: Android app for deliveries" },
    { t: "call", n: "Call-back request", m: "0722 ••• 418 · Nakuru" },
    { t: "form", n: "Amina H. · Mombasa", m: "Online shop with M-Pesa checkout" },
    { t: "pay", n: "M-Pesa payment", m: "KSh 2,300 received · Order #2420" },
    { t: "wa", n: "Peter K. · Eldoret", m: "Can you build a school portal?" },
    { t: "form", n: "Grace N. · Thika", m: "POS system for my hardware shop" }
  ];
  var FEED_ICON = { wa: ["#16a34a", "chat"], pay: ["#15803d", "card"], form: ["#2f6bff", "form"], call: ["#ea7a12", "call"] };
  var FEED_MS = 2700, TODAY0 = 14;

  /* ------------------------------------------------------------ ad artwork (SVG, accent-coloured) */
  var F = 'font-family="Inter,Segoe UI,sans-serif"';
  var ART = {
    web: function (a) {
      var stars = "";
      for (var i = 0; i < 5; i++) stars += '<circle cx="' + (9 + i * 6) + '" cy="30" r="2.1"/>';
      return '<svg viewBox="0 0 120 100" aria-hidden="true"><rect x="4" y="6" width="96" height="70" rx="7" fill="#0f1738" stroke="rgba(255,255,255,.2)"/><path d="M4 18h96" stroke="rgba(255,255,255,.14)"/>' +
        '<circle cx="11" cy="12" r="2" fill="#ff5f57"/><circle cx="18" cy="12" r="2" fill="#febc2e"/><circle cx="25" cy="12" r="2" fill="#28c840"/>' +
        '<rect x="10" y="24" width="52" height="28" rx="4" fill="' + a + '" opacity=".38"/><rect x="14" y="29" width="34" height="4" rx="2" fill="#fff"/><rect x="14" y="36" width="26" height="3" rx="1.5" fill="#fff" opacity=".55"/><rect x="14" y="42" width="22" height="6" rx="3" fill="#ffc83d"/>' +
        '<rect x="68" y="24" width="26" height="28" rx="4" fill="#1b2556"/><circle cx="81" cy="35" r="6" fill="' + a + '" opacity=".7"/><rect x="72" y="45" width="18" height="3" rx="1.5" fill="#fff" opacity=".4"/>' +
        '<rect x="10" y="57" width="24" height="13" rx="3" fill="#1b2556"/><rect x="37" y="57" width="24" height="13" rx="3" fill="#1b2556"/>' +
        '<g transform="translate(44 56)"><rect width="72" height="40" rx="6" fill="#f5f7ff"/><rect x="6" y="6" width="28" height="3" rx="1.5" fill="#8a94b8"/><text x="6" y="19" font-size="7.4" font-weight="700" fill="#1a2a66" ' + F + '>Your Business</text><g fill="#ffb400" transform="translate(0 0)">' + stars + '</g><text x="42" y="32.4" font-size="5.2" fill="#5a6488" ' + F + '>4.9 · Nairobi</text><rect x="54" y="5" width="13" height="10" rx="3" fill="#34d399"/><text x="60.5" y="12.4" text-anchor="middle" font-size="6" font-weight="800" fill="#052e1f" ' + F + '>#1</text></g></svg>';
    },
    shop: function (a) {
      return '<svg viewBox="0 0 120 100" aria-hidden="true"><defs><linearGradient id="dvg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>' +
        '<rect x="10" y="8" width="70" height="86" rx="8" fill="#0f1738" stroke="rgba(255,255,255,.2)"/><rect x="16" y="14" width="58" height="36" rx="5" fill="url(#dvg1)" opacity=".85"/>' +
        '<path d="M34 40l11-14 8 9 5-5 8 10z" fill="#fff" opacity=".85"/><circle cx="59" cy="24" r="3.4" fill="#fff" opacity=".9"/>' +
        '<rect x="16" y="56" width="36" height="4" rx="2" fill="#fff"/><text x="16" y="72" font-size="9" font-weight="800" fill="#fff" ' + F + '>KSh 3,500</text>' +
        '<rect x="16" y="77" width="58" height="12" rx="6" fill="#16a34a"/><text x="45" y="85.2" text-anchor="middle" font-size="6.2" font-weight="700" fill="#fff" ' + F + '>Pay with M-Pesa</text>' +
        '<g transform="translate(54 2)"><rect width="64" height="24" rx="7" fill="#ecfdf5"/><circle cx="12" cy="12" r="6.4" fill="#16a34a"/><path d="M9 12.2l2.2 2.3 4-4.6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="23" y="10.4" font-size="5" font-weight="700" fill="#065f46" ' + F + '>Paid · KSh 3,500</text><text x="23" y="18" font-size="5" fill="#047857" ' + F + '>via M-Pesa</text></g></svg>';
    },
    app: function (a) {
      var tiles = "", cols = ["#3b82f6", "#f59e0b", "#22c55e", "#ec4899", "#8b5cf6", "#22d3ee", "#ef4444", "#14b8a6", "#eab308"];
      for (var i = 0; i < 9; i++) tiles += '<rect x="' + (15 + (i % 3) * 12) + '" y="' + (26 + Math.floor(i / 3) * 13) + '" width="9.5" height="9.5" rx="2.6" fill="' + cols[i] + '"/>';
      return '<svg viewBox="0 0 120 100" aria-hidden="true"><g transform="rotate(-9 34 56)"><rect x="8" y="12" width="44" height="82" rx="9" fill="#0f1738" stroke="rgba(255,255,255,.22)"/><rect x="21" y="16" width="18" height="3.6" rx="1.8" fill="#000"/>' + tiles + '<rect x="14" y="72" width="32" height="9" rx="4.5" fill="' + a + '"/></g>' +
        '<rect x="56" y="4" width="50" height="90" rx="10" fill="#0b1026" stroke="rgba(255,255,255,.34)"/><rect x="71" y="8" width="20" height="3.8" rx="1.9" fill="#000"/>' +
        '<rect x="61" y="17" width="40" height="14" rx="5" fill="' + a + '"/><text x="66" y="26.2" font-size="5.6" font-weight="700" fill="#fff" ' + F + '>Order #2419</text>' +
        '<rect x="61" y="35" width="40" height="34" rx="5" fill="#16204a"/><path d="M66 63c8-2 10-14 18-14s6 8 12 6" stroke="' + a + '" stroke-width="1.6" stroke-dasharray="3 2.4" fill="none"/><circle cx="96" cy="55" r="3.2" fill="#ffc83d"/><circle cx="66" cy="63" r="2.4" fill="#fff"/>' +
        '<rect x="61" y="73" width="40" height="14" rx="5" fill="#fff" opacity=".1"/><text x="81" y="82.2" text-anchor="middle" font-size="5.2" font-weight="600" fill="#e9ecf8" ' + F + '>On the way · 12 min</text></svg>';
    },
    pos: function (a) {
      var tiles = "", cols = ["#2f6bff", "#8b5cf6", "#f59e0b", "#22c55e", "#ec4899", "#22d3ee"];
      for (var i = 0; i < 6; i++) tiles += '<rect x="' + (12 + (i % 3) * 23) + '" y="' + (22 + Math.floor(i / 3) * 21) + '" width="20" height="18" rx="4" fill="' + cols[i] + '" opacity=".85"/><rect x="' + (15 + (i % 3) * 23) + '" y="' + (34.5 + Math.floor(i / 3) * 21) + '" width="14" height="2.4" rx="1.2" fill="#fff" opacity=".85"/>';
      var lines = ""; for (var j = 0; j < 7; j++) lines += '<rect x="92" y="' + (14 + j * 7.4) + '" width="' + (j % 3 === 2 ? 14 : 22) + '" height="2.4" rx="1.2" fill="#8a94b8"/>';
      return '<svg viewBox="0 0 120 100" aria-hidden="true"><rect x="4" y="8" width="80" height="66" rx="6" fill="#0f1738" stroke="rgba(255,255,255,.22)"/><rect x="10" y="13" width="40" height="3.6" rx="1.8" fill="#fff" opacity=".8"/>' + tiles +
        '<rect x="10" y="64" width="68" height="0.01"/><rect x="10" y="62.5" width="38" height="8" rx="4" fill="rgba(255,255,255,.08)"/><text x="14" y="68.3" font-size="4.7" fill="#cbd2ee" ' + F + '>Total KSh 2,450</text><rect x="52" y="62.5" width="26" height="8" rx="4" fill="' + a + '"/><text x="65" y="68.2" text-anchor="middle" font-size="5.2" font-weight="800" fill="#1a1200" ' + F + '>Charge</text>' +
        '<path d="M34 74h20l3 8H31z" fill="#202a58"/><rect x="24" y="82" width="40" height="5" rx="2.5" fill="#2b366e"/>' +
        '<path d="M88 8h26v70l-3.25-3-3.25 3-3.25-3-3.25 3-3.25-3-3.25 3-3.25-3z" fill="#f5f7ff"/><rect x="92" y="14" width="18" height="3.6" rx="1.8" fill="' + a + '"/>' + lines.replace(/y="14"/, 'y="22"') + '</svg>';
    },
    seo: function (a) {
      var st = ""; for (var i = 0; i < 5; i++) st += '<circle cx="' + (50 + i * 6) + '" cy="88" r="2.1"/>';
      return '<svg viewBox="0 0 120 100" aria-hidden="true"><rect x="4" y="4" width="112" height="15" rx="7.5" fill="#f5f7ff"/><circle cx="14" cy="11.5" r="3.4" fill="none" stroke="#6b7699" stroke-width="1.5"/><path d="M16.6 14l3 3" stroke="#6b7699" stroke-width="1.5" stroke-linecap="round"/><text x="24" y="14" font-size="6.4" fill="#46517a" ' + F + '>salon near me</text>' +
        '<rect x="4" y="24" width="112" height="46" rx="7" fill="#101a40" stroke="rgba(255,255,255,.18)"/><path d="M4 44h112M4 58h112M30 24v46M62 24v46M92 24v46" stroke="rgba(255,255,255,.08)"/><path d="M4 66L50 36l30 14 36-20" stroke="rgba(255,255,255,.14)" stroke-width="3" fill="none"/>' +
        '<circle cx="60" cy="47" r="14" fill="' + a + '" opacity=".18"/><circle cx="60" cy="47" r="8" fill="' + a + '" opacity=".28"/><path d="M60 58c-6-7-9-11-9-15a9 9 0 0 1 18 0c0 4-3 8-9 15z" fill="' + a + '" stroke="#fff" stroke-width="1.4"/><circle cx="60" cy="43" r="3.2" fill="#fff"/>' +
        '<rect x="4" y="74" width="112" height="24" rx="6" fill="#f5f7ff"/><rect x="9" y="79" width="14" height="10" rx="3" fill="#34d399"/><text x="16" y="86.3" text-anchor="middle" font-size="6" font-weight="800" fill="#052e1f" ' + F + '>#1</text><text x="28" y="85" font-size="7" font-weight="700" fill="#1a2a66" ' + F + '>Your Business</text><g fill="#ffb400" transform="translate(-18 0)">' + st + '</g><text x="82" y="90.4" font-size="5.2" fill="#5a6488" ' + F + '>Open · 0.8 km</text></svg>';
    }
  };

  /* ------------------------------------------------------------ markup */
  function dashboardHTML() {
    var nav = [["home", "Overview", "", 1], ["bag", "Orders", "496"], ["users", "Customers"], ["card", "M-Pesa"], ["chat", "Enquiries", "14", 0, 1]];
    var side = nav.map(function (n) { return '<a' + (n[3] ? ' class="on"' : "") + ">" + ico(n[0]) + n[1] + (n[2] ? "<em" + (n[4] ? ' class="hot"' : "") + ">" + n[2] + "</em>" : "") + "</a>"; }).join("");
    var kpis = KPIS.map(function (k, i) {
      var mx = Math.max.apply(null, k.s), pts = k.s.map(function (v, j) { return (j * 40 / 6).toFixed(1) + "," + (14 - v / mx * 13).toFixed(1); }).join(" ");
      return '<div class="kpi"><p>' + k.k + '</p><strong data-kpi="' + i + '">' + k.fmt(k.to) + '</strong><span class="delta">▲ ' + k.d + '</span><svg viewBox="0 0 40 14" preserveAspectRatio="none"><polyline points="' + pts + '"/></svg></div>';
    }).join("");
    var src = SOURCES.map(function (s) { return '<div class="bar" style="--c1:' + s.c[0] + ';--c2:' + s.c[1] + '"><div><em>' + s.n + "</em><b>" + s.v + '%</b></div><span><i style="width:' + s.v * 2 + '%"></i></span></div>'; }).join("");
    return '<div class="db"><aside class="db-side"><div class="db-brand"><b>M</b><span>Mwanzo<br>Hardware</span></div><nav>' + side + '</nav></aside>' +
      '<div class="db-main"><header><div><h4>Overview</h4><p>Online store · Oct 2026</p></div><div class="db-tools"><span class="pill">Last 6 months</span><span class="avatar">JM</span></div></header>' +
      '<section class="kpis">' + kpis + '</section>' +
      '<section class="row"><div class="card"><div class="ch-head"><h5>Online sales</h5><span class="legend"><i></i>KSh per month</span></div><div class="ch-plot"><div class="ch-area"><svg></svg></div></div></div>' +
      '<div class="card src"><h5>Where customers come from</h5>' + src + '</div></section></div><span class="glass"></span></div>';
  }
  function adsHTML() {
    var slides = ADS.map(function (a, i) {
      return '<div class="ad" style="--ac:' + a.ac + '"><div class="ad-copy"><span class="ad-tag">' + ico(a.ic, 2.2) + a.tag + "</span><h3>" + a.h + "</h3><p>" + a.p + '</p><span class="ad-cta">Get a free quote ' + ico("arrow", 2.6).replace("<svg", '<svg width="14" height="14" style="width:3.2cqw;height:3.2cqw"') + '</span></div><div class="ad-art">' + ART[a.art](a.ac) + "</div></div>";
    }).join("");
    var prog = ADS.map(function () { return "<span><i></i></span>"; }).join("");
    return '<div class="ad-brand"><i></i>VYNEX</div><div class="ad-count"></div>' + slides + '<div class="ad-prog">' + prog + '</div><span class="glass"></span>';
  }
  function msgHTML(it, cls) {
    var ic = FEED_ICON[it.t];
    return '<div class="msg ' + (cls || "") + '"><span class="ic" style="--ic:' + ic[0] + '">' + ico(ic[1], 2.2) + '</span><div class="tx"><b>' + it.n + "</b><span>" + it.m + "</span></div><time>now</time></div>";
  }
  function phoneHTML() {
    var bars = [5, 8, 6, 10, 9, 12, 14].map(function (h, i) { return '<i style="--h:' + h + "cqw;--i:" + i + '"></i>'; }).join("");
    return '<div class="ph-island"></div><div class="ph-status"><span>10:24</span><span class="ph-sig"><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/></svg><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.2" fill="none" stroke="#fff" opacity=".6"/><rect x="2" y="2" width="16" height="8" rx="2"/><rect x="24" y="4" width="1.8" height="4" rx=".9" opacity=".6"/></svg></span></div>' +
      '<div class="ph-head"><small>Mwanzo Hardware</small><h4>Enquiries</h4></div>' +
      '<div class="ph-stat"><span>New today</span><strong id="phToday">' + TODAY0 + '</strong><em>▲ 58% this month</em><div class="ph-bars">' + bars + "</div></div>" +
      '<div class="ph-label">Latest<b><i></i>Live</b></div><div class="ph-feed" id="phFeed"></div>' +
      '<div class="ph-tabs">' + ["home", "chat", "card", "user"].map(function (n, i) { return ico(n).replace("<svg", "<svg" + (i === 1 ? ' class="on"' : "")); }).join("") + '</div><div class="ph-home"></div><span class="glass" style="border-radius:3.6cqw"></span>';
  }
  root.innerHTML =
    '<div class="dev laptop"><div class="lp-lid"><div class="lp-bezel"><i class="lp-cam"></i><div class="lp-screen">' + dashboardHTML() + '</div></div></div><div class="lp-base"></div></div>' +
    '<div class="dev tablet"><div class="tb-bezel"><i class="tb-cam"></i><div class="tb-screen">' + adsHTML() + '</div></div></div>' +
    '<div class="dev phone"><div class="ph-bezel"><div class="ph-screen">' + phoneHTML() + '</div></div></div>';

  /* ------------------------------------------------------------ dashboard behaviour */
  var db = { raf: [], anims: [], timers: [], running: false, main: $(".db-main") };
  function later(fn, ms) { var t = setTimeout(fn, ms); db.timers.push(t); }
  function smooth(p) {
    var d = "M" + p[0][0].toFixed(1) + " " + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += " C" + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + " " + (b[1] + (c[1] - a[1]) / 6).toFixed(1) + "," + (c[0] - (e[0] - b[0]) / 6).toFixed(1) + " " + (c[1] - (e[1] - b[1]) / 6).toFixed(1) + "," + c[0].toFixed(1) + " " + c[1].toFixed(1);
    }
    return d;
  }
  var chart = null;
  function drawChart() {
    var area = $(".ch-area"), svg = $("svg", area), plot = $(".ch-plot");
    var W = area.clientWidth, H = area.clientHeight;
    if (!W || !H) return false;
    $$(".ylab, .xlab, .launch, .tip, .dot-end", plot).forEach(function (n) { n.remove(); });
    var n = SALES.length, sw = Math.max(1.6, W / 95);
    var X = function (i) { return i / (n - 1) * W; }, Y = function (v) { return H * (1 - v / YMAX); };
    var pts = SALES.map(function (v, i) { return [X(i), Y(v)]; });
    var before = smooth(pts.slice(0, LAUNCH + 1)), after = smooth(pts.slice(LAUNCH));
    var grid = "";
    [0, 400, 800, 1200].forEach(function (v) {
      grid += '<line x1="0" x2="' + W + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="rgba(255,255,255,.07)" stroke-dasharray="' + (v ? "3 4" : "0") + '"/>';
      var l = document.createElement("div"); l.className = "ylab"; l.textContent = v === 0 ? "0" : v >= 1000 ? (v / 1000).toFixed(1) + "M" : v + "K";
      l.style.top = (area.offsetTop + Y(v)) + "px"; plot.appendChild(l);
    });
    MONTHS.forEach(function (m, i) { var l = document.createElement("div"); l.className = "xlab"; l.textContent = m; l.style.left = (area.offsetLeft + X(i)) + "px"; plot.appendChild(l); });
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.innerHTML = '<defs><linearGradient id="dvArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34d399" stop-opacity=".42"/><stop offset="1" stop-color="#34d399" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="dvLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>' + grid +
      '<line x1="' + X(LAUNCH).toFixed(1) + '" x2="' + X(LAUNCH).toFixed(1) + '" y1="0" y2="' + H + '" stroke="#ffbe46" stroke-opacity=".6" stroke-dasharray="3 4"/>' +
      '<path class="p-area" d="' + after + " L" + W + " " + H + " L" + X(LAUNCH).toFixed(1) + " " + H + 'Z" fill="url(#dvArea)"/>' +
      '<path class="p-before" d="' + before + '" fill="none" stroke="#7d89b8" stroke-width="' + sw + '" stroke-linecap="round"/>' +
      '<path class="p-after" d="' + after + '" fill="none" stroke="url(#dvLine)" stroke-width="' + sw * 1.15 + '" stroke-linecap="round"/>';
    var lb = document.createElement("div"); lb.className = "launch"; lb.textContent = "Website launched"; lb.style.left = (area.offsetLeft + X(LAUNCH) + 1) + "px"; lb.style.top = (area.offsetTop - 0.6) + "px"; plot.appendChild(lb);
    var last = pts[n - 1], dot = document.createElement("div"); dot.className = "dot-end"; dot.style.left = (area.offsetLeft + last[0]) + "px"; dot.style.top = (area.offsetTop + last[1]) + "px"; plot.appendChild(dot);
    var tip = document.createElement("div"); tip.className = "tip"; tip.textContent = "Oct · KSh 1.13M"; tip.style.left = (area.offsetLeft + last[0] + 4) + "px"; tip.style.top = (area.offsetTop + last[1]) + "px"; plot.appendChild(tip);
    chart = { svg: svg, lb: lb, dot: dot, tip: tip, W: W, H: H };
    return true;
  }
  function setKpis(f) { $$("[data-kpi]").forEach(function (el) { var k = KPIS[el.dataset.kpi]; el.innerHTML = k.fmt(k.to * f); }); }
  function resetDash() {
    db.raf.forEach(cancelAnimationFrame); db.raf = [];
    db.anims.forEach(function (a) { a.cancel(); }); db.anims = [];
    db.timers.forEach(clearTimeout); db.timers = [];
    setKpis(0);
    $$(".bar").forEach(function (b) { b.classList.remove("go"); });
    if (chart) {
      var pb = $(".p-before", chart.svg), pa = $(".p-after", chart.svg), ar = $(".p-area", chart.svg);
      [pb, pa].forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p._L = L; });
      ar.style.opacity = 0;
      [chart.lb, chart.dot, chart.tip].forEach(function (e) { e.classList.remove("is-in"); });
    }
  }
  function showDashFinal() {
    setKpis(1);
    $$(".bar").forEach(function (b) { b.classList.add("go"); });
    if (chart) {
      $$(".p-before, .p-after", chart.svg).forEach(function (p) { p.style.strokeDasharray = "none"; p.style.strokeDashoffset = 0; });
      $(".p-area", chart.svg).style.opacity = 1;
      [chart.lb, chart.dot, chart.tip].forEach(function (e) { e.classList.add("is-in"); });
    }
  }
  function count(dur, delay) {
    var t0 = performance.now() + delay;
    (function tick(now) {
      var p = Math.max(0, Math.min(1, (now - t0) / dur)); setKpis(1 - Math.pow(1 - p, 3));
      if (p < 1) db.raf.push(requestAnimationFrame(tick));
    })(performance.now());
  }
  function playDash() {
    if (!db.running) return;
    if (!chart && !drawChart()) { later(playDash, 300); return; }
    resetDash();
    count(1700, 250);
    var pb = $(".p-before", chart.svg), pa = $(".p-after", chart.svg), ar = $(".p-area", chart.svg);
    var go = function (p, delay, dur) { var a = p.animate([{ strokeDashoffset: p._L }, { strokeDashoffset: 0 }], { duration: dur, delay: delay, easing: "cubic-bezier(.3,.7,.25,1)", fill: "forwards" }); db.anims.push(a); };
    go(pb, 300, 1000); go(pa, 1250, 1900);
    db.anims.push(ar.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1100, delay: 1900, fill: "forwards" }));
    later(function () { chart.lb.classList.add("is-in"); }, 1300);
    later(function () { chart.dot.classList.add("is-in"); chart.tip.classList.add("is-in"); }, 3100);
    $$(".bar").forEach(function (b, i) { later(function () { b.classList.add("go"); }, 700 + i * 180); });
    later(function () { db.main.classList.add("fade"); later(function () { db.main.classList.remove("fade"); playDash(); }, 520); }, 13800);
  }

  /* ------------------------------------------------------------ tablet: service ads */
  var ad = { i: -1, t: 0, slides: $$(".ad"), segs: $$(".ad-prog span"), count: $(".ad-count"), running: false };
  function showAd(n) {
    var prev = ad.i; ad.i = n;
    ad.slides.forEach(function (s, k) {
      s.classList.remove("out");
      if (k === n) s.classList.add("on");
      else if (k === prev) { s.classList.remove("on"); s.classList.add("out"); (function (el) { setTimeout(function () { el.classList.remove("out"); }, 850); })(s); }
      else s.classList.remove("on");
    });
    ad.segs.forEach(function (sg, k) {
      sg.classList.toggle("done", k < n); sg.classList.remove("now");
      if (k === n) { void sg.offsetWidth; sg.style.setProperty("--dur", AD_MS + "ms"); sg.classList.add("now"); }
    });
    ad.count.textContent = (n + 1) + " / " + ADS.length;
  }
  function nextAd() { if (!ad.running) return; showAd((ad.i + 1) % ADS.length); ad.t = setTimeout(nextAd, AD_MS); }

  /* ------------------------------------------------------------ phone: live enquiries */
  var ph = { feed: $("#phFeed"), today: $("#phToday"), n: 4, t: 0, running: false, total: TODAY0 };
  var AGE = ["now", "1m", "3m", "6m", "9m", "14m", "20m"];
  function stampFeed() { $$(".msg time", ph.feed).forEach(function (t, i) { t.textContent = AGE[i] || ""; }); }
  function seedFeed() {
    ph.feed.innerHTML = ""; ph.total = TODAY0; ph.today.textContent = ph.total; ph.n = 4;
    for (var i = 3; i >= 0; i--) ph.feed.insertAdjacentHTML("afterbegin", msgHTML(FEED[i]));
    stampFeed();
  }
  function pushMsg() {
    if (!ph.running) return;
    if (ph.n >= FEED.length) seedFeed();                 // loop: reset to the opening four, then replay the rest
    var it = FEED[ph.n];
    ph.feed.insertAdjacentHTML("afterbegin", msgHTML(it, "new"));
    while (ph.feed.children.length > 6) ph.feed.lastElementChild.remove();
    stampFeed();
    if (it.t !== "pay") { ph.total++; ph.today.textContent = ph.total; }
    ph.n++;
    ph.t = setTimeout(pushMsg, FEED_MS);
  }

  /* ------------------------------------------------------------ orchestration */
  seedFeed();
  showAd(0);
  ad.segs.forEach(function (s) { s.classList.remove("now"); });   // keep the bar still until animations start
  var visible = true, started = false;
  function start() {
    if (reduce || started) return;
    started = true;
    db.running = ad.running = ph.running = true;
    playDash(); showAd(ad.i < 0 ? 0 : ad.i); ad.t = setTimeout(nextAd, AD_MS); ph.t = setTimeout(pushMsg, 1800);
  }
  function stop() {
    if (!started) return;
    started = false; db.running = ad.running = ph.running = false;
    clearTimeout(ad.t); clearTimeout(ph.t); resetDash();
    ad.segs.forEach(function (s) { s.classList.remove("now"); });
  }
  function sync() { if (visible && !document.hidden) start(); else stop(); }

  function init() {
    if (!drawChart()) { requestAnimationFrame(init); return; }
    showDashFinal();                                           // a complete still frame (also the reduced-motion view)
    ad.segs.forEach(function (s, k) { s.classList.toggle("done", k === 0); });
    if (reduce) return;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; sync(); }, { threshold: .15 }).observe(root);
    document.addEventListener("visibilitychange", sync);
    var rz = 0, lastW = root.clientWidth;
    if ("ResizeObserver" in window) new ResizeObserver(function () {
      if (Math.abs(root.clientWidth - lastW) < 4) return; lastW = root.clientWidth;
      clearTimeout(rz); rz = setTimeout(function () { var was = started; stop(); drawChart(); showDashFinal(); if (was) sync(); }, 200);
    }).observe(root);
    sync();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(init, 60); }); else setTimeout(init, 150);
})();
