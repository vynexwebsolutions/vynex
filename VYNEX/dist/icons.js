/* VYNEX/public/icons.js — modern line icons (replaces emojis). Used by the site and the admin panel.
   VX_ICON("globe")              -> inline <svg> markup
   VX_ICON.resolve(value, title) -> icon from a saved name (or best guess from the service title) */
(function () {
  var P = {
 "globe": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18\"/>",
 "code": "<path d=\"M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14\"/>",
 "building": "<path d=\"M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M2 21h20M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1\"/>",
 "cart": "<circle cx=\"9\" cy=\"20\" r=\"1.4\"/><circle cx=\"18\" cy=\"20\" r=\"1.4\"/><path d=\"M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6\"/>",
 "devices": "<rect x=\"2.5\" y=\"4\" width=\"14\" height=\"10\" rx=\"1.5\"/><path d=\"M6 18h7M9.5 14v4\"/><rect x=\"18\" y=\"8\" width=\"3.5\" height=\"9\" rx=\"1\"/>",
 "refresh": "<path d=\"M20 11a8 8 0 0 0-14.5-4.5L3 9M3 4v5h5M4 13a8 8 0 0 0 14.5 4.5L21 15M21 20v-5h-5\"/>",
 "server": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"7\" rx=\"2\"/><rect x=\"3\" y=\"14\" width=\"18\" height=\"7\" rx=\"2\"/><path d=\"M7 6.5h.01M7 17.5h.01M12 6.5h5M12 17.5h5\"/>",
 "rocket": "<path d=\"M12.5 3.5C16.5 2 20 2.5 21 3c.5 1 1 4.5-.5 8.5l-5 5-6-6 5-5z\"/><path d=\"M9.5 10.5L5 11l-2 3 4 .5M13.5 14.5L13 19l-3 2-.5-4M6 18c-1.5.5-2.5 2-2.5 3.5 1.5 0 3-1 3.5-2.5\"/><circle cx=\"16\" cy=\"8\" r=\"1.3\"/>",
 "wrench": "<path d=\"M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z\"/>",
 "shield": "<path d=\"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z\"/><path d=\"M9 12l2 2 4-4\"/>",
 "search": "<circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"M20 20l-4-4M8 12l2-2 2 2 3-3\"/>",
 "layers": "<path d=\"M12 3l9 5-9 5-9-5 9-5z\"/><path d=\"M3 12.5l9 5 9-5\"/><path d=\"M3 17l9 5 9-5\"/>",
 "android": "<rect x=\"7\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2.5\"/><path d=\"M10.5 9.5L9 11l1.5 1.5M13.5 9.5L15 11l-1.5 1.5\"/>",
 "ios": "<rect x=\"7\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2.5\"/><circle cx=\"12\" cy=\"17.5\" r=\"1\"/>",
 "cpu": "<rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"2\"/><rect x=\"9.5\" y=\"9.5\" width=\"5\" height=\"5\"/><path d=\"M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4\"/>",
 "chart": "<path d=\"M3 3v18h18\"/><path d=\"M7 15l4-4 3 3 6-7\"/>",
 "box": "<path d=\"M21 8l-9-5-9 5v8l9 5 9-5V8z\"/><path d=\"M3 8l9 5 9-5M12 13v8\"/>",
 "receipt": "<path d=\"M6 3h12v18l-3-2-3 2-3-2-3 2V3z\"/><path d=\"M9 8h6M9 12h6\"/>",
 "graduation": "<path d=\"M2 9l10-5 10 5-10 5L2 9z\"/><path d=\"M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6\"/>",
 "home": "<path d=\"M3 11l9-8 9 8\"/><path d=\"M5 10v10h5v-6h4v6h5V10\"/>",
 "calendar": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17.5h2\"/>",
 "palette": "<path d=\"M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.5-1 0-2.5 1.5-2.5H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5z\"/><circle cx=\"7.5\" cy=\"11\" r=\"1\"/><circle cx=\"10\" cy=\"7\" r=\"1\"/><circle cx=\"15\" cy=\"7.5\" r=\"1\"/>",
 "pen": "<path d=\"M4 20l1-5L16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 2z\"/><path d=\"M14 6l3 3\"/>",
 "plug": "<path d=\"M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0V7zM12 17v5\"/>",
 "card": "<rect x=\"2.5\" y=\"5\" width=\"19\" height=\"14\" rx=\"2\"/><path d=\"M2.5 10h19M6 15h4\"/>",
 "cloud": "<path d=\"M7 18a5 5 0 1 1 1.2-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18H7z\"/>",
 "toolbox": "<rect x=\"3\" y=\"8\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18M11 13v2h2v-2\"/>",
 "mail": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 7l9 6 9-6\"/>",
 "phone": "<path d=\"M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z\"/>",
 "chat": "<path d=\"M4 20l1.3-4.2A8 8 0 1 1 8.2 18.8L4 20z\"/><path d=\"M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2L9 9.5z\"/>",
 "pin": "<path d=\"M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/>",
 "target": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\"/>",
 "eye": "<path d=\"M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
 "sparkle": "<path d=\"M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z\"/>",
 "lock": "<rect x=\"5\" y=\"11\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 11V8a4 4 0 0 1 8 0v3\"/>",
 "users": "<circle cx=\"9\" cy=\"8\" r=\"3.2\"/><path d=\"M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6\"/><circle cx=\"17\" cy=\"9\" r=\"2.5\"/><path d=\"M17 14c2.5 0 4.5 2 4.5 4.5\"/>",
 "zap": "<path d=\"M13 2L4 14h7l-1 8 9-12h-7l1-8z\"/>",
 "check": "<path d=\"M5 12l4 4 10-10\"/>",
 "star": "<path d=\"M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z\"/>",
 "menu": "<path d=\"M4 7h16M4 12h16M4 17h16\"/>",
 "dashboard": "<rect x=\"3\" y=\"3\" width=\"7\" height=\"9\" rx=\"1.5\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"5\" rx=\"1.5\"/><rect x=\"14\" y=\"12\" width=\"7\" height=\"9\" rx=\"1.5\"/><rect x=\"3\" y=\"16\" width=\"7\" height=\"5\" rx=\"1.5\"/>",
 "folder": "<path d=\"M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z\"/>",
 "message": "<path d=\"M4 4h16v12H8l-4 4V4z\"/>",
 "image": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"1.6\"/><path d=\"M21 16l-5-5-8 8\"/>",
 "settings": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1\"/>"
};
  var GUESS = [
    [/hosting|domain/i, "server"], [/deploy|launch/i, "rocket"], [/maint|support|consult/i, "wrench"], [/secur/i, "shield"],
    [/seo|perform|optimi/i, "search"], [/redesign|update/i, "refresh"], [/e-?commerce|shop|store/i, "cart"],
    [/responsive|mobile-friendly/i, "devices"], [/corporate|business website/i, "building"], [/android/i, "android"], [/ios|iphone/i, "ios"],
    [/pos|point.of.sale/i, "receipt"], [/inventory/i, "box"], [/school/i, "graduation"], [/property|real estate/i, "home"],
    [/booking|reserv/i, "calendar"], [/ui\/?ux|graphic|brand|design system/i, "palette"], [/api|integrat|m-?pesa|payment/i, "plug"],
    [/cloud/i, "cloud"], [/management|system|erp/i, "chart"], [/software|custom/i, "cpu"], [/web ?app/i, "layers"], [/website|web|develop/i, "code"]
  ];
  function VX_ICON(name, cls) {
    var p = P[name] || P.sparkle;
    return '<svg class="' + (cls || "ico") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  }
  VX_ICON.names = Object.keys(P);
  VX_ICON.resolve = function (value, title) {
    var v = String(value || "").trim().toLowerCase();
    if (P[v]) return VX_ICON(v);
    for (var i = 0; i < GUESS.length; i++) if (GUESS[i][0].test(title || "")) return VX_ICON(GUESS[i][1]);
    return VX_ICON("sparkle");
  };
  window.VX_ICON = VX_ICON;
})();

