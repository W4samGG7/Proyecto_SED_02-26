
// Cargar componentes HTML reutilizables
async function cargarComponente(elementoId, ruta) {
    try {
        const respuesta = await fetch(ruta);

        if (!respuesta.ok) {
            throw new Error(`Error al cargar ${ruta}: ${respuesta.status}`);
        }

        let contenido = await respuesta.text();

        const path = window.location.pathname;

        let basePath = './';

        if (path.includes('/modules/')) {
            basePath = '../../';
        }

        contenido = contenido.replace(/src="assets\//g, `src="${basePath}assets/`)

        const contenedor = document.getElementById(elementoId);

        if (!contenedor) {
            throw new Error(`No se encontró el contenedor: ${elementoId}`);
        }

        contenedor.innerHTML = contenido;

    } catch (error) {
        console.error(error);
    }
}


// =====================================
// ANUNCIOS PROMOCIONALES
// =====================================

function inicializarAnuncios() {

    const contenedor = document.getElementById("announcement-track");

    if (!contenedor) return;

    const anuncios = [
        "Aprovecha nuestras promociones y renueva tu estilo",
        "50% de descuento en tu primera compra.",
         "Tu ropa merece otra oportunidad, vendela con nosotros.",
         "¡Envío gratis en compras mayores a $15!"
    ];

    // Duplicar los anuncios para conseguir un desplazamiento continuo
    const anunciosCompletos = [...anuncios, ...anuncios];

    anunciosCompletos.forEach((mensaje) => {

        const elemento = document.createElement("span");

        elemento.classList.add("announcement-item");
        elemento.textContent = mensaje;

        contenedor.appendChild(elemento);

    });
}


// Cargar navbar y footer cuando el documento esté listo
document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
        cargarComponente("navbar-container", "../components/navbar.html"),
        cargarComponente("footer-container", "../general/footer.html"
        )
    ]);

     // Inicializar anuncios después de cargar el navbar
    inicializarAnuncios();
    inicializarSwitch();

    // Inicializar iconos Lucide
    if (window.lucide) {
        lucide.createIcons();
    }
});

function inicializarSwitch(){
    const btnSell = document.getElementById("btn-sell");

    if (btnSell){
        btnSell.classList.add("active");
    }
}