// Piezas compartidas para mostrar y editar productos
// (las usan el panel de admin y la gestion de stock del vendedor).
// La pagina debe tener los <dialog> #visorImagen y #editorProducto.

export const CONDICIONES = {
    'nuevo': 'Nuevo',
    'usado-como-nuevo': 'Usado como nuevo',
    'usado-buen-estado': 'Usado buen estado'
};

const REGEX_TALLA = /^[A-Za-z0-9 ./-]{1,10}$/;

// Desde esta cantidad (o menos) se avisa que queda poco stock
export const STOCK_BAJO = 2;


// ===== Utilidades del DOM (sin innerHTML para evitar XSS) =====

export function crear(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

export function celda(etiqueta, contenido) {
    const td = document.createElement('td');
    td.dataset.label = etiqueta;
    if (contenido instanceof Node) {
        td.appendChild(contenido);
    } else {
        td.textContent = contenido;
    }
    return td;
}

export function boton(texto, clase, accion, deshabilitado = false) {
    const btn = crear('button', `btn-admin ${clase}`, texto);
    btn.type = 'button';
    btn.disabled = deshabilitado;
    btn.addEventListener('click', accion);
    return btn;
}

export function etiqueta(texto, tipo) {
    return crear('span', `etiqueta etiqueta-${tipo}`, texto);
}

// Solo se aceptan enlaces http/https (evita javascript:, data:, etc.)
export function urlSegura(valor) {
    if (!valor) return null;
    try {
        const enlace = new URL(valor);
        return (enlace.protocol === 'http:' || enlace.protocol === 'https:') ? enlace.href : null;
    } catch {
        return null;
    }
}


// ===== Fila de producto =====

// Miniatura del producto. Si no hay imagen o falla, se muestra un recuadro.
export function imagenProducto(p) {
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

// Aviso de stock para productos publicados (texto + color, no solo color)
function avisoStock(p) {
    if (!p.activo) return null;
    if (p.cantidad === 0) return etiqueta('Sin stock', 'agotado');
    if (p.cantidad <= STOCK_BAJO) return etiqueta('Stock bajo', 'bajo');
    return null;
}

// Celda de cantidad. Si se pasa alAjustar, lleva botones - / + para ajustar rapido.
function cantidadProducto(p, alAjustar) {
    const contenedor = crear('div', 'cantidad-celda');

    if (alAjustar) {
        const controles = crear('div', 'cantidad-rapida');
        const menos = boton('−', 'btn-cantidad', () => alAjustar(p, -1, controles), p.cantidad === 0);
        const mas = boton('+', 'btn-cantidad', () => alAjustar(p, 1, controles));
        menos.setAttribute('aria-label', `Restar una unidad a ${p.nombre}`);
        mas.setAttribute('aria-label', `Sumar una unidad a ${p.nombre}`);
        controles.append(menos, crear('span', 'cantidad-valor', String(p.cantidad)), mas);
        contenedor.appendChild(controles);
    } else {
        contenedor.appendChild(crear('span', 'cantidad-valor', String(p.cantidad)));
    }

    const aviso = avisoStock(p);
    if (aviso) contenedor.appendChild(aviso);
    return contenedor;
}

// Fila de la tabla de stock con los botones Editar y Eliminar
export function filaProducto(p, { alEditar, alEliminar, alAjustar }) {
    const fila = document.createElement('tr');
    fila.dataset.id = p.id;

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
        boton('Editar', 'btn-exito', () => alEditar(p)),
        boton('Eliminar', 'btn-peligro', () => alEliminar(p))
    );

    fila.append(
        celda('Producto', producto),
        celda('Talla', p.talla),
        celda('Precio', `$${p.precio.toFixed(2)}`),
        celda('Cantidad', cantidadProducto(p, alAjustar)),
        celda('Estado', etiqueta(p.activo ? 'Publicado' : 'Oculto', p.activo ? 'activo' : 'inactivo')),
        celda('Acciones', acciones)
    );

    if (!p.activo) fila.classList.add('fila-inactiva');
    return fila;
}


// ===== Visor de imagen =====

let visor = null;

function iniciarVisor() {
    if (visor) return;

    visor = document.getElementById('visorImagen');
    const visorImg = document.getElementById('visorImg');

    visor.addEventListener('close', () => visorImg.removeAttribute('src'));

    // Cerrar al hacer clic fuera de la imagen (en el fondo oscuro)
    visor.addEventListener('click', (e) => {
        if (e.target === visor) visor.close();
    });

    document.getElementById('cerrarVisor').addEventListener('click', () => visor.close());
}

function abrirVisor(url, nombre) {
    iniciarVisor();
    const visorImg = document.getElementById('visorImg');
    visorImg.referrerPolicy = 'no-referrer';
    visorImg.src = url;
    visorImg.alt = nombre;
    document.getElementById('visorTitulo').textContent = nombre;
    visor.showModal();
}


// ===== Editor de producto =====

// Prepara el formulario de edicion.
// enviar(producto, cambios) guarda los cambios y devuelve el mensaje del servidor
// (si falla debe lanzar un Error con el mensaje para mostrarlo en el formulario).
// Devuelve la funcion para abrir el editor con un producto.
export function configurarEditor({ enviar }) {
    const editor = document.getElementById('editorProducto');
    const form = document.getElementById('formProducto');
    const vistaPrevia = document.getElementById('vistaPrevia');
    const errorEditor = document.getElementById('errorEditor');
    const btnGuardar = document.getElementById('guardarEditor');
    const contador = document.getElementById('contadorDescripcion');

    let productoEditando = null;

    function cerrar() {
        productoEditando = null;
        editor.close();
    }

    function limpiarErrores() {
        form.querySelectorAll('.editor-error').forEach((e) => { e.textContent = ''; });
        form.querySelectorAll('.input-invalido').forEach((c) => c.classList.remove('input-invalido'));
    }

    function errorCampo(nombre, texto) {
        form.querySelector(`[data-error="${nombre}"]`).textContent = texto;
        form[nombre].classList.add('input-invalido');
    }

    function actualizarContador() {
        contador.textContent = `${form.descripcion.value.length} / 1000`;
    }

    // Muestra la imagen del enlace escrito (solo http/https)
    function actualizarVistaPrevia() {
        const url = urlSegura(form.imagen_url.value.trim());
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

    // Valida el formulario y devuelve solo los campos que cambiaron (o null si hay errores)
    function leerFormulario() {
        const p = productoEditando;
        const cambios = {};
        let valido = true;

        const nombre = form.nombre.value.trim();
        if (nombre.length < 2 || nombre.length > 100) {
            errorCampo('nombre', 'Debe tener entre 2 y 100 caracteres.');
            valido = false;
        } else if (nombre !== p.nombre) {
            cambios.nombre = nombre;
        }

        const imagen = form.imagen_url.value.trim();
        if (imagen && (!urlSegura(imagen) || imagen.length > 255)) {
            errorCampo('imagen_url', 'Debe ser un enlace http o https (hasta 255 caracteres).');
            valido = false;
        } else if (imagen !== (p.imagen_url || '')) {
            cambios.imagen_url = imagen || null;
        }

        const talla = form.talla.value.trim();
        if (!REGEX_TALLA.test(talla)) {
            errorCampo('talla', 'De 1 a 10 caracteres: letras, numeros, espacio, punto, / o -.');
            valido = false;
        } else if (talla !== p.talla) {
            cambios.talla = talla;
        }

        const precio = Number(form.precio.value);
        const dosDecimales = Math.abs(Math.round(precio * 100) - precio * 100) < 1e-6;
        if (form.precio.value === '' || !Number.isFinite(precio) || precio <= 0 || precio > 999999.99 || !dosDecimales) {
            errorCampo('precio', 'Mayor que 0, hasta 999999.99 y con maximo 2 decimales.');
            valido = false;
        } else if (precio !== p.precio) {
            cambios.precio = precio;
        }

        const cantidad = Number(form.cantidad.value);
        if (form.cantidad.value === '' || !Number.isInteger(cantidad) || cantidad < 0 || cantidad > 100000) {
            errorCampo('cantidad', 'Numero entero entre 0 y 100000.');
            valido = false;
        } else if (cantidad !== p.cantidad) {
            cambios.cantidad = cantidad;
        }

        const activo = form.activo.value === '1';
        if (activo !== p.activo) cambios.activo = activo;

        const descripcion = form.descripcion.value.trim();
        if (descripcion.length > 1000) {
            errorCampo('descripcion', 'Hasta 1000 caracteres.');
            valido = false;
        } else if (descripcion !== (p.descripcion || '')) {
            cambios.descripcion = descripcion || null;
        }

        return valido ? cambios : null;
    }

    async function guardar(e) {
        e.preventDefault();
        if (!productoEditando) return;

        limpiarErrores();
        const cambios = leerFormulario();

        if (!cambios) {
            errorEditor.textContent = 'Revisa los campos marcados.';
            return;
        }

        if (Object.keys(cambios).length === 0) {
            cerrar();
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        try {
            await enviar(productoEditando, cambios);
            cerrar();
        } catch (error) {
            errorEditor.textContent = error.message;
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar cambios';
        }
    }

    form.addEventListener('submit', guardar);
    form.descripcion.addEventListener('input', actualizarContador);
    form.imagen_url.addEventListener('input', actualizarVistaPrevia);
    document.getElementById('cerrarEditor').addEventListener('click', cerrar);
    document.getElementById('cancelarEditor').addEventListener('click', cerrar);

    // Quitar el error de un campo cuando se corrige
    form.addEventListener('input', (e) => {
        if (!e.target.name) return;
        e.target.classList.remove('input-invalido');
        const error = form.querySelector(`[data-error="${e.target.name}"]`);
        if (error) error.textContent = '';
    });

    return function abrirEditor(p) {
        productoEditando = p;
        limpiarErrores();

        form.nombre.value = p.nombre;
        form.imagen_url.value = p.imagen_url || '';
        form.talla.value = p.talla;
        form.precio.value = p.precio.toFixed(2);
        form.cantidad.value = p.cantidad;
        form.activo.value = p.activo ? '1' : '0';
        form.descripcion.value = p.descripcion || '';

        document.getElementById('editorTitulo').textContent = `Editar: ${p.nombre}`;
        actualizarContador();
        actualizarVistaPrevia();

        editor.showModal();
        form.nombre.focus();
    };
}
