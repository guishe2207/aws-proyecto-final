const service = require('../services/productos.service');

async function listar(request, response) {
  response.json({ data: await service.listar(request.categoryId) });
}

async function obtener(request, response) {
  response.json({ data: await service.obtener(request.resourceId) });
}

async function crear(request, response) {
  response.status(201).json({ data: await service.crear(request.validatedBody) });
}

async function actualizar(request, response) {
  response.json({ data: await service.actualizar(request.resourceId, request.validatedBody) });
}

async function eliminar(request, response) {
  await service.eliminar(request.resourceId);
  response.status(204).end();
}

module.exports = { actualizar, crear, eliminar, listar, obtener };
