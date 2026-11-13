import './env.js';
import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  addReading,
  app,
  assignPatient,
  authHeader,
  closeDatabase,
  registerDoctor,
  registerUser,
  resetData,
  setupDatabase,
} from './helpers.js';

const DATE = '2026-10-15';

before(setupDatabase);
beforeEach(resetData);
after(closeDatabase);

// A doctor with one assigned patient and one patient who is not assigned.
async function createDoctorWithPatients() {
  const doctor = await registerDoctor();
  const assigned = await registerUser({ name: 'Assigned Patient' });
  const unassigned = await registerUser({ name: 'Unassigned Patient' });
  await assignPatient(doctor.user.id, assigned.user.id);
  return { doctor, assigned, unassigned };
}

const get = (token, path) => request(app).get(path).set(authHeader(token));

describe('doctor role', () => {
  it('lists only the patients assigned to the doctor', async () => {
    const { doctor, assigned } = await createDoctorWithPatients();

    const response = await get(doctor.token, '/api/doctor/patients');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.patients.map((patient) => patient.id), [assigned.user.id]);
  });

  it('lets a doctor view an assigned patient\'s readings and reports', async () => {
    const { doctor, assigned } = await createDoctorWithPatients();
    await addReading(assigned.token, { date: DATE, slot: 'morning_fasting', value: 100 });
    await addReading(assigned.token, { date: DATE, slot: 'after_dinner', value: 140 });
    const base = `/api/doctor/patients/${assigned.user.id}`;

    const readings = await get(doctor.token, `${base}/readings?date=${DATE}`);
    assert.equal(readings.body.readings.length, 2);

    const report = await get(doctor.token, `${base}/reports/daily?date=${DATE}`);
    assert.equal(report.body.count, 2);
    assert.equal(report.body.average, 120);
  });

  it('blocks a doctor from a patient who is not assigned', async () => {
    const { doctor, unassigned } = await createDoctorWithPatients();
    await addReading(unassigned.token, { date: DATE, slot: 'after_lunch', value: 130 });
    const base = `/api/doctor/patients/${unassigned.user.id}`;

    assert.equal((await get(doctor.token, `${base}/readings?date=${DATE}`)).status, 403);
    assert.equal((await get(doctor.token, `${base}/reports/daily?date=${DATE}`)).status, 403);
  });

  it('keeps doctors read-only', async () => {
    const { doctor, assigned } = await createDoctorWithPatients();
    const created = await addReading(assigned.token, { date: DATE, slot: 'after_lunch', value: 130 });
    const id = created.body.reading.id;
    const reading = { date: DATE, slot: 'after_lunch', value: 300 };

    const add = await request(app).post('/api/readings').set(authHeader(doctor.token)).send(reading);
    const edit = await request(app).put(`/api/readings/${id}`).set(authHeader(doctor.token)).send(reading);
    const remove = await request(app).delete(`/api/readings/${id}`).set(authHeader(doctor.token));
    assert.deepEqual([add.status, edit.status, remove.status], [403, 403, 403]);

    const after = await get(assigned.token, `/api/readings?date=${DATE}`);
    assert.equal(after.body.readings[0].value, 130);
  });

  it('keeps patients out of the doctor endpoints', async () => {
    const { assigned } = await createDoctorWithPatients();
    const response = await get(assigned.token, '/api/doctor/patients');
    assert.equal(response.status, 403);
  });
});
