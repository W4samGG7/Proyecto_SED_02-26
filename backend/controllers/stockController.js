const { pool } = require('../config/database');

const { leerId, validarCambiosProducto, STOCK_MAXIMO } = require('./validacionProducto');

// Todas las consultas filtran por vendedor_id = usuario de la sesion,
// asi un vendedor nunca puede ver ni modificar productos de otro.

// Listar los productos del vendedor
const misProductos = async (req, res) => {
    try {
        const [productos] = await pool.execute(`
            SELECT id, nombre, marca, tipo, condicion, talla, precio,
                   cantidad, descripcion, seccion, activo, imagen_url, creado_en
            FROM productos
            WHERE vendedor_id = ?
            ORDER BY creado_en DESC
        `, [req.usuario.id]);

        res.json({
            total: productos.length,
            productos: productos.map((p) => ({
                ...p,
                activo: Boolean(p.activo),
                precio: Number(p.precio)
            }))
        });

    } catch (error) {
        console.error('Error al listar productos del vendedor:', error);
        res.status(500).json({ message: 'Error al consultar tus productos.' });
    }
};

// Editar un producto propio
const actualizarMiProducto = async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id de producto no valido.' });

    const validacion = validarCambiosProducto(req.body);
    if (validacion.error) return res.status(400).json({ message: validacion.error });

    const { cambios, valores } = validacion;

    try {
        const [resultado] = await pool.execute(
            `UPDATE productos SET ${cambios.join(', ')} WHERE id = ? AND vendedor_id = ?`,
            [...valores, id, req.usuario.id]
        );

        // Si no existe o es de otro vendedor se responde igual (no se revela cual)
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        res.json({ message: 'Producto actualizado correctamente.' });

    } catch (error) {
        console.error('Error al actualizar producto del vendedor:', error);
        res.status(500).json({ message: 'Error al actualizar el producto.' });
    }
};

// Sumar o restar unidades de un producto propio (botones - / +).
// Se hace en la BD (cantidad = cantidad + ?) para que dos pestanas abiertas
// no se pisen, y la condicion evita que quede negativa o pase del maximo.
const ajustarMiProducto = async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id de producto no valido.' });

    const { ajuste } = req.body || {};
    if (!Number.isInteger(ajuste) || ajuste === 0 || Math.abs(ajuste) > 100) {
        return res.status(400).json({ message: 'El ajuste debe ser un numero entero entre -100 y 100.' });
    }

    try {
        const [resultado] = await pool.execute(`
            UPDATE productos
            SET cantidad = cantidad + ?
            WHERE id = ? AND vendedor_id = ?
              AND cantidad + ? BETWEEN 0 AND ?
        `, [ajuste, id, req.usuario.id, ajuste, STOCK_MAXIMO]);

        if (resultado.affectedRows === 0) {
            // Distinguir "no es tuyo / no existe" de "quedaria fuera de rango"
            const [productos] = await pool.execute(
                'SELECT cantidad FROM productos WHERE id = ? AND vendedor_id = ?',
                [id, req.usuario.id]
            );
            if (productos.length === 0) {
                return res.status(404).json({ message: 'Producto no encontrado.' });
            }
            return res.status(400).json({ message: 'La cantidad no puede quedar menor que 0.' });
        }

        const [[producto]] = await pool.execute(
            'SELECT cantidad FROM productos WHERE id = ? AND vendedor_id = ?',
            [id, req.usuario.id]
        );

        res.json({ message: 'Cantidad actualizada.', cantidad: producto.cantidad });

    } catch (error) {
        console.error('Error al ajustar la cantidad:', error);
        res.status(500).json({ message: 'Error al actualizar la cantidad.' });
    }
};

// Eliminar un producto propio
const eliminarMiProducto = async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id de producto no valido.' });

    try {
        const [resultado] = await pool.execute(
            'DELETE FROM productos WHERE id = ? AND vendedor_id = ?',
            [id, req.usuario.id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        res.json({ message: 'Producto eliminado correctamente.' });

    } catch (error) {
        console.error('Error al eliminar producto del vendedor:', error);
        res.status(500).json({ message: 'Error al eliminar el producto.' });
    }
};

module.exports = { misProductos, actualizarMiProducto, ajustarMiProducto, eliminarMiProducto };
