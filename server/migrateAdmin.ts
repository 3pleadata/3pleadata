import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import {Pool} from 'pg';

const databaseUrl = process.env.ADMIN_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('ADMIN_DATABASE_URL must be set before running admin migrations.');
}

const pool = new Pool({connectionString: databaseUrl});
let transactionStarted = false;

try {
  const migration = await readFile(
    new URL('./migrations/001_admin_dashboard.sql', import.meta.url),
    'utf8'
  );
  await pool.query('BEGIN');
  transactionStarted = true;
  await pool.query(migration);
  await pool.query('COMMIT');
  transactionStarted = false;
  console.log('Admin dashboard database schema is up to date.');
} catch (error) {
  if (transactionStarted) {
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Admin dashboard migration rollback failed:', rollbackError);
    }
  }
  console.error('Admin dashboard database migration failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
