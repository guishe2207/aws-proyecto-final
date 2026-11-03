const authService = require('../services/auth.service');
const { AppError } = require('./errors');

async function requireAuth(request, response, next) {
  const header = request.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Inicia sesion como administrador para realizar esta accion.'));
  }

  const sesion = await authService.verificarToken(token);
  if (!sesion) {
    return next(new AppError(401, 'UNAUTHORIZED', 'La sesion no es valida o ya expiro.'));
  }

  request.token = token;
  request.admin = { idUsuario: sesion.idUsuario, usuario: sesion.usuario };
  next();
}

module.exports = { requireAuth };
