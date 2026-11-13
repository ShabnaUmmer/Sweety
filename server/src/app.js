import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(cors({ origin: config.clientOrigins }));
  app.use(express.json({ limit: '10kb' }));

  app.use('/api', apiRouter);
  app.use('/api', apiNotFound);

  app.use(errorHandler);
  return app;
}
