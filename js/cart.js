/* Cart page */
(function () {
  const cartSection = document.getElementById("cartSection");
  if (!cartSection) return;

  window.PRODUCTS_READY.then(() => {
    const tableWrap = document.getElementById("cartTableWrap");
    const emptyState = document.getElementById("cartEmpty");
    const summaryCard = document.getElementById("summaryCard");
    const checkoutForm = document.getElementById("checkoutForm");
    const paymentInfoBox = document.getElementById("paymentInfoBox");

    function accentGradient(hex) {
      return `linear-gradient(135deg, ${hex}22, #C9CFD8 40%, #EDEFF2 60%, ${hex}33)`;
    }

    function render() {
      // Keep quantities within current stock (e.g. if stock was reduced since the item was added).
      getCart().forEach((i) => {
        const p = getProduct(i.id);
        if (p && (i.qty || 1) > Math.max(p.stock, 1)) setCartQty(i.id, Math.max(p.stock, 1));
      });
      const cart = getCart();
      if (!cart.length) {
        tableWrap.style.display = "none";
        summaryCard.style.display = "none";
        if (checkoutForm) checkoutForm.style.display = "none";
        if (paymentInfoBox) paymentInfoBox.style.display = "none";
        emptyState.style.display = "block";
        return;
      }
      tableWrap.style.display = "block";
      summaryCard.style.display = "block";
      if (checkoutForm) checkoutForm.style.display = "block";
      if (paymentInfoBox) paymentInfoBox.style.display = "block";
      emptyState.style.display = "none";

      const rows = cart
        .map((item) => {
          const p = getProduct(item.id);
          if (!p) return "";
          const href = `product.html?id=${p.id}`;
          const qty = item.qty || 1;
          const size = window.sizeLabel(p);
          const qtyCell = p.stock > 1
            ? `<div class="qty-control"><button type="button" data-action="dec" aria-label="Decrease quantity" ${qty <= 1 ? "disabled" : ""}>−</button><span aria-live="polite">${qty}</span><button type="button" data-action="inc" aria-label="Increase quantity" ${qty >= p.stock ? "disabled" : ""}>+</button></div>`
            : `<span class="qty-static">1</span>`;
          return `
          <tr class="cart-row" data-id="${p.id}">
            <td>
              <div class="cart-item-info">
                <a href="${href}" class="cart-item-thumb-link" aria-label="View ${p.name}">
                  <div class="thumb" style="background:${accentGradient(p.accent)}">${window.productThumbHTML(p)}</div>
                </a>
                <div>
                  <h4><a href="${href}">${p.name}</a></h4>
                  <span>${size ? size + " · " : ""}${p.categoryLabel}</span><br/>
                  ${qty > 1 ? `<span><span data-price-primary="${p.price}"></span> each</span><br/>` : ""}
                  <a class="remove-link" href="#" data-action="remove">Remove</a>
                </div>
              </div>
            </td>
            <td class="cart-qty">${qtyCell}</td>
            <td class="cart-price" data-price="${p.price * qty}"></td>
          </tr>`;
        })
        .join("");

      tableWrap.innerHTML = `
        <table class="cart-table">
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;

      const subtotal = cartTotal();
      const total = cartGrandTotal();
      const delivery = cartDeliveryInfo();
      summaryCard.innerHTML = `
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span data-price-primary="${subtotal}"></span></div>
        <div class="summary-row"><span>Delivery (${delivery.label})</span><span>${STORE.currencySymbolPKR}${delivery.pkr.toLocaleString("en-US")}/-</span></div>
        <div class="summary-row total"><span>Total</span><span data-price-primary="${total}"></span></div>
        <p class="summary-note">Fill in your details above, then tap below to send your order to our team on WhatsApp. Your items are reserved for you as soon as we confirm on WhatsApp.</p>
        <button class="btn btn-whatsapp btn-block" id="checkoutBtn" type="button">Send Order on WhatsApp</button>
        <a class="btn btn-outline btn-block" href="shop.html" style="margin-top:10px;">Continue Shopping</a>
      `;

      renderAllPrices();

      document.getElementById("checkoutBtn").addEventListener("click", () => {
        const nameInput = document.getElementById("custName");
        const phoneInput = document.getElementById("custPhone");
        const addressInput = document.getElementById("custAddress");
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const address = addressInput.value.trim();

        const fields = [
          { input: nameInput, value: name },
          { input: phoneInput, value: phone },
          { input: addressInput, value: address },
        ];
        let firstInvalid = null;
        fields.forEach(({ input, value }) => {
          const label = input.closest("label");
          const invalid = !value;
          label.classList.toggle("invalid", invalid);
          if (invalid && !firstInvalid) firstInvalid = input;
        });
        if (firstInvalid) {
          firstInvalid.focus();
          showToast("Please fill in your name, phone, and address first");
          return;
        }

        window.open(whatsAppOrderLink({ name, phone, address }), "_blank", "noopener");
        saveCart([]);
        render();
        showOrderModal();
      });
    }

    // Attached once (these inputs live in the persistent checkoutForm markup, not
    // the summaryCard block that render() rebuilds each time).
    if (checkoutForm) {
      ["custName", "custPhone", "custAddress"].forEach((id) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener("input", () => {
          if (input.value.trim()) input.closest("label").classList.remove("invalid");
        });
      });
    }

    // Post-checkout "thank you" confirmation — shown on this page right after the
    // WhatsApp tab opens, so it never touches or delays the WhatsApp message itself.
    const orderModalOverlay = document.getElementById("orderModalOverlay");
    const orderModalClose = document.getElementById("orderModalClose");
    function showOrderModal() {
      if (!orderModalOverlay) return;
      orderModalOverlay.classList.add("open");
    }
    function hideOrderModal() {
      if (!orderModalOverlay) return;
      orderModalOverlay.classList.remove("open");
    }
    if (orderModalClose) {
      orderModalClose.addEventListener("click", () => {
        location.href = "shop.html";
      });
    }
    if (orderModalOverlay) {
      orderModalOverlay.addEventListener("click", (e) => {
        if (e.target === orderModalOverlay) hideOrderModal();
      });
    }

    tableWrap.addEventListener("click", (e) => {
      const row = e.target.closest(".cart-row");
      const action = e.target.closest("[data-action]");
      if (!row || !action) return;
      e.preventDefault();
      const id = row.dataset.id;
      const current = getCart().find((i) => i.id === id);
      const qty = current ? current.qty || 1 : 1;
      if (action.dataset.action === "remove") removeFromCart(id);
      else if (action.dataset.action === "inc") setCartQty(id, qty + 1);
      else if (action.dataset.action === "dec") setCartQty(id, qty - 1);
      render();
    });

    document.addEventListener("currencychange", render);
    render();
  });
})();
