import './env.js';
import fs from 'node:fs/promises';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db.js';

export const app = createApp();

export async function setupDatabase() {
  const schema = await fs.readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
}

export async function resetData() {
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

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export function addReading(token, reading) {
  return request(app).post('/api/readings').set(authHeader(token)).send(reading);
}

export function getReport(token, type, date) {
  return request(app).get(`/api/reports/${type}?date=${date}`).set(authHeader(token));
}
