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

describe('creating readings', () => {
  it('saves a valid reading', async () => {
    const { token } = await registerUser();
    const response = await addReading(token, reading);

    assert.equal(response.status, 201);
    assert.deepEqual(
      { date: response.body.reading.date, slot: response.body.reading.slot, value: response.body.reading.value },
      reading,
    );
  });

  it('returns the date as typed, regardless of time zones', async () => {
    const { token } = await registerUser();
    await addReading(token, { ...reading, date: '2026-10-01' });
    const list = await request(app).get('/api/readings?date=2026-10-01').set(authHeader(token));
    assert.equal(list.body.readings[0].date, '2026-10-01');
  });

  it('requires a value', async () => {
    const { token } = await registerUser();
    const response = await addReading(token, { date: DATE, slot: 'after_lunch' });
    assert.equal(response.status, 400);
    assert.equal(response.body.error.fields.value, 'Please enter a glucose value.');
  });

  it('rejects decimal and out-of-range values', async () => {
    const { token } = await registerUser();
    const decimal = await addReading(token, { ...reading, value: 120.5 });
    const tooLow = await addReading(token, { ...reading, value: 39 });
    const tooHigh = await addReading(token, { ...reading, value: 601 });

    assert.equal(decimal.status, 400);
    assert.equal(tooLow.status, 400);
    assert.equal(tooHigh.status, 400);
    assert.equal(tooLow.body.error.fields.value, 'Value must be between 40 and 600 mg/dl.');
  });

  it('rejects a future date, using the configured time zone', async () => {
    const { token } = await registerUser();
    const today = todayInTimezone(config.timezone);

    const tomorrow = await addReading(token, { ...reading, date: shiftDate(today, 1) });
    assert.equal(tomorrow.status, 400);
    assert.equal(tomorrow.body.error.fields.date, 'Date cannot be in the future.');

    const todayResponse = await addReading(token, { ...reading, date: today });
    assert.equal(todayResponse.status, 201);
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

  it('allows the same slot on a different date, and the same slot for another user', async () => {
    const first = await registerUser();
    const second = await registerUser();
    await addReading(first.token, reading);

    const otherDay = await addReading(first.token, { ...reading, date: '2026-10-14' });
    const otherUser = await addReading(second.token, reading);
    assert.equal(otherDay.status, 201);
    assert.equal(otherUser.status, 201);
  });

  it('refuses a fifth reading on the same date', async () => {
    const { token } = await registerUser();
    const slots = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];
    for (const slot of slots) {
      const response = await addReading(token, { date: DATE, slot, value: 110 });
      assert.equal(response.status, 201);
    }

    const fifth = await addReading(token, { date: DATE, slot: 'after_dinner', value: 120 });
    assert.equal(fifth.status, 409);
    assert.equal(fifth.body.error.fields.date, 'You can add only 4 readings per day.');

    const list = await request(app).get(`/api/readings?date=${DATE}`).set(authHeader(token));
    assert.equal(list.body.readings.length, 4);
  });

  it('lets only one of two simultaneous requests for the same slot succeed', async () => {
    const { token } = await registerUser();
    const responses = await Promise.all([
      addReading(token, reading),
      addReading(token, { ...reading, value: 150 }),
    ]);

    const statuses = responses.map((response) => response.status).sort();
    assert.deepEqual(statuses, [201, 409]);

    const list = await request(app).get(`/api/readings?date=${DATE}`).set(authHeader(token));
    assert.equal(list.body.readings.length, 1);
  });
});

describe('listing readings', () => {
  it('returns only the logged-in user\'s readings, in slot order', async () => {
    const mine = await registerUser();
    const theirs = await registerUser();
    await addReading(mine.token, { date: DATE, slot: 'after_dinner', value: 130 });
    await addReading(mine.token, { date: DATE, slot: 'morning_fasting', value: 100 });
    await addReading(theirs.token, { date: DATE, slot: 'after_lunch', value: 590 });

    const response = await request(app).get(`/api/readings?date=${DATE}`).set(authHeader(mine.token));
    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.readings.map((item) => item.slot),
      ['morning_fasting', 'after_dinner'],
    );
  });

  it('requires a valid date', async () => {
    const { token } = await registerUser();
    const response = await request(app).get('/api/readings?date=nonsense').set(authHeader(token));
    assert.equal(response.status, 400);
  });
});

