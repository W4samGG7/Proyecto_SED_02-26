
// ===== Utilidades =====

async function api(url, opciones = {}) {
    const respuesta = await fetch(url, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        ...opciones
    });

    const datos = await respuesta.json().catch(() => ({}));

    // Sin sesion: al login. Admin u otro sin permiso: al inicio.
    if (respuesta.status === 401) {
        const destino = encodeURIComponent(window.location.pathname);
        window.location.replace(`/modules/login/index_login.html?redirect=${destino}`);
        throw new Error(datos.message || 'Debes iniciar sesion');
    }

    if (respuesta.status === 403) {
        window.location.replace('/');
        throw new Error(datos.message || 'Sin permisos');
    }

    if (!respuesta.ok) {
        throw new Error(datos.message || 'Ocurrio un error.');
    }

    return datos;
}