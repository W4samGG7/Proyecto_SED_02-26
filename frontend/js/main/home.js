let cartQuantities = new Map(); 
let currentUserId = null;
const productsById = new Map();

async function refreshCartQuantities() {
  try {
    cartQuantities = await getCartQuantities();
  } catch {
    cartQuantities = new Map();
  }
}

async function refreshCurrentUser() {
  currentUserId = await getCurrentUserId();
}

function isInCart(productId) {
  return (cartQuantities.get(String(productId)) || 0) > 0;
}

function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = mockCategories
    .map((category) => `<li><a href="#">${escapeHTML(category.name)}</a></li>`)
    .join("");
}

function getCardState(product) {
  if (isOwnProduct(product, currentUserId)) return { type: "own", inCart: 0 };

  const stock = product.stock == null ? Infinity : Number(product.stock);
  const inCart = cartQuantities.get(String(product.id)) || 0;

  if (stock <= 0) return { type: "soldout", inCart };
  if (inCart >= stock) return { type: "full", inCart };
  if (inCart > 0) return { type: "in-cart", inCart };
  return { type: "default", inCart };
}

function createCartButtonHTML(product) {
  const { type, inCart } = getCardState(product);

  if (type === "own") {
  return `<span class="own-tag">Tu artículo</span>`;
}

  if (type === "soldout") {
    return `<span class="sold-out-tag">Agotado</span>`;
  }

  const isFull = type === "full";
  const icon = isFull
    ? "assets/icons/shoppingCart/cart-check.svg"
    : "assets/icons/shoppingCart/cart-plus.svg";
  const label = isFull
    ? "Ya tienes todas las unidades en tu carrito"
    : inCart > 0
      ? `Agregar otra unidad (tienes ${inCart})`
      : "Agregar al carrito";
  const badge = inCart > 0 && !isFull
    ? `<span class="cart-qty-badge">${inCart}</span>`
    : "";
    

  return `
    <button type="button" class="add-to-cart${isFull ? " is-full" : ""}"
            title="${label}" aria-label="${label}" ${isFull ? 'aria-disabled="true"' : ""}>
      <img src="${icon}" alt="" class="cart-icon">
      ${badge}
    </button>`;
}

function updateCardButton(card) {
  const product = productsById.get(String(card.dataset.id));
  if (!product) return;

  const container = card.querySelector(".product-image-container");
  const old = container.querySelector(".add-to-cart, .sold-out-tag, .own-tag");
  if (old) old.remove();
  container.insertAdjacentHTML("beforeend", createCartButtonHTML(product));
}

function createProductCardHTML(product) {
  const image = escapeHTML(product.images?.[0] || "");

  return `
    <article class="product-card" data-id="${escapeHTML(product.id)}">
      <div class="product-image-container">
        <img src="${image}" alt="${escapeHTML(product.brand)}" class="product-image" loading="lazy">
        ${createCartButtonHTML(product)}
      </div>
      <div class="product-info">
        <span class="product-brand">${escapeHTML(product.brand)}</span>
        <span class="product-name">${escapeHTML(product.name)}</span>
        <span class="product-size"> Talla ${escapeHTML(product.size)}</span>
        <div class="product-pricing">
          <span class="current-price">$${Number(product.price).toFixed(2)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML =
      '<p class="empty-message">No hay prendas disponibles por el momento.</p>';
    return;
  }

  container.innerHTML = products
    .map((product) => createProductCardHTML(product))
    .join("");
}

function enableCardNavigation(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.addEventListener("click", async (e) => {
   
    const addBtn = e.target.closest(".add-to-cart");
    if (addBtn) {
      
      if (addBtn.classList.contains("is-full")) {
        showToast("Ya tienes todas las unidades en tu carrito");
        return;
      }

      const card = addBtn.closest(".product-card");
      const product = productsById.get(String(card.dataset.id));

      addBtn.disabled = true; 
      const result = await addToCart(card.dataset.id, 1, product);

      if (result.ok) {
        await refreshCartQuantities();
        updateCardButton(card);  
        showCartPopup(result.product, result.added);
      } else {
        addBtn.disabled = false;
        showToast(result.message);
      }
      return;
    }

    const card = e.target.closest(".product-card");
    if (!card) return;

    window.location.href = `modules/productDetail/product.html?id=${encodeURIComponent(card.dataset.id)}`;
  });
}

async function loadSection(containerId, category) {
  const container = document.getElementById(containerId);
  const [products] = await Promise.all([
    fetchProducts({ category, limit: 12 }),
    refreshCartQuantities(),
    refreshCurrentUser(),
  ]);
  if (!container) return;

  container.innerHTML = '<p class="empty-message">Cargando prendas...</p>';

  try {
    const [products] = await Promise.all([
      fetchProducts({ category, limit: 12 }),
      refreshCartQuantities(),
    ]);

    products.forEach((p) => productsById.set(String(p.id), p));
    renderProducts(containerId, products);
  } catch {
    container.innerHTML =
      '<p class="empty-message">No se pudieron cargar las prendas.</p>';
  }
}


document.addEventListener("DOMContentLoaded", () => {
  renderCategories();

  enableCardNavigation("women-products");
  enableCardNavigation("men-products");

  loadSection("women-products", "mujer");
  loadSection("men-products", "hombre");
});

window.addEventListener("pageshow", async (e) => {
  if (e.persisted) {
    invalidateCart();
    await refreshCartQuantities();
    document.querySelectorAll(".product-card").forEach(updateCardCartIcon);
    updateCartBadge();
  }
});

