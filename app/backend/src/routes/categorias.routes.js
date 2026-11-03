const express = require('express');
const controller = require('../controllers/categorias.controller');
const { requireAuth } = require('../middleware/auth');
const { requireCsrf } = require('../middleware/csrf');
const { validateBody, validateId } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     tags: [Categorias]
 *     summary: Listar categorias
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Categoria'
 *   post:
 *     tags: [Categorias]
 *     summary: Crear una categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoriaEntrada'
 *           example:
 *             nombre: Accesorios
 *             descripcion: Complementos para uso diario
 *     responses:
 *       201:
 *         description: Categoria creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Categoria'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/', controller.listar);
router.post('/', requireAuth, requireCsrf, validateBody('categoria'), controller.crear);

/**
 * @swagger
 * /api/categorias/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *       example: 1
 *   get:
 *     tags: [Categorias]
 *     summary: Obtener categoria por ID
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Categoria'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Categorias]
 *     summary: Reemplazar una categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoriaEntrada'
 *           example:
 *             nombre: Accesorios
 *             descripcion: Complementos de temporada
 *     responses:
 *       200:
 *         description: Categoria actualizada
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Categorias]
 *     summary: Eliminar categoria sin productos
 *     description: Devuelve 409 y conserva la categoria cuando tiene productos asociados.
 *     responses:
 *       204:
 *         description: Categoria eliminada
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: La categoria tiene productos asociados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validateId, controller.obtener);
router.put('/:id', requireAuth, requireCsrf, validateId, validateBody('categoria'), controller.actualizar);
router.delete('/:id', requireAuth, requireCsrf, validateId, controller.eliminar);

module.exports = router;
