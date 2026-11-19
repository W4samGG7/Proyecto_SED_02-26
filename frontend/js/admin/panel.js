import { getSession } from '../general/session.js';
import { crear, boton, celda, etiqueta, filaProducto, configurarEditor } from '../shared/productos.js';

// Elementos de la pagina
const tablaUsuarios = document.getElementById('tablaUsuarios');
const sinUsuarios = document.getElementById('sinUsuarios');
const buscarUsuario = document.getElementById('buscarUsuario');
const filtroUsuarios = document.getElementById('filtroUsuarios');
const mensaje = document.getElementById('mensajeAdmin');

const seccionStock = document.getElementById('seccionStock');
const tituloStock = document.getElementById('tituloStock');
const tablaStock = document.getElementById('tablaStock');
const sinProductos = document.getElementById('sinProductos');

let usuarios = [];
let adminActual = null;
let usuarioStock = null;

// ===== Utilidades =====

// Peticiones a la API del admin
async function api(url, opciones = {}) {
    const respuesta = await fetch(url, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        ...opciones
    });

    const datos = await respuesta.json().catch(() => ({}));

    // Sesion vencida o sin permisos
    if (respuesta.status === 401 || respuesta.status === 403) {
        window.location.replace('/');
        throw new Error(datos.message || 'Sin permisos');
    }

    if (!respuesta.ok) {
        throw new Error(datos.message || 'Ocurrio un error.');
    }

    return datos;
}

function mostrarMensaje(texto, tipo = 'ok') {
    mensaje.textContent = texto;
    mensaje.className = `mensaje-admin mensaje-${tipo}`;
}


// ===== Usuarios =====

