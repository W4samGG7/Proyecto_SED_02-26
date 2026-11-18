import { getSession } from '../general/session.js';

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

const CONDICIONES = {
    'nuevo': 'Nuevo',
    'usado-como-nuevo': 'Usado como nuevo',
    'usado-buen-estado': 'Usado buen estado'
};


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

// Crea un elemento con clase y texto (sin innerHTML para evitar XSS)
function crear(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function celda(etiqueta, contenido) {
    const td = document.createElement('td');
    td.dataset.label = etiqueta;
    if (contenido instanceof Node) {
        td.appendChild(contenido);
    } else {
        td.textContent = contenido;
    }
    return td;
}

function boton(texto, clase, accion, deshabilitado = false) {
    const btn = crear('button', `btn-admin ${clase}`, texto);
    btn.type = 'button';
    btn.disabled = deshabilitado;
    btn.addEventListener('click', accion);
    return btn;
}

function etiqueta(texto, tipo) {
    return crear('span', `etiqueta etiqueta-${tipo}`, texto);
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
        const fila = document.createElement('tr');

        const info = crear('div', 'producto-info');
        info.append(
            crear('span', 'producto-nombre', p.nombre),
            crear('span', 'producto-detalle',
                `${p.marca} · ${CONDICIONES[p.condicion] || p.condicion} · ${p.seccion}`)
        );

        const producto = crear('div', 'producto-celda');
        producto.append(imagenProducto(p), info);

        const acciones = crear('div', 'acciones');
        acciones.append(
            boton('Editar', 'btn-exito', () => abrirEditor(p)),
            boton('Eliminar', 'btn-peligro', () => eliminarProducto(p))
        );

        fila.append(
            celda('Producto', producto),
            celda('Talla', p.talla),
            celda('Precio', `$${p.precio.toFixed(2)}`),
            celda('Cantidad', p.cantidad),
            celda('Estado', etiqueta(p.activo ? 'Publicado' : 'Oculto', p.activo ? 'activo' : 'inactivo')),
            celda('Acciones', acciones)
        );

        if (!p.activo) fila.classList.add('fila-inactiva');
        tablaStock.appendChild(fila);
    });
}

// Miniatura del producto. Solo se aceptan enlaces http/https
// (evita javascript:, data:, etc.). Si no hay imagen o falla, se muestra un recuadro.
function urlSegura(valor) {
    if (!valor) return null;
    try {
        const enlace = new URL(valor);
        return (enlace.protocol === 'http:' || enlace.protocol === 'https:') ? enlace.href : null;
    } catch {
        return null;
    }
}

function imagenProducto(p) {
    const contenedor = crear('div', 'producto-imagen');
    const sinImagen = () => contenedor.replaceChildren(crear('span', 'producto-sin-imagen', 'Sin imagen'));

    const url = urlSegura(p.imagen_url);

    if (!url) {
        sinImagen();
        return contenedor;
    }

    // La miniatura es un boton para poder abrirla tambien con el teclado
    const abrir = crear('button', 'producto-imagen-btn');
    abrir.type = 'button';
    abrir.setAttribute('aria-label', `Ver imagen de ${p.nombre}`);
    abrir.addEventListener('click', () => abrirVisor(url, p.nombre));

    const img = document.createElement('img');
    img.src = url;
    img.alt = p.nombre;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', sinImagen);

    abrir.appendChild(img);
    contenedor.appendChild(abrir);
    return contenedor;
}


// ===== Visor de imagen =====

const visor = document.getElementById('visorImagen');
const visorImg = document.getElementById('visorImg');
const visorTitulo = document.getElementById('visorTitulo');

function abrirVisor(url, nombre) {
    visorImg.referrerPolicy = 'no-referrer';
    visorImg.src = url;
    visorImg.alt = nombre;
    visorTitulo.textContent = nombre;
    visor.showModal();
}

function cerrarVisor() {
    visor.close();
}

visor.addEventListener('close', () => {
    visorImg.removeAttribute('src');
});

// Cerrar al hacer clic fuera de la imagen (en el fondo oscuro)
visor.addEventListener('click', (e) => {
    if (e.target === visor) cerrarVisor();
});

document.getElementById('cerrarVisor').addEventListener('click', cerrarVisor);

// ===== Edicion de productos =====

const REGEX_TALLA = /^[A-Za-z0-9 ./-]{1,10}$/;

const editor = document.getElementById('editorProducto');
const formProducto = document.getElementById('formProducto');
const vistaPrevia = document.getElementById('vistaPrevia');
const errorEditor = document.getElementById('errorEditor');
const btnGuardarEditor = document.getElementById('guardarEditor');
const contadorDescripcion = document.getElementById('contadorDescripcion');

let productoEditando = null;

function abrirEditor(p) {
    productoEditando = p;
    limpiarErroresEditor();

    formProducto.nombre.value = p.nombre;
    formProducto.imagen_url.value = p.imagen_url || '';
    formProducto.talla.value = p.talla;
    formProducto.precio.value = p.precio.toFixed(2);
    formProducto.cantidad.value = p.cantidad;
    formProducto.activo.value = p.activo ? '1' : '0';
    formProducto.descripcion.value = p.descripcion || '';

    document.getElementById('editorTitulo').textContent = `Editar: ${p.nombre}`;
    actualizarContador();
    actualizarVistaPrevia();

    btnGuardarEditor.disabled = false;
    btnGuardarEditor.textContent = 'Guardar cambios';
    editor.showModal();
    formProducto.nombre.focus();
}

