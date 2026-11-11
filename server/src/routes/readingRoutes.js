import { Router } from 'express';
import {
  createReading,
  editReading,
  listReadings,
  removeReading,
} from '../controllers/readingsController.js';

const router = Router();
router.get('/', listReadings);
router.post('/', createReading);
router.put('/:id', editReading);
router.delete('/:id', removeReading);

export default router;
