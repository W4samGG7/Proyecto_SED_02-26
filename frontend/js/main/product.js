function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function renderProductDetail(product) {
    const container = document.getElementById("product-detail");
    const available = product.stock > 0;

        container.innerHTML = `
            <div class="gallery-main">
                <img id="main-image" src="${product.images[0]}" alt="${product.name}" />
            </div>

            <div class="product-summary">
                <span class="detail-brand">${product.brand}</span>
                <h1 class="detail-name">${product.name}</h1>
                <p class="detail-meta">Talla ${product.size} · ${product.type}</p>
                <p class="detail-meta">Condición: ${product.condition}</p>
                <p class="detail-price">$${product.price.toFixed(2)}</p>
                <p class="detail-stock ${available ? "" : "out"}">
                    ${available ? `Disponibles: ${product.stock}` : "Agotado"}
                </p>

            <button class="btn-add-cart" id="add-cart-btn" ${available ? "" : "disabled"}>
                ${available ? "Agregar al carrito" : "No disponible"}
            </button>

            <details class="accordion" open>
                <summary>Detalles del artículo</summary>
                <div class="accordion-body">
                    <p>${product.description}</p>
                    <ul>
                        <li><strong>Marca:</strong> ${product.brand}</li>
                        <li><strong>Tipo:</strong> ${product.type}</li>
                        <li><strong>Condición:</strong> ${product.condition}</li>
                        <li><strong>Talla:</strong> ${product.size}</li>
                    </ul>
                </div>
            </details>

            <details class="accordion">
                <summary>Envíos y devoluciones</summary>
                <div class="accordion-body">
                    <p>Información de envíos y devoluciones próximamente.</p>
                </div>
            </details>
        </div>
        `;

        const addBtn = document.getElementById("add-cart-btn");
        if(addBtn) {
            addBtn.addEventListener("click", () => {
                alert(`"${product.name}" agregado al carrito`);
            });
        }
}

function renderSellerItems(product) {
    const items = getProductsBySeller(product.seller.id, product.id);
    const section = document.getElementById("seller-section");
    if(items.length === 0) return;

    section.hidden = false;
    document.querySelector("#seller-section h2").textContent =
        `Más de ${product.seller.name}`;

  document.getElementById("seller-items").innerHTML = items
    .map(
      (p) => `
      <a class="seller-item" href="product.html?id=${p.id}" title="${p.name}">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy" />
      </a>`
    )
    .join("");
}

function renderNotFound() {
  document.title = "Producto no encontrado";
  document.getElementById("product-detail").innerHTML = `
    <p class="not-found">
      No encontramos este producto.
      <a href="../../index.html">Volver al inicio</a>
    </p>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const product = getProductById(getProductIdFromUrl());

  if (!product) {
    renderNotFound();
    return;
  }

  document.title = `${product.name}`;
  renderProductDetail(product);
  renderSellerItems(product);
});