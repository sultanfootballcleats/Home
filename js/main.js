/* ==========================================================================
   SULTAN FOOTBALL CLEATS — main.js
   Cart engine, currency conversion, shared UI behaviour, and the product
   catalog loader. No backend: cart persists in localStorage, checkout
   hands off to WhatsApp.

   PRODUCT DATA LIVES IN data/products.txt
   Every product — name, price, size, condition, photos, everything — is
   read from data/products.txt, a plain text file meant to be opened and
   edited directly (see the instructions at the top of that file). This
   script only fetches and parses it; nothing here needs to change when
   products are added, edited, or removed.
   ========================================================================== */

/* ---------------------------------- Config ---------------------------------- */
const STORE = {
  whatsapp: "923295336020", // international format, no + or leading 0
  currencySymbolUSD: "$",
  currencySymbolPKR: "Rs. ",
  usdToPkr: 278, // approximate reference rate — update as needed
  deliveryPKR: 300, // delivery charge per pair
  nayapayNumber: "03295336020",
  jazzcashNumber: "03329022264",
};

/* ---------------------------------- Product catalog ---------------------------------- */
// Populated asynchronously from data/products.txt — see window.PRODUCTS_READY
// below. Starts empty so nothing throws before that fetch resolves.
let PRODUCTS = [];

const CATEGORY_LABELS = {
  "adult-studs": "Adult Studs",
  "kids-studs": "Kids Studs",
  "adult-grippers": "Adult Grippers",
  "kids-grippers": "Kids Grippers",
};
// Auto-assigned per category so nobody has to pick a hex colour per product
// in the text file — just a subtle accent behind each product photo.
const CATEGORY_ACCENT = {
  "adult-studs": "#25438C",
  "kids-studs": "#4A6FA5",
  "adult-grippers": "#5C7A99",
  "kids-grippers": "#7C93B0",
};
// Studs vs grippers cuts across the adult/kids split — used by the shop
// page's "Type" filter (adult-studs & kids-studs = studs, etc).
function productType(category) {
  if (!category) return "";
  if (category.indexOf("studs") !== -1) return "studs";
  if (category.indexOf("grippers") !== -1) return "grippers";
  return "";
}
window.productType = productType;

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

/* ---------------------------------- Loading data/products.txt ----------------------------------
   Simple "Label: value" blocks separated by a line of dashes — see the notes at the
   top of data/products.txt for the human-facing explanation of the format. */
const PRODUCT_FIELD_MAP = {
  "product id": "id",
  id: "id",
  name: "name",
  brand: "brand",
  category: "category",
  tag: "tag",
  color: "color",
  colour: "color",
  "size us": "sizeUS",
  "size uk": "sizeUK",
  "size eur": "sizeEUR",
  condition: "conditionRaw",
  fault: "fault",
  price: "priceRaw",
  "original price": "originalPriceRaw",
  image: "image",
  video: "video",
  description: "desc",
};

function normalizeFieldKey(rawKey) {
  return rawKey
    .replace(/\([^)]*\)/g, "") // drop parenthetical hints like "(out of 10)"
    .trim()
    .toLowerCase();
}

