const BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'sweety.token';

export class ApiError extends Error {
  constructor(status, message, fields, code) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

// The token lives in sessionStorage: it is cleared when the tab closes.
export const tokenStore = {
  get() {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage can be blocked; the user simply has to log in again after a reload.
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};

// Called when the server says the saved login is no longer valid (expired or invalid token).
let handleSessionEnded = () => {};
export function setSessionEndedHandler(handler) {
  handleSessionEnded = handler;
}

async function request(path, { method = 'GET', body } = {}) {
  const token = tokenStore.get();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${BASE_URL}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = data?.error ?? {};
    const message = error.message ?? 'Something went wrong. Please try again.';
    if (response.status === 401 && token) {
      handleSessionEnded(message);
    }
    throw new ApiError(response.status, message, error.fields, error.code);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
