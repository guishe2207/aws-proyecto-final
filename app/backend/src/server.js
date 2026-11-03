const app = require('./app');
const fs = require('node:fs');
const https = require('node:https');
const pool = require('./config/database');
const { https: httpsConfig, port } = require('./config/env');

const server = httpsConfig.enabled
  ? https.createServer({ key: fs.readFileSync(httpsConfig.keyPath), cert: fs.readFileSync(httpsConfig.certPath) }, app).listen(port, iniciar)
  : app.listen(port, iniciar);

function iniciar() {
  const protocol = httpsConfig.enabled ? 'https' : 'http';
  console.log(`API disponible en ${protocol}://localhost:${port}`);
  console.log(`Swagger disponible en ${protocol}://localhost:${port}/api-docs`);
}

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
