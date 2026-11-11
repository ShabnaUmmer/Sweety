import 'dotenv/config';

const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. See server/.env.example.`);
  }
  return value;
}

const timezone = process.env.APP_TIMEZONE || 'Asia/Kolkata';
try {
  new Intl.DateTimeFormat('en-US', { timeZone: timezone });
} catch {
  throw new Error(`APP_TIMEZONE is not a valid IANA time zone: ${timezone}`);
}

if (isTest && process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL must be different from DATABASE_URL: tests delete data.');
}

const jwtSecret = requireEnv('JWT_SECRET');
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

export const config = {
  isTest,
  isProduction,
  port: Number(process.env.PORT) || 4000,
  databaseUrl: requireEnv(isTest ? 'TEST_DATABASE_URL' : 'DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  timezone,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
