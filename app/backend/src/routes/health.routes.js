const express = require('express');
const controller = require('../controllers/health.controller');

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Salud]
 *     summary: Comprobar API y conexion de PostgreSQL
 *     responses:
 *       200:
 *         description: API y base de datos disponibles
 *       500:
 *         description: No fue posible conectar con la base de datos
 */
router.get('/', controller.health);

module.exports = router;
