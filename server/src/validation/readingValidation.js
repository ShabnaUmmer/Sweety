import { GLUCOSE_MAX, GLUCOSE_MIN, MAX_READINGS_PER_DAY, SLOTS, slotLabel } from '../constants.js';
import { isValidDateString } from '../dates.js';

export function duplicateSlotMessage(slotValue) {
  const label = slotLabel(slotValue);
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
  return `You already have ${article} ${label} reading for this date.`;
}

export function fullDayMessage() {
  return `You can add only ${MAX_READINGS_PER_DAY} readings per day.`;
}

function checkValue(rawValue) {
  const text = rawValue === undefined || rawValue === null ? '' : String(rawValue).trim();
  if (text === '') {
    return { error: 'Please enter a glucose value.' };
  }
  // Only plain integers pass; "120.5", "1e2" and "abc" are rejected.
  if (!/^-?\d+$/.test(text)) {
    return { error: 'Value must be a whole number.' };
  }
  const value = Number(text);
  if (value < GLUCOSE_MIN || value > GLUCOSE_MAX) {
    return { error: `Value must be between ${GLUCOSE_MIN} and ${GLUCOSE_MAX} mg/dl.` };
  }
  return { value };
}

function checkDate(date, today) {
  if (date === undefined || date === null || date === '') {
    return { error: 'Please select a date.' };
  }
  if (!isValidDateString(date)) {
    return { error: 'Enter a valid date.' };
  }
  // 'YYYY-MM-DD' strings sort in calendar order, so string comparison is enough.
  if (date > today) {
    return { error: 'Date cannot be in the future.' };
  }
  return { date };
}

function checkSlot(slot) {
  if (!SLOTS.some((item) => item.value === slot)) {
    return { error: 'Please choose a time slot.' };
  }
  return { slot };
}

// `today` is a 'YYYY-MM-DD' string in the app's time zone.
export function validateReadingInput(body, today) {
  const input = body ?? {};
  const fields = {};

  const value = checkValue(input.value);
  const date = checkDate(input.date, today);
  const slot = checkSlot(input.slot);

  if (value.error) fields.value = value.error;
  if (date.error) fields.date = date.error;
  if (slot.error) fields.slot = slot.error;

  return { fields, values: { date: date.date, slot: slot.slot, value: value.value } };
}
