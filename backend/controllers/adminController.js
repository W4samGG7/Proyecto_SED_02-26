const { pool } = require('../config/database');

const ROLES = ['usuario', 'admin'];
const STOCK_MAXIMO = 100000;
const PRECIO_MAXIMO = 999999.99;          // DECIMAL(8,2) en la BD
const REGEX_TALLA = /^[A-Za-z0-9 ./-]{1,10}$/; // VARCHAR(10) en la BD
const NOMBRE_MAXIMO = 100;                 // VARCHAR(100) en la BD
const DESCRIPCION_MAXIMA = 1000;
const URL_MAXIMA = 255;                    // VARCHAR(255) en la BD

// Solo enlaces http/https (evita javascript:, data:, etc.)
function urlImagenValida(valor) {
    if (valor.length > URL_MAXIMA) return false;
    try {
        const url = new URL(valor);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

// Valida que el id de la URL sea un entero positivo
function leerId(valor) {
    if (!/^\d{1,10}$/.test(valor)) return null;
    const id = Number(valor);
    return id > 0 ? id : null;
}

// Listar usuarios con el resumen de su stock
const listarUsuarios = async (req, res) => {
    try {
        const [usuarios] = await pool.execute(`
            SELECT
                u.id,
                u.nombre,
                u.apellido,
                u.correo,
                u.rol,
                u.activo,
                u.creado_en,
                COUNT(p.id) AS total_productos,
                COALESCE(SUM(p.activo = 1), 0) AS productos_activos,
                COALESCE(SUM(CASE WHEN p.activo = 1 THEN p.cantidad ELSE 0 END), 0) AS stock_total
            FROM usuarios u
            LEFT JOIN productos p ON p.vendedor_id = u.id
            GROUP BY u.id
            ORDER BY u.creado_en DESC
        `);

        res.json({
            total: usuarios.length,
            usuarios: usuarios.map((u) => ({
                ...u,
                activo: Boolean(u.activo),
                total_productos: Number(u.total_productos),
                productos_activos: Number(u.productos_activos),
                stock_total: Number(u.stock_total)
            }))
        });

    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ message: 'Error al consultar los usuarios.' });
    }
};

