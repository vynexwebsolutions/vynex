/* VYNEX/public/image-motion.js — makes sure no picture on the site is static.
   • Finds every content image (including ones the site adds later: project cards, gallery,
     lightbox, testimonial photos) and tags its frame with .vx-frame (see image-motion.css).
   • Adds .vx-in when the frame scrolls into view, which starts the reveal / settle / drift.
   • Tracks the pointer over a picture so the glow follows the cursor.
   Skipped entirely for visitors who prefer reduced motion. Logos, icons, the watermark and
   the chat widget are left alone. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root = document.documentElement;
  root.classList.add("vx-motion");

  var FRAME = ".img-frame, .hero-art, .wm-wrap, .project-thumb, .avatar, .detail-cover, .lb-stage";
  var HOST = ".pf-card, .project-card, .g-item, .img-frame, .hero-art, .detail-cover, .lb-stage, .avatar";
  var SKIP = ".wm, .brand-logo, .vxa-root, [class*='vxa-'], .site-header, .site-footer, .ad-brand, .side-brand";
  var count = 0;

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("vx-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }) : null;

  function frameOf(img) {
    if (img.closest(SKIP)) return null;
    var f = img.closest(FRAME);
    // a watermark wrapper is the innermost clipping box — prefer it so the watermark stays still
    var w = img.closest(".wm-wrap");
    return w || f || null;
  }

  function prep(img) {
    if (img.dataset.vx) return;
    var f = frameOf(img);
    if (!f) return;
    img.dataset.vx = "1";
    if (f.classList.contains("vx-frame")) return;       // a second image in the same frame
    var n = count++;
    f.classList.add("vx-frame");
    if (f.classList.contains("avatar")) f.classList.add("vx-tiny");
    if (n % 3 === 1) f.classList.add("vx-alt"); else if (n % 3 === 2) f.classList.add("vx-alt2");
    f.style.setProperty("--vx-sheen-delay", (1.5 + (n % 5) * 1.3).toFixed(1) + "s");

    // client screenshots: act like someone is browsing the page (pointer + clicks; tall captures scroll)
    if (f.matches(".wm-wrap, .project-thumb, .detail-cover") && !f.closest(".lightbox")) {
      f.classList.add("vx-browse");
      var tall = function () {
        if (!img.naturalWidth) return;
        var r = f.getBoundingClientRect();
        if (r.width && img.naturalHeight / img.naturalWidth > (r.height / r.width) * 1.3) f.classList.add("vx-scrolly");
      };
      if (img.complete) tall(); else img.addEventListener("load", tall, { once: true });
    }

    var host = f.closest(HOST);
    if (host) host.classList.add("vx-host"); else f.classList.add("vx-host");

    if (!io || f.closest(".lightbox")) { f.classList.add("vx-in"); return; }
    io.observe(f);
    setTimeout(function () { f.classList.add("vx-in"); }, 4500);   // safety net: never leave a picture hidden
  }

  function scan(scope) {
    (scope || document).querySelectorAll("img").forEach(prep);
  }

  scan();
  if ("MutationObserver" in window) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.tagName === "IMG") prep(n); else scan(n);
        });
        // image-loader.js sets src after the page loads — nothing to do, the frame is already tagged
      });
    }).observe(document.body || root, { childList: true, subtree: true });
  }
  document.addEventListener("DOMContentLoaded", function () { scan(); });

  // cursor-following glow
  if (window.matchMedia("(hover: hover)").matches) {
    var raf = 0;
    document.addEventListener("pointermove", function (e) {
      var host = e.target.closest && e.target.closest(".vx-host");
      if (!host || raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var f = host.classList.contains("vx-frame") ? host : host.querySelector(".vx-frame");
        if (!f) return;
        var r = f.getBoundingClientRect();
        if (!r.width || !r.height) return;
        f.style.setProperty("--px", Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)).toFixed(3));
        f.style.setProperty("--py", Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)).toFixed(3));
      });
    }, { passive: true });
  }
})();
