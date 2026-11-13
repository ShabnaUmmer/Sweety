import { Router } from 'express';
import {
  getPatient,
  getPatientReadings,
  getPatientReport,
  listPatients,
} from '../controllers/doctorController.js';
import { requireAssignedPatient } from '../middleware/requireAssignedPatient.js';

// Only GET routes exist: doctors have read-only access.
const router = Router();
router.get('/patients', listPatients);
router.get('/patients/:patientId', requireAssignedPatient, getPatient);
router.get('/patients/:patientId/readings', requireAssignedPatient, getPatientReadings);
router.get('/patients/:patientId/reports/:type', requireAssignedPatient, getPatientReport);

export default router;
