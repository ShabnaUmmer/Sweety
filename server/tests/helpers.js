import './env.js';
import fs from 'node:fs/promises';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db.js';

export const app = createApp();

// Safety check: the tests delete data, so they only run against a database named *_test.
async function assertTestDatabase() {
  const { rows } = await pool.query('SELECT current_database() AS name');
  if (!rows[0].name.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests on database "${rows[0].name}". ` +
        'TEST_DATABASE_URL must point to a separate database whose name ends in _test.',
    );
  }
}

export async function setupDatabase() {
  await assertTestDatabase();
  const schema = await fs.readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
}

export async function resetData() {
  await assertTestDatabase();
  await pool.query('TRUNCATE users RESTART IDENTITY CASCADE');
}

export async function closeDatabase() {
  await pool.end();
}

let userCounter = 0;

export async function registerUser(overrides = {}) {
  userCounter += 1;
  const credentials = {
    name: 'Test User',
    email: `user${userCounter}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const response = await request(app).post('/api/auth/register').send(credentials);
  return { token: response.body.token, user: response.body.user, credentials };
}

// Doctors cannot register through the API, so tests promote a registered user directly.
export async function registerDoctor() {
  const doctor = await registerUser({ name: 'Dr Test' });
  await pool.query("UPDATE users SET role = 'doctor' WHERE id = $1", [doctor.user.id]);
  return doctor;
}

export async function assignPatient(doctorId, patientId) {
  await pool.query('INSERT INTO doctor_patients (doctor_id, patient_id) VALUES ($1, $2)', [
    doctorId,
    patientId,
  ]);
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export function addReading(token, reading) {
  return request(app).post('/api/readings').set(authHeader(token)).send(reading);
}

export function getReport(token, type, date) {
  return request(app).get(`/api/reports/${type}?date=${date}`).set(authHeader(token));
}
