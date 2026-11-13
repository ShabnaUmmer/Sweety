import { query } from '../db.js';

export async function findAssignedPatients(doctorId) {
  const result = await query(
    `SELECT u.id, u.name, u.email
     FROM doctor_patients dp
     JOIN users u ON u.id = dp.patient_id
     WHERE dp.doctor_id = $1
     ORDER BY u.name`,
    [doctorId],
  );
  return result.rows;
}

export async function findAssignedPatient(doctorId, patientId) {
  const result = await query(
    `SELECT u.id, u.name, u.email
     FROM doctor_patients dp
     JOIN users u ON u.id = dp.patient_id
     WHERE dp.doctor_id = $1 AND dp.patient_id = $2`,
    [doctorId, patientId],
  );
  return result.rows[0] ?? null;
}
