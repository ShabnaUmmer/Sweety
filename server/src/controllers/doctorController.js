import { findAssignedPatients } from '../queries/doctorQueries.js';
import { readingsForDate } from './readingsController.js';
import { createReport } from './reportsController.js';


export async function listPatients(req, res) {
  res.json({ patients: await findAssignedPatients(req.user.id) });
}

export function getPatient(req, res) {
  res.json({ patient: req.patient });
}

export async function getPatientReadings(req, res) {
  const readings = await readingsForDate(req.patient.id, req.query.date);
  res.json({ date: req.query.date, readings });
}

export async function getPatientReport(req, res) {
  res.json(await createReport(req.patient.id, req.params.type, req.query.date));
}
