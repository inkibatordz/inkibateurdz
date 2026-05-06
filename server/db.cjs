const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

function shouldUseSsl(str) {
  if (!str) return false;
  if (process.env.DATABASE_SSL === 'disable') return false;
  if (/supabase\.co/i.test(str)) return true;
  if (/sslmode=require/i.test(str)) return true;
  return process.env.DATABASE_SSL === 'require';
}

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
    })
  : null;

async function query(text, params) {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured');
  }
  return pool.query(text, params);
}

module.exports = { pool, query, connectionString };