function parseProductsText(text) {
  const blocks = text
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line)) // drop comment lines
    .join("\n")
    .split(/^-{3,}\s*$/m) // a line of 3+ dashes separates products
    .map((block) => block.trim())
    .filter(Boolean);

  const products = [];
  blocks.forEach((block) => {
    const raw = {};
    block.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (!match) return;
      const field = PRODUCT_FIELD_MAP[normalizeFieldKey(match[1])];
      if (!field) return;
      raw[field] = match[2].trim();
    });
    if (!raw.id || !raw.name) return; // skip incomplete/malformed blocks

    const category = (raw.category || "").trim();
    const priceNum = parseFloat(String(raw.priceRaw || "").replace(/,/g, ""));
    const originalNum = raw.originalPriceRaw
      ? parseFloat(String(raw.originalPriceRaw).replace(/,/g, ""))
      : null;
    // The "Image" line can list more than one photo (comma-separated) for extra
    // angles — e.g. "Image: assets/products/p1.jpg, assets/products/p1-b.jpg".
    const imageList = (raw.image || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    products.push({
      id: raw.id,
      name: raw.name,
      brand: raw.brand || "",
      category,
      categoryLabel: CATEGORY_LABELS[category] || category,
      accent: CATEGORY_ACCENT[category] || "#25438C",
      tag: raw.tag || "",
      color: raw.color || "",
      sizeUS: raw.sizeUS || "",
      sizeUK: raw.sizeUK || "",
      sizeEUR: raw.sizeEUR || "",
      condition: parseFloat(raw.conditionRaw) || 0,
      fault: raw.fault && raw.fault.trim() ? raw.fault.trim() : "NONE",
      price: isNaN(priceNum) ? 0 : priceNum / STORE.usdToPkr,
      originalPrice: originalNum && !isNaN(originalNum) ? originalNum / STORE.usdToPkr : null,
      image: imageList[0] || null,
      images: imageList,
      video: raw.video || null,
      desc: raw.desc || "",
    });
  });
  return products;
}

// Every page script waits on this promise before touching PRODUCTS (see the
// window.PRODUCTS_READY.then(...) wrapper in shop.js / product.js / cart.js /
// footer.js and the inline scripts on index.html and about.html).
window.PRODUCTS_READY = fetch("data/products.txt")
  .then((res) => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.text();
  })
  .then((text) => {
    PRODUCTS = parseProductsText(text);
    return PRODUCTS;
  })
  .catch((err) => {
    console.error(
      "Sultan Football Cleats: could not load data/products.txt. " +
        "If you're viewing this file directly from disk (file://), it needs to be served over http:// instead — browsers block local file reads otherwise.",
      err
    );
    PRODUCTS = [];
    return PRODUCTS;
  });
/* ---------------------------------- Condition star rating ----------------------------------
   Condition is stored on each product as a score out of 10 (see data/products.txt).
   For display, that maps straight onto a 5-star scale: stars = condition / 2, so a 10/10 pair
   is a full 5 stars and a 9/10 pair is 4.5 stars. renderStars() builds each star as its own
   fixed-size cell (full / half / empty) so the fill is always exact — no shared-width overlay
   that could look the same across different scores. */
function conditionToStars(condition) {
  const n = Number(condition) || 0;
  return Math.max(0, Math.min(5, n / 2));
}
function renderStars(condition) {
  const stars = conditionToStars(condition);
  const full = Math.floor(stars + 1e-6);
  const half = stars - full >= 0.49;
  let cells = "";
  for (let i = 0; i < 5; i++) {
    let fillPct = 0;
    if (i < full) fillPct = 100;
    else if (i === full && half) fillPct = 50;
    cells += `<span class="star-cell"><span class="star-cell-base" aria-hidden="true">★</span><span class="star-cell-fill" aria-hidden="true" style="width:${fillPct}%">★</span></span>`;
  }
  const label = `${stars % 1 === 0 ? stars : stars.toFixed(1)} out of 5 stars condition`;
  return `<span class="star-rating" role="img" aria-label="${label}">${cells}</span>`;
}
window.renderStars = renderStars;
window.conditionToStars = conditionToStars;

/* ---------------------------------- Filter helpers ---------------------------------- */
function uniqueBrands() {
  return Array.from(new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))).sort();
}
function uniqueSizesUK() {
  return Array.from(new Set(PRODUCTS.map((p) => p.sizeUK).filter(Boolean))).sort(
    (a, b) => parseFloat(a) - parseFloat(b)
  );
}
window.uniqueBrands = uniqueBrands;
window.uniqueSizesUK = uniqueSizesUK;

/* ---------------------------------- Currency ---------------------------------- */
function getCurrency() {
  return localStorage.getItem("sultan_currency") || "USD";
}
function setCurrency(cur) {
  localStorage.setItem("sultan_currency", cur);
  document.dispatchEvent(new CustomEvent("currencychange"));
}
function formatPrice(usdAmount, { primaryOnly = false } = {}) {
  const cur = getCurrency();
  const usd = `${STORE.currencySymbolUSD}${usdAmount.toFixed(2)}`;
  const pkr = `${STORE.currencySymbolPKR}${Math.round(usdAmount * STORE.usdToPkr).toLocaleString("en-US")}`;
  if (primaryOnly) return cur === "USD" ? usd : pkr;
  return cur === "USD"
    ? `${usd}<span class="alt">${pkr}</span>`
    : `${pkr}<span class="alt">${usd}</span>`;
}

