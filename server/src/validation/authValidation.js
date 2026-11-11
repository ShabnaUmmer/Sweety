import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from '../constants.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;

const text = (value) => (typeof value === 'string' ? value.trim() : '');

export function validateRegistration(body) {
  const input = body ?? {};
  const name = text(input.name);
  const email = text(input.email).toLowerCase();
  const password = typeof input.password === 'string' ? input.password : '';
  const fields = {};

  if (!name) {
    fields.name = 'Please enter your name.';
  } else if (name.length > NAME_MAX_LENGTH) {
    fields.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!email) {
    fields.email = 'Please enter your email.';
  } else if (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX_LENGTH) {
    fields.email = 'Please enter a valid email address.';
  }

  if (!password) {
    fields.password = 'Please enter a password.';
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    fields.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  } else if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
    fields.password = `Password is too long (maximum ${PASSWORD_MAX_BYTES} bytes).`;
  }

  return { fields, values: { name, email, password } };
}

export function validateLogin(body) {
  const input = body ?? {};
  const email = text(input.email).toLowerCase();
  const password = typeof input.password === 'string' ? input.password : '';
  const fields = {};

  if (!email) fields.email = 'Please enter your email.';
  if (!password) fields.password = 'Please enter your password.';

  return { fields, values: { email, password } };
}
