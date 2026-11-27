// Elementos principales del registro
const formRegistro = document.getElementById("registroForm");
const estadoRegistro = document.getElementById("estado");
const botonRegistro = formRegistro.querySelector('button[type="submit"]');

// Direccion de la pagina de login
const redirectParam = new URLSearchParams(window.location.search).get("redirect");

const paginaLogin = redirectParam
    ? "index_login.html?redirect=" + encodeURIComponent(redirectParam)
    : "index_login.html";

const loginLink = document.querySelector(".register-link a");
if (loginLink) loginLink.href = paginaLogin;

// Reglas de validacion
const regexNombre = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const minimoClave = 8;


// Limpiar los mensajes de error
function limpiarErroresRegistro() {

    formRegistro.querySelectorAll(".error-text").forEach(function(error) {
        error.textContent = "";
    });

    formRegistro.querySelectorAll("input").forEach(function(campo) {
        campo.classList.remove("input-invalid");
        campo.removeAttribute("aria-invalid");
    });

    estadoRegistro.textContent = "";
    estadoRegistro.className = "";
}


// Mostrar un error debajo del campo
function mostrarErrorRegistro(campo, mensaje) {

    const error = formRegistro.querySelector('[data-for="' + campo + '"]');
    const input = formRegistro.querySelector('[name="' + campo + '"]');

    error.textContent = mensaje;

    input.classList.add("input-invalid");
    input.setAttribute("aria-invalid", "true");
}


// Validar nombre o apellido
function validarNombre(campo, valor, texto) {

    if (valor === "") {
        mostrarErrorRegistro(campo, "Ingresa tu " + texto + ".");
        return false;
    }

    if (valor.length < 2 || !regexNombre.test(valor)) {
        mostrarErrorRegistro(campo, "Ingresa un " + texto + " valido (solo letras).");
        return false;
    }

    return true;
}


// Validar todos los datos ingresados
function validarRegistro() {

    limpiarErroresRegistro();

    let correcto = true;

    const nombre = formRegistro.nombre.value.trim();
    const apellido = formRegistro.apellido.value.trim();
    const correo = formRegistro.email.value.trim();
    const clave = formRegistro.password.value;
    const confirmar = formRegistro.confirmarPassword.value;

    if (!validarNombre("nombre", nombre, "nombre")) {
        correcto = false;
    }

    if (!validarNombre("apellido", apellido, "apellido")) {
        correcto = false;
    }

    if (correo === "") {
        mostrarErrorRegistro("email", "Ingresa tu correo electronico.");
        correcto = false;
    } else if (!regexCorreo.test(correo)) {
        mostrarErrorRegistro("email", "Ingresa un correo valido.");
        correcto = false;
    }

    if (clave === "") {
        mostrarErrorRegistro("password", "Ingresa una contraseña.");
        correcto = false;
    } else if (
        clave.length < minimoClave ||
        !/[A-Za-z]/.test(clave) ||
        !/[0-9]/.test(clave)
    ) {
        mostrarErrorRegistro(
            "password",
            "Debe tener al menos " + minimoClave + " caracteres, una letra y un numero."
        );
        correcto = false;
    }

    if (confirmar === "") {
        mostrarErrorRegistro("confirmarPassword", "Confirma tu contraseña.");
        correcto = false;
    } else if (confirmar !== clave) {
        mostrarErrorRegistro("confirmarPassword", "Las contraseñas no coinciden.");
        correcto = false;
    }

    return correcto;
}


// Registrar al usuario
async function registrarUsuario(e) {

    // Evitar que el formulario se envie solo
    e.preventDefault();

    if (!validarRegistro()) {
        return;
    }

    botonRegistro.disabled = true;
    botonRegistro.textContent = "Registrando...";

    try {

        const respuesta = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre: formRegistro.nombre.value.trim(),
                apellido: formRegistro.apellido.value.trim(),
                email: formRegistro.email.value.trim(),
                password: formRegistro.password.value
            })
        });

        const datos = await respuesta.json().catch(function() { return {}; });

        if (!respuesta.ok) {

            // 409 = ese correo ya existe: se muestra debajo del campo
            if (respuesta.status === 409) {
                mostrarErrorRegistro("email", datos.message);
            } else {
                estadoRegistro.textContent = datos.message || "No se pudo crear la cuenta.";
            }

            botonRegistro.disabled = false;
            botonRegistro.textContent = "Registrarse";
            return;
        }

        estadoRegistro.textContent = "¡Cuenta creada! Ahora puedes iniciar sesion.";
        estadoRegistro.className = "estado-ok";

        formRegistro.reset();

        setTimeout(function() {
            window.location.href = paginaLogin;
        }, 1500);

    } catch (error) {

        estadoRegistro.textContent = "No se pudo conectar con el servidor.";
        botonRegistro.disabled = false;
        botonRegistro.textContent = "Registrarse";

    }
}


// Quitar el error de un campo cuando el usuario lo corrige
formRegistro.addEventListener("input", function(e) {

    const campo = e.target.name;
    const error = formRegistro.querySelector('[data-for="' + campo + '"]');

    if (error) {
        error.textContent = "";
        e.target.classList.remove("input-invalid");
        e.target.removeAttribute("aria-invalid");
    }
});

formRegistro.addEventListener("submit", registrarUsuario);
