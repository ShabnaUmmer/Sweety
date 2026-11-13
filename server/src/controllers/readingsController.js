import { config } from '../config.js';
import { MAX_READINGS_PER_DAY, slotOrder } from '../constants.js';
import { isValidDateString, todayInTimezone } from '../dates.js';
import { UNIQUE_VIOLATION } from '../db.js';
import { HttpError, fieldError, hasErrors, validationError } from '../errors.js';
import {
  countReadingsOnDate,
  deleteReading,
  findReadingsByDate,
  insertReading,
  updateReading,
} from '../queries/readingQueries.js';
import {
  duplicateSlotMessage,
  fullDayMessage,
  validateReadingInput,
} from '../validation/readingValidation.js';

function parseReadingId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    throw new HttpError(404, 'Reading not found.');
  }
  return id;
}

export function sortBySlot(readings) {
  return [...readings].sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));
}

async function conflictOnCreate(userId, { date, slot }) {
  const count = await countReadingsOnDate(userId, date);
  if (count >= MAX_READINGS_PER_DAY) {
    return fieldError(409, 'date', fullDayMessage());
  }
  return fieldError(409, 'slot', duplicateSlotMessage(slot));
}

export async function readingsForDate(userId, date) {
  if (!isValidDateString(date)) {
    throw fieldError(400, 'date', 'Enter a valid date.');
  }
  return sortBySlot(await findReadingsByDate(userId, date));
}

export async function listReadings(req, res) {
  const readings = await readingsForDate(req.user.id, req.query.date);
  res.json({ date: req.query.date, readings });
}

export async function createReading(req, res) {
  const today = todayInTimezone(config.timezone);
  const { fields, values } = validateReadingInput(req.body, today);
  if (hasErrors(fields)) throw validationError(fields);

  try {
    const reading = await insertReading(req.user.id, values);
    res.status(201).json({ reading });
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw await conflictOnCreate(req.user.id, values);
    }
    throw error;
  }
}

export async function editReading(req, res) {
  const id = parseReadingId(req.params.id);
  const today = todayInTimezone(config.timezone);
  const { fields, values } = validateReadingInput(req.body, today);
  if (hasErrors(fields)) throw validationError(fields);

  try {
    const reading = await updateReading(req.user.id, id, values);
    if (!reading) throw new HttpError(404, 'Reading not found.');
    res.json({ reading });
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw fieldError(409, 'slot', duplicateSlotMessage(values.slot));
    }
    throw error;
  }
}

export async function removeReading(req, res) {
  const id = parseReadingId(req.params.id);
  const deleted = await deleteReading(req.user.id, id);
  if (!deleted) throw new HttpError(404, 'Reading not found.');
  res.status(204).end();
}
