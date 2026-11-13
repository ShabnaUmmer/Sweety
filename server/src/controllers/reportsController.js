import { config } from '../config.js';
import {
  dailyRange,
  isValidDateString,
  monthToDateRange,
  previousMonthRange,
  todayInTimezone,
} from '../dates.js';
import { HttpError, fieldError } from '../errors.js';
import { findReadingsByDate } from '../queries/readingQueries.js';
import { getSummary } from '../queries/reportQueries.js';
import { sortBySlot } from './readingsController.js';

function getRange(type, date) {
  if (type === 'daily') return dailyRange(date);
  if (type === 'month-to-date') return monthToDateRange(date);
  if (type === 'monthly') return previousMonthRange(date);
  return null;
}

// Builds a report for one user. Doctors call this with a patient's id.
export async function createReport(userId, type, dateParam) {
  const today = todayInTimezone(config.timezone);
  const date = dateParam ?? today;

  if (!getRange(type, today)) {
    throw new HttpError(404, 'Unknown report type.');
  }
  if (!isValidDateString(date)) {
    throw fieldError(400, 'date', 'Enter a valid date.');
  }
  if (date > today) {
    throw fieldError(400, 'date', 'Date cannot be in the future.');
  }

  const { from, to } = getRange(type, date);
  const summary = await getSummary(userId, from, to);
  const report = { type, date, from, to, ...summary };

  if (type === 'daily') {
    report.readings = sortBySlot(await findReadingsByDate(userId, date));
  }
  return report;
}

export async function getReport(req, res) {
  res.json(await createReport(req.user.id, req.params.type, req.query.date));
}
