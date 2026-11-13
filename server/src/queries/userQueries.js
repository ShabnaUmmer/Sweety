import { query } from '../db.js';

export async function createUser({ name, email, passwordHash }) {
  const result = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role`,
    [name, email, passwordHash],
  );
  return result.rows[0];
}

export async function findUserByEmail(email) {
  const result = await query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id) {
  const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}