function initCurrencyToggle() {
  document.querySelectorAll("[data-currency-toggle]").forEach((wrap) => {
    const cur = getCurrency();
    wrap.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.currency === cur);
      btn.addEventListener("click", () => {
        setCurrency(btn.dataset.currency);
      });
    });
  });
  document.addEventListener("currencychange", () => {
    document.querySelectorAll("[data-currency-toggle] button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.currency === getCurrency());
    });
    renderAllPrices();
  });
}
function renderAllPrices() {
  document.querySelectorAll("[data-price]").forEach((el) => {
    const amount = parseFloat(el.dataset.price);
    el.innerHTML = formatPrice(amount);
  });
  document.querySelectorAll("[data-price-primary]").forEach((el) => {
    const amount = parseFloat(el.dataset.pricePrimary);
    el.textContent = formatPrice(amount, { primaryOnly: true });
  });
  if (typeof window.onPriceRender === "function") window.onPriceRender();
}

/* ---------------------------------- Cart engine ---------------------------------- */
const CART_KEY = "sultan_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  document.dispatchEvent(new CustomEvent("cartchange"));
}
function cartCount() {
  return getCart().length;
}
function cartTotal() {
  return getCart().reduce((sum, item) => {
    const p = getProduct(item.id);
    return p ? sum + p.price : sum;
  }, 0);
}
function cartDeliveryUSD() {
  return getCart().length ? (STORE.deliveryPKR * getCart().length) / STORE.usdToPkr : 0;
}
function cartGrandTotal() {
  return cartTotal() + cartDeliveryUSD();
}
// Every product is a single unique physical pair — there is no "quantity"
// beyond 1, and no size variant to key on. addToCart returns false (and adds
// nothing) if the pair is already in the cart, since a second one doesn't exist.
function addToCart(id) {
  const cart = getCart();
  if (cart.some((i) => i.id === id)) return false;
  cart.push({ id, qty: 1 });
  saveCart(cart);
  return true;
}
function removeFromCart(id) {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
}
function updateCartCount() {
  const n = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}

/* ---------------------------------- WhatsApp checkout handoff ---------------------------------- */
// `customer` is an optional { name, phone, address } collected on the cart page before
// checkout, so the WhatsApp message arrives pre-filled with everything our team needs
// to confirm and ship the order — no back-and-forth typing required from the customer.
function buildWhatsAppOrderMessage(customer) {
  customer = customer || {};
  const cart = getCart();
  if (!cart.length) return "";
  let lines = ["Hi Sultan Football Cleats, I'd like to order:"];
  cart.forEach((item) => {
    const p = getProduct(item.id);
    if (!p) return;
    lines.push(`• ${p.name} — Size US ${p.sizeUS} / UK ${p.sizeUK} / EUR ${p.sizeEUR} — ${formatPrice(p.price, { primaryOnly: true })}`);
  });
  lines.push("");
  lines.push(`Subtotal: ${formatPrice(cartTotal(), { primaryOnly: true })}`);
  const deliveryPairs = cart.length;
  const deliveryTotalPKR = STORE.deliveryPKR * deliveryPairs;
  lines.push(`Delivery: ${STORE.currencySymbolPKR}${deliveryTotalPKR.toLocaleString('en-US')}/- (${STORE.currencySymbolPKR}${STORE.deliveryPKR}/- per pair × ${deliveryPairs} pair${deliveryPairs === 1 ? '' : 's'})`);
  lines.push(`Total: ${formatPrice(cartGrandTotal(), { primaryOnly: true })}`);
  lines.push("");
  lines.push(`Name: ${customer.name || ""}`);
  lines.push(`Phone: ${customer.phone || ""}`);
  lines.push(`Delivery address: ${customer.address || ""}`);
  lines.push("");
  lines.push(`I'll send the Rs. ${STORE.deliveryPKR}/- per pair delivery charge and share the payment screenshot here.`);
  return lines.join("\n");
}
function whatsAppOrderLink(customer) {
  const msg = encodeURIComponent(buildWhatsAppOrderMessage(customer));
  return `https://wa.me/${STORE.whatsapp}?text=${msg}`;
}
function whatsAppEnquiryLink(productName) {
  const msg = encodeURIComponent(
    `Hi Sultan Football Cleats, I'd like to ask about the ${productName}.`
  );
  return `https://wa.me/${STORE.whatsapp}?text=${msg}`;
}

