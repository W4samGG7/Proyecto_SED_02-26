function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = mockCategories
    .map((category) => `<li><a href="#">${category.name}</a></li>`)
    .join("");
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function renderEmptyCart() {
  document.getElementById("cart-content").innerHTML = `
    <div class="empty-cart">
    <img src="../../assets/icons/shoppingCart/cart.svg"
           alt="Carrito vacío"
           class="empty-cart-icon" />
      <h1 class="empty-cart-title">Tu carrito</h1>
      <p class="empty-cart-text">
        Tu carrito está vacío. ¡Llénalo con prendas que merecen una segunda oportunidad!
      </p>
      <a href="../../index.html" class="btn-shop-now">Explorar prendas</a>
    </div>
  `;
}

function createCartItemHTML({ product, cantidad }) {
  const detailURL = `../productDetail/product.html?id=${product.id}`;
  const subtotal = product.price * cantidad;

  return `
    <article class="cart-item" data-id="${product.id}">
      <a href="${detailURL}">
        <img class="cart-item-image" src="${product.images[0]}" alt="${product.name}" />
      </a>

      <div class="cart-item-info">
        <span class="cart-item-brand">${product.brand}</span>
        <a class="cart-item-name" href="${detailURL}">${product.name}</a>
        <span class="cart-item-meta">Talla ${product.size} · ${product.condition}</span>
        <span class="cart-item-seller">Vendido por ${product.seller.name}</span>
        <span class="cart-item-price">$${product.price.toFixed(2)}</span>

        <div class="cart-item-bottom">
          <div class="quantity-controls">
            <button type="button" data-action="minus" aria-label="Disminuir cantidad" ${cantidad <= 1 ? "disabled" : ""}>−</button>
            <span>${cantidad}</span>
            <button type="button" data-action="plus" aria-label="Aumentar cantidad" ${cantidad >= product.stock ? "disabled" : ""}>+</button>
          </div>
          <span class="cart-item-subtotal">$${subtotal.toFixed(2)}</span>
        </div>
      </div>

      <button type="button" class="remove-item" data-action="remove">
        <img src="../../assets/icons/shoppingCart/trash.svg" alt="" />
      </button>
    </article>
  `;
}

function renderCart() {
  const items = getCartItems();
  const page = document.querySelector(".cart-page");

  // Centra verticalmente solo el estado vacío
  if (page) page.classList.toggle("is-empty", items.length === 0);

  if (items.length === 0) {
    renderEmptyCart();
    return;
  }

  const count = getCartCount();
  const total = getCartTotal();

  document.getElementById("cart-content").innerHTML = `
    <div class="cart-layout">
      <section class="cart-items">
        <h1 class="cart-title">Carrito de compras</h1>
        <p class="cart-subtitle">${count} ${count === 1 ? "artículo" : "artículos"}</p>
        ${items.map(createCartItemHTML).join("")}
      </section>

      <aside class="cart-summary">
        <h2>Resumen del pedido</h2>

        <div class="summary-row">
          <span>Subtotal</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Envío</span>
          <span>Por calcular</span>
        </div>

        <div class="summary-row total">
          <span>Total</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <p class="summary-note">(+ envío e impuestos aplicables)</p>

        <button type="button" class="btn-checkout" id="checkout-btn">Finalizar compra</button>
        <a href="../../index.html" class="continue-link">Seguir comprando</a>
      </aside>
    </div>
  `;
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#checkout-btn")) {
    // TODO: pago. Aquí (en el backend) es donde el stock baja de verdad.
    showToast("El pago estará disponible próximamente");
    return;
  }

  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const card = btn.closest(".cart-item");
  const id = Number(card.dataset.id);
  const current = getCartQuantity(id);

  if (btn.dataset.action === "plus") setCartQuantity(id, current + 1);
  if (btn.dataset.action === "minus") setCartQuantity(id, current - 1);
  if (btn.dataset.action === "remove") removeFromCart(id);

  renderCart();
});

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderCart();
});