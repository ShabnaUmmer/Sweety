import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { UNIQUE_VIOLATION } from '../db.js';
import { HttpError, fieldError, hasErrors, validationError } from '../errors.js';
import { createUser, findUserByEmail } from '../queries/userQueries.js';
import { validateLogin, validateRegistration } from '../validation/authValidation.js';

const BCRYPT_COST = config.isTest ? 4 : 12;

function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });
}

function publicUser({ id, name, email, role }) {
  return { id, name, email, role };
}

export async function register(req, res) {
  const { fields, values } = validateRegistration(req.body);
  if (hasErrors(fields)) throw validationError(fields);

  const passwordHash = await bcrypt.hash(values.password, BCRYPT_COST);
  try {
    const user = await createUser({ name: values.name, email: values.email, passwordHash });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw fieldError(409, 'email', 'An account with this email already exists.');
    }
    throw error;
  }
}

export async function login(req, res) {
  const { fields, values } = validateLogin(req.body);
  if (hasErrors(fields)) throw validationError(fields);

  const user = await findUserByEmail(values.email);
  const passwordMatches = user && (await bcrypt.compare(values.password, user.password_hash));
  if (!passwordMatches) {
    throw new HttpError(401, 'Incorrect email or password.', { code: 'INVALID_CREDENTIALS' });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
}

export function currentUser(req, res) {
  res.json({ user: publicUser(req.user) });
}
