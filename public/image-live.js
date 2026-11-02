/* VYNEX/public/image-live.js — turns the screens inside our photos into LIVE screens.
   • images/hero-code.jpg     → every holographic panel scrolls real code, charts move, rings spin
   • images/about-company.jpg → the laptop, tablet and phone browse the VYNEX site (typing, scrolling,
                                clicking, counting numbers, growing charts) in perspective
   How it works: live content is built in flat HTML, then warped onto each screen's four corners
   with a CSS perspective matrix (matrix3d) so it sits on the photo like a real display.
   To fix a misaligned screen, edit the corner points in SCENES below (x,y in the photo's own pixels).
   Visitors who prefer reduced motion get the same screens, frozen (see .lv-still in image-live.css). */
(function () {
  // Reduced-motion visitors (and phones in battery-saver) still get the sharp live screens,
  // just frozen — otherwise they only see the low-resolution photo, which looks blurry.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("lv-still");

  /* ---------- geometry ---------- */
  // 4 corners (TL, TR, BR, BL) in stage pixels  →  matrix3d for a w×h element
  function quad(w, h, q) {
    var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1], x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
    var sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, a, b, c, d, e, f, g, h2;
    if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) { a = x1 - x0; b = x3 - x0; c = x0; d = y1 - y0; e = y3 - y0; f = y0; g = 0; h2 = 0; }
    else {
      var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, den = dx1 * dy2 - dx2 * dy1;
      g = (sx * dy2 - dx2 * sy) / den; h2 = (dx1 * sy - sx * dy1) / den;
      a = x1 - x0 + g * x1; b = x3 - x0 + h2 * x3; c = x0; d = y1 - y0 + g * y1; e = y3 - y0 + h2 * y3; f = y0;
    }
    return "matrix3d(" + [a / w, d / w, 0, g / w, b / h, e / h, 0, h2 / h, 0, 0, 1, 0, c, f, 0, 1].join(",") + ")";
  }
  function poly(holes) {
    // evenodd cut-outs so a screen is never painted over a device that sits in front of it
    if (!holes || !holes.length) return "";
    var pts = ["0 0", "100% 0", "100% 100%", "0 100%", "0 0"];
    holes.forEach(function (h) { h.concat([h[0]]).forEach(function (p) { pts.push(p[0] + "px " + p[1] + "px"); }); pts.push("0 0"); });
    return "polygon(evenodd," + pts.join(",") + ")";
  }

  /* ---------- code ---------- */
  var CODE = [
    "import { createServer } from 'vynex/core';", "// boot the application", "const app = createServer({ port: 8080, secure: true });", "",
    "async function handleRequest(req, res) {", "  const user = await auth.verify(req.token);", "  if (!user) return res.status(401).json({ error: 'denied' });",
    "  const data = await db.query('SELECT * FROM projects');", "  for (const item of data) {", "    item.views += 1;", "    cache.set(item.id, item, 3600);", "  }",
    "  return res.json({ ok: true, count: data.length });", "}", "", "function renderChart(points, color = '#55eeff') {", "  const max = Math.max(...points);",
    "  return points.map((p, i) => ({ x: i * 24, y: 100 - (p / max) * 100 }));", "}", "", "export const deploy = async () => {", "  await build({ minify: true, target: 'es2022' });",
    "  const res = await fetch('https://api.vynex.co.ke/deploy', { method: 'POST' });", "  if (res.status === 200) console.log('Live in 2.4s');", "  else throw new Error('Deploy failed');", "};", "",
    "router.get('/pay/mpesa', async (req, res) => {", "  const tx = await mpesa.stkPush(req.query.phone, 1500);", "  res.send(tx.status);", "});", "",
    "const theme = { primary: '#ffcd00', radius: 12, dark: true };", "window.addEventListener('resize', debounce(layout, 120));", "while (running) { await tick(16); }", ""
  ];
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function colorize(line) {
    var out = "", re = /(\/\/.*$)|('[^']*'|"[^"]*")|\b(import|from|export|const|let|var|function|async|await|return|if|else|for|of|while|new|throw|try|catch)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\()/g, last = 0, m;
    while ((m = re.exec(line))) {
      out += esc(line.slice(last, m.index));
      var cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : m[4] ? "n" : "f";
      out += '<span class="' + cls + '">' + esc(m[0]) + "</span>"; last = re.lastIndex;
    }
    return '<span class="p">' + out + esc(line.slice(last)) + "</span>";
  }
  function codeTrack(offset, dur) {
    var rows = [], n = CODE.length, i;
    for (i = 0; i < n; i++) rows.push('<div><b>' + (i + 1) + "</b>" + colorize(CODE[(i + offset) % n]) + "</div>");
    var html = rows.join("");
    return '<div class="lv-track" style="--lv-dur:' + dur + 's">' + html + html + "</div>";
  }

  /* ---------- hero-code.jpg ---------- */
  function codePanel(offset, dur, fs) { return '<div class="lv-code" style="font-size:' + fs + 'px"><div class="lv-gut"></div>' + codeTrack(offset, dur) + '<div class="lv-hl"></div><div class="lv-glass"></div></div>'; }
  function mainPanel() {
    return '<div class="lv-main" style="font-size:19px"><div class="lv-tabs"><span class="on">server.ts</span><span>routes.js</span><span>deploy.ts</span></div>' +
      '<div class="lv-side"><i></i><i></i><i></i><i></i><i></i></div>' +
      '<div class="lv-body"><div class="lv-code" style="font-size:19px;background:#0b0a28"><div class="lv-gut"></div>' + codeTrack(0, 46) + '<div class="lv-hl"></div></div></div>' +
      '<div class="lv-term"><div class="lv-code" style="font-size:15px;background:#0a0924">' + codeTrack(14, 30) + '</div></div>' +
      '<div class="lv-status"><span class="lv-dot"></span><em>Build passing</em><u></u><span>UTF-8 · TypeScript</span></div><div class="lv-glass"></div></div>';
  }
  function tableRows() {
    var names = ["orders", "users", "invoices", "payments", "stock", "reports", "mpesa", "emails"], h = "";
    for (var i = 0; i < 28; i++) h += "<div><span>" + names[i % names.length] + "_" + (100 + i * 7) + "</span> <span>" + (Math.round((i * 37) % 97) + 3) + "ms</span> <span>OK</span></div>";
    return h;
  }
  function barsHTML() { var h = ""; for (var i = 0; i < 9; i++) h += '<i style="animation-delay:' + (-i * 0.37).toFixed(2) + "s;animation-duration:" + (2.2 + (i % 4) * 0.55).toFixed(2) + 's"></i>'; return '<div class="lv-bars">' + h + '</div><div class="lv-glass"></div>'; }

  var S = 3;
  var HERO = {
    w: 576, h: 608,
    build: function (st) {
      [
        { q: [[170, 209], [524, 243], [524, 402], [170, 438]], html: mainPanel() },
        { q: [[94, 36], [268, 99], [268, 188], [94, 205]], html: codePanel(6, 52, 17) },
        { q: [[358, 60], [504, 75], [504, 183], [358, 172]], html: codePanel(19, 44, 17) },
        { q: [[66, 358], [168, 352], [168, 478], [66, 508]], html: codePanel(11, 38, 17) },
        { q: [[444, 430], [530, 418], [530, 528], [444, 553]], html: codePanel(25, 48, 17) },
        { q: [[0, 258], [56, 262], [56, 352], [0, 346]], html: '<div class="lv-table" style="font-size:13px"><div class="lv-track" style="--lv-dur:24s">' + tableRows() + tableRows() + "</div></div>" },
        { q: [[272, 462], [326, 462], [326, 486], [272, 486]], html: barsHTML() }
      ].forEach(function (p) { add(st, p.q, p.html); });
      ring(st, 500, 80, 25); ring(st, 484, 212, 12);
    }
  };
  function ring(st, cx, cy, r) {
    var d = document.createElement("div"); d.className = "lv-ring"; d.style.cssText = "left:" + (cx - r) + "px;top:" + (cy - r) + "px;width:" + r * 2 + "px;height:" + r * 2 + "px;--r:" + r;
    d.innerHTML = "<i></i>"; st.appendChild(d);
  }

  /* ---------- plumbing ---------- */
  function add(st, q, html, dw, dh, holes, radius) {
    var xs = q.map(function (p) { return p[0]; }), ys = q.map(function (p) { return p[1]; });
    var w = dw || Math.round((Math.max.apply(0, xs) - Math.min.apply(0, xs)) * S), h = dh || Math.round((Math.max.apply(0, ys) - Math.min.apply(0, ys)) * S);
    var clip = document.createElement("div"); clip.className = "lv-clip"; clip.style.width = st.w + "px"; clip.style.height = st.h + "px";
    var cp = poly(holes); if (cp) clip.style.clipPath = cp;
    var el = document.createElement("div"); el.className = "lv-screen"; el.style.cssText = "width:" + w + "px;height:" + h + "px;transform:" + quad(w, h, q) + (radius ? ";border-radius:" + radius : "");
    el.innerHTML = html; clip.appendChild(el); st.appendChild(clip);
  }
  var SCENES = { "hero-code.jpg": HERO };

  function attach(img) {
    var name = (img.currentSrc || img.src || "").split("?")[0].split("/").pop();
    var scene = SCENES[name];
    if (!scene || img.dataset.lv === name) return;
    var frame = img.closest(".img-frame, .hero-art");
    if (!frame) return;
    img.dataset.lv = name;
    var old = frame.querySelector(".lv-wrap"); if (old) old.remove();
    frame.classList.add("vx-live");
    var wrap = document.createElement("div"); wrap.className = "lv-wrap";
    var st = document.createElement("div"); st.className = "lv-stage"; st.w = scene.w; st.h = scene.h; st.style.width = scene.w + "px"; st.style.height = scene.h + "px";
    wrap.appendChild(st); frame.appendChild(wrap);
    scene.build(st);
    function fit() {
      var fw = frame.clientWidth, fh = frame.clientHeight; if (!fw || !fh) return;
      var k = Math.max(fw / scene.w, fh / scene.h);                       // same maths as object-fit: cover
      st.style.transform = "translate(" + (fw - scene.w * k) / 2 + "px," + (fh - scene.h * k) / 2 + "px) scale(" + k + ")";
    }
    // pause every animation while the picture is off-screen (saves battery and keeps scrolling smooth)
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { frame.classList.toggle("lv-off", !es[0].isIntersecting); }, { rootMargin: "80px" }).observe(frame);
    fit();
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(frame); else addEventListener("resize", fit);
    if (location.search.indexOf("lvdebug") > -1) document.documentElement.classList.add("lv-debug");
  }
  function scan() { document.querySelectorAll("img").forEach(function (i) { if (i.complete && i.src) attach(i); }); }
  document.addEventListener("load", function (e) { if (e.target && e.target.tagName === "IMG") attach(e.target); }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan); else scan();
  window.addEventListener("load", scan);
})();
