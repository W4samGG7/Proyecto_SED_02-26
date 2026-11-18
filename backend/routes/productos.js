const express = require('express');

const router = express.Router();

const {obtenerProductos, crearProducto} = require('../controllers/productosController');
const {requireLogin} = require('../middleware/auth'); 
const {uploadProductImage} = require('../middleware/upload');

router.get('/', obtenerProductos);
router.post('/', requireLogin, uploadProductImage ,crearProducto);

module.exports = router;