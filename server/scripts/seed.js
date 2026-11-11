import bcrypt from 'bcryptjs';
import { config } from '../src/config.js';
import { SLOTS } from '../src/constants.js';
import { shiftDate, todayInTimezone } from '../src/dates.js';
import { pool } from '../src/db.js';

const DEMO_EMAIL = 'demo@sweety.test';
const DEMO_PASSWORD = 'demo-pass-123';
const DAYS_OF_HISTORY = 45; // covers the current month and all of the previous month

// Made-up sample values for demonstration only. They are not real medical data.
const SAMPLE_DAYS = [
  [104, 142, 128, 135],
  [98, 151, 119, 132],
  [110, 138, 124, 147],
  [101, 129, 133, 126],
  [117, 160, 141, 139],
  [95, 134, 121, 130],
  [108, 145, 127, 143],
];

function readingsForDay(dayIndex) {
  if (dayIndex === 0) return [SAMPLE_DAYS[0][0]]; // today: only the morning reading so far
  const count = dayIndex % 4 === 3 ? 2 : SLOTS.length; // some days have only two readings
  return SAMPLE_DAYS[dayIndex % SAMPLE_DAYS.length].slice(0, count);
}

const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Re-running the seed replaces the demo account (its readings are deleted with it).
  await client.query('DELETE FROM users WHERE email = $1', [DEMO_EMAIL]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const userResult = await client.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    ['Demo User', DEMO_EMAIL, passwordHash],
  );
  const userId = userResult.rows[0].id;

  const today = todayInTimezone(config.timezone);
  let readingCount = 0;
  for (let dayIndex = 0; dayIndex < DAYS_OF_HISTORY; dayIndex += 1) {
    const date = shiftDate(today, -dayIndex);
    const values = readingsForDay(dayIndex);
    for (let slotIndex = 0; slotIndex < values.length; slotIndex += 1) {
      await client.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2::date, $3, $4)',
        [userId, date, SLOTS[slotIndex].value, values[slotIndex]],
      );
      readingCount += 1;
    }
  }

  await client.query('COMMIT');
  console.log(`Seeded ${readingCount} sample readings.`);
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
