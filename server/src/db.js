import pg from 'pg';
import { config } from './config.js';

export const UNIQUE_VIOLATION = '23505';

const DATE_TYPE_OID = 1082;
pg.types.setTypeParser(DATE_TYPE_OID, (value) => value);

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export function query(text, params) {
  return pool.query(text, params);
}
