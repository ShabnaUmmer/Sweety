import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ReportsPage from './ReportsPage.jsx';

// A doctor viewing one assigned patient's reports (read-only).
export default function PatientPage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    setPatient(null);
    setErrorMessage('');
    api
      .get(`/doctor/patients/${patientId}`)
      .then((data) => {
        if (!ignore) setPatient(data.patient);
      })
      .catch((error) => {
        if (!ignore) setErrorMessage(error.message);
      });
    return () => {
      ignore = true;
    };
  }, [patientId]);

  return (
    <>
      <Link className="back-link" to="/">Back to patients</Link>
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      {!patient && !errorMessage && <p>Loading…</p>}
      {patient && <ReportsPage patient={patient} />}
    </>
  );
}
