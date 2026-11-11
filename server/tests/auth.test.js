import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { pool } from '../src/db.js';
import { app, authHeader, closeDatabase, registerUser, resetData, setupDatabase } from './helpers.js';

before(setupDatabase);
beforeEach(resetData);
after(closeDatabase);

describe('registration', () => {
  it('creates an account and returns a token without the password hash', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Asha', email: 'Asha@Example.com', password: 'password123' });

    assert.equal(response.status, 201);
    assert.ok(response.body.token);
    assert.equal(response.body.user.email, 'asha@example.com');
    assert.equal(JSON.stringify(response.body).includes('password'), false);
  });

  it('stores a bcrypt hash, not the password', async () => {
    await registerUser({ email: 'hash@example.com', password: 'password123' });
    const { rows } = await pool.query('SELECT password_hash FROM users');
    assert.notEqual(rows[0].password_hash, 'password123');
    assert.match(rows[0].password_hash, /^\$2[aby]\$/);
  });

  it('rejects invalid input with field errors', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    assert.equal(response.status, 400);
    assert.deepEqual(Object.keys(response.body.error.fields).sort(), ['email', 'name', 'password']);
  });

  it('rejects an email that is already registered, ignoring case', async () => {
    await registerUser({ email: 'same@example.com' });
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'SAME@example.com', password: 'password123' });

    assert.equal(response.status, 409);
    assert.ok(response.body.error.fields.email);
  });
});

describe('login', () => {
  it('returns a token for the right password', async () => {
    const { credentials } = await registerUser();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    assert.equal(response.status, 200);
    assert.ok(response.body.token);
  });

  it('rejects a wrong password', async () => {
    const { credentials } = await registerUser();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });

    assert.equal(response.status, 401);
    assert.equal(response.body.error.message, 'Incorrect email or password.');
  });

  it('gives the same answer for an unknown email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    assert.equal(response.status, 401);
    assert.equal(response.body.error.message, 'Incorrect email or password.');
  });
});

describe('authentication on private endpoints', () => {
  it('rejects requests without a token', async () => {
    for (const path of ['/api/auth/me', '/api/readings?date=2026-10-15', '/api/reports/daily']) {
      const response = await request(app).get(path);
      assert.equal(response.status, 401, path);
    }
    const create = await request(app).post('/api/readings').send({});
    assert.equal(create.status, 401);
  });

  it('rejects a malformed token', async () => {
    const response = await request(app).get('/api/auth/me').set(authHeader('not-a-real-token'));
    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'TOKEN_INVALID');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ sub: '1' }, 'some-other-secret');
    const response = await request(app).get('/api/auth/me').set(authHeader(forged));
    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'TOKEN_INVALID');
  });

  it('reports an expired token so the client can ask the user to log in again', async () => {
    const { user } = await registerUser();
    const expired = jwt.sign(
      { sub: String(user.id), exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET,
    );
    const response = await request(app).get('/api/auth/me').set(authHeader(expired));
    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'TOKEN_EXPIRED');
  });

  it('returns the current user for a valid token', async () => {
    const { token, user } = await registerUser();
    const response = await request(app).get('/api/auth/me').set(authHeader(token));
    assert.equal(response.status, 200);
    assert.equal(response.body.user.id, user.id);
  });
});
