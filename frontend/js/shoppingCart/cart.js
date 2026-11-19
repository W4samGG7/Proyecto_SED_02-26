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

function renderLoginRequired() {
  document.getElementById("cart-content").innerHTML = `
    <div class="empty-cart">
      <img src="../../assets/icons/shoppingCart/cart.svg" alt="" class="empty-cart-icon" />
      <h1 class="empty-cart-title">Tu carrito</h1>
      <p class="empty-cart-text">Inicia sesión para ver los artículos de tu carrito.</p>
      <a href="${LOGIN_URL}?redirect=${encodeURIComponent(window.location.pathname)}" class="btn-shop-now">Iniciar sesión</a>
    </div>
  `;
}

function renderCartError() {
  document.getElementById("cart-content").innerHTML = `
    <div class="cart-error">
      <p>No pudimos cargar tu carrito. Revisa tu conexión e inténtalo de nuevo.</p>
      <button type="button" class="btn-shop-now" id="retry-cart">Reintentar</button>
    </div>
  `;
}

function createCartItemHTML({ product, cantidad }) {
  const detailURL = `../productDetail/product.html?id=${encodeURIComponent(product.id)}`;
  const price = Number(product.price);
  const subtotal = price * cantidad;
  const image = escapeHTML(product.images?.[0] || "");

  return `
    <article class="cart-item" data-id="${escapeHTML(product.id)}">
      <a href="${detailURL}">
        <img class="cart-item-image" src="${image}" alt="${escapeHTML(product.name)}" />
      </a>

      <div class="cart-item-info">
        <span class="cart-item-brand">${escapeHTML(product.brand)}</span>
        <a class="cart-item-name" href="${detailURL}">${escapeHTML(product.name)}</a>
        <span class="cart-item-meta">Talla ${escapeHTML(product.size)} · ${escapeHTML(labelOf(CONDITION_LABELS, product.condition))}</span>
        <span class="cart-item-price">$${price.toFixed(2)}</span>

        <div class="cart-item-bottom">
          <div class="quantity-controls">
            <button type="button" data-action="minus" aria-label="Disminuir cantidad" ${cantidad <= 1 ? "disabled" : ""}>−</button>
            <span>${cantidad}</span>
            <button type="button" data-action="plus" aria-label="Aumentar cantidad" ${cantidad >= product.stock ? "disabled" : ""}>+</button>
          </div>
          <span class="cart-item-subtotal">$${subtotal.toFixed(2)}</span>
        </div>
      </div>

      <button type="button" class="remove-item" data-action="remove" aria-label="Eliminar del carrito">
        <img src="../../assets/icons/shoppingCart/trash.svg" alt="" />
      </button>
    </article>
  `;
}

async function renderCart(showLoading = false) {
  const page = document.querySelector(".cart-page");
  const container = document.getElementById("cart-content");
  if (!container) return;

  // La dirección que el usuario ya escribió no debe perderse al redibujar
  const savedAddress = document.getElementById("shipping-address")?.value ?? "";

  if (showLoading) {
    page?.classList.add("is-empty");
    container.innerHTML = `<p class="cart-loading">Cargando tu carrito…</p>`;
  }

  let items;
  try {
    items = await fetchCart();
  } catch (error) {
    console.error(error);
    page?.classList.add("is-empty");
    renderCartError();
    return;
  }

  if (isGuestSession()) {
    page?.classList.add("is-empty");
    renderLoginRequired();
    return;
  }

  page?.classList.toggle("is-empty", items.length === 0);

  if (items.length === 0) {
    renderEmptyCart();
    return;
  }

  const count = items.reduce((sum, i) => sum + i.cantidad, 0);
  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.cantidad, 0);

  container.innerHTML = `
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

        <label class="shipping-label" for="shipping-address">Dirección de envío</label>
        <textarea id="shipping-address" class="shipping-input" rows="3" maxlength="255"
                  placeholder="Calle, número, ciudad…"></textarea>

        <button type="button" class="btn-checkout" id="checkout-btn">Finalizar compra</button>
        <a href="../../index.html" class="continue-link">Seguir comprando</a>
      </aside>
    </div>
  `;

  const addressInput = document.getElementById("shipping-address");
  if (addressInput) addressInput.value = savedAddress;
}

async function handleCheckout(btn) {
  const input = document.getElementById("shipping-address");
  const direccion = input ? input.value.trim() : "";

  if (direccion.length < 5) {
    showToast("Ingresa tu dirección de envío");
    input?.focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = "Procesando…";

  const result = await checkout(direccion);

  if (result.ok) {
    window.location.replace(`../shoppingCart/receipt.html?id=${result.orderId}`);
    return;
  }

  showToast(result.message);
  btn.disabled = false;
  btn.textContent = "Finalizar compra";
  await renderCart();
}

document.addEventListener("click", async (e) => {
  if (e.target.closest("#retry-cart")) {
    await renderCart(true);
    return;
  }

  const checkoutBtn = e.target.closest("#checkout-btn");
  if (checkoutBtn) {
    await handleCheckout(checkoutBtn);
    return;
  }

  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const card = btn.closest(".cart-item");
  if (!card) return;

  const id = card.dataset.id;
  const current = await getCartQuantity(id);

  if (btn.dataset.action === "plus") await setCartQuantity(id, current + 1);
  if (btn.dataset.action === "minus") await setCartQuantity(id, current - 1);
  if (btn.dataset.action === "remove") await removeFromCart(id);

  await renderCart();
});

document.addEventListener("DOMContentLoaded", async () => {
  renderCategories();
  await renderCart(true);
});