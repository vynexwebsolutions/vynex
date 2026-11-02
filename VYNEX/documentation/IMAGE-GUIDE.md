# IMAGE GUIDE

There are **two** kinds of images.

## 1. Static images (in the project folder)

Location: `public/images/` — all files directly inside, **no subfolders**.

Required files (replace the placeholders with your real artwork, keep the names):

| File | Use |
|---|---|
| `favicon.png` | Browser tab icon (square, e.g. 64×64 or 256×256) |
| `logo.png` | Normal logo (transparent background) |
| `logo-white.png` | Logo for dark backgrounds (transparent) |
| `watermark.png` | Optional watermark (transparent PNG) |

Other images — name them clearly. The **file name decides the category**:

| Name starts with / contains | Category | Where it appears |
|---|---|---|
| `hero…` | hero | Hero / sharing image |
| `about…` | about | About sections |
| `footer…` | footer | Footer background |
| `portfolio…` / `project…` | portfolio | Static portfolio visuals |
| `testimonial…` | testimonial | Testimonial photos |
| `background…` / `bg…` | background | Section backgrounds |
| `…-development`, `…-design`, `…-hosting` | services | Service imagery |
| anything else | general | Available for reuse |

Examples: `hero-main.jpg`, `about-company.jpg`, `website-development.jpg`, `ecommerce-development.jpg`, `footer-background.jpg`.

### Adding a new static image

1. Copy the file into `public/images/`.
2. Run `npm run manifest` (or just `npm run dev` / deploy — the build does it for you). This updates `public/image-manifest.json`.
3. Commit and **redeploy** (static files are part of the website build).

The pages read the manifest through `image-loader.js`; an `<img data-image-slot="about">` automatically shows the first image of category `about`, and `<img data-image-name="hero-main.jpg">` picks an exact file. You never edit several pages by hand.

Tips: use JPG/WebP for photos, PNG for logos; keep photos under ~300 KB (1600 px wide is plenty).

## 2. Admin-uploaded images (Supabase Storage)

Cover images, screenshots, service images, testimonial photos and the logo override are uploaded from the admin panel to Supabase Storage (bucket `website-images`).

- They are compressed in your browser before upload.
- They appear on the website **immediately** — no redeploy.
- Manage them under **Media** (preview, copy URL, delete, folders).

## Watermark

`public/images/watermark.png` is overlaid on images you tick **Watermark** for (cover and each screenshot). Control it under **Settings → Portfolio watermark**: on/off, opacity, size, position. Your original images are never modified.
