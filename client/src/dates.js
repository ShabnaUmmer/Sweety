// Dates arrive from the API as 'YYYY-MM-DD'. They are formatted in UTC so the browser's time zone can never move them to a different day.

function toUtcDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function format(dateString, options) {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(toUtcDate(dateString));
}

export function formatDate(dateString) {
  return format(dateString, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatRange(from, to) {
  if (from === to) return formatDate(from);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = sameYear ? format(from, { day: 'numeric', month: 'short' }) : formatDate(from);
  return `${start} – ${formatDate(to)}`;
}
