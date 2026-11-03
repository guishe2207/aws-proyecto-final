const service = require('../services/auth.service');

async function login(request, response) {
  const { usuario, password } = request.validatedBody;
  response.json({ data: await service.login(usuario, password) });
}

async function logout(request, response) {
  await service.logout(request.token);
  response.status(204).end();
}

async function sesion(request, response) {
  response.json({ data: request.admin });
}

module.exports = { login, logout, sesion };