function cerrarEditor() {
    productoEditando = null;
    editor.close();
}

function limpiarErroresEditor() {
    formProducto.querySelectorAll('.editor-error').forEach((e) => { e.textContent = ''; });
    formProducto.querySelectorAll('.input-invalido').forEach((c) => c.classList.remove('input-invalido'));
}

function errorCampo(nombre, texto) {
    formProducto.querySelector(`[data-error="${nombre}"]`).textContent = texto;
    formProducto[nombre].classList.add('input-invalido');
}

function actualizarContador() {
    contadorDescripcion.textContent = `${formProducto.descripcion.value.length} / 1000`;
}

// Muestra la imagen del enlace escrito (solo http/https)
function actualizarVistaPrevia() {
    const url = urlSegura(formProducto.imagen_url.value.trim());
    const sinImagen = () => vistaPrevia.replaceChildren(crear('span', 'producto-sin-imagen', 'Sin imagen'));

    if (!url) {
        sinImagen();
        return;
    }

    const img = document.createElement('img');
    img.referrerPolicy = 'no-referrer';
    img.alt = 'Vista previa';
    img.addEventListener('error', sinImagen);
    img.src = url;
    vistaPrevia.replaceChildren(img);
}

// Lee el formulario, valida y devuelve solo los campos que cambiaron
function leerFormulario() {
    const p = productoEditando;
    const f = formProducto;
    const cambios = {};
    let valido = true;

    const nombre = f.nombre.value.trim();
    if (nombre.length < 2 || nombre.length > 100) {
        errorCampo('nombre', 'Debe tener entre 2 y 100 caracteres.');
        valido = false;
    } else if (nombre !== p.nombre) {
        cambios.nombre = nombre;
    }

    const imagen = f.imagen_url.value.trim();
    if (imagen && (!urlSegura(imagen) || imagen.length > 255)) {
        errorCampo('imagen_url', 'Debe ser un enlace http o https (hasta 255 caracteres).');
        valido = false;
    } else if (imagen !== (p.imagen_url || '')) {
        cambios.imagen_url = imagen || null;
    }

    const talla = f.talla.value.trim();
    if (!REGEX_TALLA.test(talla)) {
        errorCampo('talla', 'De 1 a 10 caracteres: letras, numeros, espacio, punto, / o -.');
        valido = false;
    } else if (talla !== p.talla) {
        cambios.talla = talla;
    }

    const precio = Number(f.precio.value);
    const dosDecimales = Math.abs(Math.round(precio * 100) - precio * 100) < 1e-6;
    if (f.precio.value === '' || !Number.isFinite(precio) || precio <= 0 || precio > 999999.99 || !dosDecimales) {
        errorCampo('precio', 'Mayor que 0, hasta 999999.99 y con maximo 2 decimales.');
        valido = false;
    } else if (precio !== p.precio) {
        cambios.precio = precio;
    }

    const cantidad = Number(f.cantidad.value);
    if (f.cantidad.value === '' || !Number.isInteger(cantidad) || cantidad < 0 || cantidad > 100000) {
        errorCampo('cantidad', 'Numero entero entre 0 y 100000.');
        valido = false;
    } else if (cantidad !== p.cantidad) {
        cambios.cantidad = cantidad;
    }

    const activo = f.activo.value === '1';
    if (activo !== p.activo) cambios.activo = activo;

    const descripcion = f.descripcion.value.trim();
    if (descripcion.length > 1000) {
        errorCampo('descripcion', 'Hasta 1000 caracteres.');
        valido = false;
    } else if (descripcion !== (p.descripcion || '')) {
        cambios.descripcion = descripcion || null;
    }

    return valido ? cambios : null;
}

async function guardarEditor(e) {
    e.preventDefault();
    if (!productoEditando) return;

    limpiarErroresEditor();
    const cambios = leerFormulario();

    if (!cambios) {
        errorEditor.textContent = 'Revisa los campos marcados.';
        return;
    }

    if (Object.keys(cambios).length === 0) {
        cerrarEditor();
        return;
    }

    btnGuardarEditor.disabled = true;
    btnGuardarEditor.textContent = 'Guardando...';

    try {
        const datos = await api(`/api/admin/productos/${productoEditando.id}`, {
            method: 'PATCH',
            body: JSON.stringify(cambios)
        });
        cerrarEditor();
        mostrarMensaje(datos.message);
        await Promise.all([cargarStock(), cargarUsuarios()]);
    } catch (error) {
        errorEditor.textContent = error.message;
        btnGuardarEditor.disabled = false;
        btnGuardarEditor.textContent = 'Guardar cambios';
    }
}

formProducto.addEventListener('submit', guardarEditor);
formProducto.descripcion.addEventListener('input', actualizarContador);
formProducto.imagen_url.addEventListener('input', actualizarVistaPrevia);
document.getElementById('cerrarEditor').addEventListener('click', cerrarEditor);
document.getElementById('cancelarEditor').addEventListener('click', cerrarEditor);

// Quitar el error de un campo cuando se corrige
formProducto.addEventListener('input', (e) => {
    if (!e.target.name) return;
    e.target.classList.remove('input-invalido');
    const error = formProducto.querySelector(`[data-error="${e.target.name}"]`);
    if (error) error.textContent = '';
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
