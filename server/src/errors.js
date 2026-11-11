export class HttpError extends Error {
  constructor(status, message, { fields, code } = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

export function hasErrors(fields) {
  return Object.keys(fields).length > 0;
}

export function validationError(fields) {
  return new HttpError(400, 'Please fix the errors below.', { fields, code: 'VALIDATION_ERROR' });
}

// An error that belongs to one form field, so the client can show it next to that input.
export function fieldError(status, field, message) {
  return new HttpError(status, message, { fields: { [field]: message } });
}
