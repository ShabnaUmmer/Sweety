import { HttpError } from '../errors.js';
import { findAssignedPatient } from '../queries/doctorQueries.js';

// For /patients/:patientId routes. The doctor must be assigned to that patient in the database.
export async function requireAssignedPatient(req, res, next) {
  const patientId = Number(req.params.patientId);
  const patient = Number.isInteger(patientId)
    ? await findAssignedPatient(req.user.id, patientId)
    : null;

  if (!patient) {
    throw new HttpError(403, 'You do not have access to this patient.', { code: 'FORBIDDEN' });
  }
  req.patient = patient;
  next();
}