describe('editing and deleting readings', () => {
  it('updates a reading', async () => {
    const { token } = await registerUser();
    const created = await addReading(token, reading);
    const id = created.body.reading.id;

    const response = await request(app)
      .put(`/api/readings/${id}`)
      .set(authHeader(token))
      .send({ ...reading, value: 155, slot: 'after_dinner' });

    assert.equal(response.status, 200);
    assert.equal(response.body.reading.value, 155);
    assert.equal(response.body.reading.slot, 'after_dinner');
  });

  it('validates updates the same way as new readings', async () => {
    const { token } = await registerUser();
    const created = await addReading(token, reading);
    const response = await request(app)
      .put(`/api/readings/${created.body.reading.id}`)
      .set(authHeader(token))
      .send({ ...reading, value: 700 });
    assert.equal(response.status, 400);
  });

  it('refuses to move a reading onto a slot that is already used', async () => {
    const { token } = await registerUser();
    await addReading(token, { ...reading, slot: 'after_breakfast' });
    const lunch = await addReading(token, reading);

    const response = await request(app)
      .put(`/api/readings/${lunch.body.reading.id}`)
      .set(authHeader(token))
      .send({ ...reading, slot: 'after_breakfast' });
    assert.equal(response.status, 409);
  });

  it('deletes a reading', async () => {
    const { token } = await registerUser();
    const created = await addReading(token, reading);

    const response = await request(app)
      .delete(`/api/readings/${created.body.reading.id}`)
      .set(authHeader(token));
    assert.equal(response.status, 204);

    const list = await request(app).get(`/api/readings?date=${DATE}`).set(authHeader(token));
    assert.equal(list.body.readings.length, 0);
  });

  it('returns 404 for a reading that does not exist or has a malformed id', async () => {
    const { token } = await registerUser();
    const missing = await request(app).delete('/api/readings/9999').set(authHeader(token));
    const malformed = await request(app).delete('/api/readings/abc').set(authHeader(token));
    assert.equal(missing.status, 404);
    assert.equal(malformed.status, 404);
  });
});

describe('data isolation between users', () => {
  it('does not let another user edit or delete a reading', async () => {
    const owner = await registerUser();
    const intruder = await registerUser();
    const created = await addReading(owner.token, reading);
    const id = created.body.reading.id;

    const edit = await request(app)
      .put(`/api/readings/${id}`)
      .set(authHeader(intruder.token))
      .send({ ...reading, value: 300 });
    const remove = await request(app).delete(`/api/readings/${id}`).set(authHeader(intruder.token));
    assert.equal(edit.status, 404);
    assert.equal(remove.status, 404);

    const list = await request(app).get(`/api/readings?date=${DATE}`).set(authHeader(owner.token));
    assert.equal(list.body.readings.length, 1);
    assert.equal(list.body.readings[0].value, reading.value);
  });

  it('ignores a user id sent in the request body', async () => {
    const owner = await registerUser();
    const other = await registerUser();
    await request(app)
      .post('/api/readings')
      .set(authHeader(other.token))
      .send({ ...reading, user_id: owner.user.id, userId: owner.user.id });

    const ownerList = await request(app).get(`/api/readings?date=${DATE}`).set(authHeader(owner.token));
    const otherList = await request(app).get(`/api/readings?date=${DATE}`).set(authHeader(other.token));
    assert.equal(ownerList.body.readings.length, 0);
    assert.equal(otherList.body.readings.length, 1);
  });
});
