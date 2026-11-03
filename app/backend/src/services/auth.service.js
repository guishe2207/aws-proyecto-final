const crypto = require('node:crypto');
const usuarios = require('../models/usuarios.model');
const sesiones = require('../models/sesiones.model');
const { verifyPassword } = require('../security/password');
const { AppError } = require('../middleware/errors');
const { crearTokenCsrf } = require('../middleware/csrf');

const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function login(usuario, password) {
  const registro = await usuarios.buscarPorUsuario(usuario);
  // Mismo mensaje si el usuario no existe o la contrasena es incorrecta, para no revelar cuentas.
  if (!registro || !verifyPassword(password, registro.passwordHash)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Usuario o contrasena incorrectos.');
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS);
  await sesiones.eliminarExpiradas();
  await sesiones.crear(hashToken(token), registro.idUsuario, expiraEn);

  return { token, csrfToken: crearTokenCsrf(token), usuario: registro.usuario, expiraEn: expiraEn.toISOString() };
}

async function logout(token) {
  await sesiones.eliminar(hashToken(token));
}

async function verificarToken(token) {
  return sesiones.buscarActiva(hashToken(token));
}

module.exports = { login, logout, verificarToken };
