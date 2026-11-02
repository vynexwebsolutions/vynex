/* VYNEX/public/assistant.js
   (v2: short answers first + "More details", price/timeline answers per service, FAQ and whole-site knowledge.)
   Floating AI assistant for the public site: an animated robot button that opens an animated chat window.

   How it "knows" things: all the knowledge lives in the KB array below (company, 31 services, pricing approach,
   process, FAQs, contact details...). Messages are matched to the best topic with keyword + typo-tolerant scoring,
   so it works instantly with no external AI service and no API key in the browser.
   Contact details are read live from Supabase (company_settings) when configured, so the assistant always shows
   the same phone / WhatsApp / email / social links the admin panel manages. Defaults below are used otherwise.

   To edit what it says: change the answers in KB. To add a topic: copy any entry and change k (keywords) and a (answer). */
(function () {
  "use strict";
  if (window.__vynexAssistant) return;
  window.__vynexAssistant = true;

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STORE = "vynex-assistant-v2";

  /* ------------------------------------------------------------------ contact details */
  // Fallbacks = the details in backend/seed-business.sql. Replaced by the live company_settings row when available.
  var company = {
    email: "vynexwebsolutions@gmail.com",
    phone: "+254 742 210 239",
    whatsapp: "+254 181 971 409",
    location: "Kenya · serving clients worldwide",
    social_instagram: "", social_tiktok: "", social_twitter: ""
  };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function href(key, raw) {
    if (window.VX_CONTACT && VX_CONTACT.link) return VX_CONTACT.link(key, raw);
    var v = String(raw || "").trim(); if (!v) return null;
    if (key === "call") return "tel:" + v.replace(/[^\d+]/g, "");
    if (key === "email") return "mailto:" + v;
    if (key === "whatsapp") return "https://wa.me/" + v.replace(/\D/g, "");
    return null;
  }
  function loadCompany() {
    if (!window.vynexDb) return;
    window.vynexDb.from("company_settings").select("*").limit(1).maybeSingle().then(function (r) {
      if (!r || r.error || !r.data) return;
      ["email", "phone", "whatsapp", "location", "social_instagram", "social_tiktok", "social_twitter"].forEach(function (k) { if (r.data[k]) company[k] = r.data[k]; });
    }, function () {});
  }

  /* ------------------------------------------------------------------ answer-building helpers */
  function P(s) { return "<p>" + s + "</p>"; }
  function UL(a) { return "<ul>" + a.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"; }
  function A(url, label, cls) { return '<a class="vxa-cta ' + (cls || "") + '" href="' + url + '"' + (/^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + label + "</a>"; }
  function quoteLink(service, label) { return A("get-quote.html" + (service ? "?service=" + encodeURIComponent(service) : ""), label || "Get a free quote"); }
  function contactButtons() {
    var out = "", h;
    if ((h = href("call", company.phone))) out += A(h, "Call us");
    if ((h = href("whatsapp", company.whatsapp))) out += A(h, "WhatsApp", "wa");
    if ((h = href("email", company.email))) out += A(h, "Email", "alt");
    return out;
  }

  /* ------------------------------------------------------------------ knowledge base */
  // k: keywords/phrases (typo-tolerant). a: answer (HTML or function returning HTML/Promise). next: suggested follow-up topic ids.
  // yes: topic shown when the visitor just says "yes / ok / sure".
  var KB = [
    { id: "greet", label: "Hello", low: true, k: ["hi", "hello", "hey", "hallo", "hola", "jambo", "habari", "mambo", "niaje", "sasa", "good morning", "good afternoon", "good evening", "howdy", "greetings"],
      a: function () { return P("Hello, and welcome to <strong>VYNEX Web Solutions</strong>. I can tell you about our services, how pricing works, how long projects take, and how to reach the team.") + P("What would you like to know?"); },
      next: ["services", "price", "timeline", "quote", "plans"] },

    { id: "thanks", label: "Thanks", low: true, k: ["thanks", "thank you", "thank", "asante", "asante sana", "appreciate", "cheers", "great", "awesome", "perfect", "nice"],
      a: function () { return P("You are welcome. If you would like a developer to look at your idea, a free quote is the best next step."); },
      next: ["quote", "services", "contact"] },

    { id: "bye", label: "Bye", low: true, k: ["bye", "goodbye", "see you", "later", "kwaheri", "ciao", "tutaonana"],
      a: function () { return P("Goodbye, and thank you for visiting VYNEX. Whenever you are ready to build, we are one message away."); },
      next: ["quote", "contact"] },

    { id: "human", label: "Talk to a person", k: ["human", "person", "real person", "agent", "representative", "speak to someone", "talk to someone", "talk to a person", "call me", "call back", "callback", "call-back", "developer call", "someone call"],
      a: function () { return P("Of course. The fastest way is to <strong>request a free call-back</strong>: leave your number on the quote form and a VYNEX developer will phone you to discuss your idea. Or reach us directly:") + contactButtons() + quoteLink("", "Request call-back"); },
      next: ["contact", "quote"] },

    { id: "bot", label: "Are you a bot?", k: ["are you a bot", "are you human", "are you real", "are you ai", "robot", "are you a chatbot", "who are you", "your name", "what are you", "artificial"],
      a: function () { return P("I am the <strong>VYNEX Assistant</strong>, an automated helper on this website. I know the company, its services, process and contact details. For custom pricing or technical decisions, a real VYNEX developer will speak with you, and I can help you set that up."); },
      next: ["human", "services"] },

    /* ================= EXTRA KNOWLEDGE (FAQ + whole website) =================
       s = short answer (shown first). a = full answer (shown by "More details"). svc = service name for the quote button. cat = service group (used for price/time answers). */

    { id: "whyphone", label: "Why a phone number?", k: ["why phone", "why do you ask for my phone", "why my number", "why do you need my number", "why do you need my phone", "why call me", "do you call", "phone number required", "why phone number", "why whatsapp number"],
      s: "So a VYNEX developer can <strong>call you directly</strong>, understand your idea and prepare an accurate quote. It is faster than long email chains, and your number is used only for your project.",
      a: function () { return P("We ask for your phone number so a <strong>real VYNEX developer can call you</strong>, understand your idea properly and prepare an accurate quote. It is faster than long email chains.") + P("Your number is used only for your project and is visible only to authorised administrators.") + A("privacy-policy.html", "Privacy policy", "alt") + quoteLink("", "Request a call-back"); },
      next: ["quote", "privacy", "contact"], yes: "quote" },

    { id: "difference", label: "Website vs web app vs mobile app", k: ["difference", "differences", "difference between", "what is the difference", "website vs app", "website vs web app", "web app vs mobile app", "which one do i need", "which do i need", "do i need an app", "do i need a website", "website or app", "app or website", "what is a web app", "what is a mobile app", "what is a website", "which is better", "which should i choose", "which one should i choose"],
      s: "A <strong>website</strong> presents your business and brings enquiries. A <strong>web app</strong> is software in the browser (e.g. a booking or management system). A <strong>mobile app</strong> is installed from Google Play or the App Store. Often a good website or PWA is enough.",
      a: function () { return P("Here is the simple difference:") + UL(["<strong>Website</strong>: presents your business, shows services and gets enquiries or orders", "<strong>Web app</strong>: software that runs in the browser, such as a booking, school or management system, with no installation", "<strong>Mobile app</strong>: installed on the phone from Google Play or the App Store", "<strong>PWA</strong>: a website that installs like an app, a cheaper middle option"]) + P("We will advise what you really need. Sometimes a good website or a PWA is enough.") + quoteLink("", "Get advice for free"); },
      next: ["cross", "systems", "price", "quote"], yes: "quote" },

    { id: "responsive", label: "Mobile-friendly sites", k: ["responsive", "mobile friendly", "mobile-friendly", "work on phones", "work on mobile", "work on my phone", "phone friendly", "tablet", "different screens", "screen sizes", "mobile first", "mobile-first", "look good on phone", "slow internet", "mobile data"],
      s: "Yes — every site we build is <strong>responsive</strong> and mobile-first: it works well on phones, tablets and computers and loads quickly even on mobile data.",
      a: function () { return P("Yes. Most Kenyans browse on their phones, so we <strong>design for the phone first</strong> and then scale up.") + UL(["Mobile-first layouts tested on real devices", "Large, thumb-friendly buttons and clear text", "Optimised images for fast loading", "Works on Android, iPhone, tablet and desktop"]) + A("services.html#responsive-websites", "See details", "alt") + quoteLink("Responsive & Mobile-Friendly Websites", "Get a quote"); },
      next: ["website", "price", "timeline"], svc: "Responsive & Mobile-Friendly Websites", cat: "web", yes: "quote" },

    { id: "landing", label: "Landing pages", k: ["landing page", "landing pages", "single page", "one page website", "one-page website", "portfolio website", "portfolio site", "personal website", "campaign page", "event page", "lead capture", "lead generation", "personal brand"],
      s: "Yes — we build sharp <strong>landing pages and portfolio sites</strong> with a clear call-to-action and a lead form that sends enquiries to you. The focused scope means a quick turnaround.",
      a: function () { return P("A landing page has one job: <strong>get the visitor to act</strong>.") + UL(["Clear headline, offer and call-to-action", "Lead capture form that sends enquiries to you", "Gallery or case-study layout for portfolios", "Quick turnaround because the scope is focused"]) + P("Great for freelancers, creatives, event organisers and ad campaigns.") + A("services.html#landing-pages", "See details", "alt") + quoteLink("Landing Pages & Portfolio Websites", "Get a quote"); },
      next: ["website", "price", "timeline"], svc: "Landing Pages & Portfolio Websites", cat: "web", yes: "quote" },

    { id: "pwa", label: "Progressive Web Apps", k: ["pwa", "pwas", "progressive web app", "progressive web apps", "installable", "install from browser", "app without play store", "no app store", "offline app", "home screen"],
      s: "A <strong>PWA</strong> gives customers an app-like icon on their home screen straight from your website, fast and partly offline, with no Play Store or App Store download. It is much cheaper than native apps.",
      a: function () { return P("A <strong>Progressive Web App</strong> gives an app-like experience straight from your website.") + UL(["Install from the browser to the home screen", "Fast, even on weak connections", "Works offline for key features", "Much cheaper than building native apps"]) + A("services.html#pwa", "See details", "alt") + quoteLink("Progressive Web Apps (PWA)", "Get a quote"); },
      next: ["cross", "android", "price"], svc: "Progressive Web Apps (PWA)", cat: "app", yes: "quote" },

    { id: "seo", label: "SEO & Google ranking", k: ["seo", "google ranking", "rank on google", "rank higher", "ranking higher", "google search", "search engine", "search engines", "show up on google", "appear on google", "get found", "keywords", "keyword research", "google business", "google business profile", "google maps listing", "core web vitals", "page speed", "website speed", "google", "on google", "slow", "slow website", "site is slow", "website is slow", "loading slowly", "takes long to load", "load faster", "faster website", "traffic", "more customers from google", "organic"],
      s: "Yes — we improve your site's structure, content and speed so <strong>Google understands it and shows it to the right people</strong>: keyword research, page titles, Google Business Profile guidance and speed fixes. Every site also gets a basic SEO-ready setup.",
      a: function () { return P("When customers search for what you sell, you want to be the name they see.") + UL(["Keyword research for your market", "Page titles, descriptions and clean structure", "Google Business Profile guidance", "Speed and Core Web Vitals improvements"]) + P("No one can honestly promise a #1 ranking, but a fast, well-structured site gives you the best chance.") + A("services.html#seo", "See details", "alt") + quoteLink("SEO & Performance Optimization", "Get a quote"); },
      next: ["care", "price", "website"], svc: "SEO & Performance Optimization", cat: "care", yes: "quote" },

    { id: "security", label: "Website security", k: ["security", "secure", "is it secure", "safe website", "hacked", "hacker", "hackers", "website was hacked", "site was hacked", "got hacked", "hacked website", "i was hacked", "my site got hacked", "malware", "virus", "spam protection", "secure login", "data protection on my site", "attacks", "protect my website", "protect my site", "safe payments", "recovery plan", "https"],
      s: "Security is built in from day one: <strong>SSL, secure login, spam protection and protected data</strong>. We also clean up hacked sites, add backups and tune speed.",
      a: function () { return P("Hacked or slow websites cost you customers, so security is built in, not added later.") + UL(["SSL, secure login and spam protection", "Malware clean-up and prevention", "Speed tuning and image optimisation", "Backups and a recovery plan"]) + A("services.html#security", "See details", "alt") + quoteLink("Website Security & Optimization", "Get a quote"); },
      next: ["care", "price", "hosting"], svc: "Website Security & Optimization", cat: "care", yes: "quote" },

    { id: "email", label: "Business email", k: ["business email", "professional email", "company email", "work email", "email setup", "email set up", "mailboxes", "mailbox", "email on my domain", "custom email", "email on my phone", "gmail address", "emails go to spam", "staff email", "staff emails", "email accounts"],
      s: "Yes — we set up <strong>professional email on your own domain</strong> (like info@yourcompany.co.ke), connect it to your phone and computer, and configure it so it does not land in spam.",
      a: function () { return P("Emails from <strong>info@yourcompany.co.ke</strong> build far more trust than a free Gmail address.") + UL(["Mailboxes on your own domain", "Set-up on phone and computer", "Spam and delivery settings configured", "Staff accounts and forwarding"]) + A("services.html#business-email", "See details", "alt") + quoteLink("Professional Business Email Setup", "Get a quote"); },
      next: ["hosting", "price", "timeline"], svc: "Professional Business Email Setup", cat: "care", yes: "quote" },

    { id: "consult", label: "IT advice & troubleshooting", k: ["it consultancy", "consultancy", "consultant", "consulting", "technical support", "troubleshoot", "troubleshooting", "system review", "technology advice", "which technology", "not sure what to build", "not sure what i need", "advice", "my system is slow", "technical problem", "tech help", "it support"],
      s: "Yes — we give <strong>straight, practical IT advice</strong> and hands-on help: project planning, technology choices, system reviews and fixing stubborn technical problems, in plain language.",
      a: function () { return P("Not sure what to build, which technology to choose, or why your system is slow? We help with:") + UL(["Project planning and technology advice", "System review and improvement plan", "Troubleshooting and technical support", "Plain-language explanations, no jargon"]) + A("services.html#consultancy", "See details", "alt") + quoteLink("IT Consultancy and Technical Support", "Get help"); },
      next: ["quote", "care", "price"], svc: "IT Consultancy and Technical Support", cat: "care", yes: "quote" },

    { id: "maintenance", label: "Maintenance & support", k: ["maintenance", "maintain", "maintain my website", "website down", "site down", "not working", "broken", "backups", "backup", "uptime", "updates", "bug fixes", "bug fix", "support", "after launch", "after-sales", "aftercare", "help after", "support after launch", "post launch", "post-launch", "ongoing support", "support plan", "monthly support"],
      s: "Yes — we <strong>stay with you after launch</strong>: content updates, backups, uptime checks, bug fixes and direct support. Ask about support options when you request your quote.",
      a: function () { return P("A website is not a one-time purchase, so we keep yours healthy:") + UL(["Content and image updates", "Regular backups and uptime checks", "Bug fixes and software updates", "Direct support when you need help"]) + P("Support options depend on what you need, so mention it when you request your quote.") + A("services.html#maintenance", "See details", "alt") + quoteLink("Website Maintenance & Support", "Get a quote"); },
      next: ["security", "price", "contact"], svc: "Website Maintenance & Support", cat: "care", yes: "quote" },

    { id: "deploy", label: "Launching my website", k: ["deployment", "deploy", "go live", "launch my website", "launch my site", "launch day", "publish my website", "publish my site", "put my website online", "make it live", "website live", "pre-launch", "testing before launch", "launch checklist"],
      s: "We handle <strong>launch day</strong>: full testing, connecting your domain, SSL and email, and checking forms, payments and mobile layout before going live, plus a post-launch check.",
      a: function () { return P("Launch day without the stress:") + UL(["Full pre-launch testing checklist", "Domain, SSL and email connected", "Forms and payments verified", "Post-launch check to catch early issues"]) + A("services.html#deployment", "See details", "alt") + quoteLink("Website Deployment", "Get a quote"); },
      next: ["hosting", "care", "price"], svc: "Website Deployment", cat: "care", yes: "quote" },

    { id: "mobile", label: "Mobile apps", k: ["android and iphone", "android and ios", "iphone and android", "ios and android", "mobile app", "mobile apps", "mobile application", "mobile applications", "app development", "do you build apps", "build apps", "build an app", "make an app", "make me an app", "need an app for my business", "phone app", "smartphone app", "app", "apps"],
      s: "Yes — we build <strong>Android apps, iOS apps and cross-platform apps</strong> that run on both. We can also add a web version and an admin dashboard connected to the same system.",
      a: function () { return P("Yes, we build mobile apps for every phone:") + UL(["<strong>Android apps</strong>, published on Google Play", "<strong>iOS apps</strong> for iPhone and iPad, with help for App Store review", "<strong>Cross-platform apps</strong>: one codebase for both, at lower cost", "A <strong>web version and admin dashboard</strong> connected to the same system, if you need one"]) + P("Not sure you need a store app? A PWA can be a cheaper alternative.") + A("services.html#apps", "Apps & software", "alt") + quoteLink("", "Get a quote"); },
      next: ["android", "ios", "cross", "price"], svc: "", cat: "app", yes: "quote" },

    { id: "plans", label: "Plans & packages", k: ["plan", "plans", "package", "packages", "pricing plan", "pricing plans", "pricing tiers", "tier", "tiers", "starter", "starter plan", "basic plan", "premium plan", "monthly plan", "subscription", "our plan", "your plans", "development plan", "project plan", "what plans", "which plan", "plan do you have", "plans do you have"],
      s: "We don't use fixed packages. Every project is <strong>planned and quoted around your goals and budget</strong>. As a guide: a simple website or landing page, a full business site or store, or a custom app or system. We recommend the right fit.",
      a: function () { return P("We do not sell one-size-fits-all packages. Instead we plan each project around your goals, then quote it, so you only pay for what you need.") + UL(["<strong>Starter</strong>: a landing page, portfolio or simple business website", "<strong>Business</strong>: a multi-page website or online store with admin panel and M-Pesa", "<strong>Custom</strong>: Android/iOS apps, web apps and systems such as POS, school, property or booking"]) + P("Our development plan always follows four steps: Discover, Design, Develop, Launch &amp; support. Tell us your goals and budget and we will recommend the right plan.") + A("services.html", "All services", "alt") + quoteLink("", "Get my plan & quote"); },
      next: ["process", "price", "timeline", "quote"], svc: "", yes: "quote" },

    { id: "budget", label: "I have a small budget", k: ["budget", "small budget", "low budget", "tight budget", "limited budget", "my budget", "afford", "affordable", "cheap", "cheaper", "cheapest", "expensive", "too expensive", "discount", "discounts", "negotiate", "negotiable", "kes", "ksh", "shillings", "low cost", "lowest price", "best price", "reduce the cost"],
      s: "Yes — we aim for <strong>fair prices that fit small businesses</strong> and growing companies, with no hidden costs. Tell us your budget on the quote form and we will recommend what fits, such as a simpler first version or a PWA.",
      a: function () { return P("Yes. VYNEX is built to be <strong>affordable for small businesses</strong> and growing companies, with fair, upfront quotes and no hidden costs.") + UL(["Share your budget on the quote form (it is optional)", "We recommend what fits it, such as starting with a simpler version and growing later", "A PWA or a focused landing page costs much less than a full native app or large system"]) + P("The quote is free, with no obligation.") + quoteLink("", "Get a quote for my budget"); },
      next: ["price", "plans", "pricefactors", "quote"], svc: "", yes: "quote" },

    { id: "pricefactors", label: "What affects the price?", k: ["what affects the price", "what affects price", "what affects cost", "what affects the cost", "what determines the price", "what decides the price", "price depend", "cost depend", "prices depend", "costs depend", "depends on", "factors", "why do prices vary", "price vary", "prices vary", "how do you calculate", "how is the price", "how do you price", "how do you charge"],
      s: "Price depends mainly on <strong>scope</strong>: number of pages or screens, features (store, bookings, login, admin panel), platforms (web, Android, iOS), integrations like M-Pesa, and your timeline.",
      a: function () { return P("Because every project is different, the price is shaped by:") + UL(["<strong>Size</strong>: number of pages, screens or modules", "<strong>Features</strong>: online store, bookings, user accounts, admin panel, reports", "<strong>Platforms</strong>: website, Android, iOS or all three", "<strong>Integrations</strong>: M-Pesa, SMS, email, maps and other services", "<strong>Design &amp; timeline</strong>: custom design and how fast you need it"]) + P("We quote after a short call so the price matches your real needs. It is free, with no hidden costs.") + quoteLink("", "Get my free quote"); },
      next: ["price", "budget", "timeline", "quote"], svc: "", yes: "quote" },

    { id: "paymentterms", label: "How do I pay?", k: ["payment plan", "payment plans", "payment terms", "installments", "instalments", "installment", "deposit", "upfront", "up front", "advance payment", "pay half", "pay in parts", "pay in stages", "how do i pay", "how to pay", "how do i pay you", "payment schedule", "invoice", "invoices", "refund", "refunds", "pay later", "pay after", "milestone", "milestones", "pay you"],
      s: "Scope, price, timeline and <strong>payment terms are agreed in writing in your proposal before work begins</strong>. Ask about staged payments when we call you, so there are no surprises.",
      a: function () { return P("Specific scope, pricing, timelines and deliverables are <strong>agreed in writing in a proposal or contract before any work begins</strong>.") + P("That is also where payment terms are set out. If you would prefer to pay in stages, mention it when we call you or in your quote request.") + A("terms.html", "Terms", "alt") + quoteLink("", "Request a quote"); },
      next: ["price", "agreement", "quote", "contact"], svc: "", yes: "quote" },

    { id: "prepare", label: "What do you need from me?", k: ["what do you need from me", "what do i need to provide", "what should i prepare", "what to prepare", "what do i need", "provide content", "website content", "my content", "who writes the content", "write the content", "logo and images", "photos", "materials", "what do i give you", "what information", "what information do you need", "what should i send", "do i need to have a logo", "i dont have a logo", "i dont have content"],
      s: "Just your <strong>goals, who your customers are, and your budget</strong>. If you have a logo, photos or text, great; if not, ask us about <strong>branding and content help</strong>. We guide you through the rest.",
      a: function () { return P("You do not need anything technical. To start we simply need:") + UL(["Your business, goals and customers", "What you want visitors to do (call, order, book, request a quote)", "Any logo, photos or text you already have", "Your budget and deadline (optional)"]) + P("No logo yet? Our branding service can create one. We will explain every step in plain language.") + A("services.html#branding", "Branding", "alt") + quoteLink("", "Start with a free call"); },
      next: ["process", "design", "quote"], svc: "", yes: "quote" },

    { id: "revisions", label: "Can I request changes?", k: ["revision", "revisions", "changes after", "change my mind", "make changes", "request changes", "edits", "unlimited changes", "feedback on design", "not happy", "dont like the design", "dont like", "approve the design", "approval", "see the design first", "see the design", "design before you build", "before you build", "before building", "before development", "mockup", "mock up", "preview", "see before you build", "design first", "redo", "modify the design"],
      s: "Yes — you <strong>review wireframes and the visual design before any code is written</strong>, and we refine until you love it. Changes after that depend on the agreed scope, so discuss it in your proposal.",
      a: function () { return P("You are involved before anything is built:") + UL(["You review wireframes and the visual design <strong>before any code is written</strong>", "We refine the design until you are happy", "Progress is shared at every stage of development", "How later changes are handled is agreed in your proposal"]) + quoteLink("", "Start with a free quote"); },
      next: ["process", "timeline", "quote"], svc: "", yes: "quote" },

    { id: "agreement", label: "Contracts & ownership", k: ["contract", "contracts", "agreement", "agreements", "in writing", "written agreement", "ownership", "who owns", "own the website", "own the code", "own my website", "source code", "copyright", "intellectual property", "handover", "hand over", "terms", "conditions", "terms and conditions", "legal", "is it legal", "own my domain"],
      s: "Scope, pricing, timelines and deliverables are <strong>agreed in writing before work begins</strong>, and <strong>ownership of delivered work is set out in each project agreement</strong>. Your domain and hosting accounts are handed over clearly.",
      a: function () { return P("Our terms are simple and in writing:") + UL(["Scope, pricing, timelines and deliverables are agreed in a proposal or contract <strong>before work begins</strong>", "Ownership of delivered project work is set out in each project agreement", "Domain, hosting and email accounts get a <strong>clear handover</strong>", "Our terms are governed by the laws of Kenya"]) + P("Ask for any detail on the call and it will be put in your proposal.") + A("terms.html", "Terms", "alt") + A("privacy-policy.html", "Privacy policy", "alt"); },
      next: ["paymentterms", "privacy", "quote"], yes: "quote" },

    { id: "guarantee", label: "Training & guarantee", k: ["guarantee", "warranty", "warranties", "after delivery", "after handover", "free updates", "training", "train me", "train my staff", "teach me", "how to use it", "documentation", "manual", "what if something breaks", "what if there is a bug", "quality", "quality assurance", "tested"],
      s: "Everything is <strong>tested on real devices before delivery</strong>, we <strong>train you to use it</strong> at launch and stay available for updates and help afterwards. Exact support terms go in your proposal.",
      a: function () { return P("We do not disappear after delivery:") + UL(["Clean design and clean code, tested before every delivery", "Training so you and your staff can use what we build", "Updates, fixes and hosting help are available after launch", "Support terms are confirmed in your proposal"]) + A("services.html#maintenance", "Maintenance & support", "alt") + quoteLink("", "Get a quote"); },
      next: ["maintenance", "process", "quote"], yes: "quote" },

    { id: "included", label: "What is included?", k: ["included", "what is included", "whats included", "what do i get", "what comes with", "comes with", "comes standard", "essentials", "every project", "free with", "inclusions", "what is in the price", "does it include"],
      s: "Every project includes <strong>mobile-first design, an SEO-ready structure, built-in security, domain and hosting help, an admin panel for easy content updates, and support after launch</strong>.",
      a: function () { return P("Every project comes with the essentials built in:") + UL(["<strong>Mobile-first design</strong> that works on phones, tablets and computers", "<strong>SEO-ready structure</strong> with clean code and fast pages", "<strong>Security</strong> built in, with secure sign-in and protected data", "<strong>Domain &amp; hosting help</strong>, taking your project live", "<strong>Easy content updates</strong> through an admin panel", "<strong>Support after launch</strong>"]) + A("services.html#included", "See details", "alt") + quoteLink("", "Get a quote"); },
      next: ["price", "plans", "quote"], svc: "", yes: "quote" },

    { id: "audience", label: "Who do you build for?", k: ["who do you build for", "who do you work with", "who are your clients", "who are your customers", "industries", "industry", "sectors", "kind of business", "kinds of business", "types of business", "small business", "small businesses", "startup", "startups", "ngo", "ngos", "church", "hospital", "who can use", "for my business", "my business type", "who is it for", "online shops", "schools and colleges"],
      s: "We build for <strong>small businesses, online shops, schools and colleges, real estate and property firms, booking and hospitality businesses, and startups and NGOs</strong>.",
      a: function () { return P("We build solutions for every kind of business, including:") + UL(["Small businesses", "Online shops", "Schools &amp; colleges", "Real estate &amp; property", "Booking &amp; hospitality", "Startups &amp; NGOs"]) + P("Tell us about yours and we will recommend the right solution.") + quoteLink("", "Tell us about my business"); },
      next: ["services", "price", "quote"], svc: "", yes: "quote" },

    { id: "testimonials", label: "Client reviews", k: ["testimonial", "testimonials", "review", "reviews", "feedback", "what clients say", "what customers say", "ratings", "rating", "rated", "satisfied", "happy clients", "client feedback", "recommend"],
      s: "Client stories are <strong>coming soon</strong> on our website. In the meantime, you can see our recent work in the portfolio, or ask the team to talk you through past projects.",
      a: function () { return P("We are adding client feedback to the website, so the testimonials section is <strong>coming soon</strong>.") + P("Meanwhile, the best proof is the work itself. Browse our portfolio, or ask for a call and we will talk you through relevant projects.") + A("portfolio.html", "Open portfolio", "alt") + quoteLink("", "Request a call-back"); },
      next: ["portfolio", "about", "contact"], yes: "portfolio" },

    { id: "why", label: "Why choose VYNEX?", k: ["why choose", "why choose you", "why choose vynex", "why vynex", "why you", "why should i", "why should we", "what makes you different", "what makes vynex", "better than", "competitors", "competition", "stand out", "advantages", "benefits", "unique", "not templates", "best developers", "ranked"],
      s: "<strong>10+ years of experience</strong>, custom (non-template) work, fair prices with no hidden costs, fast and secure by design, M-Pesa ready, and support after launch, with designs approved before development starts.",
      a: function () { return P("Why businesses choose <strong>VYNEX</strong>:") + UL(["<strong>Custom, never copy-paste</strong>: designed and coded around your brand", "<strong>Fast on any phone</strong>, even on mobile data", "<strong>Secure by design</strong>: secure sign-in, protected data and safe payments", "<strong>Made for Kenya</strong>: M-Pesa checkout and mobile-first layouts", "<strong>You see it before we build it</strong>: designs are approved before development", "<strong>Honest communication</strong>: clear updates and realistic timelines", "<strong>10+ years</strong> of experience, ranked among Kenya's best developers"]) + A("about.html", "About us", "alt") + quoteLink("", "Get a quote"); },
      next: ["about", "portfolio", "quote"], yes: "quote" },

    { id: "sitemap", label: "What is on this website?", k: ["site map", "sitemap", "menu", "navigation", "what pages", "pages on your website", "pages does your website", "what is on this website", "what is on your website", "where can i find", "where do i find", "which page", "find on this website", "show me around", "tour"],
      s: "This site has <strong>Home, About, Services (31), Portfolio, FAQ, Get a Quote and Contact</strong> pages, plus our Privacy Policy and Terms.",
      a: function () { return P("Here is what you can find on this website:") + UL(["<strong>Services</strong>: all 31 services explained in plain language", "<strong>Portfolio</strong>: projects we have built", "<strong>About</strong>: who we are, mission, vision and principles", "<strong>FAQ</strong>: quick answers to common questions", "<strong>Get a Quote</strong>: request your free quote and call-back", "<strong>Contact</strong>: call, WhatsApp, email or send a message"]) + A("services.html", "Services", "alt") + A("portfolio.html", "Portfolio", "alt") + A("about.html", "About", "alt") + A("faq.html", "FAQ", "alt") + A("get-quote.html", "Get a quote"); },
      next: ["services", "faq", "quote", "contact"] },

    { id: "form", label: "What is on the quote form?", k: ["quote form", "what do i fill", "what do i put", "what information do you need", "what details do you need", "form fields", "fill in the form", "how to fill", "how do i fill", "what does the form ask", "what do you ask", "fill the form", "the form"],
      s: "The quote form asks for your <strong>name, email, phone/WhatsApp number</strong>, the service you need and your requirements. Budget, timeline, how to reach you and the best time to call are optional.",
      a: function () { return P("The quote form is short:") + UL(["Name, email and <strong>phone / WhatsApp number</strong> (we call you on it)", "The <strong>service</strong> you need, from our full list", "Your <strong>project requirements</strong> in your own words", "Optional: estimated budget and preferred timeline", "How to reach you (phone call, WhatsApp or email) and the best time to call"]) + P("It is free, with no obligation, and a real developer calls you, not a call centre.") + quoteLink("", "Open the quote form"); },
      next: ["quote", "whyphone", "price"], yes: "quote" },

    /* ---------- specific services first (so they win ties against the general ones) ---------- */
    { id: "mpesa", label: "M-Pesa payments", k: ["mpesa", "m-pesa", "m pesa", "stk", "stk push", "daraja", "mobile money", "pay online", "payment", "payments", "pay with", "card payment", "paybill", "till", "lipa na mpesa"],
      a: function () { return P("Yes, we integrate <strong>M-Pesa</strong> so customers can pay the way Kenyans actually pay.") + UL(["M-Pesa STK push, the pay prompt that appears on the customer's phone", "Card and bank payments as well", "Automatic payment confirmation, history and receipts", "Secure handling of every transaction"]) + P("It works in websites, online stores, mobile apps and POS systems.") + A("services.html#mpesa", "See details", "alt") + quoteLink("M-Pesa and Payment Integrations", "Quote for payments"); },
      next: ["ecommerce", "pos", "price"], yes: "quote" },

    { id: "api", label: "API & tool integrations", k: ["api", "apis", "api integration", "api integrations", "integrate", "integration", "integrations", "third party", "third-party", "sync data", "sync", "sms", "sms integration", "bulk sms", "accounting software", "quickbooks", "google maps", "maps integration", "connect my system", "connect my tools", "connect my website"],
      s: "Yes — we connect your website or app to the tools you use (<strong>SMS, email, WhatsApp, maps, payments, accounting</strong>) so data flows automatically instead of being copied by hand.",
      a: function () { return P("We connect your product to the other tools you use:") + UL(["SMS, email and WhatsApp messaging", "Maps, delivery and payment services", "Syncing data between your systems", "Reliable error handling and logging"]) + A("services.html#api-integrations", "See details", "alt") + quoteLink("API Integrations", "Get a quote"); },
      next: ["mpesa", "systems", "price"], svc: "API Integrations", cat: "int", yes: "quote" },

    { id: "ecommerce", label: "Online stores", k: ["ecommerce", "e-commerce", "online store", "online shop", "shop online", "eshop", "e-shop", "sell online", "sell products", "store", "webshop", "cart", "checkout", "dropshipping"],
      a: function () { return P("We build <strong>e-commerce websites</strong> where customers browse, add to cart and pay with M-Pesa or card, while you manage everything from one dashboard.") + UL(["Product catalogue with categories and search", "M-Pesa and card checkout", "Order tracking and customer accounts", "Inventory, discounts and delivery fee settings"]) + A("services.html#ecommerce", "See details", "alt") + quoteLink("E-Commerce Websites", "Quote for a store"); },
      next: ["mpesa", "price", "timeline"], yes: "quote" },

    { id: "android", label: "Android apps", k: ["android", "android app", "android apps", "android application", "play store", "google play", "apk"],
      a: function () { return P("We build smooth, reliable <strong>Android apps</strong>, from customer and delivery apps to internal staff tools, and help you publish on Google Play.") + UL(["Clean, intuitive interface", "Works with M-Pesa, maps, notifications and cameras", "Online and offline-friendly where needed"]) + A("services.html#android-apps", "See details", "alt") + quoteLink("Android Application Development", "Quote for an Android app"); },
      next: ["ios", "cross", "price"], yes: "quote" },

    { id: "ios", label: "iOS apps", k: ["ios", "ios app", "ios apps", "ios application", "iphone app", "iphone apps", "iphone", "ipad", "app store", "apple", "swift"],
      a: function () { return P("We build <strong>iOS apps</strong> for iPhone and iPad that feel native, fast and polished, and guide you through App Store publishing.") + UL(["Native-feeling design", "Push notifications and secure sign-in", "Payment and API integrations", "Help preparing for App Store review"]) + A("services.html#ios-apps", "See details", "alt") + quoteLink("iOS Application Development", "Quote for an iOS app"); },
      next: ["android", "cross", "price"], yes: "quote" },

    { id: "cross", label: "Android + iOS together", k: ["cross-platform", "cross platform", "crossplatform", "both android and ios", "android and iphone", "flutter", "react native", "one codebase", "both platforms", "pwa", "progressive web app", "installable"],
      a: function () { return P("If you want to reach everyone without paying for two apps, there are two good options:") + UL(["<strong>Cross-platform app</strong>: one codebase serving both Android and iOS, with lower cost and easier maintenance", "<strong>Progressive Web App (PWA)</strong>: an app-like icon on the customer's home screen straight from your website, fast and even offline, with no store download"]) + P("We will advise which fits your budget and goals.") + A("services.html#cross-platform", "See details", "alt") + quoteLink("Cross-Platform Mobile Apps", "Get a quote"); },
      next: ["android", "ios", "price"], yes: "quote" },

    { id: "pos", label: "POS & shop systems", k: ["pos", "point of sale", "point-of-sale", "cashier", "receipt", "receipts", "supermarket", "restaurant system", "salon", "retail", "barcode"],
      a: function () { return P("Our <strong>POS systems</strong> serve customers faster and show exactly what you sold.") + UL(["Fast checkout with barcode or search", "Receipts, M-Pesa and cash payments", "Automatic stock deduction", "Daily sales and cashier reports"]) + P("Ideal for retail shops, restaurants, salons and supermarkets.") + A("services.html#pos", "See details", "alt") + quoteLink("POS Systems", "Quote for a POS"); },
      next: ["inventory", "mpesa", "price"], yes: "quote" },

    { id: "school", label: "School systems", k: ["school", "schools", "college", "student", "students", "fees", "exam", "report card", "report cards", "tuition", "parents", "teachers", "education"],
      a: function () { return P("Our <strong>School Management System</strong> replaces piles of paper with one secure system.") + UL(["Student records and class lists", "Fee tracking with balances and receipts", "Exam results and printable report cards", "Parent and teacher communication"]) + P("Suitable for primary and secondary schools, colleges and tuition centres.") + A("services.html#school-systems", "See details", "alt") + quoteLink("School Management Systems", "Quote for a school system"); },
      next: ["systems", "price", "timeline"], yes: "quote" },

    { id: "property", label: "Property systems", k: ["property", "properties", "landlord", "tenant", "tenants", "rent", "rental", "real estate", "estate agent", "lease", "apartments", "airbnb"],
      a: function () { return P("Our <strong>Property Management System</strong> tracks every unit, tenant and payment in one place.") + UL(["Units, tenants and lease records", "Rent tracking, arrears and statements", "Maintenance requests and history", "Landlord and manager reports"]) + A("services.html#property-systems", "See details", "alt") + quoteLink("Property Management Systems", "Quote for a property system"); },
      next: ["systems", "price"], yes: "quote" },

    { id: "booking", label: "Booking systems", k: ["booking", "bookings", "reservation", "reservations", "appointment", "appointments", "hotel", "guesthouse", "clinic", "book online", "schedule", "booking system", "booking systems", "reservation system", "online booking", "online booking system"],
      a: function () { return P("Our <strong>Booking and Reservation Systems</strong> let customers book a table, room, appointment or service at any hour, without a phone call.") + UL(["Online calendar with available slots", "Deposit or full payment at booking", "SMS or email confirmations and reminders", "Admin overview of all bookings"]) + P("Great for hotels, salons, clinics, guesthouses, venues and tour operators.") + A("services.html#booking-systems", "See details", "alt") + quoteLink("Booking and Reservation Systems", "Quote for bookings"); },
      next: ["mpesa", "systems", "price"], yes: "quote" },

    { id: "inventory", label: "Inventory systems", k: ["inventory", "stock", "warehouse", "pharmacy", "distributor", "stock control", "low stock"],
      a: function () { return P("Our <strong>Inventory Management Systems</strong> track every item in and out, so you always know what is in stock.") + UL(["Real-time stock levels across branches", "Low-stock alerts and reorder lists", "Supplier and purchase records", "Stock reports and loss tracking"]) + A("services.html#inventory", "See details", "alt") + quoteLink("Inventory Management Systems", "Quote for inventory"); },
      next: ["pos", "systems", "price"], yes: "quote" },

    { id: "systems", label: "Business systems", k: ["system", "systems", "software", "custom software", "management system", "business management", "erp", "crm", "dashboard", "automate", "automation", "spreadsheet", "web app", "web application", "webapp", "portal", "platform", "app"],
      a: function () { return P("Besides websites, we build the software that runs a business:") + UL(["<strong>Web applications</strong>: dashboards, portals and platforms in the browser", "<strong>Custom software</strong> built around your exact process", "<strong>Business management</strong>: customers, sales, staff, expenses and reports", "<strong>Inventory, POS, school, property and booking systems</strong>"]) + P("Tell me which one fits and I can give details, or request a quote and we will recommend the right approach.") + A("services.html#apps", "Apps & software", "alt") + quoteLink("", "Get a free quote"); },
      next: ["pos", "school", "android", "price"], yes: "quote" },

    { id: "design", label: "Design & branding", k: ["design", "ui", "ux", "ui/ux", "logo", "branding", "brand", "graphic", "graphics", "flyer", "business card", "poster", "wireframe", "prototype", "figma", "identity"],
      a: function () { return P("We offer two design services:") + UL(["<strong>UI/UX Design</strong>: wireframes, clickable prototypes and on-brand screens for websites and apps, reviewed with you before any code is written", "<strong>Graphic Design &amp; Branding</strong>: logo, colours, fonts, business cards, flyers, social media graphics and a brand guideline sheet"]) + A("services.html#ui-ux", "UI/UX", "alt") + A("services.html#branding", "Branding", "alt") + quoteLink("UI/UX Design", "Get a quote"); },
      next: ["website", "price"], yes: "quote" },

    { id: "hosting", label: "Domain, hosting & email", k: ["domain", "domains", "hosting", "host", "email address", "business email", "professional email", ".co.ke", "co.ke", ".com", "ssl", "dns", "mailbox", "website live", "deployment", "deploy", "launch", "go live"],
      a: function () { return P("Yes, we handle the technical side so you never face confusing settings:") + UL(["<strong>Domain registration</strong> (.co.ke or .com) and DNS setup", "<strong>Fast, reliable hosting</strong> with SSL (the padlock)", "<strong>Professional email</strong> such as you@yourbusiness.com, set up on your phone and computer", "<strong>Deployment</strong>: full testing, then a safe launch with forms, payments and mobile layout verified"]) + A("services.html#hosting", "See details", "alt") + quoteLink("Domain & Hosting Setup", "Get a quote"); },
      next: ["care", "price", "timeline"], yes: "quote" },

    { id: "care", label: "Security, SEO & support", k: ["seo", "ranking", "rank", "search engine", "keywords", "security", "secure", "hacked", "malware", "backup", "backups", "maintenance", "maintain", "update", "updates", "fix", "bug", "bugs", "support", "after launch", "after-sales", "aftercare", "help after"],
      a: function () { return P("A website is not a one-time purchase, so we stay with you after launch:") + UL(["<strong>Maintenance &amp; support</strong>: content updates, backups, uptime checks, bug fixes and direct help", "<strong>Security &amp; optimization</strong>: SSL, secure login, spam protection, malware clean-up and speed tuning", "<strong>SEO &amp; performance</strong>: keyword research, clean structure, Google Business Profile guidance and speed improvements", "<strong>IT consultancy</strong>: plain-language advice and troubleshooting"]) + P("Ask about support options when we speak, or when you request your quote.") + A("services.html#care", "See details", "alt") + quoteLink("Website Maintenance & Support", "Get a quote"); },
      next: ["hosting", "price", "contact"], yes: "quote" },

    { id: "chatbot", label: "Chatbots & WhatsApp", k: ["chatbot", "chat bot", "whatsapp business", "whatsapp integration", "auto reply", "automatic replies", "assistant for my website", "ai assistant", "bot for my"],
      a: function () { return P("Yes. We can add a <strong>smart assistant to your website or WhatsApp</strong> that answers common questions, captures orders and enquiries around the clock, and hands over to you for complex questions. You are talking to one right now.") + A("services.html#chatbots", "See details", "alt") + quoteLink("Chatbots & WhatsApp Business Integration", "Get one for my business"); },
      next: ["services", "price"], yes: "quote" },

    { id: "cms", label: "Edit my site myself", k: ["admin panel", "cms", "edit myself", "update myself", "change content", "manage content", "content management", "edit text", "change images", "control my website", "update the website", "update my website", "without code"],
      a: function () { return P("Yes. We can build your site with a simple, secure <strong>admin panel</strong> so you can change text, images, prices, services and contact details yourself, from any device, without touching code. Different user roles are available for staff.") + A("services.html#cms-dashboards", "See details", "alt") + quoteLink("CMS & Admin Dashboards", "Get a quote"); },
      next: ["care", "price"], yes: "quote" },

    { id: "redesign", label: "Redesign my site", k: ["redesign", "re-design", "revamp", "old website", "outdated", "refresh", "rebuild", "improve my website", "my current website", "existing website", "modernise", "modernize"],
      a: function () { return P("We can rebuild a slow, dated or hard-to-use site with a modern design <strong>while keeping the content, domain and search rankings that already work</strong> for you. That includes a visual refresh, speed and mobile improvements, content migration, and new sections or features.") + A("services.html#redesign", "See details", "alt") + quoteLink("Website Redesign & Updates", "Get a quote"); },
      next: ["care", "price", "timeline"], yes: "quote" },

    { id: "website", label: "Websites", k: ["website", "websites", "web site", "website design", "website development", "web design", "web development", "web developer", "webpage", "site", "corporate", "company website", "business website", "landing page", "landing pages", "portfolio website", "responsive", "mobile friendly", "mobile-friendly", "blog", "build me a website"],
      a: function () { return P("We design and code <strong>websites from scratch, no cheap templates</strong>, planned around what your visitors need and what you want them to do: call you, order, book or request a quote.") + UL(["Business &amp; corporate websites", "Landing pages and portfolio sites", "E-commerce stores", "Mobile-first and fast on mobile data", "Contact forms, WhatsApp and click-to-call buttons", "Basic SEO setup so Google can find you"]) + A("services.html#websites", "See details", "alt") + quoteLink("Website Design & Development", "Get a quote"); },
      next: ["price", "timeline", "cms", "ecommerce"], yes: "quote" },

    /* ---------- general topics ---------- */
    { id: "services", label: "What services do you offer?", k: ["service", "services", "offer", "offers", "what do you do", "what you do", "what can you build", "what do you build", "do you build", "capabilities", "solutions", "products", "all services", "list of services", "portfolio of services", "31"],
      a: function () { return P("VYNEX offers <strong>31 services</strong> across web, Android and iOS:") + UL(["<strong>Websites &amp; online stores</strong>: business sites, e-commerce, landing pages, redesigns, admin dashboards", "<strong>Mobile apps &amp; software</strong>: Android, iOS, cross-platform, PWA, web apps, custom software, POS, inventory, school, property and booking systems", "<strong>Payments, integrations &amp; design</strong>: M-Pesa, API integrations, UI/UX, branding, chatbots &amp; WhatsApp", "<strong>Hosting, security &amp; growth</strong>: domain &amp; hosting, deployment, maintenance, security, SEO, business email, IT consultancy"]) + P("Ask me about any of them, or browse the full list.") + A("services.html", "All services", "alt") + quoteLink("", "Get a quote"); },
      next: ["website", "android", "systems", "mpesa"], yes: "quote" },

    { id: "price", label: "How much does it cost?", k: ["price", "prices", "pricing", "cost", "costs", "how much", "charge", "charges", "rates", "rate", "quotation", "bei", "gharama", "bei gani", "pesa ngapi", "hidden costs", "price list", "how much is", "how much does"],
      a: function () { return P("Every project is different, so VYNEX <strong>quotes per project</strong> rather than using a fixed price list. Quotes are fair and upfront, with <strong>no hidden costs</strong>, and the work is designed to fit small businesses and growing companies alike.") + P("Tell us your goals and budget, and we will recommend what fits. The quote is <strong>free with no obligation</strong>.") + quoteLink("", "Get my free quote"); },
      next: ["quote", "timeline", "contact"], yes: "quote" },

    { id: "quote", label: "Get a free quote", k: ["quote", "quotes", "get started", "start a project", "start project", "new project", "proposal", "hire", "hire you", "work with you", "work with us", "order", "request", "estimate", "begin", "how do i start", "how to start", "interested", "sign up", "free consultation", "consultation", "free call", "book a call", "meeting", "free advice", "get a website", "need a website", "want a website", "need an app", "want an app"],
      a: function () { return P("Getting started is simple:") + UL(["Fill in the <strong>quote form</strong> with your phone number and a short description of what you need", "A VYNEX developer <strong>calls you</strong>, asks a few questions and understands your idea", "You receive a <strong>clear proposal</strong> with scope, timeline and price"]) + P("It is free, with no obligation, and your details are used only to prepare your quote.") + quoteLink("", "Request my free quote"); },
      next: ["price", "timeline", "contact"], yes: "contact" },

    { id: "timeline", label: "How long does it take?", k: ["how long", "timeline", "time frame", "timeframe", "duration", "deadline", "turnaround", "turn around", "when ready", "how soon", "how fast", "delivery time", "weeks", "days", "urgent", "urgently", "quickly", "asap", "how fast", "fast can you"],
      a: function () { return P("It depends on the size and complexity. <strong>A simple website is much quicker than a custom system or app.</strong> You will receive an estimated timeline in your proposal, and we give honest timelines, with progress shared at every stage, so there are no surprises.") + P("If you have a deadline, mention it when you request your quote.") + quoteLink("", "Request a quote"); },
      next: ["process", "price"], yes: "quote" },

    { id: "process", label: "How do you work?", k: ["process", "how do you work", "how it works", "how does it work", "steps", "workflow", "methodology", "stages", "approach", "procedure", "what happens"],
      a: function () { return P("Our process has <strong>four clear steps</strong>:") + UL(["<strong>Discover</strong>: we listen to your business, goals and customers, then agree scope, features and budget", "<strong>Design</strong>: you review wireframes and the visual design before any code is written, and we refine until you love it", "<strong>Develop</strong>: we build, test on real devices and share progress at every stage", "<strong>Launch &amp; support</strong>: we take it live, train you to use it and stay available for updates and help"]) + quoteLink("", "Start with a free quote"); },
      next: ["timeline", "price", "care"], yes: "quote" },

    { id: "about", label: "About VYNEX", k: ["about you", "about us", "about vynex", "about the company", "about company", "company", "who is vynex", "what is vynex", "vynex", "tell me about yourself", "background", "history", "experience", "years", "how long have you been", "how many years", "years in business", "since when", "how old is", "established", "team", "who are we", "mission", "vision", "values", "why choose", "why vynex", "why you", "trust", "reliable", "legit", "genuine"],
      a: function () { return P("<strong>VYNEX Web Solutions</strong> is a website development and digital solutions company serving clients in Kenya and internationally. The team has over <strong>10 years</strong> of experience building websites, Android and iOS apps and business systems.") + UL(["<strong>Mission</strong>: turn your ideas into a powerful online presence, with quality websites at prices that fit your budget", "<strong>Promise</strong>: Your Vision, Our Code, Your Success", "Honest, affordable pricing; clean, secure code; support after launch", "100% responsive on every device, M-Pesa ready"]) + A("about.html", "About us", "alt") + A("portfolio.html", "Our work", "alt"); },
      next: ["services", "portfolio", "quote"], yes: "services" },

    { id: "portfolio", label: "See your work", k: ["portfolio", "projects", "project", "past work", "previous work", "your work", "examples", "example", "samples", "sample", "case study", "case studies", "clients", "references", "recent work", "showcase", "demo"],
      a: function () {
        var intro = P("Here is a look at what we have built.");
        var tail = A("portfolio.html", "Open portfolio", "alt") + quoteLink("", "Start your project");
        if (!window.vynexDb) return intro + tail;
        return window.vynexDb.from("projects").select("title,category").eq("is_published", true).order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(5)
          .then(function (r) {
            if (!r || r.error || !r.data || !r.data.length) return P("Our latest projects are on the portfolio page, and new ones are being added regularly.") + tail;
            return P("Some of our recent projects:") + UL(r.data.map(function (p) { return "<strong>" + esc(p.title) + "</strong>" + (p.category ? " (" + esc(p.category) + ")" : ""); })) + tail;
          }, function () { return intro + tail; });
      },
      next: ["services", "quote", "contact"], yes: "quote" },

    { id: "outside", label: "Clients outside Kenya", k: ["outside kenya", "international", "internationally", "abroad", "overseas", "worldwide", "uganda", "tanzania", "rwanda", "nigeria", "south africa", "usa", "uk", "remote", "other countries", "country", "diaspora", "foreign"],
      a: function () { return P("Yes. VYNEX is based in Kenya and <strong>works with clients in Kenya and internationally</strong>. Projects, calls and support can all happen remotely.") + quoteLink("", "Request a quote"); },
      next: ["price", "contact"], yes: "quote" },

    { id: "tech", label: "Technologies you use", k: ["technology", "technologies", "tech stack", "stack", "framework", "frameworks", "language", "languages", "javascript", "html", "css", "database", "supabase", "postgresql", "react", "php", "wordpress", "laravel", "node", "template", "templates"],
      a: function () { return P("We write <strong>custom code, not cheap templates</strong>. Our toolbox includes HTML5, CSS3, JavaScript, GSAP animations, Supabase and PostgreSQL databases, Android and iOS, M-Pesa and REST API integrations, and cloud hosting. We choose the right tools for each project and explain them in plain language.") + quoteLink("", "Discuss my project"); },
      next: ["services", "price"], yes: "quote" },

    { id: "privacy", label: "Is my data safe?", k: ["privacy", "data protection", "personal data", "my data", "my details", "confidential", "confidentiality", "nda", "policy", "data safely", "handle data", "data safe", "keep my data", "safe with you", "my information", "personal information", "is it safe to share", "sensitive information", "gdpr", "safe to share", "phone number why"],
      a: function () { return P("Your details are used only to prepare your quote and respond to your enquiry, and are visible only to authorised administrators. We do not sell personal information, and we handle data in line with applicable laws, including Kenya's Data Protection Act, 2019.") + A("privacy-policy.html", "Privacy policy", "alt") + A("terms.html", "Terms", "alt"); },
      next: ["quote", "contact"], yes: "quote" },

    { id: "faq", label: "More questions", k: ["faq", "faqs", "questions", "frequently asked", "question", "ask"],
      a: function () { return P("Our FAQ page covers apps, M-Pesa, domains and hosting, timelines, pricing, support and working with clients outside Kenya. You can also just ask me here.") + A("faq.html", "Open FAQ", "alt"); },
      next: ["price", "timeline", "mpesa", "contact"] },

    /* ---------- contact ---------- */
    { id: "contact", label: "Contact details", k: ["contact", "contacts", "contact details", "contact info", "reach", "reach you", "get in touch", "touch", "phone", "phone number", "number", "call", "telephone", "mobile number", "whatsapp", "whatsapp number", "email", "e-mail", "mail", "email address", "message", "dm", "social", "instagram", "tiktok", "twitter", "x", "facebook", "address", "where are you", "location", "located", "office", "visit", "based", "find you", "hours", "open", "opening hours", "working hours", "available", "mawasiliano", "nambari", "simu"],
      a: function () {
        var rows = [];
        if (company.phone) rows.push("Phone: <strong>" + esc(company.phone) + "</strong>");
        if (company.whatsapp) rows.push("WhatsApp: <strong>" + esc(company.whatsapp) + "</strong>");
        if (company.email) rows.push("Email: <strong>" + esc(company.email) + "</strong>");
        if (company.location) rows.push("Location: <strong>" + esc(company.location) + "</strong>");
        var soc = [];
        [["social_instagram", "instagram", "Instagram"], ["social_tiktok", "tiktok", "TikTok"], ["social_twitter", "x", "X"]].forEach(function (s) {
          var h = company[s[0]] && href(s[1], company[s[0]]);
          if (h && /^https?:/i.test(h)) soc.push(A(h, s[2], "alt"));
        });
        return P("Here is how to reach VYNEX:") + UL(rows) + contactButtons() + (soc.length ? P("Follow us:") + soc.join("") : "") +
          P("Prefer a call-back? Leave your number on the quote form and choose the best time (morning, afternoon, evening or anytime).") + quoteLink("", "Request call-back") + A("contact.html", "Contact page", "alt");
      },
      next: ["quote", "services", "price"] }
  ];

  var BYID = {};
  KB.forEach(function (e) { BYID[e.id] = e; });
  var STARTERS = ["services", "price", "timeline", "quote", "plans", "contact"];

  /* ------------------------------------------------------------------ SHORT ANSWERS
     Every topic has a short answer (s). The assistant replies short first, with a "More details" chip that shows the full answer (a).
     Visitors can also type "more", "details" or "explain". Topics below had only full answers; their short versions live here. */
  var SHORT = {
    mpesa: "Yes — we integrate <strong>M-Pesa STK push</strong>, plus card and bank payments, into websites, stores, apps and POS systems, with automatic confirmations and receipts.",
    ecommerce: "Yes — we build online stores with a product catalogue, <strong>M-Pesa and card checkout</strong>, order tracking and a dashboard to manage stock and orders.",
    android: "Yes — we build <strong>Android apps</strong> (customer, delivery or staff apps) and help you publish on Google Play.",
    ios: "Yes — we build polished <strong>iPhone and iPad apps</strong> and guide you through App Store publishing.",
    cross: "Yes — one <strong>cross-platform app</strong> can serve both Android and iOS at lower cost, or a PWA gives an app-like icon with no store download. We will advise what fits your budget.",
    pos: "Yes — our <strong>POS systems</strong> handle fast checkout, receipts, M-Pesa and cash payments, automatic stock deduction and daily sales reports.",
    school: "Yes — our <strong>school system</strong> covers student records, fee tracking, exam results, report cards and parent communication.",
    property: "Yes — our <strong>property system</strong> tracks units, tenants, leases, rent and arrears, maintenance requests and reports.",
    booking: "Yes — customers can <strong>book online 24/7</strong> with a live calendar, optional deposit, SMS or email reminders and an admin view of all bookings.",
    inventory: "Yes — <strong>real-time stock levels</strong> across branches, low-stock alerts, supplier records and stock reports.",
    systems: "Yes — besides websites we build <strong>web apps, custom software and business systems</strong> (inventory, POS, school, property, booking).",
    design: "We offer <strong>UI/UX design</strong> (wireframes, prototypes, website and app screens) and <strong>graphic design &amp; branding</strong> (logo, colours, business cards, flyers, social graphics).",
    hosting: "Yes — we register your <strong>.co.ke or .com domain</strong>, set up fast hosting with SSL, create email on your domain and hand over all accounts clearly.",
    care: "Yes — after launch we offer <strong>maintenance and support, security and speed work, SEO and IT advice</strong>.",
    chatbot: "Yes — we can add a <strong>smart assistant to your website or WhatsApp</strong> that answers common questions and captures orders and enquiries 24/7.",
    cms: "Yes — we can build a secure <strong>admin panel</strong> so you can change text, images, prices and contact details yourself, with no code.",
    redesign: "Yes — we rebuild slow or dated sites with a <strong>modern design</strong> while keeping your content, domain and search rankings.",
    website: "We design and code <strong>custom websites, no cheap templates</strong>: business sites, landing pages, portfolios and stores, fast on mobile, with contact forms, WhatsApp buttons and basic SEO.",
    services: "We offer <strong>31 services</strong>: websites &amp; stores, Android/iOS/web apps and business systems, M-Pesa &amp; integrations, UI/UX and branding, plus hosting, security, SEO and support.",
    price: "Every project is <strong>quoted individually</strong>: no fixed price list and no hidden costs. The quote is <strong>free, with no obligation</strong>.",
    quote: "Fill in the quote form with your phone number and a short description. A VYNEX developer <strong>calls you</strong>, then you get a clear proposal with scope, timeline and price. Free.",
    timeline: "As a rough guide: a <strong>simple website takes about 1–3 weeks</strong>, stores and larger sites several weeks, and apps or systems 1–4 months. Your proposal confirms the exact timeline.",
    process: "Four steps: <strong>Discover → Design → Develop → Launch &amp; support</strong>. You approve the design before any code is written.",
    about: "<strong>VYNEX Web Solutions</strong> is a Kenya-based web and app development company with <strong>10+ years</strong> of experience, serving Kenya and international clients. <em>Your Vision, Our Code, Your Success.</em>",
    outside: "Yes — we work with clients <strong>in Kenya and internationally</strong>, with calls, projects and support all done remotely.",
    tech: "We write <strong>custom code, not templates</strong>: HTML5, CSS3, JavaScript, GSAP, Supabase/PostgreSQL, Android, iOS, M-Pesa and REST APIs.",
    privacy: "Your details are used <strong>only to prepare your quote</strong>, are visible only to authorised admins, are never sold, and are handled under Kenya's Data Protection Act, 2019.",
    human: "Yes — leave your number on the quote form for a <strong>free call-back</strong> from a VYNEX developer, or reach the team directly.",
    faq: "The FAQ page covers apps, M-Pesa, domains and hosting, timelines, pricing, support and clients outside Kenya. Or just ask me here.",
    portfolio: function () { return P("You can browse our recent projects on the portfolio page.") + A("portfolio.html", "Open portfolio", "alt") + quoteLink("", "Start your project"); },
    contact: function () {
      var bits = [];
      if (company.phone) bits.push("call <strong>" + esc(company.phone) + "</strong>");
      if (company.whatsapp) bits.push("WhatsApp <strong>" + esc(company.whatsapp) + "</strong>");
      if (company.email) bits.push("email <strong>" + esc(company.email) + "</strong>");
      return P("You can " + (bits.length ? bits.join(", ") : "reach us through the contact page") + ". We are based in Kenya and serve clients worldwide.") + contactButtons();
    }
  };
  // Service name used by the "Get a free quote" button on short answers (must match the quote form options). "" = general quote.
  var SVC = {
    mpesa: "M-Pesa and Payment Integrations", ecommerce: "E-Commerce Websites", android: "Android Application Development", ios: "iOS Application Development",
    cross: "Cross-Platform Mobile Apps", pos: "POS Systems", school: "School Management Systems", property: "Property Management Systems",
    booking: "Booking and Reservation Systems", inventory: "Inventory Management Systems", systems: "", design: "UI/UX Design", hosting: "Domain & Hosting Setup",
    care: "Website Maintenance & Support", chatbot: "Chatbots & WhatsApp Business Integration", cms: "CMS & Admin Dashboards", redesign: "Website Redesign & Updates",
    website: "Website Design & Development", services: "", price: "", quote: "", timeline: "", process: "", human: "", outside: "", tech: ""
  };
  // Service group: lets "how much is an Android app?" or "how long for a school system?" get a specific answer.
  var CAT = {
    website: "web", ecommerce: "web", redesign: "web", cms: "web",
    android: "app", ios: "app", cross: "app",
    systems: "system", pos: "system", school: "system", property: "system", booking: "system", inventory: "system",
    mpesa: "int", chatbot: "int", design: "design", hosting: "care", care: "care"
  };
  Object.keys(SHORT).forEach(function (id) { if (BYID[id] && !BYID[id].s) BYID[id].s = SHORT[id]; });
  Object.keys(SVC).forEach(function (id) { if (BYID[id] && BYID[id].svc === undefined) BYID[id].svc = SVC[id]; });
  Object.keys(CAT).forEach(function (id) { if (BYID[id] && !BYID[id].cat) BYID[id].cat = CAT[id]; });

  /* ------------------------------------------------------------------ PRICE & TIME GUIDANCE (edit these)
     The website does not publish fixed prices, so by default the assistant explains what drives the price and says every quote is free.
     To show a "from" price, fill in PRICE_FROM, for example  web: "KES 25,000"  (leave "" to keep quoting per project).
     TIME_GUIDE holds rough time estimates; change them to match how your team really works. */
  var PRICE_FROM = { web: "", app: "", system: "", int: "", design: "", care: "" };
  var PRICE_DRIVERS = {
    web: "the number of pages, the features you need (online store, bookings, login, admin panel) and the design",
    app: "the features, whether it is Android, iOS or both, and the number of screens and user types",
    system: "how many users, modules and reports you need and how closely it must follow your process",
    int: "which payment methods or tools are connected and how many systems are involved",
    design: "how many screens or items need designing and how much you need delivered",
    care: "the size of your site and the level of support you need"
  };
  var TIME_GUIDE = {
    web: "A simple website typically takes about <strong>1–3 weeks</strong>; larger sites take longer.",
    app: "A mobile app typically takes <strong>2–4 months or more</strong>, depending on features; a PWA is usually quicker.",
    system: "A business system typically takes <strong>1–3 months</strong>, depending on the modules you need.",
    int: "Integrations usually take <strong>days to a couple of weeks</strong>, depending on approvals from the payment or service provider.",
    design: "UI/UX or branding work usually takes <strong>1–3 weeks</strong>.",
    care: "Domain, hosting and email setup is usually done within <strong>a few days</strong>; maintenance, security and SEO work is ongoing or per task."
  };
  var TIME_BY_ID = {
    landing: "A landing page is quick: often <strong>a few days to about 2 weeks</strong>.",
    ecommerce: "An online store typically takes about <strong>3–8 weeks</strong>.",
    pwa: "A PWA is usually quicker than a native app: roughly <strong>1–2 months</strong>.",
    redesign: "A redesign typically takes about <strong>2–6 weeks</strong>, depending on the size of the site.",
    deploy: "Launch and deployment usually takes <strong>a few days</strong>.",
    email: "Business email setup is usually done within <strong>a day or two</strong>."
  };
  function priceText(e) {
    var from = PRICE_FROM[e.cat];
    return "Pricing for <strong>" + e.label + "</strong> is not a fixed list. It depends on " + PRICE_DRIVERS[e.cat] + "." +
      (from ? " Projects typically start from <strong>" + esc(from) + "</strong>." : " Quotes are free, with no hidden costs.");
  }
  function timeText(e) { return (TIME_BY_ID[e.id] || TIME_GUIDE[e.cat]) + " Your proposal confirms the exact timeline."; }
  function aspectReply(asp, e) {
    return (asp.price ? P(priceText(e)) : "") + (asp.time ? P(timeText(e)) : "") + quoteLink(e.svc || "", "Get a free quote");
  }
  function shortHtml(e) {
    if (typeof e.s === "function") return e.s();
    return P(e.s) + (e.svc !== undefined ? quoteLink(e.svc, "Get a free quote") : "");
  }
  function fullHtml(e) { return typeof e.a === "function" ? e.a() : e.a; }

  /* ------------------------------------------------------------------ matching (keyword + typo tolerance) */
  function norm(s) { return " " + String(s).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9.+/ -]+/g, " ").replace(/\.+(?= |$)/g, "").replace(/\s+/g, " ").trim() + " "; }
  function stem(w) { return w.length > 4 ? w.replace(/(ing|ed)$/, "").replace(/([^s])s$/, "$1") : w; }
  function transp(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length - 1; i++) if (a[i] !== b[i]) return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); return false; }
  function lev(a, b) {
    if (a === b) return 0; if (transp(a, b)) return 1; if (Math.abs(a.length - b.length) > 2) return 9;
    var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) { var prev = p[0]; p[0] = i; for (j = 1; j <= b.length; j++) { var t = p[j]; p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
    return p[b.length];
  }
  var indexed = KB.map(function (e) {
    return { e: e, kw: e.k.map(function (k) { var n = norm(k).trim(); return { raw: n, phrase: n.indexOf(" ") > -1, stem: stem(n) }; }) };
  });
  // Scores every topic for a message; best first (ties keep the order of the KB array, so put specific topics earlier).
  function rank(text) {
    var n = norm(text), toks = n.trim().split(" ").filter(Boolean), stems = toks.map(stem), out = [];
    indexed.forEach(function (it) {
      var s = 0, used = {};                                  // each word of the message can score only once per topic
      it.kw.forEach(function (k) {
        if (k.phrase) { if (n.indexOf(" " + k.raw + " ") > -1) s += 2 + k.raw.split(" ").length; return; }
        for (var i = 0; i < stems.length; i++) {
          if (used[i]) continue;
          if (stems[i] === k.stem || toks[i] === k.raw) { s += 2; used[i] = 1; return; }
          if (k.stem.length >= 5 && stems[i].length >= 5 && lev(stems[i], k.stem) <= (k.stem.length >= 8 ? 2 : 1)) { s += 1.3; used[i] = 1; return; }
        }
      });
      if (s >= 1.3) out.push({ e: it.e, s: s });
    });
    return out.sort(function (a, b) { return b.s - a.s; });
  }
  function match(text) {
    var r = rank(text), i;
    for (i = 0; i < r.length; i++) if (!r[i].e.low) return r[i].e;
    return r.length ? r[0].e : null;
  }
  var YES = /^(yes|yeah|yep|yup|sure|ok|okay|alright|please|go ahead|do it|ndio|sawa|yes please)\b/;
  // "more", "details", "explain in detail", "can you tell me more about that please"... (no new topic named, so it refers to the last answer)
  var MORE_FILLER = { please: 1, tell: 1, me: 1, in: 1, can: 1, you: 1, could: 1, give: 1, go: 1, on: 1, that: 1, it: 1, this: 1, about: 1, the: 1, a: 1, bit: 1, little: 1, some: 1, i: 1, want: 1, need: 1, to: 1, know: 1, would: 1, like: 1, show: 1, full: 1, and: 1, thanks: 1, ok: 1, okay: 1 };
  var MORE_CORE = { more: 1, detail: 1, details: 1, detailed: 1, explain: 1, elaborate: 1, expand: 1, info: 1, information: 1, everything: 1 };
  function isMoreRequest(t) {
    var w = t.split(" ").filter(Boolean), core = false;
    for (var i = 0; i < w.length; i++) { if (MORE_CORE[w[i]]) core = true; else if (!MORE_FILLER[w[i]]) return false; }
    return core;
  }
  var WANT_FULL = /\b(in detail|detailed|elaborate|explain|full details?|more details?|more info|more information|tell me more|everything about|all about)\b/;

  function fallback() {
    return P("I am not sure I have that one yet. I can help with <strong>VYNEX services, pricing, timelines, process, plans and contact details</strong>. Pick a topic below, or speak to the team directly:") + contactButtons() + quoteLink("", "Request call-back");
  }

  // Returns { id, full?, more?, last?, html?, next? }.
  function reply(text) {
    var t = norm(text).trim(), last = state.last && BYID[state.last];
    if (YES.test(t) && last && last.yes) return { id: last.yes };
    if (isMoreRequest(t)) return last ? { id: last.id, full: true } : { html: P("Sure. What would you like to know more about? Pick a topic below, or type your question."), next: STARTERS };

    var r = rank(text), asp = { price: 0, time: 0 }, svc = null;
    r.forEach(function (x) {
      if (x.e.id === "price" && x.s >= 1.3) asp.price = 1;
      else if (x.e.id === "timeline" && x.s >= 1.3) asp.time = 1;
      else if (!svc && x.e.cat && !x.e.low) svc = x.e;
    });
    var next = ["quote", "plans", "contact"];
    if ((asp.price || asp.time) && svc)                       // "how much is an app?", "how long for a school system?"
      return { html: aspectReply(asp, svc), more: svc.id, last: svc.id, next: asp.price && asp.time ? next : [asp.price ? "timeline" : "price", "pricefactors", "quote"] };
    if (asp.price && asp.time)                                // "how much and how long?"
      return { html: P(BYID.price.s) + P(BYID.timeline.s) + quoteLink("", "Get a free quote"), next: ["pricefactors", "plans", "quote"], last: "price" };

    var m = match(text);
    if (m) return { id: m.id, full: WANT_FULL.test(t) };
    if (WANT_FULL.test(t) && last) return { id: last.id, full: true };
    if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text) || /(\+?\d[\d\s-]{8,})/.test(text))
      return { html: P("Thank you. I cannot pass messages on from here, so please share your details through the quote form and a VYNEX developer will call you back, or contact the team directly:") + quoteLink("", "Open quote form") + contactButtons(), next: ["contact"] };
    return { html: fallback(), next: STARTERS.slice(0, 5) };
  }

  /* ------------------------------------------------------------------ robot drawing */
  var DEFS = '<svg class="vxa-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="vxa-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b9bff"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>' +
    '<linearGradient id="vxa-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4bb8"/><stop offset="1" stop-color="#2a2f86"/></linearGradient>' +
    '<linearGradient id="vxa-eye" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7fbff"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>' +
    '<radialGradient id="vxa-glow"><stop offset="0" stop-color="#22d3ee" stop-opacity=".55"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>' +
    "</defs></svg>";

  function robot(opts) {
    opts = opts || {};
    return '<svg class="vxa-svg' + (opts.still ? " still" : "") + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<g class="r-ant"><path d="M32 13V6" stroke="#9db4ff" stroke-width="2.4" stroke-linecap="round"/><circle class="r-led" cx="32" cy="4.6" r="3" fill="#22d3ee"/></g>' +
      '<path d="M18 64c0-8 6-11 14-11s14 3 14 11z" fill="url(#vxa-g2)" stroke="rgba(255,255,255,.22)" stroke-width="1"/>' +
      '<rect x="28" y="49" width="8" height="6" rx="2" fill="#2a2f86"/>' +
      '<g class="r-head">' +
        '<rect x="5" y="27" width="6" height="14" rx="3" fill="url(#vxa-g2)"/><rect x="53" y="27" width="6" height="14" rx="3" fill="url(#vxa-g2)"/>' +
        '<rect x="10" y="12" width="44" height="38" rx="14" fill="url(#vxa-g1)" stroke="rgba(255,255,255,.4)" stroke-width="1"/>' +
        '<path d="M17 19c4-4 10-5 15-5" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linecap="round" fill="none"/>' +
        '<rect x="15" y="21" width="34" height="22" rx="9" fill="#070a1f" stroke="rgba(34,211,238,.5)" stroke-width="1"/>' +
        '<ellipse class="r-glow" cx="24" cy="31" rx="9" ry="9" fill="url(#vxa-glow)"/><ellipse class="r-glow" cx="40" cy="31" rx="9" ry="9" fill="url(#vxa-glow)"/>' +
        '<g class="r-look"><rect class="r-eye" x="20.5" y="26" width="7" height="9" rx="3.5" fill="url(#vxa-eye)"/><rect class="r-eye e2" x="36.5" y="26" width="7" height="9" rx="3.5" fill="url(#vxa-eye)"/></g>' +
        '<path class="r-mouth" d="M27 38.5q5 3.4 10 0" stroke="#22d3ee" stroke-width="1.9" stroke-linecap="round" fill="none"/>' +
      "</g>" +
      (opts.wave ? '<g class="r-hand"><circle cx="55" cy="52" r="4.6" fill="url(#vxa-g1)" stroke="rgba(255,255,255,.5)" stroke-width="1"/><path d="M52.6 49.6l-1.4-2.6M55 48.2v-3M57.4 49.6l1.6-2.4" stroke="#9db4ff" stroke-width="1.6" stroke-linecap="round"/></g>' : "") +
    "</svg>";
  }
  var ICON = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>',
    min: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>'
  };

  /* ------------------------------------------------------------------ state + storage */
  var state = { open: false, log: [], last: null, greeted: false, seen: false };
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify({ open: state.open, log: state.log.slice(-40), last: state.last, greeted: state.greeted, seen: state.seen })); } catch (e) {} }
  function restore() {
    try { var s = JSON.parse(sessionStorage.getItem(STORE) || "null"); if (s && Array.isArray(s.log)) { state.open = !!s.open; state.log = s.log; state.last = s.last || null; state.greeted = !!s.greeted; state.seen = !!s.seen; } } catch (e) {}
  }

  // Only a small set of tags/attributes may be rendered, even for text restored from storage.
  var OKTAG = { P: 1, UL: 1, LI: 1, STRONG: 1, EM: 1, A: 1, BR: 1 };
  function clean(html) {
    var doc = new DOMParser().parseFromString("<body>" + html + "</body>", "text/html"), out = document.createDocumentFragment();
    (function walk(src, dst) {
      Array.prototype.forEach.call(src.childNodes, function (n) {
        if (n.nodeType === 3) { dst.appendChild(document.createTextNode(n.nodeValue)); return; }
        if (n.nodeType !== 1) return;
        if (!OKTAG[n.tagName]) { walk(n, dst); return; }
        var el = document.createElement(n.tagName.toLowerCase());
        if (n.tagName === "A") {
          var h = n.getAttribute("href") || "";
          if (!/^(https?:|tel:|mailto:|[a-z0-9_.-]+\.html)/i.test(h)) { walk(n, dst); return; }
          el.setAttribute("href", h);
          var c = (n.getAttribute("class") || "").match(/vxa-cta( alt| wa)?/); if (c) el.className = c[0];
          if (/^https?:/i.test(h)) { el.target = "_blank"; el.rel = "noopener noreferrer"; }
        }
        walk(n, el); dst.appendChild(el);
      });
    })(doc.body, out);
    return out;
  }

  /* ------------------------------------------------------------------ UI */
  var root, fab, panel, logEl, chipsEl, form, input, sendBtn, greet, badge, typingEl, busy = false, actionsEl;

  var net;

  /* Live network over the photo: drifting glowing nodes, faint links between neighbours and small
     "data pulses" that travel along the links. Runs only while the chat is open and the tab is visible. */
  function makeNet(canvas) {
    var ctx = canvas.getContext("2d"), W = 0, H = 0, dpr = 1, nodes = [], pulses = [], links = [];
    var raf = 0, last = 0, spawn = 0, running = false, t0 = 0;
    var COLS = [[34, 211, 238], [96, 165, 250], [139, 130, 255], [167, 139, 250]], sprites = [];
    COLS.forEach(function (c) {                          // pre-rendered soft glow per colour (cheap to draw)
      var cv = document.createElement("canvas"); cv.width = cv.height = 64;
      var g = cv.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.18, "rgba(" + c + ",.95)");
      r.addColorStop(.5, "rgba(" + c + ",.28)"); r.addColorStop(1, "rgba(" + c + ",0)");
      g.fillStyle = r; g.fillRect(0, 0, 64, 64); sprites.push(cv);
    });

    function size() {
      var w = canvas.offsetWidth, h = canvas.offsetHeight; if (!w || !h) return false;   // layout size (ignores the open animation's scale)
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      if (w === W && h === H && nodes.length) return true;
      W = w; H = h; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed(); return true;
    }
    function seed() {
      var n = Math.max(26, Math.min(52, Math.round(W * H / 8200)));
      nodes = [];
      for (var i = 0; i < n; i++) {
        var x = Math.random() * W, ridge = .4 + .06 * Math.sin(x / W * 6.2);         // wavy "horizon", like the photo
        var y = H * (ridge + (1 - ridge) * Math.pow(Math.random(), .85));
        nodes.push({ x: x, y: y, vx: (Math.random() - .5) * 9, vy: (Math.random() - .5) * 6, ph: Math.random() * 6.28,
          sp: .6 + Math.random() * 1.4, r: .7 + Math.random() * 1.9, c: (Math.random() * COLS.length) | 0, fl: 0 });
      }
      pulses = [];
    }
    function frame(ts) {
      if (!running) return;
      if (panel.hidden || document.hidden) { running = false; raf = 0; return; }
      var dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; var t = (ts - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      var D = Math.max(78, Math.min(150, Math.max(W, H) * .2)), D2 = D * D, i, j, a, b;
      for (i = 0; i < nodes.length; i++) {                     // move
        a = nodes[i]; a.x += (a.vx + Math.sin(t * .35 + a.ph) * 3) * dt; a.y += (a.vy + Math.cos(t * .3 + a.ph) * 2.2) * dt;
        if (a.x < -10) a.x = W + 10; else if (a.x > W + 10) a.x = -10;
        if (a.y < H * .3) a.vy = Math.abs(a.vy); else if (a.y > H + 6) a.vy = -Math.abs(a.vy);
        if (a.fl > 0) a.fl = Math.max(0, a.fl - dt * 1.8);
      }
      links.length = 0; ctx.lineWidth = .7;
      for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
        a = nodes[i]; b = nodes[j]; var dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > D2) continue;
        var k = 1 - Math.sqrt(d2) / D, hot = Math.max(a.fl, b.fl);
        ctx.strokeStyle = "rgba(" + (hot > .05 ? "150,200,255" : "110,140,255") + "," + (k * (.34 + hot * .5)).toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (links.length < 160) links.push(a, b);
      }
      spawn -= dt;
      if (spawn <= 0 && links.length && pulses.length < 9) {   // launch a data pulse along a random link
        var q = ((Math.random() * (links.length / 2)) | 0) * 2, fwd = Math.random() < .5;
        pulses.push({ a: fwd ? links[q] : links[q + 1], b: fwd ? links[q + 1] : links[q], p: 0, s: .55 + Math.random() * .6, c: (Math.random() * COLS.length) | 0 });
        spawn = .22 + Math.random() * .4;
      }
      for (i = 0; i < nodes.length; i++) {                     // nodes
        a = nodes[i]; var tw = .55 + .45 * Math.sin(t * a.sp + a.ph), sz = (a.r * 7 + a.fl * 9) * (.85 + tw * .3);
        ctx.globalAlpha = Math.min(1, .35 + tw * .5 + a.fl); ctx.drawImage(sprites[a.c], a.x - sz, a.y - sz, sz * 2, sz * 2);
      }
      for (i = pulses.length - 1; i >= 0; i--) {               // pulses
        var u = pulses[i]; u.p += dt * u.s;
        if (u.p >= 1) { u.b.fl = 1; pulses.splice(i, 1); continue; }
        var px = u.a.x + (u.b.x - u.a.x) * u.p, py = u.a.y + (u.b.y - u.a.y) * u.p;
        ctx.globalAlpha = .95; ctx.drawImage(sprites[u.c], px - 9, py - 9, 18, 18);
        ctx.globalAlpha = .35; ctx.drawImage(sprites[u.c], px - (u.b.x - u.a.x) * .05 - 6, py - (u.b.y - u.a.y) * .05 - 6, 12, 12);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || !size()) return;
      if (reduce) { running = true; last = 0; t0 = performance.now(); frame(t0 + 16); running = false; return; }   // one still frame
      running = true; last = 0; t0 = t0 || performance.now(); raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    addEventListener("resize", function () { if (!panel.hidden) { W = 0; if (size() && !running) start(); } });
    document.addEventListener("visibilitychange", function () { if (!document.hidden && !panel.hidden) start(); });
    return { start: start, stop: stop };
  }

  function build() {
    root = document.createElement("div");
    root.className = "vxa-root";
    root.innerHTML = DEFS +
      '<div class="vxa-greet" hidden role="status"><button class="vxa-greet-x" type="button" aria-label="Dismiss">&times;</button>Hi, I am the <b>VYNEX Assistant</b>. Ask me about our services, pricing or how to reach us.</div>' +
      '<section class="vxa-panel" id="vxa-panel" role="dialog" aria-label="VYNEX Assistant chat" hidden>' +
        '<div class="vxa-bg" aria-hidden="true"><span class="vxa-photo"></span><span class="vxa-photo p2"></span><canvas class="vxa-net"></canvas><span class="vxa-sweep"></span><span class="vxa-shade"></span></div>' +
        '<header class="vxa-head"><div class="vxa-avatar">' + robot() + '</div>' +
          '<div class="vxa-title"><strong>VYNEX Assistant</strong><span class="vxa-status"><i></i>Online &middot; replies instantly</span></div>' +
          '<button class="vxa-ibtn vxa-reset" type="button" aria-label="Start a new chat" title="New chat">' + ICON.reset + '</button>' +
          '<button class="vxa-ibtn vxa-min" type="button" aria-label="Close chat" title="Close">' + ICON.close + '</button></header>' +
        '<div class="vxa-log" role="log" aria-live="polite" aria-label="Conversation" tabindex="0"></div>' +
        '<div class="vxa-chips" aria-label="Suggested questions"></div>' +
        '<form class="vxa-form" autocomplete="off"><label class="sr-only" for="vxa-input">Type your question</label>' +
          '<input class="vxa-input" id="vxa-input" type="text" maxlength="300" placeholder="Ask about pricing, time, services..." enterkeyhint="send">' +
          '<button class="vxa-send" type="submit" aria-label="Send message">' + ICON.send + '</button></form>' +
        '<div class="vxa-foot">Automated assistant &middot; for a custom quote, our team will call you</div>' +
      "</section>" +
      '<button class="vxa-fab" type="button" aria-label="Chat with the VYNEX Assistant" aria-expanded="false" aria-controls="vxa-panel">' +
        '<span class="vxa-ring"></span><span class="vxa-pulse"></span><span class="vxa-pulse p2"></span>' +
        '<span class="vxa-bot">' + robot({ wave: true }) + "</span>" +
        '<svg class="vxa-close-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '<span class="vxa-badge" hidden>1</span></button>';
    document.body.appendChild(root);

    fab = root.querySelector(".vxa-fab"); panel = root.querySelector(".vxa-panel"); logEl = root.querySelector(".vxa-log");
    chipsEl = root.querySelector(".vxa-chips"); form = root.querySelector(".vxa-form"); input = root.querySelector(".vxa-input");
    sendBtn = root.querySelector(".vxa-send"); greet = root.querySelector(".vxa-greet"); badge = root.querySelector(".vxa-badge");

    // animated network (nodes + travelling data pulses) drawn over the photo
    net = makeNet(root.querySelector(".vxa-net"));
    // fetch the background photo quietly so the first open is instant
    setTimeout(function () { new Image().src = "images/chat-network.jpg"; }, 2500);

    fab.addEventListener("click", function () { state.open ? close() : open(); });
    root.querySelector(".vxa-min").addEventListener("click", close);
    root.querySelector(".vxa-reset").addEventListener("click", reset);
    greet.addEventListener("click", function (e) { if (e.target.closest(".vxa-greet-x")) { hideGreet(true); } else { open(); } });
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value.trim(); if (!v || busy) return; input.value = ""; ask(v); });
    chipsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".vxa-chip"); if (!b || busy) return;
      if (b.dataset.more) ask("More details", { id: b.dataset.more, full: true }); else ask(b.textContent, { id: b.dataset.id });
    });
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(panel.querySelectorAll("button, a[href], input, [tabindex='0']"), function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });
    document.addEventListener("click", function (e) { var t = e.target.closest && e.target.closest("[data-open-assistant]"); if (t) { e.preventDefault(); open(); } });

    // robot eyes follow the pointer
    var looks = root.querySelectorAll(".r-look"), raf = 0, px = 0, py = 0;
    if (!reduce && matchMedia("(pointer:fine)").matches) {
      document.addEventListener("pointermove", function (e) {
        px = e.clientX; py = e.clientY; if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0; var r = (state.open ? root.querySelector(".vxa-avatar") : fab).getBoundingClientRect();
          var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 260);
          var x = (dx / d) * 2.6 * m, y = (dy / d) * 2 * m;
          Array.prototype.forEach.call(looks, function (l) { l.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px)"; });
        });
      }, { passive: true });
    }

    // keep the button clear of the mobile call bar
    function place() {
      var bar = document.querySelector(".call-bar"), h = 0;
      if (bar && getComputedStyle(bar).display !== "none") h = bar.offsetHeight;
      root.style.setProperty("--vxa-bottom", (h + 16) + "px");
    }
    place(); addEventListener("resize", place); addEventListener("load", place); setTimeout(place, 800);
  }

  function now() { return Date.now(); }
  function addMsg(role, node, instant) {
    var row = document.createElement("div");
    row.className = "vxa-msg " + role;
    if (instant) row.style.animation = "none";
    if (role === "bot") { var av = document.createElement("div"); av.className = "vxa-mav"; av.innerHTML = robot({ still: true }); row.appendChild(av); }
    var b = document.createElement("div"); b.className = "vxa-bubble";
    if (typeof node === "string") b.textContent = node; else b.appendChild(node);
    row.appendChild(b); logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight; return row;
  }
  function setChips(ids, more) {
    chipsEl.innerHTML = "";
    if (more) { var m = document.createElement("button"); m.type = "button"; m.className = "vxa-chip more"; m.dataset.more = more; m.textContent = "More details"; chipsEl.appendChild(m); }
    (ids || []).forEach(function (id) {
      var e = BYID[id]; if (!e || !e.label) return;
      var b = document.createElement("button"); b.type = "button"; b.className = "vxa-chip"; b.dataset.id = id; b.textContent = e.label; chipsEl.appendChild(b);
    });
    chipsEl.scrollLeft = 0;
  }
  function typing(on) {
    root.classList.toggle("is-typing", on);
    if (on && !typingEl) {
      typingEl = addMsg("bot", ""); typingEl.classList.add("vxa-typing");
      typingEl.querySelector(".vxa-bubble").innerHTML = "<i></i><i></i><i></i>";
      typingEl.setAttribute("aria-label", "Assistant is typing");
    } else if (!on && typingEl) { typingEl.remove(); typingEl = null; }
  }

  function ask(text, forced) {
    state.log.push({ r: "user", t: text }); addMsg("user", text); setChips([]);
    busy = true; sendBtn.disabled = true; typing(true);
    var res = forced && BYID[forced.id] ? forced : reply(text), started = now();
    var e = res.id ? BYID[res.id] : null;
    // Short answer first; the full answer only when asked for ("More details", "explain", "in detail").
    var useFull = res.full || (e && !e.s);
    Promise.resolve(res.html || (e ? (useFull ? fullHtml(e) : shortHtml(e)) : "")).catch(function () { return fallback(); }).then(function (html) {
      var wait = reduce ? 150 : Math.max(0, Math.min(1100, 450 + html.length * 0.8) - (now() - started));
      setTimeout(function () {
        typing(false);
        addMsg("bot", clean(html));
        state.log.push({ r: "bot", h: html });
        state.last = res.last || (e ? e.id : null);
        var more = res.more || (e && !useFull && e.s && e.a ? e.id : null);
        setChips(res.next || (e && e.next) || STARTERS, more); logEl.scrollTop = logEl.scrollHeight;
        busy = false; sendBtn.disabled = false; save();
        if (document.activeElement === document.body || !document.activeElement) { if (matchMedia("(pointer:fine)").matches) input.focus(); }
      }, wait);
    });
    save();
  }

  function renderLog() {
    logEl.innerHTML = "";
    state.log.forEach(function (m) { addMsg(m.r === "user" ? "user" : "bot", m.r === "user" ? m.t : clean(m.h), true); });
  }
  function welcome() {
    var html = BYID.greet.a(), e = BYID.greet;
    state.log = [{ r: "bot", h: html }]; state.last = "greet";
    typing(true);
    setTimeout(function () { typing(false); addMsg("bot", clean(html)); setChips(e.next.concat(["mpesa"])); logEl.scrollTop = logEl.scrollHeight; save(); }, reduce ? 100 : 750);
  }
  function reset() {
    if (busy) return;
    state.log = []; state.last = null; logEl.innerHTML = ""; setChips([]); welcome();
  }

  function open() {
    if (state.open && !panel.hidden) return;
    state.open = true; state.seen = true; hideGreet(true);
    badge.hidden = true; panel.hidden = false; panel.classList.remove("is-closing");
    root.classList.add("is-open"); fab.setAttribute("aria-expanded", "true"); fab.setAttribute("aria-label", "Close chat");
    if (!state.log.length) welcome();
    else { if (!logEl.children.length) renderLog(); setChips((BYID[state.last] && BYID[state.last].next) || STARTERS); }
    logEl.scrollTop = logEl.scrollHeight;
    if (net) requestAnimationFrame(function () { net.start(); });
    if (matchMedia("(pointer:fine)").matches) setTimeout(function () { input.focus(); }, 60);
    save();
  }
  function close() {
    if (!state.open) return;
    state.open = false; root.classList.remove("is-open");
    fab.setAttribute("aria-expanded", "false"); fab.setAttribute("aria-label", "Chat with the VYNEX Assistant");
    panel.classList.add("is-closing");
    setTimeout(function () { if (!state.open) { panel.hidden = true; panel.classList.remove("is-closing"); if (net) net.stop(); } }, reduce ? 0 : 220);
    fab.focus({ preventScroll: true }); save();
  }
  function hideGreet(remember) { greet.hidden = true; if (remember) { state.greeted = true; save(); } }

  /* ------------------------------------------------------------------ start */
  function init() {
    restore(); build(); loadCompany();
    if (state.open) { state.open = false; open(); }
    else if (!state.seen) {
      badge.hidden = false;
      if (!state.greeted) setTimeout(function () { if (!state.open && !state.greeted) greet.hidden = false; }, reduce ? 800 : 3500);
      setTimeout(function () { if (!greet.hidden) hideGreet(true); }, 16000);
    }
    window.VYNEX_ASSISTANT = { open: open, close: close };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
