function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = mockCategories
    .map((category) => `<li><a href="#">${escapeHTML(category.name)}</a></li>`)
    .join("");
}


function renderEmptyCart() {
  const content = document.getElementById("cart-content");
  if (!content) return;
  content.innerHTML = `
    <div class="empty-cart">
      <img src="../../assets/icons/shoppingCart/cart.svg" alt="Carrito vacío" class="empty-cart-icon" />
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
  const subtotal = Number(product.price) * cantidad;
  const image = product.images ? product.images[0] : product.imagen_url;

  return `
    <article class="cart-item" data-id="${product.id}">
      <a href="${detailURL}">
        <img class="cart-item-image" src="${image}" alt="${product.name}" />
      </a>

      <div class="cart-item-info">
        <span class="cart-item-brand">${escapeHTML(product.brand)}</span>
        <a class="cart-item-name" href="${detailURL}">${escapeHTML(product.name)}</a>
        <span class="cart-item-meta">Talla ${escapeHTML(product.size)} · ${escapeHTML(labelOf(CONDITION_LABELS, product.condition))}</span>
        <span class="cart-item-price">$${Number(product.price).toFixed(2)}</span>

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
        <img src="../../assets/icons/shoppingCart/trash.svg" alt="Eliminar" />
      </button>
    </article>
  `;
}

async function renderCart() {
  const items = await getCartItems();
  if (isGuestSession()) {
    document.querySelector(".cart-page")?.classList.add("is-empty");
    renderLoginRequired();
    return;
  }

  function renderLoginRequired() {
  document.getElementById("cart-content").innerHTML = `
    <div class="empty-cart">
      <img src="../../assets/icons/shoppingCart/cart.svg" alt="" class="empty-cart-icon" />
      <h1 class="empty-cart-title">Tu carrito</h1>
      <p class="empty-cart-text">Inicia sesión para ver los artículos de tu carrito.</p>
      <a href="${LOGIN_URL}?redirect=${encodeURIComponent(location.pathname)}" class="btn-shop-now">Iniciar sesión</a>
    </div>`;
  }

  const page = document.querySelector(".cart-page");

  if (page) page.classList.toggle("is-empty", items.length === 0);

  if (items.length === 0) {
    renderEmptyCart();
    return;
  }

  const count = await getCartCount();
  const total = await getCartTotal();

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

document.addEventListener("click", async (e) => {
  if (e.target.closest("#checkout-btn")) {
    showToast("El pago estará disponible próximamente");
    return;
  }

  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const card = btn.closest(".cart-item");
  if (!card) return;
  const id = Number(card.dataset.id);

  const currentQty = await getCartQuantity(id);

  if (btn.dataset.action === "plus") await setCartQuantity(id, currentQty + 1);
  if (btn.dataset.action === "minus") await setCartQuantity(id, currentQty - 1);
  if (btn.dataset.action === "remove") await removeFromCart(id);

  await renderCart();
});

document.addEventListener("DOMContentLoaded", async () => {
  renderCategories();
  await renderCart();
});