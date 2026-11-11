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

const RANGE_BY_REPORT_TYPE = {
  daily: dailyRange,
  'month-to-date': monthToDateRange,
  monthly: previousMonthRange,
};

export async function getReport(req, res) {
  const { type } = req.params;
  if (!Object.hasOwn(RANGE_BY_REPORT_TYPE, type)) {
    throw new HttpError(404, 'Unknown report type.');
  }

  const today = todayInTimezone(config.timezone);
  const date = req.query.date ?? today;
  if (!isValidDateString(date)) {
    throw fieldError(400, 'date', 'Enter a valid date.');
  }
  if (date > today) {
    throw fieldError(400, 'date', 'Date cannot be in the future.');
  }

  const { from, to } = RANGE_BY_REPORT_TYPE[type](date);
  const summary = await getSummary(req.user.id, from, to);
  const report = { type, date, from, to, ...summary };

  if (type === 'daily') {
    report.readings = sortBySlot(await findReadingsByDate(req.user.id, date));
  }
  res.json(report);
}
