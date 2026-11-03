const express = require('express');
const controller = require('../controllers/pedidos.controller');
const { requireAuth } = require('../middleware/auth');
const { validateId, validateOrder } = require('../middleware/validation');
const router = express.Router();
/** @swagger
 * /api/pedidos:
 *   post:
 *     tags: [Pedidos]
 *     summary: Crea un pedido simulado y descuenta inventario atómicamente
 *     responses:
 *       201: { description: Pedido confirmado }
 *       409: { description: Inventario insuficiente }
 */
router.post('/', validateOrder, controller.crear);
router.get('/', requireAuth, controller.listar);
router.get('/:id', requireAuth, validateId, controller.obtener);
module.exports = router;
