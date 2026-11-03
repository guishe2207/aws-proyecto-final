const pool = require('../config/database');

async function listar() {
  const result = await pool.query(
    'SELECT id_categoria AS "idCategoria", nombre, descripcion FROM categorias ORDER BY id_categoria',
  );
  return result.rows;
}

async function obtenerPorId(id) {
  const result = await pool.query(
    'SELECT id_categoria AS "idCategoria", nombre, descripcion FROM categorias WHERE id_categoria = $1',
    [id],
  );
  return result.rows[0] || null;
}

async function crear(categoria) {
  const result = await pool.query(
    `INSERT INTO categorias (nombre, descripcion)
     VALUES ($1, $2)
     RETURNING id_categoria AS "idCategoria", nombre, descripcion`,
    [categoria.nombre, categoria.descripcion],
  );
  return result.rows[0];
}

async function actualizar(id, categoria) {
  const result = await pool.query(
    `UPDATE categorias SET nombre = $1, descripcion = $2
     WHERE id_categoria = $3
     RETURNING id_categoria AS "idCategoria", nombre, descripcion`,
    [categoria.nombre, categoria.descripcion, id],
  );
  return result.rows[0] || null;
}

async function eliminar(id) {
  const result = await pool.query('DELETE FROM categorias WHERE id_categoria = $1 RETURNING id_categoria', [id]);
  return result.rowCount > 0;
}

async function tieneProductos(id) {
  const result = await pool.query('SELECT 1 FROM productos WHERE id_categoria = $1 LIMIT 1', [id]);
  return result.rowCount > 0;
}

module.exports = { actualizar, crear, eliminar, listar, obtenerPorId, tieneProductos };