async function cargarUsuarios() {
    try {
        const datos = await api('/api/admin/usuarios');
        usuarios = datos.usuarios;
        actualizarResumen();
        mostrarUsuarios();
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

function actualizarResumen() {
    document.getElementById('totalUsuarios').textContent = usuarios.length;
    document.getElementById('totalAdmins').textContent =
        usuarios.filter((u) => u.rol === 'admin').length;
    document.getElementById('totalDesactivados').textContent =
        usuarios.filter((u) => !u.activo).length;
    document.getElementById('totalStock').textContent =
        usuarios.reduce((total, u) => total + u.stock_total, 0);
}

function usuariosFiltrados() {
    const texto = buscarUsuario.value.trim().toLowerCase();
    const filtro = filtroUsuarios.value;

    return usuarios.filter((u) => {
        const nombreCompleto = `${u.nombre} ${u.apellido}`.toLowerCase();
        const coincideTexto = !texto
            || nombreCompleto.includes(texto)
            || u.correo.toLowerCase().includes(texto);

        const coincideFiltro =
            filtro === 'todos' ||
            (filtro === 'admin' && u.rol === 'admin') ||
            (filtro === 'usuario' && u.rol === 'usuario') ||
            (filtro === 'activos' && u.activo) ||
            (filtro === 'desactivados' && !u.activo);

        return coincideTexto && coincideFiltro;
    });
}

function mostrarUsuarios() {
    const lista = usuariosFiltrados();
    tablaUsuarios.replaceChildren();
    sinUsuarios.hidden = lista.length > 0;

    lista.forEach((u) => {
        const esYo = adminActual && u.id === adminActual.id;
        const fila = document.createElement('tr');

        const nombre = crear('span', 'usuario-nombre', `${u.nombre} ${u.apellido}`);
        if (esYo) nombre.appendChild(crear('span', 'usuario-yo', ' (tu)'));

        const acciones = crear('div', 'acciones');
        acciones.append(
            boton('Ver stock', 'btn-secundario', () => verStock(u)),
            boton(
                u.rol === 'admin' ? 'Quitar admin' : 'Hacer admin',
                'btn-secundario',
                () => cambiarRol(u),
                esYo
            ),
            boton(
                u.activo ? 'Desactivar' : 'Activar',
                u.activo ? 'btn-alerta' : 'btn-exito',
                () => cambiarEstado(u),
                esYo
            ),
            boton('Eliminar', 'btn-peligro', () => eliminarUsuario(u), esYo)
        );

        fila.append(
            celda('Nombre', nombre),
            celda('Correo', u.correo),
            celda('Rol', etiqueta(u.rol === 'admin' ? 'Admin' : 'Usuario', u.rol)),
            celda('Estado', etiqueta(u.activo ? 'Activo' : 'Desactivado', u.activo ? 'activo' : 'inactivo')),
            celda('Productos', `${u.productos_activos} / ${u.total_productos}`),
            celda('Stock', u.stock_total),
            celda('Acciones', acciones)
        );

        if (!u.activo) fila.classList.add('fila-inactiva');
        tablaUsuarios.appendChild(fila);
    });
}

async function cambiarRol(u) {
    const nuevoRol = u.rol === 'admin' ? 'usuario' : 'admin';
    const pregunta = nuevoRol === 'admin'
        ? `¿Dar permisos de administrador a ${u.correo}?`
        : `¿Quitar los permisos de administrador a ${u.correo}?`;

    if (!confirm(pregunta)) return;

    try {
        const datos = await api(`/api/admin/usuarios/${u.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ rol: nuevoRol })
        });
        mostrarMensaje(datos.message);
        await cargarUsuarios();
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

async function cambiarEstado(u) {
    const pregunta = u.activo
        ? `¿Desactivar la cuenta de ${u.correo}? No podra iniciar sesion.`
        : `¿Activar la cuenta de ${u.correo}?`;

    if (!confirm(pregunta)) return;

    try {
        const datos = await api(`/api/admin/usuarios/${u.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ activo: !u.activo })
        });
        mostrarMensaje(datos.message);
        await cargarUsuarios();
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

async function eliminarUsuario(u) {
    const pregunta = `¿Eliminar definitivamente a ${u.correo}?\n\n` +
        'Esta accion no se puede deshacer. Sus productos quedaran ocultos.';

    if (!confirm(pregunta)) return;

    try {
        const datos = await api(`/api/admin/usuarios/${u.id}`, { method: 'DELETE' });
        mostrarMensaje(datos.message);

        if (usuarioStock && usuarioStock.id === u.id) cerrarStock();
        await cargarUsuarios();
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}


// ===== Stock de un usuario =====

async function verStock(u) {
    usuarioStock = u;
    tituloStock.textContent = `Stock de ${u.nombre} ${u.apellido}`;
    seccionStock.hidden = false;
    await cargarStock();
    seccionStock.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarStock() {
    usuarioStock = null;
    seccionStock.hidden = true;
    tablaStock.replaceChildren();
}

async function cargarStock() {
    if (!usuarioStock) return;

    try {
        const datos = await api(`/api/admin/usuarios/${usuarioStock.id}/productos`);
        mostrarStock(datos.productos);
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

function mostrarStock(productos) {
    tablaStock.replaceChildren();
    sinProductos.hidden = productos.length > 0;

    productos.forEach((p) => {
        tablaStock.appendChild(filaProducto(p, { alEditar: abrirEditor, alEliminar: eliminarProducto }));
    });
}

// Formulario de edicion (compartido con la gestion de stock del vendedor)
const abrirEditor = configurarEditor({
    enviar: async (p, cambios) => {
        const datos = await api(`/api/admin/productos/${p.id}`, {
            method: 'PATCH',
            body: JSON.stringify(cambios)
        });
        mostrarMensaje(datos.message);
        await Promise.all([cargarStock(), cargarUsuarios()]);
    }
});

async function eliminarProducto(p) {
    if (!confirm(`¿Eliminar definitivamente "${p.nombre}"? Esta accion no se puede deshacer.`)) return;

    try {
        const datos = await api(`/api/admin/productos/${p.id}`, { method: 'DELETE' });
        mostrarMensaje(datos.message);
        await Promise.all([cargarStock(), cargarUsuarios()]);
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}


// ===== Inicio =====

buscarUsuario.addEventListener('input', mostrarUsuarios);
filtroUsuarios.addEventListener('change', mostrarUsuarios);
document.getElementById('cerrarStock').addEventListener('click', cerrarStock);

async function iniciar() {
    adminActual = await getSession();

    if (!adminActual || adminActual.rol !== 'admin') {
        window.location.replace('/');
        return;
    }

    await cargarUsuarios();
}

iniciar();
