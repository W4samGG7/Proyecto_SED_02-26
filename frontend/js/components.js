
// Cargar componentes HTML reutilizables
async function cargarComponente(elementoId, ruta) {
    try {
        const respuesta = await fetch(ruta);

        if (!respuesta.ok) {
            throw new Error(`Error al cargar ${ruta}: ${respuesta.status}`);
        }

        const contenido = await respuesta.text();

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
        "🔥 30% OFF en artículos nuevos",
        "✨ Aprovecha nuestras promociones y renueva tu estilo",
        "👕 Encuentra tus marcas favoritas al mejor precio"
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
        cargarComponente("footer-container", "../components/footer.html"
        )
    ]);

     // Inicializar anuncios después de cargar el navbar
    inicializarAnuncios();

    // Inicializar iconos Lucide
    if (window.lucide) {
        lucide.createIcons();
    }
});
