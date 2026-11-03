const dotenv = require('dotenv');
const fs = require('node:fs');

dotenv.config();

const port = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === 'production';
const csrfSecret = process.env.CSRF_SECRET || (production ? '' : 'solo-desarrollo-no-usar-en-produccion');
const pgSsl = process.env.PGSSL === 'true';
const pgRejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED === undefined
  ? production
  : process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false';

if (!csrfSecret) {
  throw new Error('CSRF_SECRET es obligatorio cuando NODE_ENV=production.');
}

module.exports = {
  port,
  production,
  csrfSecret,
  https: {
    enabled: process.env.HTTPS_ENABLED === 'true',
    keyPath: process.env.HTTPS_KEY_PATH,
    certPath: process.env.HTTPS_CERT_PATH,
  },
  // El propio API se incluye siempre: Swagger UI se sirve desde este origen y sus peticiones POST/PUT/DELETE lo envian.
  corsOrigins: [...new Set([
    ...(process.env.CORS_ORIGIN || 'http://localhost:4200')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    `http://localhost:${port}`,
  ])],
  database: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'tienda_modular',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    ssl: pgSsl ? {
      rejectUnauthorized: pgRejectUnauthorized,
      ...(process.env.PGSSL_CA_PATH ? { ca: fs.readFileSync(process.env.PGSSL_CA_PATH, 'utf8') } : {}),
    } : false,
  },
};
