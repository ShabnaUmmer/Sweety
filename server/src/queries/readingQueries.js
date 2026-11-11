import { query } from '../db.js';

// Columns returned to the API. reading_date is renamed so the API says "date".
const READING_COLUMNS = 'id, reading_date AS date, slot, value';

export async function insertReading(userId, { date, slot, value }) {
  const result = await query(
    `INSERT INTO readings (user_id, reading_date, slot, value)
     VALUES ($1, $2::date, $3, $4)
     RETURNING ${READING_COLUMNS}`,
    [userId, date, slot, value],
  );
  return result.rows[0];
}

export async function findReadingsByDate(userId, date) {
  const result = await query(
    `SELECT ${READING_COLUMNS} FROM readings
     WHERE user_id = $1 AND reading_date = $2::date`,
    [userId, date],
  );
  return result.rows;
}

export async function countReadingsOnDate(userId, date) {
  const result = await query(
    'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2::date',
    [userId, date],
  );
  return result.rows[0].count;
}

// Every statement below filters on user_id, so one user can never touch another user's rows.
export async function updateReading(userId, id, { date, slot, value }) {
  const result = await query(
    `UPDATE readings
     SET reading_date = $3::date, slot = $4, value = $5, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING ${READING_COLUMNS}`,
    [id, userId, date, slot, value],
  );
  return result.rows[0] ?? null;
}

export async function deleteReading(userId, id) {
  const result = await query(
    'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );
  return result.rowCount > 0;
}
