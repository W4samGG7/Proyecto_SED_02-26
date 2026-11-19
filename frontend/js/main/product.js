function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = mockCategories
    .map((category) => `<li><a href="#">${escapeHTML(category.name)}</a></li>`)
    .join("");
}

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function renderProductDetail(product) {
    const container = document.getElementById("product-detail");
    const inCart = await getCartQuantity(product.id);
    const available = await getAvailableStock(product);
    const soldOut = product.stock <= 0;
    const allInCart = !soldOut && available === 0;

    let stockText;
    if (soldOut) {
        stockText = "Agotado";
    } else if (allInCart) {
        stockText = `Tienes ${inCart === 1 ? "la única unidad" : `las ${inCart} unidades`} en tu carrito.`;
    } else {
        stockText = `Disponibles: ${available}` + (inCart > 0 ? ` · ${inCart} en tu carrito.` : "");
    }

    let actionsHTML;
    if (soldOut) {
        actionsHTML = `<button class="btn-add-cart" disabled>No disponible</button>`;
    } else if (allInCart) {
        actionsHTML = `<a href="../shoppingCart/cart.html" class="btn-add-cart">Ver carrito</a>`;
    } else {
        actionsHTML = `
        ${available > 1 ? `
            <div class="quantity-controls">
            <button type="button" id="qty-minus" aria-label="Disminuir cantidad">−</button>
            <span id="qty-value">1</span>
            <button type="button" id="qty-plus" aria-label="Aumentar cantidad">+</button>
            </div>` : ""}
        <button class="btn-add-cart" id="add-cart-btn">Agregar al carrito</button>`;
    }

    const name = escapeHTML(product.name);
    const brand = escapeHTML(product.brand);
    const size = escapeHTML(product.size);
    const type = escapeHTML(labelOf(TYPE_LABELS, product.type));
    const category = escapeHTML(labelOf(CATEGORY_LABELS, product.category));
    const condition = escapeHTML(labelOf(CONDITION_LABELS, product.condition));
    const description = escapeHTML(product.description);
    const mainImage = escapeHTML(product.images[0] || "");


        container.innerHTML = `
            <div class="gallery-main">
                <img id="main-image" src="${mainImage}" alt="${name}" />
            </div>

            <div class="product-summary">
                <h1 class="detail-name">${name}</h1>
                <span class="detail-brand">${brand} </span>
                <p class="detail-meta">Talla ${size} · ${type} · ${category}</p>
                <p class="detail-meta">Condición: ${condition}</p>
                <p class="detail-price">$${product.price.toFixed(2)}</p>
                <p class="detail-stock ${soldOut ? "out" : ""}">${stockText}</p>

            <div class="cart-actions">${actionsHTML}</div>

            <details class="accordion" open>
                <summary>Detalles del artículo</summary>
                <div class="accordion-body">
                    <p>${description}</p>
                    <ul>
                        <li><strong>Marca:</strong> ${brand}</li>
                        <li><strong>Tipo:</strong> ${type}</li>
                        <li><strong>Categoria:</strong> ${category}</li>
                        <li><strong>Talla:</strong> ${size}</li>
                        <li><strong>Condición:</strong> ${condition}</li>
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

        let quantity = 1;

        const qtyValue = document.getElementById("qty-value");
        const minusBtn = document.getElementById("qty-minus");
        const plusBtn = document.getElementById("qty-plus");

        function updateQuantity() {
        qtyValue.textContent = quantity;
        minusBtn.disabled = quantity <= 1;
        plusBtn.disabled = quantity >= available;
        }

        if (minusBtn && plusBtn) {
        minusBtn.addEventListener("click", () => {
            if (quantity > 1) quantity--;
            updateQuantity();
        });
        plusBtn.addEventListener("click", () => {
            if (quantity < available) quantity++;
            updateQuantity();
        });
        updateQuantity();
        }

        const addBtn = document.getElementById("add-cart-btn");
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      addBtn.disabled = true;

      const result = await addToCart(product.id, quantity, product);

      if (result.ok) {
        await showCartPopup(result.product, result.added);
      } else {
        showToast(result.message);
      }

      await renderProductDetail(product); 
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

async function renderSellerItems(product) {
  if (!product.seller) return;

  const section = document.getElementById("seller-section");
  if (!section) return;

  try {
    const items = await fetchProducts({
      seller: product.seller.id,
      exclude: product.id,
      limit: 8,
    });

    if (items.length === 0) return;

    section.hidden = false;
    document.querySelector("#seller-section h2").textContent =
      `Más de ${product.seller.name}`;

    document.getElementById("seller-items").innerHTML = items
      .map(
        (p) => `
        <a class="seller-item" href="product.html?id=${encodeURIComponent(p.id)}" title="${escapeHTML(p.name)}">
          <img src="${escapeHTML(p.images[0] || "")}" alt="${escapeHTML(p.name)}" loading="lazy" />
        </a>`
      )
      .join("");
  } catch (error) {
    console.error(error);
  }
}

function renderNotFound() {
  document.title = "Producto no encontrado";
  document.getElementById("product-detail").innerHTML = `
    <p class="not-found">
      No encontramos este producto.
      <a href="../../index.html">Volver al inicio</a>
    </p>`;
}

function renderLoadError() {
  document.getElementById("product-detail").innerHTML = `
    <p class="not-found">
      No se pudo cargar el producto. Inténtalo de nuevo en unos minutos.
      <a href="../../index.html">Volver al inicio</a>
    </p>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  renderCategories();

  const id = getProductIdFromUrl();
  if (!id) {
    renderNotFound();
    return;
  }

  try{
    const product = await fetchProductById(id);

    if (!product) {
        renderNotFound();
        return;
    }

    document.title = product.name;
    await renderProductDetail(product);
    await renderSellerItems(product);
    } catch (error) {
    console.error(error);
    renderLoadError();
  }
});