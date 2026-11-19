const express = require('express');
const router = express.Router();

const { crearPedido, obtenerPedido } = require('../controllers/pedidosController');
const { requireCliente } = require('../middleware/auth');

router.post('/', requireCliente, crearPedido);
router.get('/:id', requireCliente, obtenerPedido);

module.exports = router;