const productos = require('../models/productos.model');
const { AppError } = require('../middleware/errors');

async function asegurarCategoria(id) {
  if (!(await productos.existeCategoria(id))) {
    throw new AppError(422, 'CATEGORY_NOT_FOUND', 'La categoria indicada no existe.', [
      { field: 'idCategoria', message: 'Selecciona una categoria existente.' },
    ]);
  }
}

async function listar(categoriaId) {
  return productos.listar(categoriaId);
}

async function obtener(id) {
  const producto = await productos.obtenerPorId(id);
  if (!producto) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No se encontro el producto solicitado.');
  }
  return producto;
}

async function crear(datos) {
  await asegurarCategoria(datos.idCategoria);
  try {
    return await productos.crear(datos);
  } catch (error) {
    if (error.code === '23503') {
      throw new AppError(422, 'CATEGORY_NOT_FOUND', 'La categoria indicada no existe.');
    }
    throw error;
  }
}

async function actualizar(id, datos) {
  await asegurarCategoria(datos.idCategoria);
  try {
    const producto = await productos.actualizar(id, datos);
    if (!producto) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No se encontro el producto solicitado.');
    }
    return producto;
  } catch (error) {
    if (error.code === '23503') {
      throw new AppError(422, 'CATEGORY_NOT_FOUND', 'La categoria indicada no existe.');
    }
    throw error;
  }
}

async function eliminar(id) {
  const deleted = await productos.eliminar(id);
  if (!deleted) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No se encontro el producto solicitado.');
  }
}

module.exports = { actualizar, crear, eliminar, listar, obtener };
