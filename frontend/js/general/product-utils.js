function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

const CONDITION_LABELS = {
  "nuevo": "Nuevo",
  "usado-como-nuevo": "Usado - Como nuevo",
  "usado-buen-estado": "Usado - Buen estado",
};

const TYPE_LABELS = {
  jeans: "Jeans", pantalones: "Pantalones", camisas: "Camisas",
  camisetas: "Camisetas", blusas: "Blusas", vestidos: "Vestidos",
  faldas: "Faldas", shorts: "Shorts", chaquetas: "Chaquetas",
  sueteres: "Suéteres", sudaderas: "Sudaderas",
  "ropa-deportiva": "Ropa deportiva", "ropa-interior": "Ropa interior",
  "trajes-conjuntos": "Trajes y conjuntos", otros: "Otros",
};

const CATEGORY_LABELS = {
  mujer: "Mujer", hombre: "Hombre", infantil: "Infantil", zapatos: "Zapatos",
  accesorios: "Accesorios", bolsos: "Bolsos"
};

function labelOf(dictionary, value) {
  return dictionary[value] ?? value;
}

//llamada  a la api de producto
async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`/api/productos${query ? `?${query}` : ""}`);

  if (!response.ok) throw new Error("No se pudieron cargar los productos");
  return response.json();
}

//llamada a la api de poroducto  por id
async function fetchProductById(id) {
  const response = await fetch(`/api/productos/${encodeURIComponent(id)}`);

  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) throw new Error("No se pudo cargar el producto");
  return response.json();
}

const mockCategories = [
  { id: 1, name: "Novedades", slug: "novedades" },
  { id: 2, name: "Mujer", slug: "mujer" },
  { id: 3, name: "Hombre", slug: "hombre" },
  { id: 4, name: "Infantil", slug: "infantil" },
  { id: 5, name: "Zapatos", slug: "zapatos" },
  { id: 6, name: "Accesorios", slug: "accesorios" },
  { id: 7, name: "Bolsos", slug: "bolsos" },
];