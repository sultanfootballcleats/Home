/* Shop page: category filters, search, sorting, grid rendering */
(function () {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  window.wireProductCardLinks(grid);

  window.PRODUCTS_READY.then(() => {
    const pillsWrap = document.getElementById("filterPills");
    const resultCount = document.getElementById("resultCount");
    const sortSelect = document.getElementById("sortSelect");

    const params = new URLSearchParams(location.search);
    let activeCategory = params.get("cat") || "all";
    let searchTerm = (params.get("q") || "").trim();
    let sortBy = "featured";
    let activeType = "all";
    let activeBrand = "all";
    let sizeMin = null;
    let sizeMax = null;
    let minCondition = 0;
    let budgetMinPKR = null;
    let budgetMaxPKR = null;

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

    if (filterToggle) {
      filterToggle.addEventListener("click", () => {
        const isOpen = filterPanel.classList.toggle("open");
        filterToggle.setAttribute("aria-expanded", String(isOpen));
      });
    }
    typeSelect.addEventListener("change", () => { activeType = typeSelect.value; render(); });
    brandSelect.addEventListener("change", () => { activeBrand = brandSelect.value; render(); });
    sizeMinSelect.addEventListener("change", () => {
      sizeMin = sizeMinSelect.value ? parseFloat(sizeMinSelect.value) : null;
      // Keep the range sane: if Min is pushed past the current Max, bring Max up to match
      // rather than silently returning zero results.
      if (sizeMin !== null && sizeMax !== null && sizeMin > sizeMax) {
        sizeMax = sizeMin;
        sizeMaxSelect.value = sizeMinSelect.value;
      }
      render();
    });
    sizeMaxSelect.addEventListener("change", () => {
      sizeMax = sizeMaxSelect.value ? parseFloat(sizeMaxSelect.value) : null;
      if (sizeMin !== null && sizeMax !== null && sizeMax < sizeMin) {
        sizeMin = sizeMax;
        sizeMinSelect.value = sizeMaxSelect.value;
      }
      render();
    });
    conditionSelect.addEventListener("change", () => { minCondition = parseFloat(conditionSelect.value); render(); });
    budgetMinInput.addEventListener("input", () => {
      budgetMinPKR = budgetMinInput.value ? parseFloat(budgetMinInput.value) : null;
      render();
    });
    budgetMaxInput.addEventListener("input", () => {
      budgetMaxPKR = budgetMaxInput.value ? parseFloat(budgetMaxInput.value) : null;
      render();
    });
    filterResetBtn.addEventListener("click", () => {
      activeType = "all"; activeBrand = "all"; sizeMin = null; sizeMax = null; minCondition = 0;
      budgetMinPKR = null; budgetMaxPKR = null;
      typeSelect.value = "all"; brandSelect.value = "all";
      sizeMinSelect.value = ""; sizeMaxSelect.value = ""; conditionSelect.value = "0";
      budgetMinInput.value = ""; budgetMaxInput.value = "";
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

    function syncURL() {
      const url = new URL(location.href);
      if (activeCategory === "all") url.searchParams.delete("cat");
      else url.searchParams.set("cat", activeCategory);
      if (searchTerm) url.searchParams.set("q", searchTerm);
      else url.searchParams.delete("q");
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

    render();
  });
})();
