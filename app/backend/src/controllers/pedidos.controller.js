const service = require('../services/pedidos.service');
async function crear(request, response) { const pedido = await service.crear(request.validatedBody); response.status(pedido.duplicado ? 200 : 201).json({ data: pedido }); }
async function listar(request, response) { response.json({ data: await service.listar() }); }
async function obtener(request, response) { response.json({ data: await service.obtener(request.resourceId) }); }
module.exports = { crear, listar, obtener };
