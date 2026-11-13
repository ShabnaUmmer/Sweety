import './env.js';
import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  addReading,
  closeDatabase,
  getReport,
  registerUser,
  resetData,
  setupDatabase,
} from './helpers.js';

const SELECTED = '2026-10-15';

before(setupDatabase);
beforeEach(resetData);
after(closeDatabase);

async function seedReadings(token) {
  const readings = [
    // Previous month (September): included in the monthly report
    ['2026-09-01', 'morning_fasting', 95],
    ['2026-09-15', 'after_lunch', 100],
    ['2026-09-30', 'after_dinner', 105],
    // Just outside September
    ['2026-08-31', 'morning_fasting', 300],
    // Month to date (October up to the 15th)
    ['2026-10-01', 'morning_fasting', 90],
    ['2026-10-10', 'after_lunch', 111],
    ['2026-10-15', 'morning_fasting', 100],
    ['2026-10-15', 'after_dinner', 140],
    // After the selected date: must not appear in month-to-date
    ['2026-10-16', 'morning_fasting', 500],
    ['2026-10-31', 'morning_fasting', 450],
  ];
  for (const [date, slot, value] of readings) {
    const response = await addReading(token, { date, slot, value });
    assert.equal(response.status, 201);
  }
}

describe('reports', () => {
  it('daily report covers only the selected date and lists readings by slot', async () => {
    const { token } = await registerUser();
    await seedReadings(token);

    const response = await getReport(token, 'daily', SELECTED);
    assert.equal(response.status, 200);
    assert.equal(response.body.from, SELECTED);
    assert.equal(response.body.to, SELECTED);
    assert.equal(response.body.count, 2);
    assert.equal(response.body.highest, 140);
    assert.equal(response.body.lowest, 100);
    assert.equal(response.body.average, 120);
    assert.deepEqual(
      response.body.readings.map((item) => [item.slot, item.value]),
      [['morning_fasting', 100], ['after_dinner', 140]],
    );
  });

  it('month-to-date runs from the 1st to the selected date inclusive', async () => {
    const { token } = await registerUser();
    await seedReadings(token);

    const response = await getReport(token, 'month-to-date', SELECTED);
    assert.equal(response.body.from, '2026-10-01');
    assert.equal(response.body.to, SELECTED);
    assert.equal(response.body.count, 4); // 90, 111, 100, 140
    assert.equal(response.body.highest, 140);
    assert.equal(response.body.lowest, 90);
    assert.equal(response.body.average, 110.3); // 441 / 4 = 110.25, rounded to one decimal
  });

  it('monthly covers the whole previous month', async () => {
    const { token } = await registerUser();
    await seedReadings(token);

    const response = await getReport(token, 'monthly', SELECTED);
    assert.equal(response.body.from, '2026-09-01');
    assert.equal(response.body.to, '2026-09-30');
    assert.equal(response.body.count, 3);
    assert.equal(response.body.highest, 105);
    assert.equal(response.body.lowest, 95);
    assert.equal(response.body.average, 100);
  });

  it('returns zero count and null statistics when there are no readings', async () => {
    const { token } = await registerUser();

    for (const type of ['daily', 'month-to-date', 'monthly']) {
      const response = await getReport(token, type, SELECTED);
      assert.equal(response.status, 200, type);
      assert.equal(response.body.count, 0, type);
      assert.equal(response.body.highest, null, type);
      assert.equal(response.body.lowest, null, type);
      assert.equal(response.body.average, null, type);
    }
    const daily = await getReport(token, 'daily', SELECTED);
    assert.deepEqual(daily.body.readings, []);
  });

});
