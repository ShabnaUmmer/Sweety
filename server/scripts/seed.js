import bcrypt from 'bcryptjs';
import { config } from '../src/config.js';
import { SLOTS } from '../src/constants.js';
import { shiftDate, todayInTimezone } from '../src/dates.js';
import { pool } from '../src/db.js';

const PASSWORD = 'demo-pass-123';
const DAYS_OF_HISTORY = 45; // the current month plus all of the previous month
const DEMO_EMAILS = [
  'demo@sweety.test',
  'patient2@sweety.test',
  'patient3@sweety.test',
  'doctor@sweety.test',
];

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

function readingsForDay(dayIndex, offset) {
  if (dayIndex === 0) return [SAMPLE_DAYS[offset][0]]; // today: only the morning reading so far
  const count = dayIndex % 4 === 3 ? 2 : SLOTS.length; // some days have only two readings
  return SAMPLE_DAYS[(dayIndex + offset) % SAMPLE_DAYS.length].slice(0, count);
}

async function createUser(client, name, email, role, passwordHash) {
  const result = await client.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, email, passwordHash, role],
  );
  return result.rows[0].id;
}

async function addReadings(client, userId, today, offset) {
  let count = 0;
  for (let dayIndex = 0; dayIndex < DAYS_OF_HISTORY; dayIndex += 1) {
    const date = shiftDate(today, -dayIndex);
    const values = readingsForDay(dayIndex, offset);
    for (let slotIndex = 0; slotIndex < values.length; slotIndex += 1) {
      await client.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2::date, $3, $4)',
        [userId, date, SLOTS[slotIndex].value, values[slotIndex]],
      );
      count += 1;
    }
  }
  return count;
}

const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Running the seed again replaces the demo accounts (their readings and assignments go with them).
  await client.query('DELETE FROM users WHERE email = ANY($1)', [DEMO_EMAILS]);

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const today = todayInTimezone(config.timezone);

  const doctorId = await createUser(client, 'Dr. Demo', 'doctor@sweety.test', 'doctor', passwordHash);
  const patientId = await createUser(client, 'Demo User', 'demo@sweety.test', 'patient', passwordHash);
  const secondId = await createUser(client, 'Second Patient', 'patient2@sweety.test', 'patient', passwordHash);
  const thirdId = await createUser(client, 'Unassigned Patient', 'patient3@sweety.test', 'patient', passwordHash);

  let readingCount = 0;
  readingCount += await addReadings(client, patientId, today, 0);
  readingCount += await addReadings(client, secondId, today, 3);
  readingCount += await addReadings(client, thirdId, today, 5);

  // The doctor is assigned to the first two patients, not the third.
  await client.query(
    'INSERT INTO doctor_patients (doctor_id, patient_id) VALUES ($1, $2), ($1, $3)',
    [doctorId, patientId, secondId],
  );

  await client.query('COMMIT');
  console.log(`Seeded ${readingCount} sample readings.`);
  console.log(`Patient login: demo@sweety.test / ${PASSWORD}`);
  console.log(`Doctor login:  doctor@sweety.test / ${PASSWORD} (assigned: Demo User, Second Patient)`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
