import { filaProducto, configurarEditor, STOCK_BAJO } from '../shared/productos.js';

// Gestion de stock del vendedor: solo ve y edita sus propios productos

const tablaStock = document.getElementById('tablaStock');
const sinProductos = document.getElementById('sinProductos');
const sinPublicaciones = document.getElementById('sinPublicaciones');
const buscarProducto = document.getElementById('buscarProducto');
const filtroProductos = document.getElementById('filtroProductos');
const mensaje = document.getElementById('mensajeStock');

let productos = [];

// Orden de la tabla: columna y direccion (1 ascendente, -1 descendente)
let orden = { campo: null, direccion: 1 };

const esStockBajo = (p) => p.activo && p.cantidad > 0 && p.cantidad <= STOCK_BAJO;
const esSinStock = (p) => p.activo && p.cantidad === 0;


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

function mostrarMensaje(texto, tipo = 'ok') {
    mensaje.textContent = texto;
    mensaje.className = `mensaje-stock mensaje-${tipo}`;
}


// ===== Productos =====

async function cargarProductos() {
    try {
        const datos = await api('/api/vendedor/productos');
        productos = datos.productos;
        actualizarResumen();
        mostrarProductos();
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

function actualizarResumen() {
    const publicados = productos.filter((p) => p.activo);

    document.getElementById('totalProductos').textContent = productos.length;
    document.getElementById('totalPublicados').textContent = publicados.length;
    document.getElementById('totalStock').textContent =
        publicados.reduce((total, p) => total + p.cantidad, 0);
    document.getElementById('totalStockBajo').textContent = productos.filter(esStockBajo).length;
    document.getElementById('totalSinStock').textContent = productos.filter(esSinStock).length;
}

function ordenar(lista) {
    if (!orden.campo) return lista;

    return [...lista].sort((a, b) => {
        const x = a[orden.campo];
        const y = b[orden.campo];
        const resultado = typeof x === 'string'
            ? x.localeCompare(y, 'es', { sensitivity: 'base' })
            : x - y;
        return resultado * orden.direccion;
    });
}

// Clic en un encabezado: ordena por esa columna; otro clic invierte el orden
function cambiarOrden(campo) {
    orden = orden.campo === campo
        ? { campo, direccion: -orden.direccion }
        : { campo, direccion: 1 };

    document.querySelectorAll('.th-ordenar').forEach((btn) => {
        const activo = btn.dataset.orden === orden.campo;
        const th = btn.closest('th');
        th.setAttribute('aria-sort', activo ? (orden.direccion === 1 ? 'ascending' : 'descending') : 'none');
        btn.querySelector('.th-flecha').textContent = activo ? (orden.direccion === 1 ? '▲' : '▼') : '';
    });

    mostrarProductos();
}

function productosFiltrados() {
    const texto = buscarProducto.value.trim().toLowerCase();
    const filtro = filtroProductos.value;

    return productos.filter((p) => {
        const coincideTexto = !texto
            || p.nombre.toLowerCase().includes(texto)
            || p.marca.toLowerCase().includes(texto);

        const coincideFiltro =
            filtro === 'todos' ||
            (filtro === 'publicados' && p.activo) ||
            (filtro === 'ocultos' && !p.activo) ||
            (filtro === 'stock-bajo' && esStockBajo(p)) ||
            (filtro === 'sin-stock' && esSinStock(p));

        return coincideTexto && coincideFiltro;
    });
}

function mostrarProductos() {
    const lista = ordenar(productosFiltrados());
    tablaStock.replaceChildren();

    // Mensaje distinto si no tiene productos o si el filtro no encuentra nada
    sinPublicaciones.hidden = productos.length > 0;
    sinProductos.hidden = productos.length === 0 || lista.length > 0;

    lista.forEach((p) => {
        tablaStock.appendChild(filaProducto(p, {
            alEditar: abrirEditor,
            alEliminar: eliminarProducto,
            alAjustar: ajustarCantidad
        }));
    });
}

// Botones - / +: el servidor suma o resta y devuelve la cantidad nueva
async function ajustarCantidad(p, ajuste, controles) {
    controles.classList.add('guardando');

    try {
        const datos = await api(`/api/vendedor/productos/${p.id}/ajuste`, {
            method: 'POST',
            body: JSON.stringify({ ajuste })
        });

        p.cantidad = datos.cantidad;
        mensaje.textContent = '';
        actualizarResumen();
        mostrarProductos();

        // Devolver el foco al mismo boton para poder seguir ajustando con el teclado
        const fila = tablaStock.querySelector(`tr[data-id="${p.id}"]`);
        const boton = fila && fila.querySelectorAll('.btn-cantidad')[ajuste > 0 ? 1 : 0];
        if (boton && !boton.disabled) boton.focus();

    } catch (error) {
        controles.classList.remove('guardando');
        mostrarMensaje(error.message, 'error');
    }
}

// Formulario de edicion (el mismo que usa el admin)
const abrirEditor = configurarEditor({
    enviar: async (p, cambios, foto) => {
        let mensajeFinal = '';

        // 1. Foto nueva: se sube como archivo (multipart), igual que en Publicar articulo
        if (foto) {
            const datosFoto = new FormData();
            datosFoto.append('item_image', foto);
            const datos = await api(`/api/vendedor/productos/${p.id}/imagen`, {
                method: 'POST',
                headers: {},
                body: datosFoto
            });
            mensajeFinal = datos.message;
        }

        // 2. Los demas campos
        if (Object.keys(cambios).length > 0) {
            const datos = await api(`/api/vendedor/productos/${p.id}`, {
                method: 'PATCH',
                body: JSON.stringify(cambios)
            });
            mensajeFinal = foto ? 'Producto y foto actualizados correctamente.' : datos.message;
        }

        mostrarMensaje(mensajeFinal);
        await cargarProductos();
    }
});

async function eliminarProducto(p) {
    if (!confirm(`¿Eliminar definitivamente "${p.nombre}"? Esta accion no se puede deshacer.`)) return;

    try {
        const datos = await api(`/api/vendedor/productos/${p.id}`, { method: 'DELETE' });
        mostrarMensaje(datos.message);
        await cargarProductos();
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}


// ===== Inicio =====

buscarProducto.addEventListener('input', mostrarProductos);
filtroProductos.addEventListener('change', mostrarProductos);
document.querySelectorAll('.th-ordenar').forEach((btn) => {
    btn.addEventListener('click', () => cambiarOrden(btn.dataset.orden));
});

cargarProductos();
