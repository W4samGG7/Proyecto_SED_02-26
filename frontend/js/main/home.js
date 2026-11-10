const mockCategories = [
  { id: 1, name: "Novedades", slug: "novedades" },
  { id: 2, name: "Mujer", slug: "mujer" },
  { id: 3, name: "Hombre", slug: "hombre" },
  { id: 4, name: "Infantil", slug: "infantil" },
  { id: 5, name: "Zapatos", slug: "zapatos" },
  { id: 6, name: "Accesorios", slug: "accesorios" },
  { id: 6, name: "Bolsos", slug: "bolsos" },
];

function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = mockCategories
    .map((category) => `<li><a href="#">${category.name}</a></li>`)
    .join("");
}

const mockWomenProducts = [
  {
    id: 101,
    name: "Jeans clásico claro",
    brand: "Levi's",
    size: "12",
    price: 16.0,
    image:
      "https://i.pinimg.com/1200x/98/8e/fd/988efddbfefb91849049be49a4d4af01.jpg",
  },
  {
    id: 102,
    name: "Vestido a cuadros de manga corta celeste",
    brand: "Zara",
    size: "S",
    price: 5.5,
    image:
      "https://i.pinimg.com/736x/3d/34/3c/3d343ccc1890602f7234f75a51f05604.jpg",
  },
  {
    id: 103,
    name: "Blusa de botones formal marrón",
    brand: "Mango",
    size: "L",
    price: 4.0,
    image:
      "https://i.pinimg.com/1200x/0c/e0/06/0ce00642532b40cddf4ac7de6c026327.jpg",
  },
  {
    id: 104,
    name: "Jeans negro recto",
    brand: "H&M",
    size: "18",
    price: 10.0,
    image:
      "https://i.pinimg.com/1200x/93/aa/21/93aa214ee6b311feb8a4cbf0c88973e6.jpg",
  },
  {
    id: 101,
    name: "Jeans clásico claro",
    brand: "Levi's",
    size: "12",
    price: 16.0,
    image:
      "https://i.pinimg.com/1200x/98/8e/fd/988efddbfefb91849049be49a4d4af01.jpg",
  },
  {
    id: 102,
    name: "Vestido a cuadros de manga corta celeste",
    brand: "Zara",
    size: "S",
    price: 5.5,
    image:
      "https://i.pinimg.com/736x/3d/34/3c/3d343ccc1890602f7234f75a51f05604.jpg",
  },
  {
    id: 103,
    name: "Blusa de botones formal marrón",
    brand: "Mango",
    size: "L",
    price: 4.0,
    image:
      "https://i.pinimg.com/1200x/0c/e0/06/0ce00642532b40cddf4ac7de6c026327.jpg",
  },
  {
    id: 104,
    name: "Jeans negro recto",
    brand: "H&M",
    size: "18",
    price: 10.0,
    image:
      "https://i.pinimg.com/1200x/93/aa/21/93aa214ee6b311feb8a4cbf0c88973e6.jpg",
  }
  
];

const mockMenProducts = [
  {
    id: 201,
    name: "Sudadera oversize gris y azul",
    brand: "Tommy Hilfiger",
    size: "L",
    price: 18.0,
    image:
      "https://i.pinimg.com/736x/6d/55/98/6d5598358bba26f5a90d1b61c8b3d6d4.jpg",
  },
  {
    id: 202,
    name: "Sudadera oversize gris",
    brand: "Nike",
    size: "XL",
    price: 12.0,
    image:
      "https://i.pinimg.com/736x/62/8e/74/628e744e704e2c90039ce0cfeb862e45.jpg",
  },
  {
    id: 203,
    name: "Pantalón chino beige",
    brand: "Dockers",
    size: "32",
    price: 14.0,
    image:
      "https://i.pinimg.com/736x/ed/f4/50/edf45090b6f35ed1e1462cc6247b5dc2.jpg",
  },
  {
    id: 204,
    name: "Pants oversize gris oscuro",
    brand: "Adidas",
    size: "M",
    price: 10.0,
    image:
      "https://i.pinimg.com/1200x/cb/43/c4/cb43c4548e33ef987c7e7a2699dd64a1.jpg",
  },
  {
    id: 201,
    name: "Sudadera oversize gris y azul",
    brand: "Tommy Hilfiger",
    size: "L",
    price: 18.0,
    image:
      "https://i.pinimg.com/736x/6d/55/98/6d5598358bba26f5a90d1b61c8b3d6d4.jpg",
  },
  {
    id: 202,
    name: "Sudadera oversize gris",
    brand: "Nike",
    size: "XL",
    price: 12.0,
    image:
      "https://i.pinimg.com/736x/62/8e/74/628e744e704e2c90039ce0cfeb862e45.jpg",
  },
  {
    id: 201,
    name: "Sudadera oversize gris y azul",
    brand: "Tommy Hilfiger",
    size: "L",
    price: 18.0,
    image:
      "https://i.pinimg.com/736x/6d/55/98/6d5598358bba26f5a90d1b61c8b3d6d4.jpg",
  },
  {
    id: 202,
    name: "Sudadera oversize gris",
    brand: "Nike",
    size: "XL",
    price: 12.0,
    image:
      "https://i.pinimg.com/736x/62/8e/74/628e744e704e2c90039ce0cfeb862e45.jpg",
  },
  {
    id: 203,
    name: "Pantalón chino beige",
    brand: "Dockers",
    size: "32",
    price: 14.0,
    image:
      "https://i.pinimg.com/736x/ed/f4/50/edf45090b6f35ed1e1462cc6247b5dc2.jpg",
  },
  {
    id: 204,
    name: "Pants oversize gris oscuro",
    brand: "Adidas",
    size: "M",
    price: 10.0,
    image:
      "https://i.pinimg.com/1200x/cb/43/c4/cb43c4548e33ef987c7e7a2699dd64a1.jpg",
  },
  {
    id: 201,
    name: "Sudadera oversize gris y azul",
    brand: "Tommy Hilfiger",
    size: "L",
    price: 18.0,
    image:
      "https://i.pinimg.com/736x/6d/55/98/6d5598358bba26f5a90d1b61c8b3d6d4.jpg",
  },
  {
    id: 202,
    name: "Sudadera oversize gris",
    brand: "Nike",
    size: "XL",
    price: 12.0,
    image:
      "https://i.pinimg.com/736x/62/8e/74/628e744e704e2c90039ce0cfeb862e45.jpg",
  }
  
];

function createProductCardHTML(product) {
  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.brand}" class="product-image" loading="lazy">

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
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderProducts("women-products", mockWomenProducts);
  renderProducts("men-products", mockMenProducts);
});
