import { query } from '../db.js';

// Dates are passed as parameters and cast to DATE, so the database's own time zone
// (and CURRENT_DATE) is never involved.
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
    // pg returns NUMERIC as a string; the API sends a number (null when there are no readings).
    average: row.average === null ? null : Number(row.average),
  };
}
