const pool = require('../config/database');

async function buscarPorUsuario(usuario) {
  const result = await pool.query(
    'SELECT id_usuario AS "idUsuario", usuario, password_hash AS "passwordHash" FROM usuarios_admin WHERE usuario = $1',
    [usuario],
  );
  return result.rows[0] || null;
}

async function crear(usuario, passwordHash) {
  const result = await pool.query(
    `INSERT INTO usuarios_admin (usuario, password_hash)
     VALUES ($1, $2)
     RETURNING id_usuario AS "idUsuario", usuario`,
    [usuario, passwordHash],
  );
  return result.rows[0];
}

module.exports = { buscarPorUsuario, crear };
