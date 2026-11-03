const { Pool } = require('pg');
const { database } = require('./env');

const pool = new Pool(database);

pool.on('error', (error) => {
  console.error('Error inesperado en el pool de PostgreSQL:', error.message);
});

module.exports = pool;
