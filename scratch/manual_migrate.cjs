const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    console.log('Running manual migrations...');
    
    // Add columns to users if missing
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    `);
    console.log('Added status to users');

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('Added created_at to users');

    // Also check projects
    await pool.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
    `);
    await pool.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS mentor_feedback TEXT;
    `);
    console.log('Updated projects table');

    console.log('Migrations completed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
