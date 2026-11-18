const express = require('express');

const router = express.Router();

const {
    obtenerProductos
} = require('../controllers/productosController');

const {requireLogin, requireCliente} = require('../middleware/auth');

router.get('/', obtenerProductos);
//router.post('/', requireLogin, crearProducto); cuando necesitemos una protegida
// Para publicar, comprar o usar el carrito usar requireCliente (bloquea al admin):
//router.post('/', requireCliente, crearProducto);

module.exports = router;