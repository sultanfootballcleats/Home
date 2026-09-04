/* Shop page: category filters, search, sorting, grid rendering */
(function () {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  window.wireProductCardLinks(grid);

  window.PRODUCTS_READY.then(() => {
    const pillsWrap = document.getElementById("filterPills");
    const resultCount = document.getElementById("resultCount");
    const sortSelect = document.getElementById("sortSelect");

    // Every filter (plus sort) is read from the URL on load and kept in sync
    // with it as the customer changes things — see syncURL() below — so a
    // shared/bookmarked link always reopens the shop with the same results.
    const params = new URLSearchParams(location.search);
    let activeCategory = params.get("cat") || "all";
    let searchTerm = (params.get("q") || "").trim();
    let sortBy = params.get("sort") || "featured";
    let activeType = params.get("type") || "all";
    let activeBrand = params.get("brand") || "all";
    let sizeMin = params.has("sizeMin") ? parseFloat(params.get("sizeMin")) : null;
    let sizeMax = params.has("sizeMax") ? parseFloat(params.get("sizeMax")) : null;
    if (sizeMin !== null && isNaN(sizeMin)) sizeMin = null;
    if (sizeMax !== null && isNaN(sizeMax)) sizeMax = null;
    let minCondition = params.has("condition") ? parseFloat(params.get("condition")) : 0;
    if (isNaN(minCondition)) minCondition = 0;
    let budgetMinPKR = params.has("budgetMin") ? parseFloat(params.get("budgetMin")) : null;
    let budgetMaxPKR = params.has("budgetMax") ? parseFloat(params.get("budgetMax")) : null;
    if (budgetMinPKR !== null && isNaN(budgetMinPKR)) budgetMinPKR = null;
    if (budgetMaxPKR !== null && isNaN(budgetMaxPKR)) budgetMaxPKR = null;

    /* ------------------------------ Filter panel ------------------------------ */
    const filterPanel = document.getElementById("filterPanel");
    const filterToggle = document.getElementById("filterToggle");
    const typeSelect = document.getElementById("filterType");
    const brandSelect = document.getElementById("filterBrand");
    const sizeMinSelect = document.getElementById("filterSizeMin");
    const sizeMaxSelect = document.getElementById("filterSizeMax");
    const conditionSelect = document.getElementById("filterCondition");
    const budgetMinInput = document.getElementById("filterBudgetMin");
    const budgetMaxInput = document.getElementById("filterBudgetMax");
    const filterResetBtn = document.getElementById("filterReset");

    window.uniqueBrands().forEach((brand) => {
      const opt = document.createElement("option");
      opt.value = brand;
      opt.textContent = brand;
      brandSelect.appendChild(opt);
    });
    // Same "UK X (EUR Y)" labeling on both ends of the range, built from
    // whatever sizes actually exist in data/products.txt.
    window.uniqueSizesUK().forEach((size) => {
      const match = PRODUCTS.find((p) => String(p.sizeUK) === String(size));
      const label = match && match.sizeEUR ? `UK ${size} (EUR ${match.sizeEUR})` : `UK ${size}`;
      [sizeMinSelect, sizeMaxSelect].forEach((select) => {
        const opt = document.createElement("option");
        opt.value = size;
        opt.textContent = label;
        select.appendChild(opt);
      });
    });

    // Reflect whatever came in on the URL back onto the filter controls
    // themselves, now that their <option>s have been built above.
    typeSelect.value = activeType;
    brandSelect.value = window.uniqueBrands().includes(activeBrand) ? activeBrand : "all";
    if (activeBrand !== "all" && brandSelect.value === "all") activeBrand = "all";
    sizeMinSelect.value = sizeMin !== null ? String(sizeMin) : "";
    sizeMaxSelect.value = sizeMax !== null ? String(sizeMax) : "";
    conditionSelect.value = String(minCondition || 0);
    budgetMinInput.value = budgetMinPKR !== null ? String(budgetMinPKR) : "";
    budgetMaxInput.value = budgetMaxPKR !== null ? String(budgetMaxPKR) : "";
    sortSelect.value = sortBy;
    if (filterPanel && (activeType !== "all" || activeBrand !== "all" || sizeMin !== null || sizeMax !== null || minCondition > 0 || budgetMinPKR !== null || budgetMaxPKR !== null)) {
      filterPanel.classList.add("open");
      if (filterToggle) filterToggle.setAttribute("aria-expanded", "true");
    }

    if (filterToggle) {
      filterToggle.addEventListener("click", () => {
        const isOpen = filterPanel.classList.toggle("open");
        filterToggle.setAttribute("aria-expanded", String(isOpen));
      });
    }
    typeSelect.addEventListener("change", () => { activeType = typeSelect.value; syncURL(); render(); });
    brandSelect.addEventListener("change", () => { activeBrand = brandSelect.value; syncURL(); render(); });
    sizeMinSelect.addEventListener("change", () => {
      sizeMin = sizeMinSelect.value ? parseFloat(sizeMinSelect.value) : null;
      // Keep the range sane: if Min is pushed past the current Max, bring Max up to match
      // rather than silently returning zero results.
      if (sizeMin !== null && sizeMax !== null && sizeMin > sizeMax) {
        sizeMax = sizeMin;
        sizeMaxSelect.value = sizeMinSelect.value;
      }
      syncURL();
      render();
    });
    sizeMaxSelect.addEventListener("change", () => {
      sizeMax = sizeMaxSelect.value ? parseFloat(sizeMaxSelect.value) : null;
      if (sizeMin !== null && sizeMax !== null && sizeMax < sizeMin) {
        sizeMin = sizeMax;
        sizeMinSelect.value = sizeMaxSelect.value;
      }
      syncURL();
      render();
    });
    conditionSelect.addEventListener("change", () => { minCondition = parseFloat(conditionSelect.value); syncURL(); render(); });
    budgetMinInput.addEventListener("input", () => {
      budgetMinPKR = budgetMinInput.value ? parseFloat(budgetMinInput.value) : null;
      syncURL();
      render();
    });
    budgetMaxInput.addEventListener("input", () => {
      budgetMaxPKR = budgetMaxInput.value ? parseFloat(budgetMaxInput.value) : null;
      syncURL();
      render();
    });
    filterResetBtn.addEventListener("click", () => {
      activeType = "all"; activeBrand = "all"; sizeMin = null; sizeMax = null; minCondition = 0;
      budgetMinPKR = null; budgetMaxPKR = null;
      typeSelect.value = "all"; brandSelect.value = "all";
      sizeMinSelect.value = ""; sizeMaxSelect.value = ""; conditionSelect.value = "0";
      budgetMinInput.value = ""; budgetMaxInput.value = "";
      syncURL();
      render();
    });

    // The header search box is shared markup on every page (see main.js initHeader).
    // On the shop page itself we pre-fill it and filter live instead of reloading.
    const searchInput = document.querySelector(".search-box input");
    const searchForm = document.querySelector(".search-box");
    if (searchInput) searchInput.value = searchTerm;
    if (searchTerm && searchForm) searchForm.classList.add("open");

    function accentGradient(hex) {
      return `linear-gradient(135deg, ${hex}22, #C9CFD8 40%, #EDEFF2 60%, ${hex}33)`;
    }

    function cardHTML(p) {
      return `
        <article class="product-card" data-id="${p.id}">
          <a href="product.html?id=${p.id}" aria-label="View ${p.name}">
            <div class="product-media" style="background:${accentGradient(p.accent)}">
              ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ""}
              ${window.productThumbHTML(p)}
            </div>
          </a>
          <button class="share-btn" type="button" data-share-id="${p.id}" aria-label="Share ${p.name}" title="Share">${window.ICONS.share}</button>
          <div class="product-body">
            <span class="product-cat">${p.categoryLabel}</span>
            <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
            ${window.renderStars(p.condition)}
            <div class="card-size-row">
              <span class="card-size-badge">UK ${p.sizeUK}</span>
              <span class="card-size-badge">EUR ${p.sizeEUR}</span>
            </div>
            <div class="product-price-row">
              <span class="price" data-price="${p.price}"></span>
            </div>
            <a class="btn btn-outline btn-block" href="product.html?id=${p.id}">View Details</a>
          </div>
        </article>`;
    }

    // Matches against name, brand, category, and color for general text search.
    // Size searches ("uk 7", "us 9", "eur 43", or a bare number like "43") are handled
    // as an exact match against that specific size field, not a loose text contains —
    // otherwise "uk 7" would also match any shoe whose price/condition happens to
    // contain a "7" somewhere.
    const SIZE_FIELD = { uk: "sizeUK", us: "sizeUS", eur: "sizeEUR", eu: "sizeEUR" };

    function matchesSearch(p, rawTerm) {
      const term = rawTerm.trim().toLowerCase();
      if (!term) return true;

      const sizeMatch = term.match(/^(uk|us|eur|eu)\s*([\d]+(?:\.\d+)?)$/);
      if (sizeMatch) {
        const field = SIZE_FIELD[sizeMatch[1]];
        const target = parseFloat(sizeMatch[2]);
        const actual = parseFloat(p[field]);
        return !isNaN(actual) && Math.abs(actual - target) < 0.01;
      }

      const bareNumber = term.match(/^[\d]+(?:\.\d+)?$/);
      if (bareNumber) {
        const target = parseFloat(term);
        return [p.sizeUS, p.sizeUK, p.sizeEUR].some(
          (s) => !isNaN(parseFloat(s)) && Math.abs(parseFloat(s) - target) < 0.01
        );
      }

      const haystack = [p.name, p.brand, p.categoryLabel, p.color].join(" ").toLowerCase();
      return term
        .split(/\s+/)
        .filter(Boolean)
        .every((word) => haystack.includes(word));
    }

    function render() {
      let list = PRODUCTS.slice();
      if (activeCategory !== "all") {
        list = list.filter((p) => window.productAgeGroup(p.category) === activeCategory);
      }
      if (activeType !== "all") {
        list = list.filter((p) => window.productType(p.category) === activeType);
      }
      if (searchTerm) {
        list = list.filter((p) => matchesSearch(p, searchTerm));
      }
      if (activeBrand !== "all") {
        list = list.filter((p) => p.brand === activeBrand);
      }
      if (sizeMin !== null || sizeMax !== null) {
        list = list.filter((p) => {
          const s = parseFloat(p.sizeUK);
          if (isNaN(s)) return false;
          if (sizeMin !== null && s < sizeMin) return false;
          if (sizeMax !== null && s > sizeMax) return false;
          return true;
        });
      }
      if (minCondition > 0) {
        list = list.filter((p) => window.conditionToStars(p.condition) >= minCondition - 0.001);
      }
      if (budgetMinPKR !== null || budgetMaxPKR !== null) {
        list = list.filter((p) => {
          const pricePKR = p.price * STORE.usdToPkr;
          if (budgetMinPKR !== null && pricePKR < budgetMinPKR) return false;
          if (budgetMaxPKR !== null && pricePKR > budgetMaxPKR) return false;
          return true;
        });
      }
      if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
      if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
      if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));

      if (!list.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
          <div class="crown-mark">${window.ICONS.crown}</div>
          <h3>${searchTerm ? `No pairs match "${searchTerm}"` : "No pairs match these filters right now"}</h3>
          <p>${searchTerm ? "Try a different name, brand, or size." : "Try loosening a filter, or check back soon."}</p>
        </div>`;
      } else {
        grid.innerHTML = list.map(cardHTML).join("");
      }
      resultCount.textContent = `${list.length} ${list.length === 1 ? "result" : "results"}`;
      renderAllPrices();

      pillsWrap.querySelectorAll(".filter-pill").forEach((pill) => {
        pill.classList.toggle("active", pill.dataset.cat === activeCategory);
      });
    }

    // Every active filter (and the sort order) is written into the URL so
    // that copying/sharing the page link reopens the shop with the exact
    // same results the customer was looking at.
    function syncURL() {
      const url = new URL(location.href);
      const set = (key, value, isDefault) => {
        if (isDefault) url.searchParams.delete(key);
        else url.searchParams.set(key, value);
      };
      set("cat", activeCategory, activeCategory === "all");
      set("q", searchTerm, !searchTerm);
      set("sort", sortBy, sortBy === "featured");
      set("type", activeType, activeType === "all");
      set("brand", activeBrand, activeBrand === "all");
      set("sizeMin", sizeMin, sizeMin === null);
      set("sizeMax", sizeMax, sizeMax === null);
      set("condition", minCondition, !minCondition);
      set("budgetMin", budgetMinPKR, budgetMinPKR === null);
      set("budgetMax", budgetMaxPKR, budgetMaxPKR === null);
      history.replaceState({}, "", url);
    }

    pillsWrap.addEventListener("click", (e) => {
      const pill = e.target.closest(".filter-pill");
      if (!pill) return;
      activeCategory = pill.dataset.cat;
      syncURL();
      render();
    });

    sortSelect.addEventListener("change", (e) => {
      sortBy = e.target.value;
      syncURL();
      render();
    });

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value.trim();
        syncURL();
        render();
      });
    }
    if (searchForm) {
      // Already on the shop page — filter live instead of doing a full page reload.
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        searchInput.blur();
      });
    }

    // "Share" on the shop page shares the current URL as-is, filters and all
    // (syncURL() above keeps it current as filters change).
    const shareShopBtn = document.getElementById("shareShopBtn");
    if (shareShopBtn) {
      shareShopBtn.addEventListener("click", () => {
        window.shareLink({
          url: location.href,
          title: "Sultan Football Cleats — Shop",
          text: "Check out these cleats on Sultan Football Cleats",
        });
      });
    }

    syncURL();
    render();
  });
})();
