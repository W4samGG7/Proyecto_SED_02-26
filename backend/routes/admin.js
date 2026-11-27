const express = require('express');

const router = express.Router();

const {
    listarUsuarios,
    productosDeUsuario,
    actualizarUsuario,
    eliminarUsuario,
    actualizarProducto,
    eliminarProducto
} = require('../controllers/adminController');
const { uploadProductImage } = require('../middleware/upload');
const { cambiarImagenProducto } = require('../controllers/imagenProducto');

// Todas estas rutas pasan antes por requireAdmin (ver server.js)

router.get('/usuarios', listarUsuarios);
router.get('/usuarios/:id/productos', productosDeUsuario);
router.patch('/usuarios/:id', actualizarUsuario);
router.delete('/usuarios/:id', eliminarUsuario);

router.patch('/productos/:id', actualizarProducto);
// Cambiar la foto subiendo un archivo (cualquier producto)
router.post('/productos/:id/imagen', uploadProductImage, cambiarImagenProducto({ soloPropios: false }));
router.delete('/productos/:id', eliminarProducto);

module.exports = router;
