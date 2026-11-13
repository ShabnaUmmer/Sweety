import { HttpError } from '../errors.js';

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      throw new HttpError(403, 'You do not have permission to do this.', { code: 'FORBIDDEN' });
    }
    next();
  };
}
