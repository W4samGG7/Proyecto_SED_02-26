
function loadComponent(id, archivo) {
   return fetch(archivo)
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo cargar ${archivo}`);
      return response.text();
    })
    .then((data) => {
      const container = document.getElementById(id);
      if (container) {
        const basePath = getBasePath();
        const adjustedData = data.replace(/src="assets\//g, `src="${basePath}assets/`);

        container.innerHTML = adjustedData;
      }
    })
    .catch((error) => console.error("Error:", error));
}

function getBasePath(){
  const path = window.location.pathname;

  if (path.endsWith('index.html') || path.endsWith('frontend/')){
    return'./';
  }

  if (path.includes('/modules/')){
    return '../../'
  }

  return './'
}

const GENERAL_URL = new URL("../../modules/general/", import.meta.url);


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
  const headerContainer = document.getElementById("header-container");
  const footerContainer = document.getElementById("footer-container");

  const promises = [];

  if (headerContainer) {
    promises.push(loadComponent("header-container", new URL("header.html", GENERAL_URL).href));
  }
  
  if (footerContainer) {
    promises.push(loadComponent("footer-container", new URL("footer.html", GENERAL_URL).href));
  }

  Promise.all(promises).then(() => {
    initPromoTicker();
  });
});
