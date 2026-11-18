function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = mockCategories
    .map((category) => `<li><a href="#">${escapeHTML(category.name)}</a></li>`)
    .join("");
}

function createProductCardHTML(product) {
  const image = escapeHTML(product.images[0] || "" );

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-container">
        <img src="${image}" alt="${escapeHTML(product.brand)}" class="product-image" loading="lazy">

        <button class="add-to-cart">
          <img src="assets/icons/home/add-cart.svg" alt="Carrito" class="cart-icon">
        </button>

      </div>
      <div class="product-info">
        <span class="product-brand">${escapeHTML(product.brand)}</span>
        <span class="product-name">${escapeHTML(product.name)}</span>
        <span class="product-size"> Talla ${escapeHTML(product.size)}</span>
        <div class="product-pricing">
          <span class="current-price">$${product.price.toFixed(2)}</span>
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

  container.addEventListener("click", (e) => {
    if (e.target.closest(".add-to-cart")) return;

    const card = e.target.closest(".product-card");
    if (!card) return;

    window.location.href = `modules/productDetail/product.html?id=${card.dataset.id}`;
  });
}

async function loadSection(containerId, category) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<p class="empty-message">Cargando prendas...</p>';

  try {
    const products = await fetchProducts({ category, limit: 12 });
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