/* ---- Brand icons (real logos: Simple Icons CC0 + Font Awesome Free solid) and contact-link helper ----
   VX_BRAND(name)            -> filled <svg> for call | email | whatsapp | instagram | tiktok | x
   VX_CONTACT.build(row)     -> [{key,label,href,external}] for every contact the admin has filled in
   Both the public site and the admin panel use this, so the links are built in exactly one place. */
(function () {
  var B = {"call": ["0 0 512 512", "M160.2 25c-7.9-18.9-28.5-28.9-48.1-23.6l-5.5 1.5C42 20.5-13.2 83.1 2.9 159.3 40 334.3 177.7 472 352.7 509.1 429 525.3 491.5 470 509.1 405.4l1.5-5.5c5.4-19.7-4.7-40.3-23.5-48.1l-97.3-40.5c-16.5-6.9-35.6-2.1-47 11.8l-38.6 47.2c-70.3-34.9-126.9-93.3-159.4-165l44.2-36c13.9-11.3 18.6-30.4 11.8-47z"], "email": ["0 0 512 512", "M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4l208 156a48 48 0 0 0 57.6 0l208-156c12.1-9.1 19.2-23.3 19.2-38.4 0-26.5-21.5-48-48-48zM0 196v188c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V196L313.6 344.8c-34.1 25.6-81.1 25.6-115.2 0z"], "whatsapp": ["0 0 24 24", "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52s.198-.298.298-.497c.099-.198.05-.371-.025-.52s-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51a13 13 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074s2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413s.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413"], "instagram": ["0 0 24 24", "M7.03.084c-1.277.06-2.149.264-2.91.563a5.9 5.9 0 0 0-2.124 1.388 5.9 5.9 0 0 0-1.38 2.127C.321 4.926.12 5.8.064 7.076s-.069 1.688-.063 4.947.021 3.667.083 4.947c.061 1.277.264 2.149.563 2.911.308.789.72 1.457 1.388 2.123a5.9 5.9 0 0 0 2.129 1.38c.763.295 1.636.496 2.913.552 1.278.056 1.689.069 4.947.063s3.668-.021 4.947-.082c1.28-.06 2.147-.265 2.91-.563a5.9 5.9 0 0 0 2.123-1.388 5.9 5.9 0 0 0 1.38-2.129c.295-.763.496-1.636.551-2.912.056-1.28.07-1.69.063-4.948-.006-3.258-.02-3.667-.081-4.947-.06-1.28-.264-2.148-.564-2.911a5.9 5.9 0 0 0-1.387-2.123 5.86 5.86 0 0 0-2.128-1.38C19.074.322 18.202.12 16.924.066 15.647.009 15.236-.006 11.977 0S8.31.021 7.03.084m.14 21.693c-1.17-.05-1.805-.245-2.228-.408a3.7 3.7 0 0 1-1.382-.895 3.7 3.7 0 0 1-.9-1.378c-.165-.423-.363-1.058-.417-2.228-.06-1.264-.072-1.644-.08-4.848-.006-3.204.006-3.583.061-4.848.05-1.169.246-1.805.408-2.228.216-.561.477-.96.895-1.382a3.7 3.7 0 0 1 1.379-.9c.423-.165 1.057-.361 2.227-.417 1.265-.06 1.644-.072 4.848-.08 3.203-.006 3.583.006 4.85.062 1.168.05 1.804.244 2.227.408.56.216.96.475 1.382.895s.681.817.9 1.378c.165.422.362 1.056.417 2.227.06 1.265.074 1.645.08 4.848.005 3.203-.006 3.583-.061 4.848-.051 1.17-.245 1.805-.408 2.23-.216.56-.477.96-.896 1.38a3.7 3.7 0 0 1-1.378.9c-.422.165-1.058.362-2.226.418-1.266.06-1.645.072-4.85.079s-3.582-.006-4.848-.06m9.783-16.192a1.44 1.44 0 1 0 1.437-1.442 1.44 1.44 0 0 0-1.437 1.442M5.839 12.012a6.161 6.161 0 1 0 12.323-.024 6.162 6.162 0 0 0-12.323.024M8 12.008A4 4 0 1 1 12.008 16 4 4 0 0 1 8 12.008"], "tiktok": ["0 0 24 24", "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07"], "x": ["0 0 24 24", "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"]};
  function VX_BRAND(name, cls) {
    var b = B[name]; if (!b) return "";
    return '<svg class="' + (cls || "ico brand-ico") + '" viewBox="' + b[0] + '" fill="currentColor" aria-hidden="true" focusable="false"><path d="' + b[1] + '"/></svg>';
  }
  window.VX_BRAND = VX_BRAND;

  // Order and labels shown on the website. `field` is the company_settings column the admin edits.
  var ITEMS = [
    { key: "call",      label: "Call us",   field: "phone" },
    { key: "whatsapp",  label: "WhatsApp",  field: "whatsapp" },
    { key: "email",     label: "Email us",  field: "email" },
    { key: "instagram", label: "Instagram", field: "social_instagram" },
    { key: "tiktok",    label: "TikTok",    field: "social_tiktok" },
    { key: "x",         label: "X (Twitter)", field: "social_twitter" }
  ];
  var SAFE = /^(https?:|tel:|mailto:)/i;
  var HOSTS = { instagram: "https://instagram.com/", tiktok: "https://www.tiktok.com/@", x: "https://x.com/" };

  function link(key, raw) {
    var v = String(raw == null ? "" : raw).trim();
    if (!v) return null;
    if (key === "call") {
      if (/^tel:/i.test(v)) return v;
      var n = v.replace(/[^\d+]/g, ""); return n ? "tel:" + n : null;
    }
    if (key === "email") {
      if (/^mailto:/i.test(v)) return v;
      return /^[^\s@]+@[^\s@]+$/.test(v) ? "mailto:" + v : null;
    }
    if (key === "whatsapp") {
      if (/^https?:/i.test(v)) return v;                       // pasted link (wa.me, chat.whatsapp.com, wa.link ...)
      if (/^(wa\.me|wa\.link|chat\.whatsapp\.com|api\.whatsapp\.com)/i.test(v)) return "https://" + v;
      var d = v.replace(/\D/g, "");
      if (/^00/.test(d)) d = d.slice(2); else if (/^0/.test(d)) d = "254" + d.slice(1);   // 0712… -> 254712… (Kenya)
      return d ? "https://wa.me/" + d : null;
    }
    // instagram / tiktok / x : full link, "domain.com/name", or just "@name"
    if (/^https?:/i.test(v)) return v;
    if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null;            // javascript:, data: ... are never allowed
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(v)) return "https://" + v;
    var h = v.replace(/^@/, "").replace(/[^\w.]/g, ""); return h ? HOSTS[key] + h : null;
  }
  function build(row) {
    row = row || {}; var out = [];
    ITEMS.forEach(function (it) {
      var href = link(it.key, row[it.field]);
      if (href && SAFE.test(href)) out.push({ key: it.key, label: it.label, href: href, external: it.key !== "call" && it.key !== "email" });
    });
    return out;
  }
  function html(row, cls) {
    return build(row).map(function (c) {
      return '<a class="' + (cls || "ci") + ' ci-' + c.key + '" href="' + c.href.replace(/"/g, "&quot;") + '"' + (c.external ? ' target="_blank" rel="noopener noreferrer"' : "") +
        ' aria-label="' + c.label + '" title="' + c.label + '">' + VX_BRAND(c.key) + '<span class="ci-tip">' + c.label + "</span></a>";
    }).join("");
  }
  window.VX_CONTACT = { items: ITEMS, link: link, build: build, html: html };
})();
