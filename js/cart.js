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
          return `
          <tr class="cart-row" data-id="${p.id}">
            <td>
              <div class="cart-item-info">
                <a href="${href}" class="cart-item-thumb-link" aria-label="View ${p.name}">
                  <div class="thumb" style="background:${accentGradient(p.accent)}">${window.productThumbHTML(p)}</div>
                </a>
                <div>
                  <h4><a href="${href}">${p.name}</a></h4>
                  <span>Size US ${p.sizeUS} / UK ${p.sizeUK} / EUR ${p.sizeEUR} · ${p.categoryLabel}</span><br/>
                  <a class="remove-link" href="#" data-action="remove">Remove</a>
                </div>
              </div>
            </td>
            <td class="cart-price" data-price="${p.price}"></td>
          </tr>`;
        })
        .join("");

      tableWrap.innerHTML = `
        <table class="cart-table">
          <thead>
            <tr><th>Product</th><th>Price</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;

      const subtotal = cartTotal();
      const total = cartGrandTotal();
      summaryCard.innerHTML = `
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span data-price-primary="${subtotal}"></span></div>
        <div class="summary-row"><span>Delivery (Rs. 300/- per pair × ${cart.length})</span><span>${STORE.currencySymbolPKR}${(STORE.deliveryPKR * cart.length).toLocaleString("en-US")}/-</span></div>
        <div class="summary-row total"><span>Total</span><span data-price-primary="${total}"></span></div>
        <p class="summary-note">Fill in your details above, then tap below to send your order to our team on WhatsApp. Each item here is a single unique pair, so it's reserved for you as soon as we confirm on WhatsApp.</p>
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
      if (action.dataset.action === "remove") removeFromCart(row.dataset.id);
      render();
    });

    document.addEventListener("currencychange", render);
    render();
  });
})();
