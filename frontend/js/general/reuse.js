function loadComponent(id, archivo) {
   return fetch(archivo)
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo cargar ${archivo}`);
      return response.text();
    })
    .then((data) => {
      document.getElementById(id).innerHTML = data;
    })
    .catch((error) => console.error("Error:", error));
}

const promoMessages = [
  "¡Envío gratis en compras mayores a $15!",
  "Tu ropa merece otra oportunidad, vendela con nosotros.",
];

function initPromoTicker() {
  const promoTextElement = document.getElementById("promo-text");
  if (!promoTextElement) return;
  let currentIndex = 0;

  setInterval(() => {
    promoTextElement.classList.remove("fade-in");

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % promoMessages.length;
      promoTextElement.textContent = promoMessages[currentIndex];
      promoTextElement.classList.add("fade-in");
    }, 300);
  }, 6000);
}

document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    loadComponent("header-container", "modules/general/header.html"),
    loadComponent("footer-container", "modules/general/footer.html"),
  ]).then(() => {
    initPromoTicker();
  });
});
