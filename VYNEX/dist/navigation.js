/* VYNEX/public/navigation.js
   Reusable header + footer components. Every public page contains
   <div id="site-header"></div> and <div id="site-footer"></div>; this file fills them in,
   so a change here (or in company settings) applies to every page. */
(function () {
  const PAGES = [
    ["index.html", "Home"], ["about.html", "About"], ["services.html", "Services"],
    ["portfolio.html", "Portfolio"], ["faq.html", "FAQ"], ["contact.html", "Contact"]
  ];
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  const mark = `<img class="brand-logo" src="images/logo.png" alt="" width="61" height="38">`;

  function headerHTML() {
    const links = PAGES.map(([href, label]) =>
      `<li><a href="${href}" class="${current === href ? "active" : ""}">${label}</a></li>`).join("");
    return `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header" id="siteHeader">
      <div class="container nav">
        <a class="brand" href="index.html" aria-label="VYNEX Web Solutions home">${mark}<span data-company="name">VYNEX</span></a>
        <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navLinks" aria-label="Toggle menu"><span></span></button>
        <ul class="nav-links" id="navLinks">${links}
          <li class="nav-cta-item"><a class="btn btn-primary nav-cta" href="get-quote.html">Get a Quote</a></li>
        </ul>
      </div>
    </header>`;
  }

  function footerHTML() {
    return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="brand" href="index.html">${mark}<span data-company="name">VYNEX</span></a>
            <p data-company="description">VYNEX Web Solutions builds modern, professional and reliable websites for businesses in Kenya and worldwide.</p>
            <p class="tagline"><span>Your Vision</span><i></i><span>Our Code</span><i></i><span>Your Success</span></p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><a href="index.html">Home</a></li><li><a href="about.html">About Us</a></li>
              <li><a href="portfolio.html">Portfolio</a></li><li><a href="faq.html">FAQ</a></li>
              <li><a href="get-quote.html">Request a Quote</a></li>
            </ul>
          </div>
          <div>
            <h4>Services</h4>
            <ul id="footerServices"><li><a href="services.html#website-development">Website Design &amp; Development</a></li><li><a href="services.html#ecommerce">E-Commerce Websites</a></li><li><a href="services.html#android-apps">Android App Development</a></li><li><a href="services.html#ios-apps">iOS App Development</a></li><li><a href="services.html#mpesa">M-Pesa Integration</a></li><li><a href="services.html#pos">POS &amp; Business Systems</a></li><li><a href="services.html">All services →</a></li></ul>
          </div>
          <div>
            <h4>Get in touch</h4>
            <p class="foot-note">Tap an icon to call or message us — or <a href="get-quote.html" style="color:var(--yellow)">request a free call-back</a>.</p>
            <div class="contact-icons contact-icons-lg" data-contact-icons aria-label="Contact us"></div>
            <p class="foot-loc" data-company="location" hidden></p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© <span id="year"></span> <span data-company="name">VYNEX</span> Web Solutions. All rights reserved.</span>
          <nav aria-label="Legal"><a href="privacy-policy.html">Privacy Policy</a><a href="terms.html">Terms &amp; Conditions</a></nav>
        </div>
      </div>
    </footer>`;
  }

  const h = document.getElementById("site-header");
  const f = document.getElementById("site-footer");
  if (h) h.innerHTML = headerHTML();
  if (f) f.innerHTML = footerHTML();
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Sticky header style
  const header = document.getElementById("siteHeader");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  const toggle = document.getElementById("navToggle");
  const list = document.getElementById("navLinks");
  if (toggle && list) {
    const close = () => { list.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => {
      const open = list.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    list.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
})();
