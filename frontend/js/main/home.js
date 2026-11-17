function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = mockCategories
    .map((category) => `<li><a href="#">${category.name}</a></li>`)
    .join("");
}

function createProductCardHTML(product) {
  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-container">
        <img src="${product.images[0]}" alt="${product.brand}" class="product-image" loading="lazy">

        <button class="add-to-cart">
          <img src="assets/icons/home/add-cart.svg" alt="Carrito" class="cart-icon">
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
      if(e.target.closest(".add-to-cart")) {
        return;
      }

      const card = e.target.closest(".product-card");
      if(!card) return;

      window.location.href = `modules/productDetail/product.html?id=${card.dataset.id}`;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderProducts("women-products", getProductsByCategory("Mujer"));
  renderProducts("men-products", getProductsByCategory("Hombre"));
});

//Mostrar sesion iniciada y cerrar sesion
document.addEventListener("DOMContentLoaded", function() {

    const usuario = JSON.parse(sessionStorage.getItem("usuario"));

    const estadoSesion = document.getElementById("estadoSesion");

    if (!estadoSesion) return;

    if (usuario) {

        estadoSesion.innerHTML = `
            <span class="usuario-bienvenida">
                ¡Hola, ${usuario.nombre || "Usuario"}!
            </span>

            <button id="cerrarSesion" class="btn-cerrar-sesion">
                Cerrar sesión
            </button>
        `;

        document.getElementById("cerrarSesion").addEventListener("click", function() {

            sessionStorage.removeItem("usuario");

            window.location.reload();

        });

    }

});
