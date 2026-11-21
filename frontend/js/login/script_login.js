//para conseguir la url de redireccion
function getRedirectTarget(){
    const redirect = new URLSearchParams(window.location.search).get('redirect');

    const isSafe = redirect
        && redirect.startsWith('/')
        && !redirect.startsWith('//')
        && !redirect.startsWith('/\\');

    return isSafe ? redirect : '/';
}

const formulario = document.getElementById("loginForm");
const estado = document.getElementById("estado");

formulario.addEventListener("submit", async function(e) {

    e.preventDefault();

    const correo = document.getElementById("email").value.trim();
    const clave = document.getElementById("password").value;

    estado.textContent = "Verificando...";

    try {

        const respuesta = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                email: correo,
                password: clave
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            estado.textContent = datos.message || "Correo o contraseña incorrectos.";
            return;
        }

        // Redirigir a la pagina destino (el admin va a su panel si no venia de otra pagina)
        const destino = getRedirectTarget();
        const esAdmin = datos.usuario && datos.usuario.rol === "admin";

        window.location.href = (destino === "/" && esAdmin)
            ? "/modules/admin/panel.html"
            : destino;

    } catch (error) {

        estado.textContent = "Error al conectar con el servidor.";

    }

});

const redirectParam = new URLSearchParams(window.location.search).get('redirect');
const registerLink = document.querySelector('a[href^="registro.html"]');

if (registerLink && redirectParam ) {
    registerLink.href = `registro.html?redirect=${encodeURIComponent(redirectParam)}`;
}
