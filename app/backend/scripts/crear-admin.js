// Crea el administrador inicial. Uso (desde backend/):
//   $env:ADMIN_USUARIO = "admin"; $env:ADMIN_PASSWORD = "una-clave-larga"; npm run admin:crear
const pool = require('../src/config/database');
const usuarios = require('../src/models/usuarios.model');
const { hashPassword } = require('../src/security/password');

const usuario = (process.env.ADMIN_USUARIO || '').trim();
const password = process.env.ADMIN_PASSWORD || '';

async function main() {
  if (!usuario || password.length < 12) {
    console.error('Define ADMIN_USUARIO y ADMIN_PASSWORD (la contrasena debe tener al menos 12 caracteres).');
    process.exitCode = 1;
    return;
  }

  try {
    const creado = await usuarios.crear(usuario, hashPassword(password));
    console.log(`Administrador creado: ${creado.usuario}`);
  } catch (error) {
    console.error(error.code === '23505'
      ? 'Ya existe un administrador con ese usuario.'
      : `No se pudo crear el administrador: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
