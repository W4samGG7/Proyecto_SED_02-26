function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = mockCategories
    .map((category) => `<li><a href="#">${category.name}</a></li>`)
    .join("");
}

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
                <h1 class="detail-name">${product.name}</h1>
                <span class="detail-brand">${product.brand} </span>
                <p class="detail-meta">Talla ${product.size} · ${product.type} · ${product.category}</p>
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
                        <li><strong>Categoria:</strong> ${product.category}</li>
                        <li><strong>Talla:</strong> ${product.size}</li>
                        <li><strong>Condición:</strong> ${product.condition}</li>
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

        const gallery = container.querySelector(".gallery-main");
        const img = gallery.querySelector("img");

        gallery.addEventListener("mouseenter", () => gallery.classList.add("zoomed"));
        gallery.addEventListener("mouseleave", () => gallery.classList.remove("zoomed"));
        gallery.addEventListener("mousemove", (e) => {
        const rect = gallery.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
        });

        gallery.addEventListener("click", () => gallery.classList.toggle("zoomed"));
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
  renderCategories();
  const product = getProductById(getProductIdFromUrl());

  if (!product) {
    renderNotFound();
    return;
  }

  document.title = `${product.name}`;
  renderProductDetail(product);
  renderSellerItems(product);
});