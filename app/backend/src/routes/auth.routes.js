const express = require('express');
const controller = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { requireCsrf } = require('../middleware/csrf');
const { validateLogin } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Iniciar sesion como administrador
 *     description: Devuelve un token que se envia en el encabezado Authorization como Bearer.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario, password]
 *             properties:
 *               usuario: { type: string, example: admin }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Sesion iniciada
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Usuario o contrasena incorrectos
 */
router.post('/login', validateLogin, controller.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Cerrar sesion
 *     responses:
 *       204:
 *         description: Sesion cerrada
 *       401:
 *         description: Sesion no valida
 */
router.post('/logout', requireAuth, requireCsrf, controller.logout);

/**
 * @swagger
 * /api/auth/sesion:
 *   get:
 *     tags: [Autenticacion]
 *     summary: Comprobar la sesion actual
 *     responses:
 *       200:
 *         description: Sesion valida
 *       401:
 *         description: Sesion no valida
 */
router.get('/sesion', requireAuth, controller.sesion);

module.exports = router;
