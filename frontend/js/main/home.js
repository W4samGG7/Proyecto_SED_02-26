function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = mockCategories
    .map((category) => `<li><a href="#">${category.name}</a></li>`)
    .join("");
}

function createProductCardHTML(product) {
  const inCart = getCartQuantity(product.id) > 0;
  const cartIcon = inCart
    ? "assets/icons/shoppingCart/cart-check.svg"
    : "assets/icons/home/add-cart.svg";

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-container">
        <img src="${product.images[0]}" alt="${product.brand}" class="product-image" loading="lazy">

        <button class="add-to-cart">
          <img src="${cartIcon}" alt="${inCart ? "En el carrito" : "Agregar al carrito"}" class="cart-icon">
        </button>

      </div>
      <div class="product-info">
        <span class="product-brand">${product.brand}</span>
        <span class="product-name">${product.name}</span>
        <span class="product-size"> Talla ${product.size}</span>
        <div class="product-pricing">
          <span class="current-price">$${product.price.toFixed(2)}</span>
        </div>
      </div>
    </article>
  `;
}

function updateCardCartIcon(card) {
  const inCart = getCartQuantity(card.dataset.id) > 0;
  const icon = card.querySelector(".cart-icon");
  if (!icon) return;

  icon.src = inCart
    ? "assets/icons/shoppingCart/cart-check.svg"
    : "assets/icons/home/add-cart.svg";
  icon.alt = inCart ? "En el carrito" : "Agregar al carrito";
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

    container.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".add-to-cart");
      if (addBtn) {
        const card = addBtn.closest(".product-card");
        const result = addToCart(card.dataset.id, 1);

        if (result.ok) {
          showCartPopup(result.product, result.added);
          updateCardCartIcon(card);
        } else {
          showToast(result.message);
        }
        return;
      }

      const card = e.target.closest(".product-card");
      if (!card) return;

      window.location.href = `modules/productDetail/product.html?id=${card.dataset.id}`;
    });
  }

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderProducts("women-products", getProductsByCategory("Mujer"));
  renderProducts("men-products", getProductsByCategory("Hombre"));
});

window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    document.querySelectorAll(".product-card").forEach(updateCardCartIcon);
    updateCartBadge();
  }
});

