import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

// Doctor's home page: the patients assigned to this doctor.
export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    api
      .get('/doctor/patients')
      .then((data) => {
        if (ignore) return;
        setPatients(data.patients);
        setStatus('ready');
      })
      .catch((error) => {
        if (ignore) return;
        setErrorMessage(error.message);
        setStatus('error');
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  return (
    <>
      <h1>Your patients</h1>

      {status === 'loading' && <p>Loading patients…</p>}

      {status === 'error' && (
        <div role="alert">
          <p>{errorMessage}</p>
          <button className="button secondary" onClick={() => setAttempt((count) => count + 1)}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && patients.length === 0 && <p>No patients are assigned to you yet.</p>}

      {status === 'ready' && patients.length > 0 && (
        <ul className="patient-list">
          {patients.map((patient) => (
            <li key={patient.id}>
              <span>
                <strong>{patient.name}</strong> <span className="patient-email">{patient.email}</span>
              </span>
              <Link to={`/patients/${patient.id}`}>View reports</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
