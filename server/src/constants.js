export const SLOTS = [
  { value: 'morning_fasting', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

// Because every reading uses one of these slots and a slot can be used once per day,
// the daily maximum is simply the number of slots. The database UNIQUE constraint enforces it.
export const MAX_READINGS_PER_DAY = SLOTS.length;

export const GLUCOSE_MIN = 40;
export const GLUCOSE_MAX = 600;

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores anything past 72 bytes, so longer passwords are rejected instead of silently cut.
export const PASSWORD_MAX_BYTES = 72;

export function slotLabel(slotValue) {
  const slot = SLOTS.find((item) => item.value === slotValue);
  return slot ? slot.label : slotValue;
}

export function slotOrder(slotValue) {
  return SLOTS.findIndex((item) => item.value === slotValue);
}
