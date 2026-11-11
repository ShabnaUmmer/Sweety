import { HttpError } from '../errors.js';

export function apiNotFound(req, res) {
  res.status(404).json({ error: { message: 'Not found.' } });
}

// Express recognises error handlers by their four arguments.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { message: err.message, fields: err.fields, code: err.code },
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Request body must be valid JSON.' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'Request body is too large.' } });
  }

  // Details stay in the server log; the client only gets a generic message.
  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
}
