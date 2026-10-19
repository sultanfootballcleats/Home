/* Product detail page */
(function () {
  const root = document.getElementById("pdpRoot");
  if (!root) return;

  window.PRODUCTS_READY.then(() => {
    const params = new URLSearchParams(location.search);
    const product = getProduct(params.get("id"));

    if (!product) {
      root.innerHTML = `<div class="empty-state">
        <div class="crown-mark">${window.ICONS.crown}</div>
        <h3>We couldn't find that pair</h3>
        <p>It may have sold out or the link is incorrect.</p>
        <a href="shop.html" class="btn btn-primary" style="margin-top:18px;">Back to Shop</a>
      </div>`;
      document.getElementById("relatedSection").style.display = "none";
      return;
    }

    document.title = `${product.name} — Sultan Football Cleats`;
    document.getElementById("crumbName").textContent = product.name;

    function accentGradient(hex) {
      return `linear-gradient(135deg, ${hex}22, #C9CFD8 40%, #EDEFF2 60%, ${hex}33)`;
    }

    const conditionNote = product.fault && product.fault.trim().toUpperCase() !== "NONE"
      ? product.fault
      : (product.isNew ? "Brand new" : "No notable faults");

    root.innerHTML = `
      <div class="pdp-gallery">
        <div class="pdp-gallery-main" id="pdpGalleryMain" style="background:${accentGradient(product.accent)}">
          ${window.productGalleryHTML(product)}
        </div>
        <div class="pdp-thumbs" id="pdpThumbs" aria-label="Product photos and video"></div>
      </div>
      <div class="pdp-info">
        <span class="product-cat">${product.categoryLabel}</span>
        <h1>${product.name}</h1>
        <div class="pdp-price">
          <span data-price="${product.price}"></span>
          ${product.originalPrice ? `<span style="margin-left:10px;font-size:.85rem;color:var(--ink-muted);text-decoration:line-through;" data-price-primary="${product.originalPrice}"></span>` : ""}
        </div>
        <p class="pdp-desc">${product.desc}</p>

        ${product.sizeUS || product.sizeUK || product.sizeEUR ? `<div class="pdp-block">
          <label>${product.isFootwear && product.stock <= 1 ? "Size (this pair only — single unique unit in stock)" : "Size"}</label>
          <div class="size-grid">
            ${product.sizeUS ? `<span class="size-opt selected" style="cursor:default;">US ${product.sizeUS}</span>` : ""}
            ${product.sizeUK ? `<span class="size-opt selected" style="cursor:default;">UK ${product.sizeUK}</span>` : ""}
            ${product.sizeEUR ? `<span class="size-opt selected" style="cursor:default;">EUR ${product.sizeEUR}</span>` : ""}
          </div>
        </div>` : ""}

        <div class="pdp-block">
          <label>Condition</label>
          <div class="condition-row">${window.conditionHTML(product)}</div>
          <p class="pdp-desc" style="margin:8px 0 0;">${conditionNote}</p>
        </div>

        <div class="pdp-actions">
          <button class="btn btn-primary" id="addToCartBtn" ${product.stock < 1 ? "disabled" : ""}>${product.stock < 1 ? "Sold Out" : "Add to Cart"}</button>
          <a class="btn btn-whatsapp" id="enquireBtn" href="#" target="_blank" rel="noopener">
            Ask on WhatsApp
          </a>
          <button class="btn btn-outline" type="button" data-share-id="${product.id}">
            ${window.ICONS.share} Share
          </button>
        </div>

        <ul class="pdp-meta-list">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Nationwide delivery — ${product.isFootwear ? `Rs. ${window.STORE.deliveryPKR}/- per pair` : `flat Rs. ${window.STORE.deliveryPKR}/- on accessories-only orders (no extra charge when ordered with boots)`}, cash on delivery available</li>
          ${product.stock > 1 ? `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> ${product.stock} in stock</li>` : product.isFootwear ? `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> One-of-a-kind pair — once it's sold, it's gone</li>` : ""}
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Order confirmed directly with our team on WhatsApp</li>
          ${product.isFootwear
            ? `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> <span>Exchange or return within 7 days if damaged or the wrong size (unused shoe). <a href="policy.html" style="text-decoration:underline;">Read the full policy</a></span></li>`
            : `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> <span>See our <a href="policy.html" style="text-decoration:underline;">exchange &amp; refund policy</a></span></li>`}
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> <span>Please record a continuous video of the parcel unboxing — required for damaged-product returns or exchanges</span></li>
        </ul>
      </div>
    `;

    renderAllPrices();
    document.getElementById("enquireBtn").href = whatsAppEnquiryLink(product);

    // Build clickable thumbnails for every product photo plus an optional video.
    const galleryMain = document.getElementById("pdpGalleryMain");
    const thumbs = document.getElementById("pdpThumbs");
    const media = window.productMediaList(product);
    const imageMedia = media.filter((m) => m.type === "image");
    let currentImageIndex = 0;

    function refreshZoomAffordance() {
      const hasImage = !!galleryMain.querySelector("#pdpMainImg");
      galleryMain.classList.toggle("has-zoom", hasImage);
    }
    refreshZoomAffordance();

    galleryMain.addEventListener("click", () => {
      if (!galleryMain.querySelector("#pdpMainImg")) return; // video — let native controls handle taps
      window.openImageZoom(imageMedia, currentImageIndex, product.name);
    });

    thumbs.innerHTML = media.map((item, index) => {
      if (item.type === "video") {
        return `<button class="thumb media-thumb video-thumb ${index === 0 ? "active" : ""}" type="button" data-media-index="${index}" aria-label="View product video">
          <span>▶</span><small>Video</small>
        </button>`;
      }
      return `<button class="thumb media-thumb ${index === 0 ? "active" : ""}" type="button" data-media-index="${index}" aria-label="View ${item.label}">
        <img src="${item.src}" alt="${product.name} — ${item.label}" loading="lazy" />
      </button>`;
    }).join("");

    thumbs.querySelectorAll("[data-media-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = media[Number(button.dataset.mediaIndex)];
        if (!item) return;
        if (item.type === "video") {
          galleryMain.innerHTML = `<video class="pdp-main-video" src="${item.src}" poster="${product.image || ""}" controls playsinline preload="metadata" autoplay></video>`;
        } else {
          galleryMain.innerHTML = `<img class="pdp-main-image" src="${item.src}" alt="${product.name} — ${item.label}" id="pdpMainImg" />`;
          currentImageIndex = imageMedia.indexOf(item);
        }
        refreshZoomAffordance();
        thumbs.querySelectorAll(".media-thumb").forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
      });
    });

    document.getElementById("addToCartBtn").addEventListener("click", () => {
      const added = addToCart(product.id);
      if (added) {
        showToast(`Added ${product.name} to cart`);
      } else if (product.stock < 1) {
        showToast(`${product.name} is sold out`);
      } else if (product.stock > 1) {
        showToast(`You already have all ${product.stock} in your cart`);
      } else {
        showToast(`${product.name} is already in your cart`);
      }
    });

    // Related products: same single category, excluding this one
    const related = PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
    const relatedGrid = document.getElementById("relatedGrid");
    window.wireProductCardLinks(relatedGrid);
    if (related.length) {
      relatedGrid.innerHTML = related
        .map(
          (p) => `
        <article class="product-card" data-id="${p.id}">
          <a href="product.html?id=${p.id}">
            <div class="product-media" style="background:${accentGradient(p.accent)}">
              ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ""}
              ${window.productThumbHTML(p)}
            </div>
          </a>
          <button class="share-btn" type="button" data-share-id="${p.id}" aria-label="Share ${p.name}" title="Share">${window.ICONS.share}</button>
          <div class="product-body">
            <span class="product-cat">${p.categoryLabel}</span>
            <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
            ${window.conditionHTML(p)}
            ${window.sizeBadgesHTML(p)}
            <div class="product-price-row">
              <span class="price" data-price="${p.price}"></span>
            </div>
            <a class="btn btn-outline btn-block" href="product.html?id=${p.id}">View Details</a>
          </div>
        </article>`
        )
        .join("");
      renderAllPrices();
    } else {
      document.getElementById("relatedSection").style.display = "none";
    }
  });
})();
