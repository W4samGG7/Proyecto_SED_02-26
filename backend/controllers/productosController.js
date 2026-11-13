const { pool } = require('../config/database');

// Obtener todos los productos activos
const obtenerProductos = async (req, res) => {
    try {
        const [productos] = await pool.execute(`
            SELECT
                id_producto,
                nombre,
                marca,
                tipo,
                condicion,
                talla,
                precio,
                cantidad,
                descripcion,
                imagen_url,
                seccion,
                vendedor_id,
                creado_en
            FROM productos
            WHERE activo = 1
            ORDER BY creado_en DESC
        `);

        res.status(200).json({
            mensaje: 'Productos obtenidos correctamente',
            total: productos.length,
            productos: productos
        });

    } catch (error) {
        console.error('Error al obtener productos:', error);

        res.status(500).json({
            mensaje: 'Error al consultar los productos'
        });
    }
};

module.exports = {
    obtenerProductos
};