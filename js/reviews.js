/* Customer reviews page (reviews.html): gallery of WhatsApp screenshots.
   Clicking a tile opens the site's existing viewer, window.openImageZoom() (main.js),
   so load this file AFTER main.js.

   HOW TO ADD REVIEWS
   1. Save screenshots in assets/reviews/ named review-01.webp, review-02.webp, ... (two digits).
   2. Set REVIEW_COUNT below to how many you have.  That's it.
   (If you use .jpg or .png instead of .webp, change REVIEW_EXT.)
   Files that don't exist are skipped automatically. */
(function () {
  "use strict";

  const REVIEW_COUNT = 30;   // <- set this to the number of screenshots you've added
  const REVIEW_EXT = "webp";
  const FOLDER = "assets/reviews/";

  const grid = document.getElementById("reviewsGrid");
  if (!grid) return;
  const empty = document.getElementById("reviewsEmpty");

  const ZOOM_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>';
  const pad = (n) => (n < 10 ? "0" + n : String(n));
  const items = [];
  for (let i = 1; i <= REVIEW_COUNT; i++) items.push({ src: FOLDER + "review-" + pad(i) + "." + REVIEW_EXT });

  function showEmpty() { if (empty) empty.hidden = false; }

  function openViewer(index) {
    if (typeof window.openImageZoom !== "function" || !items.length) return;
    const imgs = items.map((it, i) => ({ src: it.src, label: "WhatsApp screenshot " + (i + 1) }));
    window.openImageZoom(imgs, Math.max(index, 0), "Customer feedback");
  }

  function removeItem(item, li) {
    const i = items.indexOf(item);
    if (i > -1) items.splice(i, 1);
    if (li.parentNode) li.parentNode.removeChild(li);
    if (!grid.children.length) showEmpty();
  }

  function render() {
    const frag = document.createDocumentFragment();
    items.slice().forEach((item, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "review-card";
      btn.setAttribute("aria-label", "Enlarge customer review " + (i + 1));
      btn._item = item;

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = "Customer feedback via WhatsApp";
      img.loading = i < 4 ? "eager" : "lazy";   // first row loads immediately, the rest lazily
      img.decoding = "async";
      img.addEventListener("error", () => removeItem(item, li));

      const zoom = document.createElement("span");
      zoom.className = "review-zoom";
      zoom.innerHTML = ZOOM_ICON;

      btn.append(img, zoom);
      li.appendChild(btn);
      frag.appendChild(li);
    });
    grid.appendChild(frag);
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".review-card");
    if (btn && btn._item) openViewer(items.indexOf(btn._item));
  });

  // Don't render a wall of broken tiles if the first screenshot isn't there yet.
  const probe = new Image();
  probe.onload = render;
  probe.onerror = showEmpty;
  probe.src = items[0] ? items[0].src : "";
  if (!items.length) showEmpty();
})();
