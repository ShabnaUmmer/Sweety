import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidDateString,
  monthToDateRange,
  previousMonthRange,
  shiftDate,
  todayInTimezone,
} from '../src/dates.js';

describe('isValidDateString', () => {
  it('accepts real calendar dates', () => {
    assert.equal(isValidDateString('2026-10-15'), true);
    assert.equal(isValidDateString('2024-02-29'), true);
  });

  it('rejects impossible dates and wrong formats', () => {
    assert.equal(isValidDateString('2026-02-30'), false);
    assert.equal(isValidDateString('2026-13-01'), false);
    assert.equal(isValidDateString('15-10-2026'), false);
    assert.equal(isValidDateString('2026-1-5'), false);
    assert.equal(isValidDateString(20261015), false);
    assert.equal(isValidDateString(undefined), false);
  });
});

describe('todayInTimezone', () => {
  // 20:00 UTC on 14 Oct is already 01:30 on 15 Oct in India (UTC+5:30).
  const now = new Date('2026-10-14T20:00:00Z');

  it('uses the configured time zone, not the machine time zone', () => {
    assert.equal(todayInTimezone('Asia/Kolkata', now), '2026-10-15');
    assert.equal(todayInTimezone('UTC', now), '2026-10-14');
    assert.equal(todayInTimezone('America/Los_Angeles', now), '2026-10-14');
  });
});

describe('shiftDate', () => {
  it('moves across month, year and leap-day boundaries', () => {
    assert.equal(shiftDate('2026-03-01', -1), '2026-02-28');
    assert.equal(shiftDate('2024-03-01', -1), '2024-02-29');
    assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  });
});

describe('report date ranges', () => {
  it('month-to-date runs from the 1st to the selected date', () => {
    assert.deepEqual(monthToDateRange('2026-10-15'), { from: '2026-10-01', to: '2026-10-15' });
    assert.deepEqual(monthToDateRange('2026-10-01'), { from: '2026-10-01', to: '2026-10-01' });
  });

  it('monthly covers the whole previous month', () => {
    assert.deepEqual(previousMonthRange('2026-10-15'), { from: '2026-09-01', to: '2026-09-30' });
    assert.deepEqual(previousMonthRange('2026-03-10'), { from: '2026-02-01', to: '2026-02-28' });
    assert.deepEqual(previousMonthRange('2024-03-10'), { from: '2024-02-01', to: '2024-02-29' });
  });

  it('monthly in January uses December of the previous year', () => {
    assert.deepEqual(previousMonthRange('2026-01-20'), { from: '2025-12-01', to: '2025-12-31' });
  });
});
