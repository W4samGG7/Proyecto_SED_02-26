// Manejo de las fotos de productos que se suben al servidor.
// Lo usan "Publicar articulo" y "Cambiar foto" (admin y vendedor).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { leerId } = require('./validacionProducto');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Solo las fotos que genera el servidor: /uploads/<uuid>.png|jpg
const REGEX_IMAGEN_SUBIDA = /^\/uploads\/[0-9a-f-]{36}\.(png|jpg)$/;

// Revisa los primeros bytes del archivo (no confia en el nombre ni en el tipo que manda el navegador)
function detectImageType(buffer) {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(png)) return 'png';
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
    return null;
}

// Guarda la foto con un nombre aleatorio y devuelve la ruta publica y la del disco
async function guardarImagen(buffer, tipo) {
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    const nombre = `${crypto.randomUUID()}.${tipo}`;
    const ruta = path.join(UPLOADS_DIR, nombre);
    await fs.promises.writeFile(ruta, buffer, { flag: 'wx' });
    return { url: `/uploads/${nombre}`, ruta };
}

// Borra una foto subida (solo si la ruta tiene el formato exacto de las que genera el servidor)
async function borrarImagenSubida(url) {
    if (typeof url !== 'string' || !REGEX_IMAGEN_SUBIDA.test(url)) return;
    const ruta = path.join(UPLOADS_DIR, path.basename(url));
    await fs.promises.unlink(ruta).catch(() => {});
}

// Crea la ruta para cambiar la foto de un producto.
// soloPropios = true: el vendedor solo puede cambiar fotos de sus productos.
// soloPropios = false: el admin puede cambiar la de cualquier producto.
function cambiarImagenProducto({ soloPropios }) {
    return async (req, res) => {
        const id = leerId(req.params.id);
        if (!id) return res.status(400).json({ message: 'Id de producto no valido.' });

        if (!req.file) {
            return res.status(400).json({ message: 'Selecciona una foto.' });
        }

        const tipo = detectImageType(req.file.buffer);
        if (!tipo) {
            return res.status(400).json({ message: 'La foto debe ser PNG o JPG.' });
        }

        const filtro = soloPropios ? ' AND vendedor_id = ?' : '';
        const parametros = soloPropios ? [id, req.usuario.id] : [id];
        let nueva = null;

        try {
            const [productos] = await pool.execute(
                `SELECT imagen_url FROM productos WHERE id = ?${filtro}`,
                parametros
            );

            // No existe o es de otro vendedor: misma respuesta (no se revela cual)
            if (productos.length === 0) {
                return res.status(404).json({ message: 'Producto no encontrado.' });
            }

            nueva = await guardarImagen(req.file.buffer, tipo);

            await pool.execute(
                `UPDATE productos SET imagen_url = ? WHERE id = ?${filtro}`,
                [nueva.url, ...parametros]
            );

            // La foto anterior ya no se usa
            await borrarImagenSubida(productos[0].imagen_url);

            res.json({ message: 'Foto actualizada correctamente.', imagen_url: nueva.url });

        } catch (error) {
            if (nueva) await fs.promises.unlink(nueva.ruta).catch(() => {});
            console.error('Error al cambiar la foto del producto:', error);
            res.status(500).json({ message: 'Error al cambiar la foto.' });
        }
    };
}

module.exports = { detectImageType, guardarImagen, borrarImagenSubida, cambiarImagenProducto };
