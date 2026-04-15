const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { createDatabaseOptions } = require('../src/config/databaseOptions');

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run the schema');
}

const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

const pool = new Pool(createDatabaseOptions({
  databaseUrl: process.env.DATABASE_URL,
  dbSsl: process.env.DB_SSL
}));

const run = async () => {
  const client = await pool.connect();

  try {
    await client.query(schemaSql);
    console.log('Database schema applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error) => {
  console.error('Failed to apply schema:', error.message);
  process.exit(1);
});
