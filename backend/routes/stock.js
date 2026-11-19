const express = require('express');

const router = express.Router();

const {
    misProductos,
    actualizarMiProducto,
    ajustarMiProducto,
    eliminarMiProducto
} = require('../controllers/stockController');

// Pasa antes por requireCliente (ver server.js): requiere sesion y bloquea al admin.

router.get('/productos', misProductos);
router.patch('/productos/:id', actualizarMiProducto);
router.post('/productos/:id/ajuste', ajustarMiProducto);
router.delete('/productos/:id', eliminarMiProducto);

module.exports = router;
