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
    console.log('Listing all tables named "users"...');
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `);
    res.rows.forEach(r => console.log(`- Schema: ${r.table_schema}, Table: ${r.table_name}`));

    console.log('\nInspecting public.users columns specifically...');
    const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    res2.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
