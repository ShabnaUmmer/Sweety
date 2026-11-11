import { config } from '../config.js';
import { GLUCOSE_MAX, GLUCOSE_MIN, SLOTS } from '../constants.js';
import { todayInTimezone } from '../dates.js';

// Lets the client use the server's idea of "today" and the same slot list and limits,
// so those rules live in one place.
export function getMeta(req, res) {
  res.json({
    today: todayInTimezone(config.timezone),
    timezone: config.timezone,
    slots: SLOTS,
    glucoseMin: GLUCOSE_MIN,
    glucoseMax: GLUCOSE_MAX,
  });
}
