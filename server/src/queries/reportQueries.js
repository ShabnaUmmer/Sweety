import { query } from '../db.js';

export async function getSummary(userId, from, to) {
  const result = await query(
    `SELECT COUNT(*)::int AS count,
            MAX(value) AS highest,
            MIN(value) AS lowest,
            ROUND(AVG(value), 1) AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2::date AND $3::date`,
    [userId, from, to],
  );
  const row = result.rows[0];
  return {
    count: row.count,
    highest: row.highest,
    lowest: row.lowest,
    average: row.average === null ? null : Number(row.average),
  };
}
