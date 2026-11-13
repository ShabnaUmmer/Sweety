import './env.js';
import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { config } from '../src/config.js';
import { shiftDate, todayInTimezone } from '../src/dates.js';
import {
  addReading,
  app,
  authHeader,
  closeDatabase,
  registerUser,
  resetData,
  setupDatabase,
} from './helpers.js';

const DATE = '2026-10-15';
const reading = { date: DATE, slot: 'after_lunch', value: 142 };

before(setupDatabase);
beforeEach(resetData);
after(closeDatabase);

function listReadings(token, date = DATE) {
  return request(app).get(`/api/readings?date=${date}`).set(authHeader(token));
}

describe('adding readings', () => {
  it('saves a valid reading', async () => {
    const { token } = await registerUser();
    const response = await addReading(token, reading);

    assert.equal(response.status, 201);
    assert.equal(response.body.reading.value, 142);
    assert.equal(response.body.reading.date, DATE);
  });

  it('requires a value', async () => {
    const { token } = await registerUser();
    const response = await addReading(token, { date: DATE, slot: 'after_lunch' });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.fields.value, 'Please enter a glucose value.');
  });

  it('rejects decimals and values outside 40 to 600', async () => {
    const { token } = await registerUser();

    const decimal = await addReading(token, { ...reading, value: 120.5 });
    const tooLow = await addReading(token, { ...reading, value: 39 });
    const tooHigh = await addReading(token, { ...reading, value: 601 });

    assert.equal(decimal.status, 400);
    assert.equal(tooLow.body.error.fields.value, 'Value must be between 40 and 600 mg/dl.');
    assert.equal(tooHigh.status, 400);
  });

  it('rejects a future date', async () => {
    const { token } = await registerUser();
    const tomorrow = shiftDate(todayInTimezone(config.timezone), 1);
    const response = await addReading(token, { ...reading, date: tomorrow });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.fields.date, 'Date cannot be in the future.');
  });

  it('rejects a second reading for the same slot and date', async () => {
    const { token } = await registerUser();
    await addReading(token, reading);
    const duplicate = await addReading(token, { ...reading, value: 150 });

    assert.equal(duplicate.status, 409);
    assert.equal(
      duplicate.body.error.fields.slot,
      'You already have an After lunch reading for this date.',
    );
  });

  it('refuses a fifth reading on the same date', async () => {
    const { token } = await registerUser();
    for (const slot of ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']) {
      await addReading(token, { date: DATE, slot, value: 110 });
    }

    const fifth = await addReading(token, { date: DATE, slot: 'after_dinner', value: 120 });
    assert.equal(fifth.status, 409);
    assert.equal(fifth.body.error.fields.date, 'You can add only 4 readings per day.');
  });

  it('lets only one of two simultaneous requests for the same slot succeed', async () => {
    const { token } = await registerUser();
    const responses = await Promise.all([
      addReading(token, reading),
      addReading(token, { ...reading, value: 150 }),
    ]);

    assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
    assert.equal((await listReadings(token)).body.readings.length, 1);
  });
});

describe('editing and deleting readings', () => {
  it('updates a reading', async () => {
    const { token } = await registerUser();
    const created = await addReading(token, reading);

    const response = await request(app)
      .put(`/api/readings/${created.body.reading.id}`)
      .set(authHeader(token))
      .send({ ...reading, value: 155 });

    assert.equal(response.status, 200);
    assert.equal(response.body.reading.value, 155);
  });

  it('deletes a reading', async () => {
    const { token } = await registerUser();
    const created = await addReading(token, reading);

    const response = await request(app)
      .delete(`/api/readings/${created.body.reading.id}`)
      .set(authHeader(token));

    assert.equal(response.status, 204);
    assert.equal((await listReadings(token)).body.readings.length, 0);
  });
});

describe('data isolation', () => {
  it('does not let another user see, edit or delete a reading', async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const created = await addReading(owner.token, reading);
    const id = created.body.reading.id;

    const otherList = await listReadings(other.token);
    const edit = await request(app)
      .put(`/api/readings/${id}`)
      .set(authHeader(other.token))
      .send({ ...reading, value: 300 });
    const remove = await request(app).delete(`/api/readings/${id}`).set(authHeader(other.token));

    assert.equal(otherList.body.readings.length, 0);
    assert.equal(edit.status, 404);
    assert.equal(remove.status, 404);
    assert.equal((await listReadings(owner.token)).body.readings[0].value, 142);
  });
});
