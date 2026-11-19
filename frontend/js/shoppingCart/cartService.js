let guestMode = false;
let cartPromise = null;

const LOGIN_URL = "/frontend/modules/login/index_login.html";

function goToLogin() {
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `${LOGIN_URL}?redirect=${redirect}`;
}

function normalizeProduct(p) {
  if (!p) return null;
  return {
    ...p,
    name: p.name ?? p.nombre,
    brand: p.brand ?? p.marca,
    size: p.size ?? p.talla,
    condition: p.condition ?? p.condicion,
    price: Number(p.price ?? p.precio ?? 0),
    stock: Number(p.stock ?? 0),
    images: p.images ?? (p.imagen_url ? [p.imagen_url] : []),
  };
}

function fetchCart() {
  if (guestMode) return Promise.resolve([]);

  if (!cartPromise) {
    cartPromise = (async () => {
      const response = await fetch("/api/carrito");

      if (response.status === 401) {
        guestMode = true;
        return [];
      }
      if (!response.ok) throw new Error("Error al obtener el carrito");

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.items ?? [];

      // Siempre [{ product, cantidad }] ya normalizado
      return list
        .map((i) => ({
          product: normalizeProduct(i.producto ?? i.product),
          cantidad: Number(i.cantidad),
        }))
        .filter((i) => i.product);
    })();

    // Si falla, no dejar el error guardado en la caché
    cartPromise.catch(() => { cartPromise = null; });
  }

  return cartPromise;
}

function invalidateCart() {
  cartPromise = null;
}

async function getCartItems() {
  try {
    return await fetchCart();
  } catch (error) {
    console.error(error);
    return [];
  }
}

function isGuestSession() {
  return guestMode;
}

async function getCartCount() {
  const items = await getCartItems();
  return items.reduce((sum, i) => sum + i.cantidad, 0);
}

async function getCartTotal() {
  const items = await getCartItems();
  return items.reduce((sum, i) => sum + i.product.price * i.cantidad, 0);
}

async function getCartQuantity(productId) {
  const items = await getCartItems();
  const item = items.find((i) => String(i.product.id) === String(productId));
  return item ? item.cantidad : 0;
}

async function getCartQuantities() {
  const items = await getCartItems();
  return new Map(items.map((i) => [String(i.product.id), i.cantidad]));
}

async function getAvailableStock(product) {
  const inCart = await getCartQuantity(product.id);
  return Math.max(Number(product.stock) - inCart, 0);
}

async function addToCart(productId, cantidad = 1, product = null) {
  try {
    const response = await fetch("/api/carrito", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producto_id: Number(productId), cantidad }),
    });

    if (response.status === 401) {
      goToLogin();
      return { ok: false, message: "Inicia sesión para continuar" };
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, message: result.message || "Error al agregar al carrito" };
    }

    invalidateCart();
    await updateCartBadge();

    let info = product ? normalizeProduct(product) : null;
    if (!info) {
      try {
        info = normalizeProduct(await fetchProductById(productId));
      } catch {
        info = null;
      }
    }

    return {
      ok: true,
      message: "Producto agregado al carrito",
      product: info,
      added: cantidad,
    };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Error de conexión con el servidor" };
  }
}

async function setCartQuantity(productId, cantidad) {
  try {
    const response = await fetch("/api/carrito", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producto_id: Number(productId), cantidad }),
    });

    if (response.status === 401) {
      goToLogin();
      return;
    }

    invalidateCart();
    await updateCartBadge();
  } catch (error) {
    console.error("Error al actualizar cantidad", error);
  }
}



async function removeFromCart(productId) {
  try {
    const response = await fetch(`/api/carrito/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      goToLogin();
      return;
    }

    invalidateCart();
    await updateCartBadge();
  } catch (error) {
    console.error("Error al eliminar del carrito", error);
  }
}

async function clearCart() {
  try {
    await fetch("/api/carrito", { method: "DELETE" });
    invalidateCart();
    await updateCartBadge();
  } catch (error) {
    console.error("Error al vaciar el carrito", error);
  }
}

async function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = await getCartCount();
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
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function hideCartPopup() {
  const popup = document.getElementById("cart-popup");
  if (popup) popup.classList.remove("show");
}

async function showCartPopup(product, cantidad) {
  if (!product) return;

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
  const count = await getCartCount();
  const image = escapeHTML(product.images?.[0] || "");

  popup.innerHTML = `
    <button type="button" class="cart-popup-close" aria-label="Cerrar">×</button>
    <div class="cart-popup-title">Agregado al carrito</div>

    <div class="cart-popup-body">
      <img class="cart-popup-image" src="${image}" alt="${escapeHTML(product.name)}" />
      <div class="cart-popup-info">
        <span class="cart-popup-brand">${escapeHTML(product.brand)}</span>
        <span class="cart-popup-name">${escapeHTML(product.name)}</span>
        <span>Talla ${escapeHTML(product.size)}</span>
        <span class="cart-popup-price">$${Number(product.price).toFixed(2)}</span>
        <span>Cantidad: ${cantidad}</span>
      </div>
    </div>

    <a href="${cartHref}" class="cart-popup-btn">Ver carrito (${count})</a>
  `;

  popup.classList.add("show");
  clearTimeout(showCartPopup.timer);
  showCartPopup.timer = setTimeout(hideCartPopup, 5000);
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
