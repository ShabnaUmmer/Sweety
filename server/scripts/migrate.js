import fs from 'node:fs/promises';
import { pool } from '../src/db.js';

const schema = await fs.readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');

try {
  await pool.query(schema);
  console.log('Database schema is up to date.');
} finally {
  await pool.end();
}
