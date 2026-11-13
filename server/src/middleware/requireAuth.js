import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { findUserById } from '../queries/userQueries.js';

function authError(message, code) {
  return new HttpError(401, message, { code });
}

export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('Authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw authError('Please log in to continue.', 'UNAUTHENTICATED');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw authError('Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    throw authError('Your session is not valid. Please log in again.', 'TOKEN_INVALID');
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    throw authError('Your session is not valid. Please log in again.', 'TOKEN_INVALID');
  }

  req.user = user;
  next();
}
