import { HttpError } from '../errors.js';

export function apiNotFound(req, res) {
  res.status(404).json({ error: { message: 'Not found.' } });
}

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { message: err.message, fields: err.fields, code: err.code },
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Request body must be valid JSON.' } });
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
}