// Ver los productos (stock) de un usuario
const productosDeUsuario = async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id de usuario no valido.' });

    try {
        const [usuarios] = await pool.execute(
            'SELECT id, nombre, apellido, correo FROM usuarios WHERE id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const [productos] = await pool.execute(`
            SELECT id, nombre, marca, tipo, condicion, talla, precio,
                   cantidad, descripcion, seccion, activo, imagen_url, creado_en
            FROM productos
            WHERE vendedor_id = ?
            ORDER BY creado_en DESC
        `, [id]);

        res.json({
            usuario: usuarios[0],
            productos: productos.map((p) => ({
                ...p,
                activo: Boolean(p.activo),
                precio: Number(p.precio)
            }))
        });

    } catch (error) {
        console.error('Error al consultar productos del usuario:', error);
        res.status(500).json({ message: 'Error al consultar los productos.' });
    }
};

// Cambiar rol o estado de un usuario
const actualizarUsuario = async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id de usuario no valido.' });

    const { rol, activo } = req.body || {};
    const cambios = [];
    const valores = [];

    if (rol !== undefined) {
        if (!ROLES.includes(rol)) {
            return res.status(400).json({ message: 'Rol no valido.' });
        }
        cambios.push('rol = ?');
        valores.push(rol);
    }

    if (activo !== undefined) {
        if (typeof activo !== 'boolean') {
            return res.status(400).json({ message: 'El estado debe ser verdadero o falso.' });
        }
        cambios.push('activo = ?');
        valores.push(activo ? 1 : 0);
    }

    if (cambios.length === 0) {
        return res.status(400).json({ message: 'No hay cambios para guardar.' });
    }

    // El admin no puede quitarse permisos ni desactivarse a si mismo
    if (id === req.usuario.id && (rol === 'usuario' || activo === false)) {
        return res.status(400).json({
            message: 'No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.'
        });
    }

    try {
        valores.push(id);
        const [resultado] = await pool.execute(
            `UPDATE usuarios SET ${cambios.join(', ')} WHERE id = ?`,
            valores
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json({ message: 'Usuario actualizado correctamente.' });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar el usuario.' });
    }
};

// Eliminar un usuario. Sus productos se ocultan para que no queden
// publicados sin vendedor.
const eliminarUsuario = async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id de usuario no valido.' });

    if (id === req.usuario.id) {
        return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta.' });
    }

    let conexion;

    try {
        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        await conexion.execute(
            'UPDATE productos SET activo = 0 WHERE vendedor_id = ?',
            [id]
        );

        const [resultado] = await conexion.execute(
            'DELETE FROM usuarios WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            await conexion.rollback();
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        await conexion.commit();
        res.json({ message: 'Usuario eliminado correctamente.' });

    } catch (error) {
        if (conexion) await conexion.rollback();
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error al eliminar el usuario.' });
    } finally {
        if (conexion) conexion.release();
    }
};

// Editar los datos de un producto (solo se cambian los campos enviados)
const actualizarProducto = async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id de producto no valido.' });

    const { nombre, descripcion, imagen_url, activo, cantidad, precio, talla } = req.body || {};
    const cambios = [];
    const valores = [];

    if (nombre !== undefined) {
        const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
        if (nombreLimpio.length < 2 || nombreLimpio.length > NOMBRE_MAXIMO) {
            return res.status(400).json({
                message: `El nombre debe tener entre 2 y ${NOMBRE_MAXIMO} caracteres.`
            });
        }
        cambios.push('nombre = ?');
        valores.push(nombreLimpio);
    }

    if (descripcion !== undefined) {
        if (descripcion !== null && typeof descripcion !== 'string') {
            return res.status(400).json({ message: 'Descripcion no valida.' });
        }
        const descripcionLimpia = (descripcion || '').trim();
        if (descripcionLimpia.length > DESCRIPCION_MAXIMA) {
            return res.status(400).json({
                message: `La descripcion puede tener hasta ${DESCRIPCION_MAXIMA} caracteres.`
            });
        }
        cambios.push('descripcion = ?');
        valores.push(descripcionLimpia || null);
    }

    if (imagen_url !== undefined) {
        if (imagen_url !== null && typeof imagen_url !== 'string') {
            return res.status(400).json({ message: 'Enlace de imagen no valido.' });
        }
        const urlLimpia = (imagen_url || '').trim();
        if (urlLimpia && !urlImagenValida(urlLimpia)) {
            return res.status(400).json({
                message: `La imagen debe ser un enlace http o https de hasta ${URL_MAXIMA} caracteres.`
            });
        }
        cambios.push('imagen_url = ?');
        valores.push(urlLimpia || null);
    }

    if (talla !== undefined) {
        const tallaLimpia = typeof talla === 'string' ? talla.trim() : '';
        if (!REGEX_TALLA.test(tallaLimpia)) {
            return res.status(400).json({
                message: 'La talla debe tener de 1 a 10 caracteres (letras, numeros, espacio, punto, / o -).'
            });
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
            return res.status(400).json({
                message: `El precio debe ser mayor que 0, hasta ${PRECIO_MAXIMO} y con maximo 2 decimales.`
            });
        }
        cambios.push('precio = ?');
        valores.push((centavos / 100).toFixed(2));
    }

    if (activo !== undefined) {
        if (typeof activo !== 'boolean') {
            return res.status(400).json({ message: 'El estado debe ser verdadero o falso.' });
        }
        cambios.push('activo = ?');
        valores.push(activo ? 1 : 0);
    }

    if (cantidad !== undefined) {
        if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > STOCK_MAXIMO) {
            return res.status(400).json({
                message: `La cantidad debe ser un numero entero entre 0 y ${STOCK_MAXIMO}.`
            });
        }
        cambios.push('cantidad = ?');
        valores.push(cantidad);
    }

    if (cambios.length === 0) {
        return res.status(400).json({ message: 'No hay cambios para guardar.' });
    }

    try {
        valores.push(id);
        const [resultado] = await pool.execute(
            `UPDATE productos SET ${cambios.join(', ')} WHERE id = ?`,
            valores
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        res.json({ message: 'Producto actualizado correctamente.' });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto.' });
    }
};

// Eliminar un producto
const eliminarProducto = async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id de producto no valido.' });

    try {
        const [resultado] = await pool.execute(
            'DELETE FROM productos WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        res.json({ message: 'Producto eliminado correctamente.' });

    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ message: 'Error al eliminar el producto.' });
    }
};

module.exports = {
    listarUsuarios,
    productosDeUsuario,
    actualizarUsuario,
    eliminarUsuario,
    actualizarProducto,
    eliminarProducto
};
