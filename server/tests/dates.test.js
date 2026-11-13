import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidDateString, previousMonthRange, todayInTimezone } from '../src/dates.js';

describe('date helpers', () => {
  it('accepts real dates and rejects impossible ones', () => {
    assert.equal(isValidDateString('2026-10-15'), true);
    assert.equal(isValidDateString('2026-02-30'), false);
    assert.equal(isValidDateString('15-10-2026'), false);
  });

  it('works out "today" in the configured time zone', () => {
    const now = new Date('2026-10-14T20:00:00Z');
    assert.equal(todayInTimezone('Asia/Kolkata', now), '2026-10-15');
    assert.equal(todayInTimezone('UTC', now), '2026-10-14');
  });

  it('previous month covers the whole month, including across a year change', () => {
    assert.deepEqual(previousMonthRange('2026-10-15'), { from: '2026-09-01', to: '2026-09-30' });
    assert.deepEqual(previousMonthRange('2026-01-20'), { from: '2025-12-01', to: '2025-12-31' });
  });
});
