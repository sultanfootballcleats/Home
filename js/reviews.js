/* Customer reviews: WhatsApp screenshot gallery on the homepage.
   Clicking a card opens the site's existing viewer, window.openImageZoom() (main.js),
   so load this file AFTER main.js.
   To add a review: put the image in assets/reviews/ and add a line to REVIEWS.
   Optional per item: width/height (px) to prevent layout shift.
   Missing files are skipped; if review-01 is missing the whole section stays hidden. */
(function () {
  "use strict";

  const REVIEWS = [
    { image: "assets/reviews/review-01.webp" },
    { image: "assets/reviews/review-02.webp" },
    { image: "assets/reviews/review-03.webp" },
    { image: "assets/reviews/review-04.webp" },
    { image: "assets/reviews/review-05.webp" },
    { image: "assets/reviews/review-06.webp" },
  ];
  const HOME_COUNT = 6; // cards shown on the page; "See All Reviews" opens the viewer on all of REVIEWS

  const section = document.getElementById("reviews");
  const grid = document.getElementById("reviewsGrid");
  const cta = document.getElementById("reviewsAll");
  if (!section || !grid || !REVIEWS.length) return;

  const ZOOM_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>';
  const items = REVIEWS.map((r) => ({ src: r.image, w: r.width, h: r.height }));

  function viewerImages() {
    return items.map((it, i) => ({ src: it.src, label: "WhatsApp screenshot " + (i + 1) }));
  }
  function openViewer(index) {
    if (typeof window.openImageZoom !== "function" || !items.length) return;
    window.openImageZoom(viewerImages(), Math.max(index, 0), "Customer feedback");
  }

  function removeItem(item, li) {
    const i = items.indexOf(item);
    if (i > -1) items.splice(i, 1);
    if (li.parentNode) li.parentNode.removeChild(li);
    if (!grid.children.length) section.hidden = true;
  }

  function render() {
    const frag = document.createDocumentFragment();
    items.slice(0, HOME_COUNT).forEach((item, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "review-card";
      btn.setAttribute("aria-label", "Enlarge customer review " + (i + 1));
      btn._item = item;

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = "Customer feedback via WhatsApp";
      img.loading = "lazy";
      img.decoding = "async";
      if (item.w && item.h) { img.width = item.w; img.height = item.h; }
      else img.className = "is-loading";
      img.addEventListener("load", () => img.classList.remove("is-loading"));
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
  if (cta) cta.addEventListener("click", () => openViewer(0));

  // Only show the section once the first screenshot actually exists.
  const probe = new Image();
  probe.onload = () => { render(); section.hidden = false; };
  probe.src = items[0].src;
})();
