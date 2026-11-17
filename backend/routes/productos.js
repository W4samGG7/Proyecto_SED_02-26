const express = require('express');

const router = express.Router();

const {
    obtenerProductos
} = require('../controllers/productosController');

const {requireLogin} = require('../middleware/auth'); 

router.get('/', obtenerProductos);
//router.post('/', requireLogin, crearProducto); cuando necesitemos una protegida

module.exports = router;