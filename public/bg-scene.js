/* VYNEX/public/bg-scene.js — animated 3D background (no libraries, no network).
   One fixed <canvas> behind the page. Each page picks a scene with data-scene on its <script> tag:
     glass   – floating, slowly rotating transparent 3D shapes (cubes, gems, pyramids, rings)
     network – a rotating 3D particle network with glowing, connected nodes
     grid    – a moving perspective digital grid with rising light points
     waves   – layered, flowing 3D waves
     trails  – glowing light trails sweeping across the screen
   Palette = the logo: deep blue + yellow + orange (with a little cyan/violet for depth).
   - Mouse + scroll create parallax.   - Pauses when the tab is hidden.
   - prefers-reduced-motion: draws one still frame.
   - Admin pages load it with data-mode="admin" (calmer, fewer shapes). */
(function () {
  "use strict";
  var script = document.currentScript;
  var admin = script && script.dataset.mode === "admin";
  // scene = which animation this page uses: glass | network | grid | waves | trails
  var scene = (script && script.dataset.scene) || "glass";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.id = "vynex-bg";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  // ---------- palette (r,g,b) ----------
  var BLUE = [59, 130, 246], DEEP = [30, 64, 175], YELLOW = [255, 205, 0], ORANGE = [255, 138, 0],
      CYAN = [34, 211, 238], VIOLET = [139, 92, 246];
  var PALETTE = [BLUE, YELLOW, ORANGE, DEEP, CYAN, YELLOW, BLUE, VIOLET, ORANGE];
  var rgba = function (c, a) { return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")"; };
  var mix = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };

  // ---------- geometry (centred on origin, radius ≈ 1) ----------
  function shape(verts, faces) {
    var cx = 0, cy = 0, cz = 0;
    verts.forEach(function (v) { cx += v[0]; cy += v[1]; cz += v[2]; });
    cx /= verts.length; cy /= verts.length; cz /= verts.length;
    return { v: verts.map(function (v) { return [v[0] - cx, v[1] - cy, v[2] - cz]; }), f: faces };
  }
  var SHAPES = {
    cube: shape(
      [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(function (v) { return v.map(function (n) { return n * 0.62; }); }),
      [[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[1,2,6,5],[0,3,7,4]]),
    octa: shape(
      [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
      [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]]),
    pyramid: shape(
      [[-0.8,0.7,-0.8],[0.8,0.7,-0.8],[0.8,0.7,0.8],[-0.8,0.7,0.8],[0,-0.9,0]],
      [[0,1,2,3],[0,1,4],[1,2,4],[2,3,4],[3,0,4]]),
    prism: shape(
      [[0,-0.9,-0.6],[0.8,0.6,-0.6],[-0.8,0.6,-0.6],[0,-0.9,0.6],[0.8,0.6,0.6],[-0.8,0.6,0.6]],
      [[0,1,2],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]]),
    gem: shape(
      [[0,-1,0],[0.8,-0.2,0],[0.25,-0.2,0.76],[-0.65,-0.2,0.47],[-0.65,-0.2,-0.47],[0.25,-0.2,-0.76],[0,0.9,0]],
      [[0,1,2],[0,2,3],[0,3,4],[0,4,5],[0,5,1],[6,2,1],[6,3,2],[6,4,3],[6,5,4],[6,1,5]])
  };
  var KINDS = ["cube", "octa", "pyramid", "prism", "gem", "cube", "octa", "ring", "ring"];

  // ---------- state ----------
  var W = 0, H = 0, dpr = 1, objs = [], dots = [], blobs = [], nodes = [], trails = [], rise = [];
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 }, scrollY = window.pageYOffset || 0, running = false, last = 0;
  var FOCAL = 700, DEPTH = 900;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  function newTrail(first) {
    var c = [BLUE, CYAN, YELLOW, ORANGE, BLUE, VIOLET][(Math.random() * 6) | 0];
    return { y0: rnd(0.1, 0.9), amp: rnd(0.04, 0.16), freq: rnd(0.6, 1.6), ph: rnd(0, 6.28), slope: rnd(-0.5, 0.5),
      t: first ? rnd(-0.2, 1.1) : rnd(-0.5, -0.05), speed: rnd(0.07, 0.19), len: rnd(0.22, 0.5), w: rnd(1.4, 3.4), c: c, par: rnd(0.3, 1) };
  }

  function build() {
    var small = W < 700;
    objs = []; dots = []; blobs = []; nodes = []; trails = []; rise = [];
    var nObj = scene === "glass" ? (admin ? (small ? 4 : 7) : (small ? 8 : 15)) : 0;
    var nDot = scene === "glass" ? (admin ? (small ? 14 : 28) : (small ? 26 : 58)) : (small ? 14 : 30);
    for (var i = 0; i < nObj; i++) {
      var kind = KINDS[i % KINDS.length];
      objs.push({
        kind: kind,
        x: rnd(-0.1, 1.1) * W, y: rnd(-0.1, 1.1) * H, z: rnd(0, DEPTH),
        size: rnd(small ? 26 : 34, small ? 60 : 96),
        rx: rnd(0, 6.28), ry: rnd(0, 6.28), rz: rnd(0, 6.28),
        vrx: rnd(-0.5, 0.5), vry: rnd(-0.6, 0.6), vrz: rnd(-0.3, 0.3),
        vx: rnd(-9, 9), vy: rnd(-12, -3), bob: rnd(0, 6.28),
        color: PALETTE[i % PALETTE.length], par: rnd(0.4, 1.2)
      });
    }
    for (var j = 0; j < nDot; j++) {
      dots.push({ x: Math.random() * W, y: Math.random() * H, vx: rnd(-8, 8), vy: rnd(-8, 8),
        r: rnd(0.8, 2.1), c: Math.random() < 0.45 ? YELLOW : (Math.random() < 0.5 ? BLUE : CYAN), tw: rnd(0, 6.28) });
    }
    if (scene === "network") {
      var nn = admin ? 40 : (small ? 46 : 92);
      for (var k = 0; k < nn; k++) {
        var cc = k % 6 === 0 ? YELLOW : (k % 5 === 0 ? ORANGE : (k % 3 === 0 ? CYAN : BLUE));
        nodes.push({ x: rnd(-1, 1), y: rnd(-0.8, 0.8), z: rnd(-1, 1), ph: rnd(0, 6.28), c: cc, hub: k % 17 === 0 });
      }
    }
    if (scene === "trails") { var nt = admin ? 7 : (small ? 9 : 16); for (var t = 0; t < nt; t++) trails.push(newTrail(true)); }
    if (scene === "grid") {
      for (var r = 0; r < (small ? 30 : 60); r++) rise.push({ x: Math.random() * W, y: rnd(0.5, 1) * H, v: rnd(14, 46), r: rnd(0.8, 2.2), c: Math.random() < 0.5 ? YELLOW : CYAN, ph: rnd(0, 6.28) });
    }
    var warm = scene === "waves" || scene === "trails";
    blobs = [
      { x: 0.12, y: 0.18, r: 0.46, c: BLUE,   a: 0.24, sp: 0.00011, ph: 0 },
      { x: 0.88, y: 0.30, r: 0.38, c: YELLOW, a: warm ? 0.12 : 0.15, sp: 0.00014, ph: 2 },
      { x: 0.70, y: 0.88, r: 0.46, c: ORANGE, a: 0.12, sp: 0.00009, ph: 4 },
      { x: 0.25, y: 0.82, r: 0.36, c: VIOLET, a: 0.13, sp: 0.00012, ph: 1 }
    ];
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (reduced) frame(0, true);
  }

  // ---------- 3D helpers ----------
  function rot(v, rx, ry, rz) {
    var x = v[0], y = v[1], z = v[2], c, s, t;
    c = Math.cos(rx); s = Math.sin(rx); t = y * c - z * s; z = y * s + z * c; y = t;
    c = Math.cos(ry); s = Math.sin(ry); t = x * c + z * s; z = -x * s + z * c; x = t;
    c = Math.cos(rz); s = Math.sin(rz); t = x * c - y * s; y = x * s + y * c; x = t;
    return [x, y, z];
  }

  var LIGHT = (function () { var l = [-0.45, -0.65, -0.62], m = Math.hypot(l[0], l[1], l[2]); return [l[0] / m, l[1] / m, l[2] / m]; })();

  function drawPoly(o, cx, cy, sc, depthA, scrollShift) {
    var g = SHAPES[o.kind], pv = [], rv = [], i, k;
    for (i = 0; i < g.v.length; i++) {
      var r = rot(g.v[i], o.rx, o.ry, o.rz);
      rv.push(r);
      pv.push([cx + r[0] * o.size * sc, cy + r[1] * o.size * sc]);
    }
    var faces = [];
    for (i = 0; i < g.f.length; i++) {
      var f = g.f[i], a = rv[f[0]], b = rv[f[1]], c = rv[f[2]];
      var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      var n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      var mx = 0, my = 0, mz = 0;
      for (k = 0; k < f.length; k++) { mx += rv[f[k]][0]; my += rv[f[k]][1]; mz += rv[f[k]][2]; }
      mx /= f.length; my /= f.length; mz /= f.length;
      if (n[0] * mx + n[1] * my + n[2] * mz < 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; } // point outward
      var len = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / len, n[1] / len, n[2] / len];
      if (n[2] > 0.05) continue; // back-face (camera looks toward +z)
      faces.push({ f: f, n: n, z: mz });
    }
    faces.sort(function (p, q) { return q.z - p.z; });
    var base = o.color, edge = mix(base, [255, 255, 255], 0.55);
    for (i = 0; i < faces.length; i++) {
      var F = faces[i], lam = Math.max(0, F.n[0] * LIGHT[0] + F.n[1] * LIGHT[1] + F.n[2] * LIGHT[2]);
      var col = mix(mix(base, [4, 8, 30], 0.55), mix(base, [255, 255, 255], 0.35), 0.15 + lam * 0.85);
      ctx.beginPath();
      ctx.moveTo(pv[F.f[0]][0], pv[F.f[0]][1]);
      for (k = 1; k < F.f.length; k++) ctx.lineTo(pv[F.f[k]][0], pv[F.f[k]][1]);
      ctx.closePath();
      ctx.fillStyle = rgba(col, (0.5 + lam * 0.25) * depthA);
      ctx.fill();
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = rgba(edge, 0.5 * depthA);
      ctx.stroke();
    }
  }

  function drawRing(o, cx, cy, sc, depthA) {
    var N = 28, R = o.size * sc * 1.05, pts = [], i;
    for (i = 0; i < N; i++) {
      var a = (i / N) * 6.2832, p = rot([Math.cos(a), Math.sin(a), 0], o.rx, o.ry, o.rz);
      pts.push(p);
    }
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rgba(o.color, 0.35 * depthA);
    ctx.beginPath();
    for (i = 0; i <= N; i++) { var q = pts[i % N]; var px = cx + q[0] * R, py = cy + q[1] * R; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    for (i = 0; i < N; i += 2) {
      var d = pts[i], dz = 0.6 + (1 - d[2]) * 0.4;
      ctx.beginPath(); ctx.arc(cx + d[0] * R, cy + d[1] * R, 2.2 * dz * sc * 1.6, 0, 6.2832);
      ctx.fillStyle = rgba(mix(o.color, [255, 255, 255], 0.4), 0.85 * depthA * dz); ctx.fill();
    }
  }

  // ---------- scene: floating particles (+ optional connecting lines) ----------
  function drawDots(ts, dt, aMul, lines) {
    var i, j;
    for (i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.x < -10) d.x = W + 10; else if (d.x > W + 10) d.x = -10;
      if (d.y < -10) d.y = H + 10; else if (d.y > H + 10) d.y = -10;
    }
    if (lines) {
      var maxD = admin ? 110 : 140;
      ctx.lineWidth = 0.7;
      for (i = 0; i < dots.length; i++) {
        for (j = i + 1; j < dots.length; j++) {
          var dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y, dd = dx * dx + dy * dy;
          if (dd < maxD * maxD) {
            ctx.strokeStyle = rgba(mix(dots[i].c, dots[j].c, 0.5), (1 - Math.sqrt(dd) / maxD) * 0.22 * aMul);
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke();
          }
        }
      }
    }
    for (i = 0; i < dots.length; i++) {
      var p = dots[i], tw = 0.55 + 0.45 * Math.sin(ts * 0.0018 + p.tw);
      ctx.beginPath(); ctx.arc(p.x, (((p.y - scrollY * 0.03) % H) + H) % H, p.r, 0, 6.2832);
      ctx.fillStyle = rgba(p.c, 0.75 * tw * aMul); ctx.fill();
    }
  }

  // ---------- scene: glass (floating 3D objects) ----------
  function drawObjects(ts, dt, aMul) {
    objs.sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < objs.length; i++) {
      var o = objs[i];
      o.rx += o.vrx * dt; o.ry += o.vry * dt; o.rz += o.vrz * dt;
      o.x += o.vx * dt; o.y += o.vy * dt; o.bob += dt * 0.8;
      var sc = FOCAL / (FOCAL + o.z), margin = o.size * 2;
      if (o.x < -margin) o.x = W + margin; else if (o.x > W + margin) o.x = -margin;
      if (o.y < -margin) o.y = H + margin; else if (o.y > H + margin) o.y = -margin;
      var depthA = (0.35 + 0.65 * (1 - o.z / (DEPTH * 1.15))) * aMul * (admin ? 0.9 : 1);
      var cx = o.x - mouse.x * 40 * o.par * sc, cy = o.y + Math.sin(o.bob) * 8 - mouse.y * 40 * o.par * sc - scrollY * 0.12 * o.par * sc;
      var span = H + margin * 2; cy = ((cy + margin) % span + span) % span - margin;
      if (o.kind === "ring") drawRing(o, cx, cy, sc, depthA); else drawPoly(o, cx, cy, sc, depthA);
    }
  }

  // ---------- scene: network (rotating 3D particle network) ----------
  function drawNetwork(ts, dt, aMul) {
    var ang = ts * 0.00006 + mouse.x * 0.9, tilt = -0.12 + mouse.y * 0.4 + Math.sin(ts * 0.00007) * 0.15;
    var ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), st = Math.sin(tilt);
    var R = Math.max(W, H) * 0.5, P = [], i, j, n;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var x = n.x + Math.sin(ts * 0.0003 + n.ph) * 0.04, y = n.y + Math.cos(ts * 0.00025 + n.ph) * 0.04, z = n.z;
      var x1 = x * ca - z * sa, z1 = x * sa + z * ca, y1 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      var k = 3.2 / (3.2 + z2);
      P.push({ x: W / 2 + x1 * R * k * 0.85, y: H / 2 + y1 * R * k * 0.62, k: k, a: clamp((k - 0.6) / 1.1, 0.12, 1), n: n, x3: x1, y3: y1, z3: z2 });
    }
    ctx.lineWidth = 0.8;
    for (i = 0; i < P.length; i++) {
      for (j = i + 1; j < P.length; j++) {
        var dx = P[i].x3 - P[j].x3, dy = P[i].y3 - P[j].y3, dz = P[i].z3 - P[j].z3, dd = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dd < 0.6) {
          ctx.strokeStyle = rgba(mix(P[i].n.c, P[j].n.c, 0.5), (1 - dd / 0.6) * 0.38 * Math.min(P[i].a, P[j].a) * aMul);
          ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); ctx.stroke();
        }
      }
    }
    for (i = 0; i < P.length; i++) {
      var p = P[i], r = (p.n.hub ? 3.4 : 1.5) * p.k * 1.4;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.2, 0, 6.2832); ctx.fillStyle = rgba(p.n.c, 0.09 * p.a * aMul); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fillStyle = rgba(mix(p.n.c, [255, 255, 255], 0.35), 0.9 * p.a * aMul); ctx.fill();
      if (p.n.hub) {
        var pr = ((ts * 0.03 + p.n.ph * 20) % 46);
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 + pr, 0, 6.2832);
        ctx.strokeStyle = rgba(p.n.c, (1 - pr / 46) * 0.4 * p.a * aMul); ctx.lineWidth = 1.2; ctx.stroke(); ctx.lineWidth = 0.8;
      }
    }
  }

  // ---------- scene: grid (moving perspective digital grid) ----------
  function drawGrid(ts, dt, aMul) {
    var hy = H * 0.5 - mouse.y * 26, vx = W / 2 - mouse.x * 80, N = 18, flow = ts * 0.00045, k = Math.floor(flow), phase = flow - k, i;
    var glow = ctx.createLinearGradient(0, hy - H * 0.12, 0, hy + H * 0.12);
    glow.addColorStop(0, rgba(CYAN, 0)); glow.addColorStop(0.5, rgba(CYAN, 0.22 * aMul)); glow.addColorStop(1, rgba(CYAN, 0));
    ctx.fillStyle = glow; ctx.fillRect(0, hy - H * 0.12, W, H * 0.24);
    ctx.strokeStyle = rgba(YELLOW, 0.45 * aMul); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(vx - W * 0.45, hy); ctx.lineTo(vx + W * 0.45, hy); ctx.stroke();
    [1, -1].forEach(function (dir) {                       // floor (down) and ceiling (up)
      var span = dir > 0 ? H - hy : hy, fade = dir > 0 ? 1 : 0.5;
      for (i = 0; i < N; i++) {                           // horizontal lines moving toward the viewer
        var t = (i + phase) / N, y = hy + dir * span * Math.pow(t, 2.3);
        var gold = (((i - k) % 5) + 5) % 5 === 0, col = gold ? YELLOW : BLUE;
        ctx.strokeStyle = rgba(col, (gold ? 0.36 : 0.28) * t * fade * aMul); ctx.lineWidth = 0.8 + t * 0.9;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (var kx = -16; kx <= 16; kx++) {                // lines converging to the vanishing point
        var xb = vx + kx * W * 0.12, yb = hy + dir * span;
        var g = ctx.createLinearGradient(vx, hy, xb, yb);
        g.addColorStop(0, rgba(CYAN, 0)); g.addColorStop(1, rgba(kx % 4 === 0 ? YELLOW : BLUE, 0.28 * fade * aMul));
        ctx.strokeStyle = g; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(vx, hy); ctx.lineTo(xb, yb); ctx.stroke();
      }
    });
    for (i = 0; i < rise.length; i++) {                   // glowing points rising from the floor
      var r = rise[i]; r.y -= r.v * dt;
      if (r.y < hy - H * 0.15) { r.y = H + 10; r.x = Math.random() * W; }
      var a = clamp((r.y - (hy - H * 0.15)) / (H * 0.4), 0, 1) * (0.55 + 0.45 * Math.sin(ts * 0.003 + r.ph)) * aMul;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * 3, 0, 6.2832); ctx.fillStyle = rgba(r.c, 0.12 * a); ctx.fill();
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.2832); ctx.fillStyle = rgba(r.c, 0.9 * a); ctx.fill();
    }
  }

  // ---------- scene: waves (layered flowing 3D waves) ----------
  function drawWaves(ts, dt, aMul) {
    var rows = admin ? 9 : 15, step = W < 700 ? 22 : 12, t = ts * 0.0006, base = H * 0.4 + mouse.y * 14, r, x;
    var grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, rgba(BLUE, 1)); grad.addColorStop(0.5, rgba(VIOLET, 1)); grad.addColorStop(1, rgba(YELLOW, 1));
    for (r = 0; r < rows; r++) {
      var f = r / (rows - 1), y0 = base + H * 0.6 * Math.pow(f, 1.55), amp = 10 + 64 * f;
      ctx.beginPath();
      for (x = -step; x <= W + step; x += step) {
        var y = y0 + amp * (Math.sin(x * 0.0042 + t + r * 0.42 + mouse.x * 1.2) + 0.55 * Math.sin(x * 0.011 - t * 1.4 + r * 0.8) + 0.3 * Math.sin(x * 0.0018 + t * 0.5 - r * 0.5)) * 0.62;
        if (x === -step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineTo(W + step, H + 4); ctx.lineTo(-step, H + 4); ctx.closePath();
      ctx.fillStyle = "rgba(5,7,15," + (0.55 + 0.35 * f).toFixed(2) + ")"; ctx.fill();   // hides the rows behind it
      ctx.globalAlpha = (0.18 + 0.6 * f) * aMul; ctx.lineWidth = 0.9 + f * 1.3; ctx.strokeStyle = grad; ctx.stroke(); ctx.globalAlpha = 1;
    }
    drawDots(ts, dt, aMul * 0.7, false);
  }

  // ---------- scene: trails (glowing light trails) ----------
  function drawTrails(ts, dt, aMul) {
    ctx.globalCompositeOperation = "lighter";
    var M = 34;
    for (var i = 0; i < trails.length; i++) {
      var tr = trails[i];
      tr.t += tr.speed * dt;
      if (tr.t - tr.len > 1.05) { trails[i] = tr = newTrail(false); }
      var pos = function (tt) {
        return [(-0.2 + tt * 1.4) * W - mouse.x * 30 * tr.par,
                (tr.y0 + Math.sin(tt * tr.freq * 6.283 + tr.ph) * tr.amp + (tt - 0.5) * tr.slope) * H - mouse.y * 30 * tr.par - scrollY * 0.04 * tr.par];
      };
      var prev = pos(tr.t);
      for (var s = 1; s <= M; s++) {
        var cur = pos(tr.t - tr.len * s / M), f = 1 - s / M;
        ctx.strokeStyle = rgba(tr.c, Math.pow(f, 1.3) * 0.95 * aMul);
        ctx.lineWidth = tr.w * 1.25 * (0.3 + 0.7 * f); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
        prev = cur;
      }
      var h = pos(tr.t);
      ctx.beginPath(); ctx.arc(h[0], h[1], tr.w * 3.2, 0, 6.2832); ctx.fillStyle = rgba(tr.c, 0.16 * aMul); ctx.fill();
      ctx.beginPath(); ctx.arc(h[0], h[1], tr.w * 1.1, 0, 6.2832); ctx.fillStyle = rgba(mix(tr.c, [255, 255, 255], 0.6), 0.9 * aMul); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    drawDots(ts, dt, aMul * 0.6, false);
  }

  // ---------- frame ----------
  function frame(ts, still) {
    var dt = still ? 0 : Math.min((ts - last) / 1000 || 0.016, 0.05) * 0.55; last = ts;   // 0.55 = calmer, slower drift
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    var aMul = admin ? 0.5 : 1;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < blobs.length; i++) {                // soft colour blobs (all scenes)
      var b = blobs[i], t = ts * b.sp + b.ph;
      var bx = (b.x + Math.sin(t) * 0.06) * W - mouse.x * 18, by = (b.y + Math.cos(t * 1.3) * 0.06) * H - mouse.y * 18 - scrollY * 0.05;
      var br = b.r * Math.max(W, H), gr = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      gr.addColorStop(0, rgba(b.c, b.a * aMul)); gr.addColorStop(1, rgba(b.c, 0));
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    }
    if (scene === "network") drawNetwork(ts, dt, aMul);
    else if (scene === "grid") { drawGrid(ts, dt, aMul); }
    else if (scene === "waves") drawWaves(ts, dt, aMul);
    else if (scene === "trails") drawTrails(ts, dt, aMul);
    else { drawDots(ts, dt, aMul, true); drawObjects(ts, dt, aMul); }
  }

  function loop(ts) { if (!running) return; frame(ts); requestAnimationFrame(loop); }
  function start() { if (running || reduced) return; running = true; last = performance.now(); requestAnimationFrame(loop); }
  function stop() { running = false; }

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", function () { scrollY = window.pageYOffset || 0; }, { passive: true });
  window.addEventListener("mousemove", function (e) { mouse.tx = e.clientX / W - 0.5; mouse.ty = e.clientY / H - 0.5; }, { passive: true });
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

  resize();
  if (reduced) frame(0, true); else start();
})();
