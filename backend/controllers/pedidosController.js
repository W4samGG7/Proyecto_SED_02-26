const { pool } = require('../config/database');

const ESTADO_INICIAL = 'pagado';

function leerId(valor) {
    if (!/^\d{1,10}$/.test(String(valor))) return null;
    const id = Number(valor);
    return id > 0 ? id : null;
}

const crearPedido = async (req, res) => {
    const usuario_id = req.session.userId;
    const direccion = typeof req.body?.direccion_envio === 'string'
        ? req.body.direccion_envio.trim()
        : '';

    if (direccion.length < 5 || direccion.length > 255) {
        return res.status(400).json({
            message: 'Ingresa una direccion de envio valida (entre 5 y 255 caracteres).'
        });
    }

    let conexion;

    try {
        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        const [items] = await conexion.execute(
            `SELECT c.cantidad AS cantidad_pedida,
                    p.id AS producto_id, p.nombre, p.marca, p.talla, p.precio,
                    p.cantidad AS stock, p.activo, p.vendedor_id
             FROM carrito c
             INNER JOIN productos p ON p.id = c.producto_id
             WHERE c.usuario_id = ?
             ORDER BY p.id
             FOR UPDATE`,
            [usuario_id]
        );

        if (items.length === 0) {
            await conexion.rollback();
            return res.status(400).json({ message: 'Tu carrito esta vacio.' });
        }

        const problemas = items.filter(
            (i) => !i.activo || i.stock < i.cantidad_pedida
        );

        if (problemas.length > 0) {
            await conexion.rollback();
            return res.status(409).json({
                message: `Estos articulos ya no estan disponibles en la cantidad pedida: ${problemas.map((i) => i.nombre).join(', ')}.`,
                articulos: problemas.map((i) => ({
                    producto_id: i.producto_id,
                    nombre: i.nombre,
                    disponible: i.activo ? i.stock : 0
                }))
            });
        }

        const centavos = items.reduce(
            (suma, i) => suma + Math.round(Number(i.precio) * 100) * i.cantidad_pedida,
            0
        );
        const total = (centavos / 100).toFixed(2);

        // 4. Pedido
        const [pedido] = await conexion.execute(
            `INSERT INTO pedidos (comprador_id, estado, total, direccion_envio)
             VALUES (?, ?, ?, ?)`,
            [usuario_id, ESTADO_INICIAL, total, direccion]
        );
        const pedidoId = pedido.insertId;

        for (const i of items) {
            await conexion.execute(
                `INSERT INTO detalle_pedidos
                    (pedido_id, producto_id, vendedor_id, nombre_producto,
                     marca, talla, cantidad, precio_unitario)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    pedidoId, i.producto_id, i.vendedor_id, i.nombre,
                    i.marca, i.talla, i.cantidad_pedida, i.precio
                ]
            );

            const [descuento] = await conexion.execute(
                `UPDATE productos SET cantidad = cantidad - ?
                 WHERE id = ? AND cantidad >= ?`,
                [i.cantidad_pedida, i.producto_id, i.cantidad_pedida]
            );

            if (descuento.affectedRows !== 1) {
                throw new Error(`Stock inconsistente en el producto ${i.producto_id}`);
            }
        }

        await conexion.execute('DELETE FROM carrito WHERE usuario_id = ?', [usuario_id]);

        await conexion.commit();
        return res.status(201).json({ pedido_id: pedidoId });

    } catch (error) {
        if (conexion) await conexion.rollback();
        console.error('Error al crear el pedido:', error);
        return res.status(500).json({ message: 'No se pudo completar la compra.' });
    } finally {
        if (conexion) conexion.release();
    }
};

const obtenerPedido = async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id de pedido no valido.' });

    try {
        const [pedidos] = await pool.execute(
            `SELECT pe.id, pe.estado, pe.total, pe.direccion_envio, pe.creado_en,
                    u.nombre, u.apellido, u.correo
             FROM pedidos pe
             LEFT JOIN usuarios u ON u.id = pe.comprador_id
             WHERE pe.id = ? AND pe.comprador_id = ?`,
            [id, req.session.userId]
        );

        if (pedidos.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        const [items] = await pool.execute(
            `SELECT producto_id, nombre_producto AS nombre, marca, talla,
                    precio_unitario, cantidad
             FROM detalle_pedidos
             WHERE pedido_id = ?
             ORDER BY id`,
            [id]
        );

        const p = pedidos[0];

        return res.json({
            id: p.id,
            fecha: p.creado_en,
            estado: p.estado,
            direccion_envio: p.direccion_envio,
            cliente_nombre: [p.nombre, p.apellido].filter(Boolean).join(' '),
            cliente_correo: p.correo,
            subtotal: Number(p.total),
            envio: 0,
            impuesto: 0,
            total: Number(p.total),
            items: items.map((i) => ({ ...i, precio_unitario: Number(i.precio_unitario) }))
        });

    } catch (error) {
        console.error('Error al obtener el pedido:', error);
        return res.status(500).json({ message: 'No se pudo cargar la factura.' });
    }
};

module.exports = { crearPedido, obtenerPedido };