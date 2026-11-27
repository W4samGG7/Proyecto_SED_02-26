// Validaciones compartidas para editar productos (admin y vendedor)

const STOCK_MAXIMO = 100000;
const PRECIO_MAXIMO = 999999.99;               // DECIMAL(8,2) en la BD
const REGEX_TALLA = /^[A-Za-z0-9 ./-]{1,10}$/; // VARCHAR(10) en la BD
const NOMBRE_MAXIMO = 100;                     // VARCHAR(100) en la BD
const DESCRIPCION_MAXIMA = 1000;

// Valida que el id de la URL sea un entero positivo
function leerId(valor) {
    if (!/^\d{1,10}$/.test(valor)) return null;
    const id = Number(valor);
    return id > 0 ? id : null;
}

// Revisa los campos enviados y arma el UPDATE.
// Devuelve { error } si algo no es valido, o { cambios, valores } para la consulta.
function validarCambiosProducto(body) {
    const { nombre, descripcion, imagen_url, activo, cantidad, precio, talla } = body || {};
    const cambios = [];
    const valores = [];

    if (nombre !== undefined) {
        const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
        if (nombreLimpio.length < 2 || nombreLimpio.length > NOMBRE_MAXIMO) {
            return { error: `El nombre debe tener entre 2 y ${NOMBRE_MAXIMO} caracteres.` };
        }
        cambios.push('nombre = ?');
        valores.push(nombreLimpio);
    }

    if (descripcion !== undefined) {
        if (descripcion !== null && typeof descripcion !== 'string') {
            return { error: 'Descripcion no valida.' };
        }
        const descripcionLimpia = (descripcion || '').trim();
        if (descripcionLimpia.length > DESCRIPCION_MAXIMA) {
            return { error: `La descripcion puede tener hasta ${DESCRIPCION_MAXIMA} caracteres.` };
        }
        cambios.push('descripcion = ?');
        valores.push(descripcionLimpia || null);
    }

    // La foto no se cambia con un enlace: se sube un archivo (ruta /imagen)
    if (imagen_url !== undefined) {
        return { error: 'La foto se cambia subiendo un archivo, no con un enlace.' };
    }

    if (talla !== undefined) {
        const tallaLimpia = typeof talla === 'string' ? talla.trim() : '';
        if (!REGEX_TALLA.test(tallaLimpia)) {
            return { error: 'La talla debe tener de 1 a 10 caracteres (letras, numeros, espacio, punto, / o -).' };
        }
        cambios.push('talla = ?');
        valores.push(tallaLimpia);
    }

    if (precio !== undefined) {
        const centavos = Math.round(precio * 100);
        const valido = typeof precio === 'number'
            && Number.isFinite(precio)
            && precio > 0
            && precio <= PRECIO_MAXIMO
            && Math.abs(centavos - precio * 100) < 1e-6;

        if (!valido) {
            return { error: `El precio debe ser mayor que 0, hasta ${PRECIO_MAXIMO} y con maximo 2 decimales.` };
        }
        cambios.push('precio = ?');
        valores.push((centavos / 100).toFixed(2));
    }

    if (activo !== undefined) {
        if (typeof activo !== 'boolean') {
            return { error: 'El estado debe ser verdadero o falso.' };
        }
        cambios.push('activo = ?');
        valores.push(activo ? 1 : 0);
    }

    if (cantidad !== undefined) {
        if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > STOCK_MAXIMO) {
            return { error: `La cantidad debe ser un numero entero entre 0 y ${STOCK_MAXIMO}.` };
        }
        cambios.push('cantidad = ?');
        valores.push(cantidad);
    }

    if (cambios.length === 0) {
        return { error: 'No hay cambios para guardar.' };
    }

    return { cambios, valores };
}

module.exports = { leerId, validarCambiosProducto, STOCK_MAXIMO };
