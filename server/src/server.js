import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Sweety API listening on port ${config.port} (time zone: ${config.timezone})`);
});

function shutDown() {
  server.close(() => pool.end().then(() => process.exit(0)));
}
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
