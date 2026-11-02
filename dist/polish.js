/* VYNEX/public/polish.js — small finishing touches (no libraries):
   • back-to-top button      • buttons that gently lean toward the mouse (desktop)      • active-link highlight on scroll */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* back-to-top */
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "to-top"; btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  document.body.appendChild(btn);
  var tick = false;
  addEventListener("scroll", function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { tick = false; btn.classList.toggle("show", window.pageYOffset > 700); });
  }, { passive: true });

  /* magnetic buttons (only with a real mouse) */
  if (!reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".hero-actions .btn, .cta-band .btn, .price-band .btn").forEach(function (b) {
      b.style.transition = getComputedStyle(b).transition + ", translate .25s cubic-bezier(.22,1,.36,1)";
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.14).toFixed(1) + "px " + ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + "px";
      }, { passive: true });
      b.addEventListener("pointerleave", function () { b.style.translate = ""; });
    });
  }
})();
