const crypto = require('node:crypto');
const { csrfSecret } = require('../config/env');
const { AppError } = require('./errors');

function crearTokenCsrf(token) {
  return crypto.createHmac('sha256', csrfSecret).update(token).digest('base64url');
}

function requireCsrf(request, response, next) {
  const received = request.get('X-CSRF-Token') || '';
  const expected = crearTokenCsrf(request.token);
  const valid = received.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  if (!valid) {
    return next(new AppError(403, 'CSRF_TOKEN_INVALID', 'El encabezado X-CSRF-Token falta o no es valido.'));
  }
  next();
}

module.exports = { crearTokenCsrf, requireCsrf };
