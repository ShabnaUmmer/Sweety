const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toUtcDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateString(utcDate) {
  return utcDate.toISOString().slice(0, 10);
}

export function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    return false;
  }
  return toDateString(toUtcDate(value)) === value;
}

export function todayInTimezone(timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function shiftDate(dateString, days) {
  const date = toUtcDate(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
}

export function dailyRange(date) {
  return { from: date, to: date };
}

export function monthToDateRange(date) {
  return { from: `${date.slice(0, 7)}-01`, to: date };
}

export function previousMonthRange(date) {
  const [year, month] = date.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 2, 1));
  const last = new Date(Date.UTC(year, month - 1, 0));
  return { from: toDateString(first), to: toDateString(last) };
}
