const { AppError } = require('./errors');

// Limites de las columnas en schema.sql: INTEGER y NUMERIC(12, 2).
const MAX_INTEGER = 2147483647;
const MAX_PRECIO = 9999999999.99;

function validateId(request, response, next) {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1 || id > MAX_INTEGER) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'El ID debe ser un entero positivo.', [
      { field: 'id', message: 'Usa un entero mayor que cero.' },
    ]));
  }
  request.resourceId = id;
  next();
}

function validateCategoryQuery(request, response, next) {
  const rawId = request.query.categoriaId;
  if (rawId === undefined) {
    return next();
  }
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1 || id > MAX_INTEGER) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'El filtro categoriaId debe ser un entero positivo.', [
      { field: 'categoriaId', message: 'Usa un entero mayor que cero.' },
    ]));
  }
  request.categoryId = id;
  next();
}

function validateBody(kind) {
  return (request, response, next) => {
    const body = request.body;
    const errors = [];
    const allowed = kind === 'categoria'
      ? ['nombre', 'descripcion']
      : ['nombre', 'descripcion', 'precio', 'stock', 'imagen', 'idCategoria'];

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON.', [
        { field: 'body', message: 'Envía un objeto JSON.' },
      ]));
    }

    for (const field of Object.keys(body)) {
      if (!allowed.includes(field)) {
        errors.push({ field, message: 'Este campo no esta permitido.' });
      }
    }

    if (typeof body.nombre !== 'string' || body.nombre.trim().length === 0) {
      errors.push({ field: 'nombre', message: 'Es obligatorio y debe contener texto.' });
    } else if (body.nombre.trim().length > 120) {
      errors.push({ field: 'nombre', message: 'No puede superar 120 caracteres.' });
    }

    for (const field of ['descripcion', 'imagen']) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
        errors.push({ field, message: 'Debe ser texto o null.' });
      }
    }

    if (kind === 'producto') {
      if (typeof body.precio !== 'number' || !Number.isFinite(body.precio) || body.precio <= 0 || body.precio > MAX_PRECIO) {
        errors.push({ field: 'precio', message: 'Debe ser un numero mayor que cero y no superior a 9999999999.99.' });
      }
      if (!Number.isSafeInteger(body.stock) || body.stock < 0 || body.stock > MAX_INTEGER) {
        errors.push({ field: 'stock', message: 'Debe ser un entero entre 0 y 2147483647.' });
      }
      if (!Number.isSafeInteger(body.idCategoria) || body.idCategoria < 1 || body.idCategoria > MAX_INTEGER) {
        errors.push({ field: 'idCategoria', message: 'Debe ser el ID de una categoria existente.' });
      }
    }

    if (errors.length) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'La solicitud contiene datos invalidos.', errors));
    }

    request.validatedBody = {
      ...body,
      nombre: body.nombre.trim(),
      descripcion: body.descripcion?.trim() || null,
      ...(kind === 'producto' ? { imagen: body.imagen?.trim() || null } : {}),
    };
    next();
  };
}

function validateLogin(request, response, next) {
  const body = request.body;
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON.', [
      { field: 'body', message: 'Envía un objeto JSON.' },
    ]));
  }
  if (typeof body.usuario !== 'string' || body.usuario.trim().length === 0) {
    errors.push({ field: 'usuario', message: 'Es obligatorio.' });
  }
  if (typeof body.password !== 'string' || body.password.length === 0) {
    errors.push({ field: 'password', message: 'Es obligatoria.' });
  }
  if (errors.length) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'La solicitud contiene datos invalidos.', errors));
  }

  request.validatedBody = { usuario: body.usuario.trim(), password: body.password };
  next();
}

function validateOrder(request, response, next) {
  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return next(new AppError(400, 'VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON.'));
  const allowed = ['nombre', 'correo', 'telefono', 'direccion', 'ciudad', 'departamento', 'observaciones', 'items', 'claveIdempotencia'];
  const errors = Object.keys(body).filter((key) => !allowed.includes(key)).map((field) => ({ field, message: 'Este campo no está permitido.' }));
  for (const field of ['nombre', 'correo', 'telefono', 'direccion', 'ciudad', 'departamento']) if (typeof body[field] !== 'string' || !body[field].trim()) errors.push({ field, message: 'Es obligatorio.' });
  if (!/^\S+@\S+\.\S+$/.test(body.correo ?? '')) errors.push({ field: 'correo', message: 'Debe ser un correo válido.' });
  if (!Array.isArray(body.items) || !body.items.length) errors.push({ field: 'items', message: 'El carrito no puede estar vacío.' });
  else body.items.forEach((item, index) => { if (!item || !Number.isSafeInteger(item.idProducto) || item.idProducto < 1 || !Number.isSafeInteger(item.cantidad) || item.cantidad < 1) errors.push({ field: `items[${index}]`, message: 'Producto o cantidad inválidos.' }); });
  if (typeof body.claveIdempotencia !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(body.claveIdempotencia)) errors.push({ field: 'claveIdempotencia', message: 'Clave de compra inválida.' });
  if (errors.length) return next(new AppError(400, 'VALIDATION_ERROR', 'La solicitud contiene datos inválidos.', errors));
  request.validatedBody = { ...body, nombre: body.nombre.trim(), correo: body.correo.trim(), telefono: body.telefono.trim(), direccion: body.direccion.trim(), ciudad: body.ciudad.trim(), departamento: body.departamento.trim(), observaciones: typeof body.observaciones === 'string' ? body.observaciones.trim() || null : null };
  next();
}

module.exports = { validateBody, validateCategoryQuery, validateId, validateLogin, validateOrder };
