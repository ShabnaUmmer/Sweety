import { Router } from 'express';
import { getMeta } from '../controllers/metaController.js';
import { query } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import authRoutes from './authRoutes.js';
import readingRoutes from './readingRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

router.get('/health', async (req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok' });
});
router.get('/meta', getMeta);

router.use('/auth', authRoutes);
// Everything below needs a valid login.
router.use('/readings', requireAuth, readingRoutes);
router.use('/reports', requireAuth, reportRoutes);

export default router;
