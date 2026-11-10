// Variables principales del login
let overlay;
let form;
let email;
let password;
let mensajeError;
let botonLogin;

// Datos para probar el inicio de sesion
const correoCorrecto = "test@test.com";
const claveCorrecta = "123456";

// Direccion de la pagina de registro
const paginaRegistro = "registro.html";


// Crear la ventana de login
function crearLogin() {

    overlay = document.createElement("div");
    overlay.className = "lm-overlay";

    overlay.innerHTML = `
        <div class="lm-modal">

            <div class="lm-header">
                <h2 class="lm-title">Iniciar Sesion</h2>
                <button class="lm-close" type="button">&times;</button>
            </div>

            <form class="lm-form">

                <p class="lm-form-error"></p>

                <div class="lm-field">
                    <label class="lm-label" for="lm-email">
                        Correo electronico
                    </label>

                    <input
                        class="lm-input"
                        type="email"
                        id="lm-email"
                        name="email"
                        placeholder="Correo electronico"
                    >

                    <p class="lm-error-text" data-for="email"></p>
                </div>

                <div class="lm-field">
                    <label class="lm-label" for="lm-password">
                        Contraseña
                    </label>

                    <div class="lm-input-wrap">
                        <input
                            class="lm-input"
                            type="password"
                            id="lm-password"
                            name="password"
                            placeholder="Contraseña"
                        >

                        <button
                            type="button"
                            class="lm-toggle"
                        >
                            Mostrar
                        </button>
                    </div>

                    <p class="lm-error-text" data-for="password"></p>
                </div>

                <button type="submit" class="lm-submit">
                    Iniciar sesion
                </button>

            </form>

            <p class="lm-footer">
                ¿No tienes una cuenta?
                <a href="registro.html" class="lm-register">
                    Registrate aqui
                </a>
            </p>

        </div>
    `;

    document.body.appendChild(overlay);

    // Obtener los elementos del formulario
    form = overlay.querySelector(".lm-form");
    email = overlay.querySelector("#lm-email");
    password = overlay.querySelector("#lm-password");
    mensajeError = overlay.querySelector(".lm-form-error");
    botonLogin = overlay.querySelector(".lm-submit");

    // Eventos de los botones
    overlay.querySelector(".lm-close").addEventListener("click", cerrarLogin);

    overlay.querySelector(".lm-toggle").addEventListener("click", mostrarClave);

    overlay.querySelector(".lm-register").addEventListener("click", irRegistro);

    // Cerrar al hacer clic fuera de la ventana
    overlay.addEventListener("click", function(e) {
        if (e.target === overlay) {
            cerrarLogin();
        }
    });

    // Validar cuando se envia el formulario
    form.addEventListener("submit", iniciarSesion);
}


// Abrir la ventana de login
function abrirLogin() {

    if (!overlay) {
        crearLogin();
    }

    overlay.classList.add("lm-open");

    email.focus();
}


// Cerrar la ventana de login
function cerrarLogin() {

    if (overlay) {
        overlay.classList.remove("lm-open");

        form.reset();

        mensajeError.textContent = "";

        limpiarErrores();
    }
}


// Mostrar u ocultar la contraseña
function mostrarClave() {

    const boton = overlay.querySelector(".lm-toggle");

    if (password.type === "password") {

        password.type = "text";
        boton.textContent = "Ocultar";

    } else {

        password.type = "password";
        boton.textContent = "Mostrar";

    }
}


// Ir a la pagina de registro
function irRegistro(e) {

    e.preventDefault();

    window.location.href = paginaRegistro;

}


// Limpiar los mensajes de error
function limpiarErrores() {

    const errores = overlay.querySelectorAll(".lm-error-text");

    errores.forEach(function(error) {
        error.textContent = "";
    });

    const campos = overlay.querySelectorAll(".lm-input");

    campos.forEach(function(campo) {
        campo.classList.remove("lm-invalid");
    });

    mensajeError.textContent = "";
}


// Mostrar un error debajo de cada campo
function mostrarError(campo, mensaje) {

    const error = overlay.querySelector(
        '[data-for="' + campo + '"]'
    );

    const input = overlay.querySelector(
        '[name="' + campo + '"]'
    );

    error.textContent = mensaje;

    input.classList.add("lm-invalid");

}


// Validar los datos ingresados
function validarFormulario() {

    limpiarErrores();

    let correcto = true;

    const correo = email.value.trim();
    const clave = password.value;

    if (correo === "") {

        mostrarError("email", "Ingresa tu correo electronico.");
        correcto = false;

    } else if (!correo.includes("@") || !correo.includes(".")) {

        mostrarError("email", "Ingresa un correo valido.");
        correcto = false;

    }

    if (clave === "") {

        mostrarError("password", "Ingresa tu contraseña.");
        correcto = false;

    } else if (clave.length < 6) {

        mostrarError("password", "La contraseña debe tener al menos 6 caracteres.");
        correcto = false;

    }

    return correcto;
}


// Iniciar sesion
function iniciarSesion(e) {

    e.preventDefault();

    if (!validarFormulario()) {
        return;
    }

    const correo = email.value.trim();
    const clave = password.value;

    botonLogin.disabled = true;
    botonLogin.textContent = "Verificando...";

    // Comprobar los datos de prueba
    if (correo === correoCorrecto && clave === claveCorrecta) {

        mensajeError.textContent = "";

        alert("¡Bienvenido! Has iniciado sesion correctamente.");

        // Avisar a la pagina principal que el usuario ingreso
        document.dispatchEvent(
            new CustomEvent("login:success", {
                detail: {
                    user: {
                        email: correo
                    }
                }
            })
        );

        cerrarLogin();

    } else {

        mensajeError.textContent =
            "El correo o la contraseña son incorrectos.";

    }

    botonLogin.disabled = false;
    botonLogin.textContent = "Iniciar sesion";

}


// Detectar cuando se hace clic en un elemento para abrir el login
document.addEventListener("click", function(e) {

    const boton = e.target.closest("[data-login-open]");

    if (boton) {

        e.preventDefault();
        abrirLogin();

    }
});

document.getElementById("cerrarLogin").addEventListener("click", function() {

    document.querySelector(".login-container").style.display = "none";

});

// Funcion para poder abrir el login desde otros archivos
window.LoginModal = {
    open: abrirLogin,
    close: cerrarLogin
};