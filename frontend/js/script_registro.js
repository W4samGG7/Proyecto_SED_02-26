// Elementos principales del registro
const formRegistro = document.getElementById("registroForm");
const estadoRegistro = document.getElementById("estado");
const botonRegistro = formRegistro.querySelector('button[type="submit"]');

// Direccion de la pagina de login
const paginaLogin = "index_login.html";

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
function registrarUsuario(e) {

    // Evitar que el formulario se envie solo
    e.preventDefault();

    if (!validarRegistro()) {
        return;
    }

    botonRegistro.disabled = true;
    botonRegistro.textContent = "Registrando...";

    // Por ahora no hay backend, solo se muestra el mensaje
    estadoRegistro.textContent = "¡Cuenta creada! Ahora puedes iniciar sesion.";
    estadoRegistro.className = "estado-ok";

    formRegistro.reset();

    setTimeout(function() {
        window.location.href = paginaLogin;
    }, 1500);
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

// Cerrar el registro
document.getElementById("cerrarRegistro").addEventListener("click", function() {

    document.querySelector(".login-container").style.display = "none";

});
