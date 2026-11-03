const pool = require('../config/database');

async function health(request, response) {
  await pool.query('SELECT 1');
  response.json({ data: { status: 'ok', database: 'connected' } });
}

module.exports = { health };
