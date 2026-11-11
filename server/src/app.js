import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  // In development the Vite server forwards /api to this server, so no CORS is involved.
  // Direct calls from another origin are allowed only for the origins listed in CLIENT_ORIGIN.
  app.use(cors({ origin: config.clientOrigins }));
  app.use(express.json({ limit: '10kb' }));

  app.use('/api', apiRouter);
  app.use('/api', apiNotFound);

  app.use(errorHandler);
  return app;
}
