
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

function initAnnouncements() {
  const track = document.getElementById("announcement-track");
  if (!track) return;

   const anuncios = [
 "Aprovecha nuestras promociones y renueva tu estilo",
    "50% de descuento en tu primera compra",
         "Tu ropa merece otra oportunidad, vendela con nosotros.",
         "¡Envío gratis en compras mayores a $15!"
  ];

  const anunciosCompletos = [...anuncios, ...anuncios];

  anunciosCompletos.forEach((mensaje) => {
    const span = document.createElement("span");
    span.classList.add("announcement-item");
    span.textContent = mensaje;
    track.appendChild(span);
  });
}


function initHeaderButtons(){
  const btnShop = document.getElementById("btn-shop");
  const btnSell = document.getElementById("btn-sell");

  if (!btnSell || !btnShop) return;

  const basePath = getBasePath();

  btnShop.href = `${basePath}index.html`;
  btnSell.href = `${basePath}modules/sell/sell.html`;

  const path = window.location.pathname;

  if(path.includes("/sell/")){
    btnSell.classList.add("active");
  } else {
    btnShop.classList.add("active")
  }

}


document.addEventListener("DOMContentLoaded", () => {
  const headerContainer = document.getElementById("header-container");
  const footerContainer = document.getElementById("footer-container");

  const promises = [];

  if (headerContainer) {
    promises.push(loadComponent("header-container", new URL("header.html", GENERAL_URL).href));
    document.body.classList.add('header-loaded');
  }
  
  if (footerContainer) {
    promises.push(loadComponent("footer-container", new URL("footer.html", GENERAL_URL).href));
  }

  Promise.all(promises).then(() => {
    initHeaderButtons();
    initAnnouncements();
  });
});
