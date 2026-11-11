import pg from 'pg';
import { config } from './config.js';

// PostgreSQL error code for a violated UNIQUE constraint.
export const UNIQUE_VIOLATION = '23505';

// By default pg turns DATE columns into JavaScript Date objects in the server's
// local time zone, which can shift the calendar day. Keep them as 'YYYY-MM-DD' strings.
const DATE_TYPE_OID = 1082;
pg.types.setTypeParser(DATE_TYPE_OID, (value) => value);

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export function query(text, params) {
  return pool.query(text, params);
}
