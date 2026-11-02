/* VYNEX/public/image-live.js — turns the screens inside our photos into LIVE screens.
   • images/hero-code.jpg     → every holographic panel scrolls real code, charts move, rings spin
   • images/services-desk.jpg → five monitors (index.html, style.css, main.js, app.py + a terminal): the editors
                                really TYPE code, auto-scroll and save, and the terminal restarts the server and
                                logs live requests — like a developer working
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


  /* ---------- services-desk.jpg : five-monitor developer desk ----------
     Four VS Code windows + a terminal. The editors really type (with caret, the odd typo, auto-scroll and
     save) one at a time like a developer would, while the others scroll as if being read. Every save makes
     the terminal restart the server and log live requests. Everything pauses when off-screen. */
  var DS = 2;   // render scale: screens are built at 2× their size in the photo so the text stays sharp
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rint(a, b) { return Math.floor(rnd(a, b + 1)); }
  function later(st, fn, ms) {
    setTimeout(function go() { if (st.paused()) { setTimeout(go, 400); return; } fn(); }, ms);
  }
  function tok(re, line, map) {
    var out = "", last = 0, m, g, cls;
    re.lastIndex = 0;
    while ((m = re.exec(line))) {
      if (!m[0]) { re.lastIndex++; continue; }
      out += esc(line.slice(last, m.index)); cls = "p";
      for (g = 1; g < m.length; g++) if (m[g]) { cls = map[g - 1]; break; }
      if (cls === "m") cls = line.charAt(re.lastIndex) === "(" ? "f" : "v";
      out += '<span class="' + cls + '">' + esc(m[0]) + "</span>"; last = re.lastIndex;
    }
    return out + esc(line.slice(last));
  }
  var RE_HTML = /(<!--[\s\S]*?(?:-->|$))|(<\/?[A-Za-z!][\w-]*)|("[^"]*"?|'[^']*'?)|([\w:-]+)(?==)|(\/?>)/g;
  var RE_JS = /(\/\/.*$)|('[^']*'?|"[^"]*"?|`[^`]*`?)|\b(const|let|var|function|new|async|class)\b|\b(return|if|else|for|of|throw|try|catch|await)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\()|(\.[A-Za-z_$][\w$]*)/g;
  var RE_PY = /(#.*$)|("[^"]*"?|'[^']*'?)|(@[\w.]+)|\b(from|import|as|def|return|if|else|elif|for|in|class|with|try|except|not|and|or|None|True|False|pass|raise)\b|\b(self)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_]\w*)(?=\()/g;
  var RE_CSSV = /(#[0-9a-fA-F]{3,8}\b)|(var\()|(-?\d*\.?\d+(?:px|rem|em|%|s|ms|vh|vw|deg)?)|('[^']*'?|"[^"]*"?)/g;
  function hl(lang, line) {
    if (lang === "html") return tok(RE_HTML, line, ["c", "t", "s", "a", "t"]);
    if (lang === "js") return tok(RE_JS, line, ["c", "s", "t", "k", "n", "f", "m"]);
    if (lang === "py") return tok(RE_PY, line, ["c", "s", "f", "k", "v", "n", "f"]);
    // css
    var m;
    if (/^\s*\/\*/.test(line) || !line.trim() || /^\s*\}/.test(line)) return /^\s*\/\*/.test(line) ? '<span class="c">' + esc(line) + "</span>" : esc(line);
    if (!/^\s/.test(line)) return '<span class="d">' + esc(line.replace(/\s*\{\s*$/, "")) + "</span>" + (/\{\s*$/.test(line) ? " {" : "");
    m = /^(\s*)([\w-]+)(\s*:\s*)?(.*)$/.exec(line);
    return esc(m[1]) + '<span class="' + (m[2].indexOf("--") === 0 ? "g" : "v") + '">' + esc(m[2]) + "</span>" + esc(m[3] || "") + '<span class="val">' + tok(RE_CSSV, m[4], ["g", "f", "n", "s"]) + "</span>";
  }

  /* ----- file contents (the first `start` lines are what the photo already shows; the rest get typed) ----- */
  var FILES = {
    html: { name: "index.html", lang: "html", ic: "html", name2: "HTML", sp: 2, start: 20, lines: [
      "<!DOCTYPE html>", '<html lang="en">', "<head>", '  <meta charset="UTF-8">', '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      "  <title>VYNEX | Modern Solutions</title>", '  <link rel="stylesheet" href="css/style.css">', "</head>", "<body>", "  <!-- Navigation -->",
      '  <header class="navbar">', '    <div class="logo">VYNEX</div>', '    <nav class="nav-links">', '      <a href="#">Home</a>', '      <a href="#">Services</a>',
      '      <a href="#">Portfolio</a>', '      <a href="#">About</a>', '      <a href="#">Contact</a>', "    </nav>", "  </header>",
      "", "  <!-- Hero -->", '  <section class="hero">', "    <h1>We build websites that <span>work for you</span></h1>",
      "    <p>Websites, mobile apps and M-Pesa payments for Kenyan businesses.</p>", '    <a href="get-quote.html" class="btn">Get a quote</a>', "  </section>", "",
      "  <!-- Services -->", '  <section class="services" id="services">', '    <article class="card">', "      <h3>Website Design</h3>", "      <p>Fast, mobile-first websites.</p>",
      "    </article>", '    <article class="card">', "      <h3>Mobile Apps</h3>", "      <p>Android and iOS apps that work offline.</p>", "    </article>", "  </section>", "",
      '  <script src="js/main.js"></script>', "</body>", "</html>" ] },
    css: { name: "style.css", lang: "css", ic: "css", name2: "CSS", sp: 2, start: 22, lines: [
      ":root {", "  --primary: #00ff4d;", "  --primary-dark: #00cc3d;", "  --bg-dark: #0a0f0c;", "  --bg-card: #111a14;", "  --text-primary: #e6ffe9;", "  --text-secondary: #9ca3af;", "}", "",
      "* {", "  margin: 0;", "  padding: 0;", "  box-sizing: border-box;", "}", "", "body {", "  font-family: 'Inter', sans-serif;", "  background: var(--bg-dark);", "  color: var(--text-primary);",
      "  line-height: 1.6;", "}", "", ".navbar {", "  display: flex;", "  justify-content: space-between;", "  align-items: center;", "  padding: 18px 6%;", "  position: sticky;", "  top: 0;",
      "  background: rgba(10, 15, 12, 0.85);", "  backdrop-filter: blur(10px);", "  z-index: 100;", "}", "", ".btn {", "  display: inline-block;", "  padding: 12px 28px;",
      "  background: var(--primary);", "  color: #000;", "  border-radius: 10px;", "  font-weight: 600;", "  transition: transform 0.2s ease;", "}", "", ".btn:hover {", "  transform: translateY(-2px);", "}" ] },
    js: { name: "main.js", lang: "js", ic: "js", name2: "JavaScript", sp: 2, start: 22, lines: [
      "// Mobile menu toggle", "const menuBtn = document.querySelector('.menu-btn');", "const navLinks = document.querySelector('.nav-links');", "",
      "menuBtn.addEventListener('click', () => {", "  navLinks.classList.toggle('active');", "});", "", "// Smooth scroll", "document.querySelectorAll('a[href^=\"#\"]').forEach(link => {",
      "  link.addEventListener('click', (e) => {", "    e.preventDefault();", "    const targetId = link.getAttribute('href');", "    const targetSection = document.querySelector(targetId);",
      "    targetSection.scrollIntoView({", "      behavior: 'smooth'", "    });", "  });", "});", "", "// Navbar scroll effect", "window.addEventListener('scroll', () => {",
      "  const navbar = document.querySelector('.navbar');", "  navbar.classList.toggle('scrolled', window.scrollY > 40);", "});", "", "// Quote form", "const form = document.querySelector('#quote-form');",
      "form.addEventListener('submit', async (e) => {", "  e.preventDefault();", "  const data = Object.fromEntries(new FormData(form));", "  const res = await fetch('/api/quote', {",
      "    method: 'POST',", "    headers: { 'Content-Type': 'application/json' },", "    body: JSON.stringify(data)", "  });", "  if (res.ok) form.reset();", "});", "",
      "// Reveal on scroll", "const io = new IntersectionObserver((entries) => {", "  entries.forEach(en => en.isIntersecting && en.target.classList.add('in'));", "});",
      "document.querySelectorAll('.card').forEach(el => io.observe(el));" ] },
    py: { name: "app.py", lang: "py", ic: "py", name2: "Python", sp: 4, start: 21, lines: [
      "from flask import Flask, render_template, request, jsonify", "from flask_mysqldb import MySQL", "import os", "", "app = Flask(__name__)", "", "# Database configuration",
      "app.config['MYSQL_HOST'] = 'localhost'", "app.config['MYSQL_USER'] = 'root'", "app.config['MYSQL_PASSWORD'] = ''", "app.config['MYSQL_DB'] = 'vynex_db'", "mysql = MySQL(app)", "",
      "@app.route('/')", "def home():", "    return render_template('index.html')", "", "@app.route('/api/services')", "def get_services():", "    cur = mysql.connection.cursor()",
      '    cur.execute("SELECT * FROM services")', "    rows = cur.fetchall()", "    cur.close()", "    return jsonify(rows)", "", "@app.route('/api/quote', methods=['POST'])", "def new_quote():",
      "    data = request.get_json()", "    cur = mysql.connection.cursor()", "    cur.execute(", '        "INSERT INTO quotes (name, phone, service) VALUES (%s, %s, %s)",',
      "        (data['name'], data['phone'], data['service'])", "    )", "    mysql.connection.commit()", "    return jsonify({'ok': True}), 201", "", "if __name__ == '__main__':",
      "    app.run(port=3000, debug=True)" ] }
  };

  /* ----- one VS Code window ----- */
  function vsHTML(c, tree, project, u) {
    var t = tree.map(function (r) {
      return '<div class="' + (r.on ? "on" : "") + '" style="padding-left:' + (0.9 + (r.d || 0) * 1.1) + 'em"><i class="ic ' + r.k + '"></i>' + esc(r.n) + "</div>";
    }).join("");
    return '<div class="dk" style="--u:' + u + "px;font-size:" + u + 'px">' +
      '<div class="dk-title"><span class="dk-logo"></span><span class="dk-ttl">' + esc(c.name) + " — VYNEX — Visual Studio Code</span><span class=\"dk-wc\"><i></i><i></i><i></i></span></div>" +
      '<div class="dk-act"><i></i><i class="on"></i><i></i><i></i><i></i><u></u></div>' +
      '<div class="dk-side"><div class="dk-sh">EXPLORER</div><div class="dk-tree"><div class="dk-proj">▾ ' + project + "</div>" + t + '</div><div class="dk-fold"><span>▸ OUTLINE</span><span>▸ TIMELINE</span></div></div>' +
      '<div class="dk-main"><div class="dk-tabs"><span><i class="ic ' + c.ic + '"></i><em>' + esc(c.name) + '</em><b class="dk-x"></b></span></div>' +
      '<div class="dk-edit"><div class="dk-gut"></div><div class="dk-view"><div class="dk-track"></div></div><div class="dk-sb"><i></i></div></div></div>' +
      '<div class="dk-stat"><span><i class="dk-br"></i> main &nbsp; ⊗ 0 &nbsp; ⚠ 0</span><span><em class="pos">Ln 1, Col 1</em><em>Spaces: ' + c.sp + "</em><em>UTF-8</em><em>" + c.name2 + '</em><em class="sv"></em></span></div>' +
      '<div class="dk-glass" style="--d:' + (-rint(0, 14)) + 's"></div></div>';
  }

  function Editor(st, root, c, rows, u) {
    var self = this, lh = u * 1.45, lines = c.lines, track = root.querySelector(".dk-track"), sbi = root.querySelector(".dk-sb i"),
        pos = root.querySelector(".pos"), sv = root.querySelector(".sv"), top = 0, count = lines.length, cur, caret = '<span class="lv-caret dk-caret"></span>';
    this.c = c; this.busy = false;
    function line(i, txt) { return "<div><b>" + (i + 1) + "</b><span>" + txt + "</span></div>"; }
    track.innerHTML = '<div class="dk-cur"></div>' + lines.map(function (t, i) { return line(i, hl(c.lang, t)); }).join("");
    cur = track.firstChild;
    function scrollTo(l, dur) {
      top = Math.max(0, Math.min(l, count - 3));
      track.style.transitionDuration = dur + "s"; track.style.transform = "translateY(" + (-top * lh) + "px)";
      if (sbi) { sbi.style.transitionDuration = dur + "s"; sbi.style.top = (top / Math.max(count, rows) * 100) + "%"; sbi.style.height = Math.min(100, rows / Math.max(count, rows) * 100) + "%"; }
    }
    function mark(i, col) { cur.style.transform = "translateY(" + (i * lh) + "px)"; pos.textContent = "Ln " + (i + 1) + ", Col " + (col + 1); }
    scrollTo(0, 0); mark(c.start - 1, 0);
    // "reading": scrolls to somewhere new every few seconds while another window is being typed in
    this.idle = function () {
      later(st, function () {
        if (!self.busy) { var t = rint(0, Math.max(0, count - rows + 2)); scrollTo(t, 1.8); mark(t + rint(2, rows - 3), rint(0, 20)); }
        self.idle();
      }, rnd(3800, 7500));
    };
    // "typing": removes everything below the part the photo shows, then types it back in
    this.type = function (done) {
      self.busy = true; scrollTo(0, 1.1);
      later(st, function () {
        var kids = track.children, i;
        for (i = kids.length - 1; i > c.start; i--) track.removeChild(kids[i]);
        count = c.start; root.classList.add("act");
        typeLine(c.start);
      }, 1300);
      function typeLine(i) {
        if (i >= lines.length) return finish();
        var text = lines[i], k = /^\s*/.exec(text)[0].length, el, box;
        track.insertAdjacentHTML("beforeend", line(i, caret)); el = track.lastChild; box = el.lastChild; count = i + 1;
        if (i >= top + rows - 4) scrollTo(i - rows + 6, 0.35);
        mark(i, k); root.classList.add("dirty");
        (function step() {
          if (k >= text.length) { box.innerHTML = hl(c.lang, text) + caret; return later(st, function () { box.innerHTML = hl(c.lang, text); typeLine(i + 1); }, text.trim() ? rint(260, 700) : rint(90, 220)); }
          if (Math.random() < 0.014 && k > 3 && k < text.length - 2 && /\w/.test(text.charAt(k))) {      // a typo, noticed and fixed
            box.innerHTML = hl(c.lang, text.slice(0, k) + "qwxzj".charAt(rint(0, 4))) + caret; mark(i, k + 1);
            return later(st, function () { box.innerHTML = hl(c.lang, text.slice(0, k)) + caret; mark(i, k); later(st, step, rint(120, 260)); }, rint(220, 420));
          }
          k += Math.random() < 0.2 ? 2 : 1; if (k > text.length) k = text.length;
          box.innerHTML = hl(c.lang, text.slice(0, k)) + caret; mark(i, k);
          later(st, step, /[\s(){}\[\],.;=]/.test(text.charAt(k - 1)) ? rint(60, 150) : rint(24, 70));
        })();
      }
      function finish() {
        later(st, function () {
          root.classList.remove("dirty"); sv.textContent = "✓ Saved"; self.busy = false; root.classList.remove("act");
          done(c.name);
          later(st, function () { sv.textContent = ""; scrollTo(0, 1.6); mark(c.start - 1, 0); }, 2600);
        }, 1800);
      }
    };
  }

  /* ----- the terminal ----- */
  function Term(st, root, maxRows) {
    var body = root.querySelector(".dk-tbody"), pend = 0, cursor = document.createElement("div");
    cursor.innerHTML = '<span class="lv-caret dk-tc"></span>';
    function push(html) {
      var d = document.createElement("div"); d.innerHTML = html || "&nbsp;";
      if (cursor.parentNode === body) body.removeChild(cursor);
      body.appendChild(d); body.appendChild(cursor);
      while (body.children.length > maxRows) body.removeChild(body.firstChild);
    }
    var Y = function (t) { return '<span class="ty">' + t + "</span>"; }, G = function (t) { return '<span class="tg">' + t + "</span>"; };
    ["PS C:\\VYNEX&gt; npm run dev", "", "&gt; vynex@1.0.0 dev", "&gt; nodemon server.js", "",
     Y("[nodemon] 3.1.0"), Y("[nodemon] to restart at any time, enter `rs`"), Y("[nodemon] watching path(s): *.*"), Y("[nodemon] watching extensions: js,json"),
     G("[nodemon] starting `node server.js`"), "Server running on port 3000", "Database connected successfully!",
     "GET / " + G("200") + " 45.231 ms", "GET /assets/css/style.css " + G("200") + " 12.456 ms", "GET /assets/js/main.js " + G("200") + " 8.112 ms",
     "GET /images/logo.png " + G("200") + " 3.221 ms", "GET /api/services " + G("200") + " 25.663 ms"].forEach(push);
    var REQ = [["GET /", 200], ["GET /services.html", 200], ["GET /assets/css/style.css", 200], ["GET /assets/js/main.js", 304], ["GET /images/logo.png", 200],
               ["GET /api/services", 200], ["GET /api/projects", 200], ["GET /portfolio.html", 200], ["POST /api/quote", 201], ["GET /assets/css/style.css", 304], ["GET /favicon.ico", 404]];
    function request() {
      var r = REQ[rint(0, REQ.length - 1)]; if (r[1] === 404 && Math.random() < 0.6) r = REQ[0];
      var cls = r[1] === 404 ? "tr" : r[1] === 304 ? "tc" : "tg", ms = r[0].indexOf("/api/") > -1 ? rnd(9, 70) : rnd(1.5, 28);
      push(r[0] + ' <span class="' + cls + '">' + r[1] + "</span> " + ms.toFixed(3) + " ms");
    }
    this.save = function () {      // called by an editor when it saves a file → nodemon restarts the server
      var t = 0;
      [[0, function () { push(Y("[nodemon] restarting due to changes...")); }], [650, function () { push(G("[nodemon] starting `node server.js`")); }],
       [1500, function () { push("Server running on port 3000"); }], [1950, function () { push("Database connected successfully!"); }],
       [2800, request], [3300, request]].forEach(function (s) { later(st, s[1], s[0]); });
    };
    if (document.documentElement.classList.contains("lv-still")) return;   // reduced motion: keep it frozen
    (function loop() { later(st, function () { request(); if (Math.random() < 0.3) later(st, request, rint(150, 500)); loop(); }, rnd(1300, 3600)); })();
  }

  var DESK = {
    w: 1600, h: 900,
    build: function (st) {
      var still = document.documentElement.classList.contains("lv-still"), eds = [], term, specs = [
        { f: FILES.html, q: [[36, 8], [583, 41], [579, 404], [36, 397]], u: 22, soft: 0.8, project: "VYNEX", tree: [
          { n: "assets", k: "dir" }, { n: "css", k: "dir" }, { n: "js", k: "dir" }, { n: "index.html", k: "html", on: 1 }, { n: "about.html", k: "html" },
          { n: "services.html", k: "html" }, { n: "portfolio.html", k: "html" }, { n: "contact.html", k: "html" }] },
        { f: FILES.css, q: [[590, 42], [1054, 64], [1052, 404], [592, 402]], u: 22, soft: 0.5, project: "VYNEX", tree: [
          { n: "▾ css", k: "dir" }, { n: "style.css", k: "css", on: 1, d: 1 }, { n: "responsive.css", k: "css", d: 1 }, { n: "animations.css", k: "css", d: 1 },
          { n: "▸ js", k: "dir" }, { n: "▸ images", k: "dir" }, { n: "▸ fonts", k: "dir" }] },
        { f: FILES.js, q: [[1063, 64], [1562, 70], [1558, 428], [1066, 424]], u: 20, soft: 0.9, project: "VYNEX", tree: [
          { n: "▸ assets", k: "dir" }, { n: "▸ css", k: "dir" }, { n: "▾ js", k: "dir" }, { n: "main.js", k: "js", on: 1, d: 1 }, { n: "animations.js", k: "js", d: 1 },
          { n: "form.js", k: "js", d: 1 }, { n: "▸ images", k: "dir" }] },
        { f: FILES.py, q: [[258, 436], [876, 441], [874, 790], [252, 815]], u: 21, soft: 0.6, project: "VYNEX-BACKEND", tree: [
          { n: "venv", k: "dir" }, { n: "routes", k: "dir" }, { n: "models", k: "dir" }, { n: "utils", k: "dir" }, { n: "app.py", k: "py", on: 1 },
          { n: "config.py", k: "py" }, { n: "requirements.txt", k: "txt" }] }
      ];
      function dims(q) {
        function d(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
        return [Math.round((d(q[0], q[1]) + d(q[3], q[2])) / 2 * DS), Math.round((d(q[0], q[3]) + d(q[1], q[2])) / 2 * DS)];
      }
      specs.forEach(function (sp) {
        var wh = dims(sp.q), rows = Math.floor((wh[1] - sp.u * 5.9) / (sp.u * 1.45));
        var el = add(st, sp.q, vsHTML(sp.f, sp.tree, sp.project, sp.u), wh[0], wh[1]);
        el.style.background = "#0a1117"; el.style.filter = "blur(" + sp.soft + "px)";
        eds.push(new Editor(st, el.firstChild, sp.f, rows, sp.u));
      });
      var tq = [[898, 451], [1386, 448], [1386, 765], [898, 775]], tw = dims(tq), tu = 20;
      var tel = add(st, tq, '<div class="dk dk-term" style="--u:' + tu + "px;font-size:" + tu + 'px">' +
        '<div class="dk-ttabs"><span class="on"><i class="tgl"></i>Terminal<b>×</b></span><em>⌄ bash</em><u>—&nbsp;&nbsp;▢&nbsp;&nbsp;✕</u></div>' +
        '<div class="dk-tbody"></div><div class="dk-tbar"><span class="tg">●</span></div><div class="dk-glass" style="--d:-7s"></div></div>', tw[0], tw[1]);
      tel.style.background = "#060b0f"; tel.style.filter = "blur(.5px)";
      term = new Term(st, tel.firstChild, Math.floor((tw[1] - tu * 4.9) / (tu * 1.5)));
      // soft light on the keyboard and the LED strip, breathing slowly
      [[600, 806, 560, 84, "rgba(0,255,110,.24)"], [1380, 18, 240, 70, "rgba(70,255,150,.26)"]].forEach(function (g, n) {
        var d = document.createElement("div"); d.className = "lv-glow";
        d.style.cssText = "left:" + g[0] + "px;top:" + g[1] + "px;width:" + g[2] + "px;height:" + g[3] + "px;background:radial-gradient(ellipse at center," + g[4] + ",rgba(0,0,0,0) 70%);" + (n ? "transform:rotate(-12deg);" : "");
        st.appendChild(d);
      });
      if (still) return;                                   // reduced motion: sharp, switched-on, but frozen
      // staggered: each window starts "reading" at a different moment, and they take turns being typed in
      eds.forEach(function (e, i) { later(st, function () { e.idle(); }, 1800 + i * 1100); });
      var order = [0, 3, 1, 2];
      later(st, function () { session(0); }, 1600);
      function session(n) {
        var e = eds[order[n % order.length]];
        e.type(function () { term.save(); later(st, function () { session(n + 1); }, rnd(4200, 7500)); });
      }
    }
  };

  /* ---------- plumbing ---------- */
  function add(st, q, html, dw, dh, holes, radius) {
    var xs = q.map(function (p) { return p[0]; }), ys = q.map(function (p) { return p[1]; });
    var w = dw || Math.round((Math.max.apply(0, xs) - Math.min.apply(0, xs)) * S), h = dh || Math.round((Math.max.apply(0, ys) - Math.min.apply(0, ys)) * S);
    var clip = document.createElement("div"); clip.className = "lv-clip"; clip.style.width = st.w + "px"; clip.style.height = st.h + "px";
    var cp = poly(holes); if (cp) clip.style.clipPath = cp;
    var el = document.createElement("div"); el.className = "lv-screen"; el.style.cssText = "width:" + w + "px;height:" + h + "px;transform:" + quad(w, h, q) + (radius ? ";border-radius:" + radius : "");
    el.innerHTML = html; clip.appendChild(el); st.appendChild(clip);
    return el;
  }
  var SCENES = { "hero-code.jpg": HERO, "services-desk.jpg": DESK };

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
    st.paused = function () { return frame.classList.contains("lv-off") || document.hidden; };
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
