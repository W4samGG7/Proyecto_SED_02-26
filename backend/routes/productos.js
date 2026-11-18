const express = require('express');

const router = express.Router();

const {obtenerProductos, obtenerProductoPorId ,crearProducto} = require('../controllers/productosController');
const {requireLogin, requireCliente} = require('../middleware/auth');
const {uploadProductImage} = require('../middleware/upload');

router.get('/', obtenerProductos);
router.get('/:id', obtenerProductoPorId)
router.post('/', requireCliente, uploadProductImage ,crearProducto);
// Para publicar, comprar o usar el carrito usar requireCliente (bloquea al admin):
//router.post('/', requireCliente, crearProducto);

module.exports = router;