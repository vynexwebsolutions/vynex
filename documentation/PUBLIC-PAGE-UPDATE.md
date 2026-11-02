# Public page update — animated devices, faster loading, professional polish

## What changed

### 1. Live laptop + tablet + phone (replaces the static photo)
- `public/devices.css` and `public/devices.js` draw the three devices in pure HTML/CSS.
- Laptop: the headline types itself, a cursor moves to **Get Started**, clicks it, and a "Quote request sent" message appears. The keyboard keys light up as if someone is typing.
- Tablet: a dashboard whose numbers count up, a chart that draws itself and bars that grow.
- Phone: a shop app that scrolls by itself, with an M-Pesa "Payment received" notification.
- It sits where the old picture was on `index.html` and `about.html`. `images/about-company.jpg` is no longer used there (keep or delete it).
- It scales to any screen, tilts slightly with the mouse on desktop, and pauses when it is off-screen.

### 2. Why things appeared late — and the fix
| Problem | Fix |
|---|---|
| Animations waited for the whole page (fonts, pictures, GSAP, Supabase) to finish loading | Reveals now use `IntersectionObserver` + CSS (`animations.js` / `animations.css`) and start immediately |
| Header/footer were built only after slow outside scripts downloaded | Scripts re-ordered and `defer`red: local files first, outside libraries (Supabase, GSAP) after |
| Page faded in from invisible, hero text slid in over 3+ seconds | Hero entrance is now pure CSS and finishes in about 1 second; durations cut from 1.4–3s to about 0.6s |
| Services/projects/contact icons only appeared after a database round-trip | Last data is cached in the visitor's browser and shown instantly, then refreshed (`script.js`); grey skeleton cards show on the very first visit |
| Typed hero code took 3 seconds | Now about 1 second |
| Heavy effects: blur on every card, endless gradient-text repaint, 3D background at full retina resolution | Removed or lowered (`polish.css`, `bg-scene.js`) |
| Fonts blocked the first paint | Fonts load without blocking (text shows immediately, then switches to the web font) |
| On phones the hero was wider than the screen | Grid columns can now shrink (`polish.css`) |

### 3. Professional finish (`polish.css`, `polish.js`)
Cleaner hero headline, scroll cue, animated nav underline, button light-sweep and "magnetic" hover, card accent lines, numbered process steps, glowing animated call-to-action border, styled scrollbar and selection colour, back-to-top button, footer accent line, and JSON-LD business data for Google (uses the email and phone already in `backend/seed-business.sql`).

## Files added
`public/devices.css`, `public/devices.js`, `public/polish.css`, `public/polish.js`

## Files changed
All `public/*.html` (script order, fonts, new stylesheet links), `public/index.html` and `public/about.html` (devices scene),
`public/animations.js`, `public/animations.css`, `public/script.js`, `public/image-loader.js`, `public/pro.js`, `public/bg-scene.js`.

## To use
1. Replace your project folder with this one (your `.env` is included unchanged).
2. Run `npm run build`, then `npm start` (or deploy as before).
3. Hard-refresh the browser (Ctrl+Shift+R) so old cached CSS/JS is replaced.

## Tweaking
- Speed of the laptop story: in `devices.css`, change `13s` in the `wc-*` animations (they must all stay equal).
- Remove a polish effect: delete its block in `polish.css`.
- Reveal speed: `.js-anim .rv-in` in `animations.css`.
