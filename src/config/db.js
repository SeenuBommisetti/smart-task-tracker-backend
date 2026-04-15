const { Pool } = require('pg');
const env = require('./env');
const { createDatabaseOptions } = require('./databaseOptions');

const pool = new Pool(createDatabaseOptions({
  databaseUrl: env.databaseUrl,
  dbSsl: env.dbSsl
}));

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params)
};
