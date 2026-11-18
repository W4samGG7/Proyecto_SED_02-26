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
      

      <h1 class="empty-cart-title">Tu carrito</h1>
      <p class="empty-cart-text">
        Tu carrito está vacío. ¡Llénalo con prendas que merecen una segunda oportunidad!
      </p>
      <a href="../../index.html" class="btn-shop-now">Explorar prendas</a>
    </div>
  `;
}