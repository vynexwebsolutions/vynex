/* VYNEX/public/animations.js — GSAP animations (hero, reveals, stagger, parallax, counters, hover).
   Everything here is deliberately SLOW and soft: long durations, gentle easing, wide staggers.
   To change the overall speed, edit SLOW below (1 = as written, 1.5 = even slower, 0.7 = faster).
   Skipped entirely when GSAP fails to load or the visitor prefers reduced motion. */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!window.gsap || reduce) return;

  const phone = window.matchMedia("(max-width: 820px), (hover: none)").matches;
  const SLOW = phone ? 0.8 : 1;   // lower = faster; text must appear as soon as you scroll to it
  const d = (s) => s * SLOW;                       // scale a duration
  const gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  document.documentElement.classList.add("js-anim");

  function hero() {
    const lines = document.querySelectorAll(".hero h1 .line > span");
    if (!lines.length) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero .eyebrow", { y: 16, opacity: 0, duration: d(1.2) })
      .from(lines, { yPercent: 105, duration: d(1.7), stagger: d(.28), ease: "power3.out" }, "-=.7")
      .from(".hero-lead", { y: 22, opacity: 0, duration: d(1.4) }, "-=1.0")
      .from(".hero-actions .btn", { y: 18, opacity: 0, duration: d(1.1), stagger: d(.2) }, "-=.9")
      .from(".hero-meta span", { y: 12, opacity: 0, duration: d(1), stagger: d(.16) }, "-=.7")
      .from(".devices", { y: 40, opacity: 0, scale: .97, duration: d(2), ease: "power2.out" }, "-=2.4");

    // Soft pointer parallax on the glow orbs + code card
    const hv = document.querySelector(".hero");
    hv.addEventListener("pointermove", (e) => {
      const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
      gsap.to(".orb-1", { x: x * 36, y: y * 28, duration: 2.8, ease: "sine.out", overwrite: "auto" });
      gsap.to(".orb-2", { x: x * -44, y: y * -28, duration: 2.8, ease: "sine.out", overwrite: "auto" });
      gsap.to(".devices", { rotationY: x * 3, rotationX: y * -3, transformPerspective: 1100, duration: 2.2, ease: "sine.out", overwrite: "auto" });
    });
  }

  function scrollAnims() {
    if (!window.ScrollTrigger) { document.documentElement.classList.remove("js-anim"); return; }
    ScrollTrigger.getAll().forEach((t) => { if (t.vars && t.vars.id === "vx") t.kill(); });

    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      if (el.dataset.done) return; el.dataset.done = 1;
      gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: d(1.6), ease: "power2.out",
        scrollTrigger: { id: "vx", trigger: el, start: "top bottom+=250", once: true } });
    });

    gsap.utils.toArray("[data-stagger]").forEach((wrap) => {
      // Grids filled from the database get new children after the first pass: animate those too (otherwise they stay hidden = blank).
      if (wrap.dataset.done && wrap._kid === wrap.firstElementChild) return;
      wrap.dataset.done = 1; wrap._kid = wrap.firstElementChild;
      gsap.fromTo(wrap.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: d(1.4), stagger: d(.14), ease: "power2.out",
        scrollTrigger: { id: "vx", trigger: wrap, start: "top bottom+=250", once: true } });
    });

    // Image reveal (soft clip-path wipe)
    gsap.utils.toArray("[data-img-reveal]").forEach((el) => {
      if (el.dataset.done) return; el.dataset.done = 1;
      gsap.fromTo(el, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: d(2.2), ease: "power3.inOut",
        scrollTrigger: { id: "vx", trigger: el, start: "top bottom+=250", once: true } });
    });

    // Parallax (smoothed so it glides instead of snapping to the scroll position)
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      if (el.dataset.px) return; el.dataset.px = 1;
      const amt = parseFloat(el.dataset.parallax) || 40;
      gsap.to(el, { y: -amt, ease: "none", scrollTrigger: { id: "vx", trigger: el, start: "top bottom", end: "bottom top", scrub: 1.8 } });
    });

    // Count-up numbers (data-count="10")
    gsap.utils.toArray("[data-count]").forEach((el) => {
      if (el.dataset.done) return; el.dataset.done = 1;
      const end = parseFloat(el.dataset.count) || 0, o = { v: 0 };
      // the final number is already in the HTML; it only counts up once it scrolls into view
      ScrollTrigger.create({ id: "vx", trigger: el, start: "top 92%", once: true, onEnter: () => {
        el.textContent = "0";
        gsap.to(o, { v: end, duration: d(3), ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v)), onComplete: () => (el.textContent = end) });
      } });
    });
  }

  // Thin colour bar showing how far down the page you are
  function progress() {
    const bar = document.createElement("div"); bar.className = "scroll-progress"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    const set = gsap.quickSetter(bar, "scaleX");
    const upd = () => { const h = document.documentElement.scrollHeight - innerHeight; set(h > 0 ? Math.min(1, scrollY / h) : 0); };
    addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();
  }

  // Page transitions: soft, unhurried cross-fade between pages
  function transitions() {
    gsap.fromTo("body", { opacity: 0 }, { opacity: 1, duration: .5, ease: "power1.out", clearProps: "opacity" });
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (/^(tel:|mailto:)/i.test(a.getAttribute("href"))) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || a.hasAttribute("download")) return;
      e.preventDefault();
      // Fade out, then go. The timer is a safety net: if the fade never finishes (background tab, paused animation
      // clock) the link must still work.
      let gone = false; const go = () => { if (!gone) { gone = true; location.href = a.href; } };
      gsap.to("body", { opacity: 0, duration: .2, ease: "power1.in", onComplete: go });
      setTimeout(go, 600);
    });
    window.addEventListener("pageshow", () => gsap.set("body", { opacity: 1 }));
  }

  window.vynexAnimate = { refresh: () => { scrollAnims(); if (window.ScrollTrigger) ScrollTrigger.refresh(); } };

  transitions();
  const safe = (fn) => { try { fn(); } catch (e) { console.warn("[vynex] animation step failed:", e); } };
  let started = false;
  const boot = () => {
    if (started) return; started = true;
    safe(hero); safe(scrollAnims); safe(progress);
    if (window.ScrollTrigger) addEventListener("load", () => ScrollTrigger.refresh());
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  addEventListener("load", boot);
  window.addEventListener("load", () => {
    // Safety net: anything on screen (or already scrolled past) that is still invisible gets shown, so a section can never stay blank.
    const rescue = () => {
      document.querySelectorAll("[data-reveal], [data-stagger] > *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight + 200 && parseFloat(getComputedStyle(el).opacity) < 0.05) gsap.to(el, { opacity: 1, y: 0, duration: .3, overwrite: "auto" });
      });
    };
    let n = 0; const iv = setInterval(() => { rescue(); if (++n > 20) clearInterval(iv); }, 500);
    let t; addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(rescue, 150); }, { passive: true });
  });
  // Safety: never leave content hidden if something goes wrong
  setTimeout(() => { if (!window.ScrollTrigger) document.documentElement.classList.remove("js-anim"); }, 4000);
})();
