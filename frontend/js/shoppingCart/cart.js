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

function renderCart() {
  const cart = getCart();

  if (cart.length === 0) {
    renderEmptyCart();
    return;
  }
  renderEmptyCart();
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderCart();
});