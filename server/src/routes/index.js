import { Router } from 'express';
import { getMeta } from '../controllers/metaController.js';
import { ROLE_DOCTOR, ROLE_PATIENT } from '../constants.js';
import { query } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import authRoutes from './authRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import readingRoutes from './readingRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

router.get('/health', async (req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok' });
});
router.get('/meta', getMeta);

router.use('/auth', authRoutes);

// Patients manage their own readings. Doctors cannot use these routes at all.
router.use('/readings', requireAuth, requireRole(ROLE_PATIENT), readingRoutes);
router.use('/reports', requireAuth, requireRole(ROLE_PATIENT), reportRoutes);

// Doctors can only read data of patients assigned to them.
router.use('/doctor', requireAuth, requireRole(ROLE_DOCTOR), doctorRoutes);

export default router;
