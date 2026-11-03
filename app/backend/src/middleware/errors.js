class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function notFound(request, response, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `No existe la ruta ${request.method} ${request.path}.`));
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    error = new AppError(400, 'INVALID_JSON', 'El cuerpo de la solicitud no contiene JSON valido.');
  }

  if (error.code === '23514') {
    error = new AppError(400, 'VALIDATION_ERROR', 'Los datos no cumplen las reglas de la base de datos.');
  }

  const status = error.status || 500;
  // Los errores internos (p. ej. codigos SQLSTATE de PostgreSQL) no deben llegar al cliente.
  const payload = {
    error: {
      code: status === 500 ? 'INTERNAL_SERVER_ERROR' : error.code || 'INTERNAL_SERVER_ERROR',
      message: status === 500 ? 'Ocurrio un error interno en el servidor.' : error.message,
    },
  };

  if (error.details) {
    payload.error.details = error.details;
  }

  if (status === 500) {
    console.error(error);
  }

  response.status(status).json(payload);
}

module.exports = { AppError, errorHandler, notFound };
