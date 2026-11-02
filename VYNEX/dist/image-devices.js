/* VYNEX/public/image-devices.js — builds the About picture as real device frames (laptop, tablet, phone)
   running a live copy of the VYNEX website. Reuses the device frame markup/CSS from the home hero (devices.css).
   Does not need the photo: it replaces every <img data-image-slot="about"> frame. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var IC = {
    web: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    app: '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
    pay: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18M7 15h4"/></svg>'
  };
  function site(kind) {
    var tab = kind === "t";
    var cmds = [["plan", "Plan", "We listen first, then agree scope, price and timeline."], ["design", "Design", "Clean layouts shaped around your brand and customers."],
      ["develop", "Develop", "We build, test on real devices and share progress."], ["launch", "Launch", "Go live, with hosting, security and support after."]];
    return '<div class="lv-site lv-' + (kind === "p" ? "p" : "d") + (tab ? " lv-tab" : "") + '">' +
      '<div class="lv-nav"><div class="lv-brand"><img src="images/logo.png" alt="">VYNEX</div><div class="lv-links"><span>Home</span><span>About</span><span>Services</span><span>Portfolio</span><span>FAQ</span><span>Contact</span></div><div class="lv-pill">Get a Quote</div><div class="lv-burger"><i></i><i></i><i></i></div></div>' +
      '<div class="lv-page"><section class="lv-hero"><i class="lv-orb a"></i><i class="lv-orb b"></i>' +
      '<div class="lv-copy"><div class="lv-eyebrow">&gt;_ web &amp; mobile app developers <b>· kenya</b></div>' +
      '<h1><span>Websites &amp; mobile apps</span><span><i class="g">built by real developers</i></span><span>that win you customers.</span></h1>' +
      '<p>Fast, secure websites, Android and iOS apps and business systems for Kenyan businesses. Clean work, honest timelines.</p>' +
      '<div class="lv-chips"><span>Web + Android + iOS</span><span>M-Pesa ready</span></div>' +
      '<div class="lv-btns"><div class="lv-btn">Get a free quote →</div><div class="lv-btn ghost">View our work</div></div></div>' +
      '<div class="lv-viz"><h6>Online sales <em>▲ 34%</em></h6><strong style="--n:820"></strong><svg viewBox="0 0 290 110" preserveAspectRatio="none"><defs><linearGradient id="lvArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#35e0a8" stop-opacity=".5"/><stop offset="1" stop-color="#35e0a8" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="ar" d="M0 100 C40 96 60 80 90 78 S140 60 170 50 S230 30 290 8 L290 110 L0 110Z"/><path class="ln" d="M0 100 C40 96 60 80 90 78 S140 60 170 50 S230 30 290 8"/></svg>' +
      '<div class="row"><span>Orders<b>496</b></span><span>Visitors<b>21.6K</b></span><span>Enquiries<b>164</b></span></div></div>' +
      '<div class="lv-toast"><i>✓</i><div>M-Pesa payment received<small>KSh 3,500 · Order #1620</small></div></div></section>' +
      '<section class="lv-sec lv-services"><span class="lv-tag">What we build</span><h2>Everything you need to launch and grow</h2><p class="sub">From a first website to a full mobile app or business system.</p><div class="lv-cards">' +
      '<div class="lv-card"><div class="ic">' + IC.web + '</div><h3>Websites that sell</h3><p>Fast, modern sites that turn visitors into paying customers.</p></div>' +
      '<div class="lv-card"><div class="ic">' + IC.app + '</div><h3>Android &amp; iOS apps</h3><p>Mobile apps your customers love to use, built and published for you.</p></div>' +
      '<div class="lv-card"><div class="ic">' + IC.pay + '</div><h3>M-Pesa payments</h3><p>Accept payments online with secure STK Push checkout.</p></div></div></section>' +
      '<section class="lv-sec lv-process"><span class="lv-tag">How we work</span><h2>No surprises, from first call to launch</h2><p class="sub">Four clear steps and updates at every stage.</p><div class="lv-cmds">' +
      cmds.map(function (c) { return '<div class="lv-cmd"><span>$ <b>vynex</b> ' + c[0] + "</span><h3>" + c[1] + "</h3><p>" + c[2] + "</p></div>"; }).join("") + "</div></section>" +
      '<section class="lv-sec lv-cta"><div><span class="lv-tag">Trusted by Kenyan businesses</span><h2>Ready to launch your project?</h2><div class="lv-stats"><div class="lv-stat"><b data-s="+"></b><span>Projects delivered</span></div><div class="lv-stat"><b data-s="%"></b><span>Client satisfaction</span></div><div class="lv-stat"><b data-s="/7"></b><span>Support</span></div></div><div class="lv-btn">Get a free quote →</div></div></section>' +
      '<section class="lv-foot"><div><b>VYNEX Web Solutions</b>Nairobi, Kenya · vynexwebsolutions@gmail.com</div></section></div>' +
      (kind === "d" ? '<div class="lv-cursor"><svg viewBox="0 0 19 24"><path d="M2 1v18l5-4.4 3.4 7.6 3-1.4-3.3-7.5H17z" fill="#fff" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/></svg></div>' : "") + "</div>";
  }

  function build(frame) {
    if (frame.dataset.lvDev) return; frame.dataset.lvDev = "1";
    frame.classList.add("vx-devscene");
    var root = document.createElement("div"); root.className = "lvd lv-devices"; root.setAttribute("aria-hidden", "true");
    var glass = '<div class="glass"></div>';
    root.innerHTML =
      '<div class="dev laptop"><div class="lp-lid"><div class="lp-bezel"><i class="lp-cam"></i><div class="lp-screen"><div class="lv-fit" data-w="1100">' + site("d") + "</div>" + glass + '</div></div></div><div class="lp-base"></div></div>' +
      '<div class="dev tablet"><div class="tb-bezel"><i class="tb-cam"></i><div class="tb-screen"><div class="lv-fit" data-w="1000">' + site("t") + "</div>" + glass + "</div></div></div>" +
      '<div class="dev phone"><div class="ph-bezel"><div class="ph-screen" style="display:block"><i class="ph-island"></i><div class="lv-fit" data-w="400">' + site("p") + "</div>" + glass + "</div></div></div>";
    frame.appendChild(root);
    if (reduce) root.classList.add("lv-still");
    function fit() {
      root.querySelectorAll(".lv-fit").forEach(function (f) {
        var scr = f.parentElement, sw = scr.clientWidth, sh = scr.clientHeight; if (!sw || !sh) return;
        var w = +f.dataset.w, k = sw / w, h = sh / k;
        f.style.width = w + "px"; f.style.height = h + "px"; f.style.setProperty("--H", h + "px"); f.firstChild.style.setProperty("--H", h + "px");
        f.style.transform = "scale(" + k + ")";
      });
    }
    var started = false;
    function fitAndStart() {
      fit();
      if (!started && root.querySelector(".lv-fit").style.width) {
        started = true;   // keyframes read --H, so restart the animations once the real screen size is known
        root.getAnimations({ subtree: true }).forEach(function (a) { try { a.cancel(); a.play(); } catch (e) {} });
      }
    }
    fitAndStart();
    if ("ResizeObserver" in window) new ResizeObserver(fitAndStart).observe(root); else addEventListener("resize", fit);
    // fonts finish loading after first layout — re-measure once
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }
  function scan() { document.querySelectorAll('.img-frame img[data-image-slot="about"]').forEach(function (i) { build(i.closest(".img-frame")); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan); else scan();
})();
