const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');
const app = require('../src/app');
const { errorHandler } = require('../src/middleware/errors');
const { requireAuth } = require('../src/middleware/auth');
const { crearTokenCsrf, requireCsrf } = require('../src/middleware/csrf');
const { validateBody, validateId, validateLogin } = require('../src/middleware/validation');
const { hashPassword, verifyPassword } = require('../src/security/password');

// Ejecuta un middleware sin Express y devuelve el error que recibe next(), o undefined si todo esta bien.
function ejecutar(middleware, request) {
  return new Promise((resolve) => middleware(request, {}, (error) => resolve(error)));
}

test('Swagger publica la interfaz y la especificacion OpenAPI', async () => {
  const page = await request(app).get('/api-docs/');
  assert.equal(page.status, 200);
  assert.match(page.text, /swagger-ui/);

  const spec = await request(app).get('/api-docs/openapi.json');
  assert.equal(spec.status, 200);
  assert.ok(spec.body.paths['/api/productos']);
  assert.ok(spec.body.paths['/api/auth/login']);
  assert.ok(spec.body.components.securitySchemes.bearerAuth);
});

test('rechaza IDs invalidos con el formato de error comun', async () => {
  const response = await request(app).get('/api/categorias/abc');
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.ok(Array.isArray(response.body.error.details));
});

test('rechaza escrituras sin sesion de administrador antes de validar o consultar PostgreSQL', async () => {
  const crear = await request(app).post('/api/productos').send({ nombre: ' ', precio: -3 });
  assert.equal(crear.status, 401);
  assert.equal(crear.body.error.code, 'UNAUTHORIZED');

  const eliminar = await request(app).delete('/api/categorias/1');
  assert.equal(eliminar.status, 401);

  const actualizar = await request(app).put('/api/productos/1').send({});
  assert.equal(actualizar.status, 401);
});

test('rechaza un token con formato incorrecto', async () => {
  const response = await request(app)
    .delete('/api/productos/1')
    .set('Authorization', 'Basic abc123');
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'UNAUTHORIZED');
});

test('valida el cuerpo de producto: campos invalidos y ausentes', async () => {
  const error = await ejecutar(validateBody('producto'), {
    body: { nombre: ' ', precio: -3, stock: 1.5, idCategoria: 0, secreto: 'ignorado' },
  });
  assert.equal(error.status, 400);
  assert.ok(error.details.length >= 4);
});

test('rechaza numeros que superan los limites de PostgreSQL', async () => {
  const error = await ejecutar(validateBody('producto'), {
    body: { nombre: 'Bolso', precio: 10000000000, stock: 2147483648, idCategoria: 2147483648 },
  });
  assert.equal(error.status, 400);
  const campos = error.details.map((detail) => detail.field).sort();
  assert.deepEqual(campos, ['idCategoria', 'precio', 'stock']);

  const idError = await ejecutar(validateId, { params: { id: '99999999999' } });
  assert.equal(idError.status, 400);
});

test('acepta un cuerpo de producto valido', async () => {
  const error = await ejecutar(validateBody('producto'), {
    body: { nombre: ' Bolso ', precio: 89000, stock: 8, idCategoria: 1, imagen: '' },
  });
  assert.equal(error, undefined);
});

test('valida el cuerpo del login sin consultar PostgreSQL', async () => {
  const response = await request(app).post('/api/auth/login').send({ usuario: '', password: '' });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.equal(response.body.error.details.length, 2);

  const error = await ejecutar(validateLogin, { body: ['no', 'es', 'objeto'] });
  assert.equal(error.status, 400);
});

test('requireAuth rechaza una peticion sin token', async () => {
  const error = await ejecutar(requireAuth, { get: () => undefined });
  assert.equal(error.status, 401);
});

test('CSRF exige el encabezado correcto para escrituras autenticadas', async () => {
  const token = 'token-de-prueba';
  const missing = await ejecutar(requireCsrf, { token, get: () => '' });
  assert.equal(missing.status, 403);
  assert.equal(missing.code, 'CSRF_TOKEN_INVALID');
  const valid = await ejecutar(requireCsrf, { token, get: () => crearTokenCsrf(token) });
  assert.equal(valid, undefined);
});

test('Helmet agrega cabeceras de proteccion sin bloquear Swagger', async () => {
  const response = await request(app).get('/api-docs/');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.ok(response.headers['strict-transport-security']);
});

test('guarda contrasenas con hash que solo verifica la clave correcta', () => {
  const stored = hashPassword('clave-de-prueba-larga');
  assert.doesNotMatch(stored, /clave-de-prueba-larga/);
  assert.equal(verifyPassword('clave-de-prueba-larga', stored), true);
  assert.equal(verifyPassword('otra-clave', stored), false);
  assert.equal(verifyPassword('clave', 'texto-sin-formato'), false);
});

test('rechaza el filtro de categoria cuando no es un entero positivo', async () => {
  const response = await request(app).get('/api/productos?categoriaId=no-es-numero');
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('permite CORS al origen de desarrollo y rechaza otros origenes', async () => {
  const allowed = await request(app).get('/api-docs/').set('Origin', 'http://localhost:4200');
  assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:4200');

  const rejected = await request(app).get('/api-docs/').set('Origin', 'http://localhost:4300');
  assert.equal(rejected.status, 403);
  assert.equal(rejected.body.error.code, 'ORIGIN_NOT_ALLOWED');
});

test('permite las peticiones de Swagger UI desde el propio API y el encabezado Authorization', async () => {
  const response = await request(app)
    .post('/api/categorias')
    .set('Origin', 'http://localhost:3000')
    .send({});
  assert.notEqual(response.body.error?.code, 'ORIGIN_NOT_ALLOWED');
  assert.equal(response.status, 401);

  const preflight = await request(app)
    .options('/api/productos')
    .set('Origin', 'http://localhost:4200')
    .set('Access-Control-Request-Method', 'DELETE')
    .set('Access-Control-Request-Headers', 'Authorization');
  assert.match(preflight.headers['access-control-allow-headers'], /Authorization/);
});

test('no expone codigos internos de PostgreSQL en errores 500', (t) => {
  t.mock.method(console, 'error', () => {});
  const response = {
    headersSent: false,
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const databaseError = Object.assign(new Error('value out of range'), { code: '22003' });

  errorHandler(databaseError, {}, response, () => {});

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error.code, 'INTERNAL_SERVER_ERROR');
  assert.equal(response.body.error.message, 'Ocurrio un error interno en el servidor.');
});
