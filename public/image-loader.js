/* VYNEX/public/image-loader.js
   Reads image-manifest.json (created by scripts/generate-image-manifest.js) and places
   static images in the right spots automatically.
   Usage in HTML:  <img data-image-slot="hero" alt="...">  or  <img data-image-name="about-company.jpg" alt="...">
   The first image in the manifest whose category matches the slot is used. */
(function () {
  fetch("image-manifest.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((m) => {
      if (!m || !Array.isArray(m.images)) return;
      window.vynexImages = m.images;
      document.querySelectorAll("img[data-image-slot], img[data-image-name]").forEach((img) => {
        const byName = img.dataset.imageName && m.images.find((i) => i.filename === img.dataset.imageName);
        const bySlot = img.dataset.imageSlot && m.images.find((i) => i.category === img.dataset.imageSlot);
        const hit = byName || bySlot;
        if (!hit) return;
        img.loading = img.loading || "lazy";
        img.decoding = "async";
        img.addEventListener("load", () => {
          const ph = img.parentElement && img.parentElement.querySelector(".placeholder");
          if (ph) ph.remove();
        }, { once: true });
        img.src = hit.path;
      });
    })
    .catch(() => {});
})();
