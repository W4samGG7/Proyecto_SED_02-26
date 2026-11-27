const { pool } = require('../config/database');

function leerId(valor) {
    if (!/^\d{1,10}$/.test(String(valor))) return null;
    const id = Number(valor);
    return id > 0 ? id : null;
}

const obtenerCarrito = async (req, res) => {
    const usuario_id = req.session?.userId || leerId(req.query.usuario_id);
    if (!usuario_id) {
        return res.status(400).json({ message: 'Usuario no autenticado o ID no válido.' });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT c.id AS carrito_id, c.cantidad, 
                    p.id, p.nombre, p.marca, p.precio, p.cantidad AS stock, 
                    p.talla, p.condicion, p.imagen_url 
             FROM carrito c
             INNER JOIN productos p ON c.producto_id = p.id
             WHERE c.usuario_id = ?`,
            [usuario_id]
        );

        const formattedItems = rows.map(row => ({
            cantidad: row.cantidad,
            producto: {
                id: row.id,
                name: row.nombre,
                brand: row.marca,
                price: Number(row.precio),
                stock: row.stock,
                size: row.talla,
                condition: row.condicion,
                images: row.imagen_url ? [row.imagen_url] : []
            }
        }));

        return res.json(formattedItems);
    } catch (error) {
        console.error('Error al obtener carrito:', error);
        return res.status(500).json({ message: 'Error al consultar el carrito.' });
    }
};

const agregarAlCarrito = async (req, res) => {
    const usuario_id = req.session?.userId || req.body.usuario_id;
    const producto_id = leerId(req.body.producto_id);
    const cantidadAgregada = Number(req.body.cantidad) || 1;
    const [prodRows] = await pool.execute(
    'SELECT cantidad AS stock, activo, vendedor_id FROM productos WHERE id = ?',
    [producto_id]);

    if (prodRows.length === 0 || prodRows[0].activo === 0) {
        return res.status(404).json({ message: 'Producto no encontrado o no disponible.' });
    }

    if (prodRows[0].vendedor_id === Number(usuario_id)) {
        return res.status(403).json({ message: 'No puedes comprar tus propios artículos.' });
    }

    if (!usuario_id || !producto_id) {
        return res.status(400).json({ message: 'Datos incompletos o inválidos.' });
    }

    if (cantidadAgregada < 1) {
        return res.status(400).json({ message: 'La cantidad debe ser al menos 1.' });
    }

    try {
        const [prodRows] = await pool.execute(
            'SELECT cantidad AS stock, activo FROM productos WHERE id = ?', 
            [producto_id]
        );

        if (prodRows.length === 0 || prodRows[0].activo === 0) {
            return res.status(404).json({ message: 'Producto no encontrado o no disponible.' });
        }
        
        const stockDisponible = prodRows[0].stock;

        const [cartRows] = await pool.execute(
            'SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?',
            [usuario_id, producto_id]
        );

        let nuevaCantidad = cantidadAgregada;

        if (cartRows.length > 0) {
            nuevaCantidad = Math.min(cartRows[0].cantidad + cantidadAgregada, stockDisponible);
            await pool.execute(
                'UPDATE carrito SET cantidad = ? WHERE id = ?',
                [nuevaCantidad, cartRows[0].id]
            );
        } else {
            nuevaCantidad = Math.min(nuevaCantidad, stockDisponible);
            await pool.execute(
                'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
                [usuario_id, producto_id, nuevaCantidad]
            );
        }

        return res.json({ message: 'Carrito actualizado correctamente.' });
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        return res.status(500).json({ message: 'Error interno al actualizar el carrito.' });
    }
};

const actualizarCantidadCarrito = async (req, res) => {
    const usuario_id = req.session?.userId || req.body.usuario_id;
    const producto_id = leerId(req.body.producto_id);
    const cantidad = Number(req.body.cantidad);

    if (!usuario_id || !producto_id || Number.isNaN(cantidad)) {
        return res.status(400).json({ message: 'Datos incompletos o no válidos.' });
    }

    try {
        if (cantidad <= 0) {
            await pool.execute(
                'DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?', 
                [usuario_id, producto_id]
            );
        } else {
            const [prodRows] = await pool.execute(
                'SELECT cantidad AS stock FROM productos WHERE id = ?', 
                [producto_id]
            );
            
            if (prodRows.length === 0) {
                return res.status(404).json({ message: 'Producto no encontrado.' });
            }

            const stockDisponible = prodRows[0].stock;
            const cantidadAjustada = Math.min(cantidad, stockDisponible);

            await pool.execute(
                'UPDATE carrito SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?',
                [cantidadAjustada, usuario_id, producto_id]
            );
        }

        return res.json({ message: 'Cantidad actualizada correctamente.' });
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        return res.status(500).json({ message: 'Error al actualizar la cantidad.' });
    }
};

const eliminarDelCarrito = async (req, res) => {
    const usuario_id = req.session?.userId || req.query.usuario_id;
    const producto_id = leerId(req.params.producto_id);

    if (!usuario_id || !producto_id) {
        return res.status(400).json({ message: 'Identificadores no válidos.' });
    }

    try {
        await pool.execute(
            'DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?', 
            [usuario_id, producto_id]
        );
        
        return res.json({ message: 'Producto eliminado del carrito.' });
    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        return res.status(500).json({ message: 'Error al eliminar el producto.' });
    }
};

const vaciarCarrito = async (req, res) => {
    const usuario_id = req.session?.userId || req.query.usuario_id;

    if (!usuario_id) {
        return res.status(400).json({ message: 'Usuario no válido.' });
    }

    try {
        await pool.execute('DELETE FROM carrito WHERE usuario_id = ?', [usuario_id]);
        return res.json({ message: 'Carrito vaciado correctamente.' });
    } catch (error) {
        console.error('Error al vaciar carrito:', error);
        return res.status(500).json({ message: 'Error al vaciar el carrito.' });
    }
};

module.exports = {
    obtenerCarrito,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarDelCarrito,
    vaciarCarrito
};