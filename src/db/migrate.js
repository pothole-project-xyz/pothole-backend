/**
 * Runs schema.sql against the configured DATABASE_URL and ensures a default
 * admin account exists (with a securely hashed password, never hardcoded).
 *
 * Usage: npm run migrate
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running schema migration...');
  await pool.query(schemaSql);
  console.log('Schema applied successfully.');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@smartroad.app';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123';

  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'admin', true)`,
      ['System Admin', adminEmail, hash]
    );
    console.log(`Default admin created: ${adminEmail} / ${adminPassword}`);
    console.log('IMPORTANT: Log in and change this password immediately.');
  } else {
    console.log('Default admin already exists, skipping seed.');
  }

  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
