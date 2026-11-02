-- 011-more-services.sql
-- Adds the full VYNEX service list (websites, mobile apps, systems, payments, hosting & growth)
-- and the longer descriptions. Safe to run more than once: existing services are updated, new ones inserted.
-- Run in Supabase -> SQL Editor.

with incoming(title, short_description, full_description, icon, display_order) as (
  values
  ('Website Design & Development', 'Custom-designed, fast websites built around your brand and goals.', 'We design and code your website from scratch — no cheap templates. Every page is planned around what your visitors need and what you want them to do: call you, order, book or request a quote.', 'code', 1),
  ('Business & Corporate Websites', 'Professional company sites that build trust with your clients.', 'First impressions decide whether a client calls you or your competitor. We build company websites that look established, explain what you do in plain language and make it easy to contact you.', 'building', 2),
  ('E-Commerce Websites', 'Online stores with secure checkout and easy product management.', 'Sell your products online, day and night. We build stores where customers can browse, add to cart and pay with M-Pesa or card, while you manage products, prices, stock and orders from one dashboard.', 'cart', 3),
  ('Responsive & Mobile-Friendly Websites', 'Sites that look and work great on phones, tablets and desktops.', 'Most Kenyans browse on their phones, so we design for the phone first and then scale up. Your site adapts perfectly to every screen size and stays quick even on slow connections.', 'devices', 4),
  ('Landing Pages & Portfolio Websites', 'One focused page that sells a single offer, or a showcase of your best work.', 'A landing page has one job: get the visitor to act. We build sharp single-page sites for campaigns, events, products or personal brands, plus portfolio sites that show off your work beautifully.', 'rocket', 5),
  ('Website Redesign & Updates', 'Give an old website a fresh, modern look and keep content current.', 'Is your website slow, dated or hard to use on a phone? We rebuild it with a modern design while keeping the content, domain and search rankings that already work for you.', 'refresh', 6),
  ('CMS & Admin Dashboards', 'Update your website yourself — text, images, prices — without touching code.', 'Never wait days to change a phone number or add a new product again. We give you a simple, secure admin panel so you control your content, enquiries and users from any device.', 'layers', 7),
  ('Web Application Development', 'Custom web apps that streamline your operations.', 'A web app is a full software system that runs in the browser — no installation needed. We build dashboards, portals and platforms that replace spreadsheets, paperwork and scattered WhatsApp messages.', 'layers', 8),
  ('Android Application Development', 'Android apps built for your customers.', 'Android is the phone of choice for most Kenyans. We build smooth, reliable Android apps — from customer apps and delivery apps to internal staff tools — and help you publish them on Google Play.', 'android', 9),
  ('iOS Application Development', 'Polished iPhone and iPad applications.', 'For customers on iPhone and iPad, we build apps that feel native, fast and polished — and guide you through the App Store publishing process.', 'ios', 10),
  ('Cross-Platform Mobile Apps', 'One app for both Android and iPhone — a smarter way to launch.', 'Want to reach everyone without paying for two separate apps? We plan your product so one codebase serves both Android and iOS users, keeping your cost and maintenance lower.', 'devices', 11),
  ('Progressive Web Apps (PWA)', 'A website that installs on the phone like an app — no app store needed.', 'A PWA gives customers an app-like experience straight from your website: an icon on their home screen, fast loading and even offline access, without a Play Store or App Store download.', 'cloud', 12),
  ('Custom Software Development', 'Software designed around the way your business works.', 'Off-the-shelf software forces you to change how you work. We build software around your exact processes, so your team saves time, avoids mistakes and has the tools they actually need.', 'cpu', 13),
  ('Business Management Systems', 'Manage staff, sales and operations in one place.', 'See your whole business at a glance. Our management systems bring customers, sales, staff, expenses and reports into one organised dashboard so you can make decisions with real numbers.', 'chart', 14),
  ('Inventory Management Systems', 'Track stock, suppliers and movements accurately.', 'Stop guessing what is in stock. Track every item that comes in and goes out, get low-stock alerts and know exactly what your stock is worth at any time.', 'box', 15),
  ('POS Systems', 'Point-of-sale systems for shops, restaurants and more.', 'Serve customers faster and know exactly what you sold. Our POS records every sale, prints receipts, manages stock automatically and gives you daily sales and cash reports.', 'receipt', 16),
  ('School Management Systems', 'Students, fees, results and communication managed digitally.', 'Replace piles of paper with one system. Manage admissions, fee payments, exam results, report cards and parent communication — all securely stored and easy to find.', 'graduation', 17),
  ('Property Management Systems', 'Tenants, rent, units and maintenance in one system.', 'Landlords and property managers can track every unit, tenant and payment in one place. See who has paid, who is behind, and what repairs are pending — without chasing paperwork.', 'home', 18),
  ('Booking and Reservation Systems', 'Let customers book and pay online.', 'Let customers book a table, room, appointment or service at any hour — without a phone call. You get a clear calendar, automatic confirmations and fewer no-shows.', 'calendar', 19),
  ('M-Pesa and Payment Integrations', 'Accept M-Pesa and other payments inside your product.', 'Let customers pay the way Kenyans actually pay. We connect M-Pesa (STK push), cards and bank payments to your website or app and record every transaction automatically.', 'card', 20),
  ('API Integrations', 'Connect your systems and third-party services.', 'We connect your website or app to the other tools you use — payments, SMS, email, maps, accounting and more — so data flows automatically instead of being copied by hand.', 'plug', 21),
  ('UI/UX Design', 'Interfaces that look sharp and feel effortless.', 'Good design is not decoration — it is what makes people finish signing up, buying or booking. We design clear screens and flows, test them with real users and hand over developer-ready files.', 'palette', 22),
  ('Graphic Design and Branding', 'Logos and brand identities that stand out.', 'Your brand is more than a logo. We create a consistent identity — logo, colours, fonts and social media graphics — so your business looks professional everywhere customers meet it.', 'pen', 23),
  ('Chatbots & WhatsApp Business Integration', 'Answer customers instantly, even when you are asleep.', 'Add a smart assistant to your website or WhatsApp that answers common questions, takes orders and collects enquiries around the clock, so you never lose a customer to a slow reply.', 'chat', 24),
  ('Domain & Hosting Setup', 'We register your domain and set up reliable, fast hosting.', 'We handle the technical side: registering your .co.ke or .com address, setting up fast, reliable hosting and connecting a professional email, so you never need to deal with confusing technical settings.', 'server', 25),
  ('Website Deployment', 'Your finished website taken live smoothly, tested and ready.', 'Launch day without the stress. We test everything, move your site live, connect your domain and check forms, payments and mobile layout before announcing it to the world.', 'rocket', 26),
  ('Website Maintenance & Support', 'Ongoing updates, fixes and help so your site stays healthy.', 'A website is not a one-time purchase. We keep yours updated, backed up and running smoothly, and we are a phone call away when something needs fixing or changing.', 'wrench', 27),
  ('Website Security & Optimization', 'Protection against threats plus tuning for speed and stability.', 'Hacked or slow websites cost you customers. We harden your site against common attacks, secure your data and tune it so pages load quickly and stay online.', 'shield', 28),
  ('SEO & Performance Optimization', 'Rank better on search engines and load faster for every visitor.', 'When customers search for what you sell, you want to be the name they see. We improve your site structure, content and speed so Google understands it and shows it to the right people.', 'search', 29),
  ('Professional Business Email Setup', 'Look professional with email on your own domain.', 'Emails from info@yourcompany.co.ke build far more trust than a free Gmail address. We set up your business mailboxes, connect them to your phone and make sure they do not land in spam.', 'mail', 30),
  ('IT Consultancy and Technical Support', 'Expert advice and ongoing technical help.', 'Not sure what to build, which technology to choose or why your system is slow? We give straight, practical advice and hands-on help — from planning a project to fixing a stubborn technical problem.', 'toolbox', 31)
),
upd as (
  update public.services s
     set short_description = i.short_description,
         full_description  = i.full_description,
         icon              = coalesce(nullif(s.icon, ''), i.icon),
         display_order     = i.display_order,
         is_published      = true
    from incoming i
   where lower(s.title) = lower(i.title)
  returning s.title
)
insert into public.services (title, short_description, full_description, icon, display_order, is_published)
select i.title, i.short_description, i.full_description, i.icon, i.display_order, true
  from incoming i
 where not exists (select 1 from public.services s where lower(s.title) = lower(i.title));
