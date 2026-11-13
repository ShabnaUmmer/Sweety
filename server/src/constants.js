export const SLOTS = [
  { value: 'morning_fasting', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

export const MAX_READINGS_PER_DAY = SLOTS.length;

export const GLUCOSE_MIN = 40;
export const GLUCOSE_MAX = 600;

export const PASSWORD_MIN_LENGTH = 8;

export const ROLE_PATIENT = 'patient';
export const ROLE_DOCTOR = 'doctor';

export function slotLabel(slotValue) {
  const slot = SLOTS.find((item) => item.value === slotValue);
  return slot ? slot.label : slotValue;
}

export function slotOrder(slotValue) {
  return SLOTS.findIndex((item) => item.value === slotValue);
}