/* ---------------------------------- Toast ---------------------------------- */
let toastTimer;
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg><span></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector("span").textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ---------------------------------- Icons (inline SVG helpers) ---------------------------------- */
const ICONS = {
  crown: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8zm2.2 12h13.6v2H5.2v-2z"/></svg>`,
  boot: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 40V16c0-1.7 1.3-3 3-3h10c1.1 0 2 .9 2 2v9.5c0 1 .5 1.9 1.4 2.4l16.4 9.4c2.5 1.4 4.2 4 4.2 6.9V44c0 2.2-1.8 4-4 4H18a4 4 0 01-4-4v-4z" stroke="#0D1B30" stroke-width="1.6" fill="rgba(13,27,48,0.06)"/>
    <path d="M14 40h37" stroke="#0D1B30" stroke-width="1.6"/>
    <path d="M20 46l1.5 5M27 46l1.5 5M34 46l1.5 5M41 46l1.5 5M48 46l1 4" stroke="#0D1B30" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M17 20h9" stroke="#0D1B30" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M17 25h9" stroke="#0D1B30" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,
};

function productMediaSVG(product) {
  return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${ICONS.boot}</div>`;
}

// Card/grid thumbnail: shows the product photo if one has been added at
// assets/products/<id>.jpg, and falls back to the placeholder boot icon
// if that file doesn't exist yet (or hasn't been uploaded).
function productThumbHTML(product) {
  return `<img class="product-thumb-image" src="${product.image}" alt="${product.name}" loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
    <div class="product-thumb-fallback">${ICONS.boot}</div>`;
}

// Product-page gallery helpers. Add extra photos in product.images and an
// optional video path in product.video. The customer sees all media as
// thumbnails below the main image and can click any one to view it.
function productMediaList(product) {
  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : (product.image ? [product.image] : []);
  const media = images.map((src, index) => ({
    type: 'image',
    src,
    label: `Photo ${index + 1}`,
  }));
  if (product.video) media.push({ type: 'video', src: product.video, label: 'Video' });
  return media;
}

function productGalleryHTML(product) {
  const media = productMediaList(product);
  if (!media.length) {
    return `<div class="pdp-media-fallback">${ICONS.boot}</div>`;
  }
  const first = media[0];
  if (first.type === 'video') {
    return `<video class="pdp-main-video" src="${first.src}" poster="${product.image || ''}" controls playsinline preload="metadata"></video>`;
  }
  return `<img class="pdp-main-image" src="${first.src}" alt="${product.name} — ${first.label}" id="pdpMainImg"
    onerror="this.onerror=null;this.style.display='none';document.getElementById('pdpFallbackIcon').style.display='flex';" />
    <div id="pdpFallbackIcon" class="pdp-media-fallback" style="display:none;">${ICONS.boot}</div>`;
}

window.productMediaList = productMediaList;

/* ---------------------------------- Clickable product cards ----------------------------------
   Product cards carry a data-id and are otherwise plain (non-link) containers, so a click
   anywhere on the card — not just the photo, title, or "View Details" button — opens that
   product's page. Clicks that land on an actual <a>/<button> inside the card (which already
   navigate there themselves) are left alone so things like "open in new tab" keep working. */
function wireProductCardLinks(container) {
  if (!container || container.dataset.cardLinksWired) return;
  container.dataset.cardLinksWired = "true";
  container.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    const card = e.target.closest(".product-card");
    if (!card || !card.dataset.id) return;
    location.href = `product.html?id=${card.dataset.id}`;
  });
}
window.wireProductCardLinks = wireProductCardLinks;

/* ---------------------------------- Product photo zoom lightbox ----------------------------------
   Opens a full-screen viewer for a product's photos. Supports pinch-to-zoom and single-finger
   panning on touch devices, double-tap/double-click to toggle zoom, and mouse wheel zoom +
   drag-to-pan on desktop. `images` is an array of {src, label} image-type media items (video
   is handled separately by the page and never passed in here). */
function openImageZoom(images, startIndex, productName) {
  if (!images || !images.length) return;
  let index = ((startIndex % images.length) + images.length) % images.length;
  let scale = 1, panX = 0, panY = 0;

  const overlay = document.createElement("div");
  overlay.className = "zoom-overlay";
  overlay.innerHTML = `
    <button class="zoom-close" type="button" aria-label="Close">&times;</button>
    ${images.length > 1 ? `
      <button class="zoom-nav zoom-prev" type="button" aria-label="Previous photo">&#10094;</button>
      <button class="zoom-nav zoom-next" type="button" aria-label="Next photo">&#10095;</button>
    ` : ""}
    <div class="zoom-stage">
      <img class="zoom-image" src="${images[index].src}" alt="${productName} — ${images[index].label}" draggable="false" />
      <div class="zoom-fallback" style="display:none;">
        ${ICONS.boot}
        <p>No photo uploaded for this pair yet</p>
      </div>
    </div>
    <p class="zoom-hint">Pinch or double-tap to zoom${images.length > 1 ? " · swipe to see more angles" : ""}</p>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // Push a history entry so the phone/browser back button closes the viewer
  // instead of navigating away from the product page entirely.
  history.pushState({ zoomOverlay: true }, "");
  window.addEventListener("popstate", onPopState);

  const img = overlay.querySelector(".zoom-image");
  const stage = overlay.querySelector(".zoom-stage");
  const fallback = overlay.querySelector(".zoom-fallback");

  function showFallback(isBroken) {
    img.style.display = isBroken ? "none" : "";
    fallback.style.display = isBroken ? "flex" : "none";
  }
  img.addEventListener("error", () => showFallback(true));
  img.addEventListener("load", () => showFallback(false));
  if (img.complete && img.naturalWidth === 0) showFallback(true);

  function applyTransform() {
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }
  function resetZoom() {
    scale = 1; panX = 0; panY = 0;
    applyTransform();
  }
  function loadIndex(next) {
    index = ((next % images.length) + images.length) % images.length;
    resetZoom();
    showFallback(false);
    img.src = images[index].src;
    img.alt = `${productName} — ${images[index].label}`;
  }
  function close(fromPopstate) {
    if (overlay.dataset.closed) return; // avoid double-closing
    overlay.dataset.closed = "true";
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("popstate", onPopState);
    overlay.remove();
    // If we're closing via the X, backdrop, or Escape (not because the user
    // already pressed back), consume the history entry we pushed above so
    // back/forward navigation stays in sync with what's on screen.
    if (!fromPopstate) history.back();
  }
  function onPopState() {
    close(true);
  }
  function onKey(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight" && images.length > 1) loadIndex(index + 1);
    else if (e.key === "ArrowLeft" && images.length > 1) loadIndex(index - 1);
  }
  document.addEventListener("keydown", onKey);

  overlay.querySelector(".zoom-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close(); // backdrop only — not the stage/image/buttons
  });
  if (images.length > 1) {
    overlay.querySelector(".zoom-prev").addEventListener("click", () => loadIndex(index - 1));
    overlay.querySelector(".zoom-next").addEventListener("click", () => loadIndex(index + 1));
  }

  function toggleZoomAt(clientX, clientY) {
    if (scale > 1) {
      resetZoom();
      return;
    }
    scale = 2.5;
    const rect = stage.getBoundingClientRect();
    const offsetX = clientX - rect.left - rect.width / 2;
    const offsetY = clientY - rect.top - rect.height / 2;
    panX = -offsetX * (scale - 1) / scale;
    panY = -offsetY * (scale - 1) / scale;
    applyTransform();
  }
  stage.addEventListener("dblclick", (e) => toggleZoomAt(e.clientX, e.clientY));

  // Touch: pinch-to-zoom, single-finger pan when zoomed in, double-tap to toggle zoom,
  // and a plain single-finger swipe (when NOT zoomed) to move between photos.
  let pinchStartDist = 0, pinchStartScale = 1;
  let dragStart = null;
  let lastTapTime = 0;
  let swipeStartX = null;

  stage.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartScale = scale;
      swipeStartX = null;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime < 320) {
        toggleZoomAt(e.touches[0].clientX, e.touches[0].clientY);
      }
      lastTapTime = now;
      dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX, panY };
      swipeStartX = scale <= 1 ? e.touches[0].clientX : null;
    }
  }, { passive: true });

  stage.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      scale = Math.min(4, Math.max(1, pinchStartScale * (dist / pinchStartDist)));
      applyTransform();
    } else if (e.touches.length === 1 && scale > 1 && dragStart) {
      e.preventDefault();
      panX = dragStart.panX + (e.touches[0].clientX - dragStart.x);
      panY = dragStart.panY + (e.touches[0].clientY - dragStart.y);
      applyTransform();
    }
  }, { passive: false });

  stage.addEventListener("touchend", (e) => {
    if (scale <= 1.02 && swipeStartX !== null && e.changedTouches.length) {
      const deltaX = e.changedTouches[0].clientX - swipeStartX;
      if (images.length > 1 && Math.abs(deltaX) > 60) {
        loadIndex(index + (deltaX < 0 ? 1 : -1));
      }
    }
    if (scale < 1.02) resetZoom();
    dragStart = null;
    swipeStartX = null;
  });

  // Desktop: wheel to zoom (centered on cursor), drag to pan once zoomed in.
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    const prevScale = scale;
    scale = Math.min(4, Math.max(1, scale - e.deltaY * 0.0015 * scale));
    const factor = scale / prevScale;
    panX = offsetX - (offsetX - panX) * factor;
    panY = offsetY - (offsetY - panY) * factor;
    applyTransform();
  }, { passive: false });

  let mouseDragging = false, mouseStart = null;
  stage.addEventListener("mousedown", (e) => {
    if (scale <= 1) return;
    mouseDragging = true;
    mouseStart = { x: e.clientX, y: e.clientY, panX, panY };
    stage.classList.add("dragging");
  });
  function onMouseMove(e) {
    if (!mouseDragging) return;
    panX = mouseStart.panX + (e.clientX - mouseStart.x);
    panY = mouseStart.panY + (e.clientY - mouseStart.y);
    applyTransform();
  }
  function onMouseUp() {
    mouseDragging = false;
    stage.classList.remove("dragging");
  }
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}
window.openImageZoom = openImageZoom;

/* ---------------------------------- Header / nav shared behaviour ---------------------------------- */
function initHeader() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open"))
    );
  }
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a").forEach((a) => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });

  // Search icon opens/closes the search box; outside click closes it.
  const searchToggle = document.querySelector(".search-toggle");
  const searchBox = document.querySelector(".search-box");
  if (searchToggle && searchBox) {
    searchToggle.addEventListener("click", () => {
      searchBox.classList.toggle("open");
      if (searchBox.classList.contains("open")) searchBox.querySelector("input").focus();
    });
    document.addEventListener("click", (e) => {
      if (!searchBox.classList.contains("open")) return;
      if (searchBox.contains(e.target) || searchToggle.contains(e.target)) return;
      searchBox.classList.remove("open");
    });
  }
}

// Expose shared consts explicitly on window (const/let don't auto-attach to window)
window.ICONS = ICONS;
window.STORE = STORE;
window.CATEGORY_LABELS = CATEGORY_LABELS;
window.productThumbHTML = productThumbHTML;
window.productGalleryHTML = productGalleryHTML;

/* ---------------------------------- Init on every page ---------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initCurrencyToggle();
  updateCartCount();
  renderAllPrices();
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
});
