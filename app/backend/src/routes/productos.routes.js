const express = require('express');
const controller = require('../controllers/productos.controller');
const { requireAuth } = require('../middleware/auth');
const { requireCsrf } = require('../middleware/csrf');
const { validateBody, validateCategoryQuery, validateId } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/productos:
 *   get:
 *     tags: [Productos]
 *     summary: Listar productos y filtrar por categoria
 *     parameters:
 *       - in: query
 *         name: categoriaId
 *         required: false
 *         description: ID de una categoria existente
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Productos encontrados (lista vacia si no hay coincidencias)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Producto'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   post:
 *     tags: [Productos]
 *     summary: Crear producto
 *     description: La categoria indicada debe existir; de lo contrario responde 422.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductoEntrada'
 *           example:
 *             nombre: Bolso tejido
 *             descripcion: Hecho a mano
 *             precio: 89000
 *             stock: 8
 *             imagen: https://images.unsplash.com/photo-example
 *             idCategoria: 1
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       422:
 *         description: La categoria no existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateCategoryQuery, controller.listar);
router.post('/', requireAuth, requireCsrf, validateBody('producto'), controller.crear);

/**
 * @swagger
 * /api/productos/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *       example: 1
 *   get:
 *     tags: [Productos]
 *     summary: Obtener producto por ID
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Productos]
 *     summary: Reemplazar producto
 *     description: La categoria indicada debe existir; de lo contrario responde 422.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductoEntrada'
 *           example:
 *             nombre: Bolso tejido
 *             descripcion: Edicion actualizada
 *             precio: 92000
 *             stock: 6
 *             imagen: https://images.unsplash.com/photo-example
 *             idCategoria: 1
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         description: La categoria no existe
 *   delete:
 *     tags: [Productos]
 *     summary: Eliminar producto
 *     responses:
 *       204:
 *         description: Producto eliminado
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validateId, controller.obtener);
router.put('/:id', requireAuth, requireCsrf, validateId, validateBody('producto'), controller.actualizar);
router.delete('/:id', requireAuth, requireCsrf, validateId, controller.eliminar);

module.exports = router;
