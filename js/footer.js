document.addEventListener("DOMContentLoaded", () => {
  const footer = document.getElementById("footer");
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer-top">
      <div>
        <div class="footer-brand">
          <img src="assets/logo.png" alt="Sultan Football Cleats crest" />
          <strong>Sultan Football Cleats</strong>
        </div>
        <p class="footer-note">Genuine, pre-loved football boots from Nike, Adidas, Puma and more. Every pair is a unique single unit — condition-checked and honestly listed. Rs. 300 flat delivery all over Pakistan.</p>
      </div>
      <div class="footer-col">
        <h4>Shop</h4>
        <ul>
          <li><a href="shop.html?cat=adult-studs">Adult Studs</a></li>
          <li><a href="shop.html?cat=kids-studs">Kids Studs</a></li>
          <li><a href="shop.html?cat=adult-grippers">Adult Grippers</a></li>
          <li><a href="shop.html?cat=kids-grippers">Kids Grippers</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="about.html">About Sultan</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="cart.html">Your Cart</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Get in Touch</h4>
        <ul>
          <li><a href="https://wa.me/923295336020" target="_blank" rel="noopener">WhatsApp: +92 329 5336020</a></li>
          <li><a href="https://www.instagram.com/sultanfootballcleats/" target="_blank" rel="noopener">Instagram: @sultanfootballcleats</a></li>
          <li><a href="contact.html">Contact form</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year></span> Sultan Football Cleats. All rights reserved.</span>
      <div class="footer-socials">
        <a href="https://wa.me/923295336020" target="_blank" rel="noopener" aria-label="Message us on WhatsApp" title="WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5C10 9 9.3 7.4 9 6.7c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4S6 7.4 6 8.9s1 3 1.2 3.2c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2a10 10 0 00-8.6 15L2 22l5.1-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1120.2 12 8.2 8.2 0 0112 20.2z"/></svg>
        </a>
        <a href="https://www.instagram.com/sultanfootballcleats/" target="_blank" rel="noopener" aria-label="Follow us on Instagram" title="@sultanfootballcleats">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>
        </a>
      </div>
    </div>
  `;
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // Persistent floating WhatsApp button, on every page
  if (!document.querySelector(".whatsapp-float")) {
    const fab = document.createElement("a");
    fab.href = "https://wa.me/923295336020";
    fab.target = "_blank";
    fab.rel = "noopener";
    fab.className = "whatsapp-float";
    fab.setAttribute("aria-label", "Message Sultan Football Cleats on WhatsApp");
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5C10 9 9.3 7.4 9 6.7c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4S6 7.4 6 8.9s1 3 1.2 3.2c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2a10 10 0 00-8.6 15L2 22l5.1-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1120.2 12 8.2 8.2 0 0112 20.2z"/></svg>
      <span>Message us on WhatsApp</span>
    `;
    document.body.appendChild(fab);
  }
});
