const express = require('express');

const router = express.Router();

const {
    misProductos,
    actualizarMiProducto,
    ajustarMiProducto,
    eliminarMiProducto
} = require('../controllers/stockController');
const { uploadProductImage } = require('../middleware/upload');
const { cambiarImagenProducto } = require('../controllers/imagenProducto');

// Pasa antes por requireCliente (ver server.js): requiere sesion y bloquea al admin.

router.get('/productos', misProductos);
router.patch('/productos/:id', actualizarMiProducto);
router.post('/productos/:id/ajuste', ajustarMiProducto);
// Cambiar la foto subiendo un archivo (solo productos propios)
router.post('/productos/:id/imagen', uploadProductImage, cambiarImagenProducto({ soloPropios: true }));
router.delete('/productos/:id', eliminarMiProducto);

module.exports = router;
