import './env.js';
import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { pool } from '../src/db.js';
import { app, authHeader, closeDatabase, registerUser, resetData, setupDatabase } from './helpers.js';

before(setupDatabase);
beforeEach(resetData);
after(closeDatabase);

describe('registration and login', () => {
  it('registers a patient, stores a bcrypt hash and never returns it', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Asha', email: 'asha@example.com', password: 'password123' });

    assert.equal(response.status, 201);
    assert.equal(response.body.user.role, 'patient');
    assert.equal(JSON.stringify(response.body).includes('password'), false);

    const { rows } = await pool.query('SELECT password_hash FROM users');
    assert.match(rows[0].password_hash, /^\$2[aby]\$/);
  });

  it('rejects invalid input and duplicate emails', async () => {
    const invalid = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });
    assert.equal(invalid.status, 400);

    await registerUser({ email: 'same@example.com' });
    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'same@example.com', password: 'password123' });
    assert.equal(duplicate.status, 409);
  });

  it('logs in with the right password and rejects a wrong one', async () => {
    const { credentials } = await registerUser();

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);

    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.body.error.message, 'Incorrect email or password.');
  });
});

describe('protected endpoints', () => {
  it('rejects requests with no token or an invalid token', async () => {
    const noToken = await request(app).get('/api/readings?date=2026-10-15');
    assert.equal(noToken.status, 401);

    const badToken = await request(app).get('/api/auth/me').set(authHeader('not-a-token'));
    assert.equal(badToken.status, 401);
  });

  it('reports an expired token', async () => {
    const { user } = await registerUser();
    const expired = jwt.sign(
      { sub: String(user.id), exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET,
    );
    const response = await request(app).get('/api/auth/me').set(authHeader(expired));
    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'TOKEN_EXPIRED');
  });
});
