const express = require('express');
const router = express.Router();

const {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito
} = require('../controllers/carritoController');

const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, obtenerCarrito);
router.post('/', requireLogin, agregarAlCarrito);
router.put('/', requireLogin, actualizarCantidadCarrito);
router.delete('/:producto_id', requireLogin, eliminarDelCarrito);
router.delete('/', requireLogin, vaciarCarrito);

module.exports = router;
