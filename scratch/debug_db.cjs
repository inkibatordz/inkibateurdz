const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    console.log('Connecting to database...');
    const res = await pool.query('SELECT * FROM users');
    console.log('Success! Total users found:', res.rowCount);
    console.log('Users list:');
    res.rows.forEach(u => console.log(`- ${u.email} (${u.role}) [ID: ${u.id}]`));
  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
