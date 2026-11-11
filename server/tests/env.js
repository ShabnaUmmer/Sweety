// Imported first by helpers.js so the config module sees test settings.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-only-secret-not-for-real-use';
