const categorias = require('../models/categorias.model');
const { AppError } = require('../middleware/errors');

async function listar() {
  return categorias.listar();
}

async function obtener(id) {
  const categoria = await categorias.obtenerPorId(id);
  if (!categoria) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'No se encontro la categoria solicitada.');
  }
  return categoria;
}

async function crear(datos) {
  return categorias.crear(datos);
}

async function actualizar(id, datos) {
  const categoria = await categorias.actualizar(id, datos);
  if (!categoria) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'No se encontro la categoria solicitada.');
  }
  return categoria;
}

async function eliminar(id) {
  if (await categorias.tieneProductos(id)) {
    throw new AppError(409, 'CATEGORY_IN_USE', 'No se puede eliminar una categoria que tiene productos.');
  }
  try {
    const deleted = await categorias.eliminar(id);
    if (!deleted) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'No se encontro la categoria solicitada.');
    }
  } catch (error) {
    if (error.code === '23503') {
      throw new AppError(409, 'CATEGORY_IN_USE', 'No se puede eliminar una categoria que tiene productos.');
    }
    throw error;
  }
}

module.exports = { actualizar, crear, eliminar, listar, obtener };
