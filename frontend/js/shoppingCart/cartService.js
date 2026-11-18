const CART_KEY = "cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function getCartQuantity(productId) {
  const item = getCart().find((i) => i.id === Number(productId));
  return item ? item.cantidad : 0;
}

function getAvailableStock(product) {
  return Math.max(product.stock - getCartQuantity(product.id), 0);
}

function addToCart(productId, cantidad = 1) {
  const product = getProductById(productId);
  if (!product) return { ok: false, message: "Producto no encontrado" };

  const available = getAvailableStock(product);
  if (available <= 0) {
    return {
      ok: false,
      message: "Ya tienes todas las unidades disponibles en tu carrito",
    };
  }

  const toAdd = Math.min(cantidad, available);
  const cart = getCart();
  const item = cart.find((i) => i.id === product.id);

  if (item) {
    item.cantidad += toAdd;
  } else {
    cart.push({ id: product.id, cantidad: toAdd });
  }

  saveCart(cart);
  return {
    ok: true,
    message: `"${product.name}" agregado al carrito`,
    product,
    added: toAdd,
  };
}

function setCartQuantity(productId, cantidad) {
  const product = getProductById(productId);
  if (!product) return;

  const cart = getCart();
  const item = cart.find((i) => i.id === Number(productId));
  if (!item) return;

  item.cantidad = Math.min(Math.max(cantidad, 1), product.stock);
  saveCart(cart);
}

function removeFromCart(productId) {
  saveCart(getCart().filter((i) => i.id !== Number(productId)));
}

function clearCart() {
  saveCart([]);
}

function getCartItems() {
  return getCart()
    .map((i) => ({ product: getProductById(i.id), cantidad: i.cantidad }))
    .filter((i) => i.product);
}

function getCartCount() {
  return getCartItems().reduce((sum, i) => sum + i.cantidad, 0);
}

function getCartTotal() {
  return getCartItems().reduce((sum, i) => sum + i.product.price * i.cantidad, 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = count;
  badge.hidden = count === 0;
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function hideCartPopup() {
  const popup = document.getElementById("cart-popup");
  if (popup) popup.classList.remove("show");
}

function showCartPopup(product, cantidad) {
  let popup = document.getElementById("cart-popup");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "cart-popup";
    popup.className = "cart-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-label", "Producto agregado al carrito");
    document.body.appendChild(popup);

    popup.addEventListener("click", (e) => {
      if (e.target.closest(".cart-popup-close")) hideCartPopup();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideCartPopup();
    });
  }

  const cartLink = document.querySelector(".cart-link");
  const cartHref = cartLink ? cartLink.getAttribute("href") : "#";

  popup.innerHTML = `
    <button type="button" class="cart-popup-close">×</button>
    <div class="cart-popup-title">Agregado al carrito</div>

    <div class="cart-popup-body">
      <img class="cart-popup-image" src="${product.images[0]}" alt="${product.name}" />
      <div class="cart-popup-info">
        <span class="cart-popup-brand">${product.brand}</span>
        <span class="cart-popup-name">${product.name}</span>
        <span>Talla ${product.size}</span>
        <span class="cart-popup-price">$${product.price.toFixed(2)}</span>
        <span>Cantidad: ${cantidad}</span>
      </div>
    </div>

    <a href="${cartHref}" class="cart-popup-btn">Ver carrito (${getCartCount()})</a>
  `;

  popup.classList.add("show");
  clearTimeout(showCartPopup.timer);
  showCartPopup.timer = setTimeout(hideCartPopup, 6000);
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
