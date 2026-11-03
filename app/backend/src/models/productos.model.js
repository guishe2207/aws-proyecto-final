const pool = require('../config/database');

const columnas = `id_producto AS "idProducto", nombre, descripcion, precio,
  stock, imagen, id_categoria AS "idCategoria"`;

function toApiProduct(product) {
  return product ? { ...product, precio: Number(product.precio) } : null;
}

async function listar(categoriaId) {
  const result = categoriaId
    ? await pool.query(`SELECT ${columnas} FROM productos WHERE id_categoria = $1 ORDER BY id_producto`, [categoriaId])
    : await pool.query(`SELECT ${columnas} FROM productos ORDER BY id_producto`);
  return result.rows.map(toApiProduct);
}

async function obtenerPorId(id) {
  const result = await pool.query(`SELECT ${columnas} FROM productos WHERE id_producto = $1`, [id]);
  return toApiProduct(result.rows[0]);
}

async function crear(producto) {
  const result = await pool.query(
    `INSERT INTO productos (nombre, descripcion, precio, stock, imagen, id_categoria)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${columnas}`,
    [producto.nombre, producto.descripcion, producto.precio, producto.stock, producto.imagen, producto.idCategoria],
  );
  return toApiProduct(result.rows[0]);
}

async function actualizar(id, producto) {
  const result = await pool.query(
    `UPDATE productos
     SET nombre = $1, descripcion = $2, precio = $3, stock = $4, imagen = $5, id_categoria = $6
     WHERE id_producto = $7
     RETURNING ${columnas}`,
    [producto.nombre, producto.descripcion, producto.precio, producto.stock, producto.imagen, producto.idCategoria, id],
  );
  return toApiProduct(result.rows[0]);
}

async function eliminar(id) {
  const result = await pool.query('DELETE FROM productos WHERE id_producto = $1 RETURNING id_producto', [id]);
  return result.rowCount > 0;
}

async function existeCategoria(id) {
  const result = await pool.query('SELECT 1 FROM categorias WHERE id_categoria = $1', [id]);
  return result.rowCount > 0;
}

module.exports = { actualizar, crear, eliminar, existeCategoria, listar, obtenerPorId };
