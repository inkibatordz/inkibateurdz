const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function findAdmin() {
  try {
    const result = await pool.query("SELECT id, email, password, role FROM users WHERE role = 'admin'");
    console.log('Admin Users:');
    console.table(result.rows);
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    await pool.end();
  }
}

findAdmin();
