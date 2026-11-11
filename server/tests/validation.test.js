import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  duplicateSlotMessage,
  fullDayMessage,
  validateReadingInput,
} from '../src/validation/readingValidation.js';
import { validateRegistration } from '../src/validation/authValidation.js';

const TODAY = '2026-10-15';
const valid = { date: '2026-10-15', slot: 'after_lunch', value: 120 };

describe('validateReadingInput', () => {
  it('accepts a valid reading and returns the value as a number', () => {
    const { fields, values } = validateReadingInput({ ...valid, value: '120' }, TODAY);
    assert.deepEqual(fields, {});
    assert.equal(values.value, 120);
  });

  it('requires a value', () => {
    for (const value of [undefined, null, '', '   ']) {
      const { fields } = validateReadingInput({ ...valid, value }, TODAY);
      assert.equal(fields.value, 'Please enter a glucose value.');
    }
  });

  it('rejects decimals and non-numbers', () => {
    for (const value of [120.5, '120.5', 'abc', '1e2']) {
      const { fields } = validateReadingInput({ ...valid, value }, TODAY);
      assert.equal(fields.value, 'Value must be a whole number.');
    }
  });

  it('accepts 40 and 600 but rejects 39 and 601', () => {
    assert.deepEqual(validateReadingInput({ ...valid, value: 40 }, TODAY).fields, {});
    assert.deepEqual(validateReadingInput({ ...valid, value: 600 }, TODAY).fields, {});
    for (const value of [39, 601, 0, -50]) {
      const { fields } = validateReadingInput({ ...valid, value }, TODAY);
      assert.equal(fields.value, 'Value must be between 40 and 600 mg/dl.');
    }
  });

  it('rejects a future date but allows today', () => {
    const future = validateReadingInput({ ...valid, date: '2026-10-16' }, TODAY);
    assert.equal(future.fields.date, 'Date cannot be in the future.');
    assert.deepEqual(validateReadingInput({ ...valid, date: TODAY }, TODAY).fields, {});
  });

  it('rejects missing or impossible dates', () => {
    assert.equal(validateReadingInput({ ...valid, date: undefined }, TODAY).fields.date, 'Please select a date.');
    assert.equal(validateReadingInput({ ...valid, date: '2026-02-30' }, TODAY).fields.date, 'Enter a valid date.');
  });

  it('rejects an unknown slot', () => {
    const { fields } = validateReadingInput({ ...valid, slot: 'midnight' }, TODAY);
    assert.equal(fields.slot, 'Please choose a time slot.');
  });

  it('copes with a missing body', () => {
    const { fields } = validateReadingInput(undefined, TODAY);
    assert.deepEqual(Object.keys(fields).sort(), ['date', 'slot', 'value']);
  });
});

describe('error messages', () => {
  it('names the slot and picks the right article', () => {
    assert.equal(
      duplicateSlotMessage('after_lunch'),
      'You already have an After lunch reading for this date.',
    );
    assert.equal(
      duplicateSlotMessage('morning_fasting'),
      'You already have a Morning (fasting) reading for this date.',
    );
    assert.equal(fullDayMessage(), 'You can add only 4 readings per day.');
  });
});

describe('validateRegistration', () => {
  it('normalises the email and flags weak input', () => {
    const ok = validateRegistration({ name: ' Asha ', email: ' ASHA@Example.com ', password: 'password123' });
    assert.deepEqual(ok.fields, {});
    assert.equal(ok.values.email, 'asha@example.com');
    assert.equal(ok.values.name, 'Asha');

    const bad = validateRegistration({ name: '', email: 'nope', password: 'short' });
    assert.deepEqual(Object.keys(bad.fields).sort(), ['email', 'name', 'password']);
  });
});
