import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Field from '../components/Field.jsx';
import ReportSection from '../components/ReportSection.jsx';
import { useMeta } from '../meta.jsx';

export default function ReportsPage() {
  const { slots, today } = useMeta();

  const [date, setDate] = useState(today);
  const [reports, setReports] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    Promise.all([
      api.get(`/reports/daily?date=${date}`),
      api.get(`/reports/month-to-date?date=${date}`),
      api.get(`/reports/monthly?date=${date}`),
    ])
      .then(([daily, monthToDate, monthly]) => {
        if (ignore) return;
        setReports({ daily, monthToDate, monthly });
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
  }, [date, attempt]);

  function slotLabel(slotValue) {
    return slots.find((slot) => slot.value === slotValue)?.label ?? slotValue;
  }

  return (
    <>
      <h1>Reports</h1>

      <div className="toolbar">
        <Field
          label="Report date"
          type="date"
          max={today}
          value={date}
          onChange={(event) => event.target.value && setDate(event.target.value)}
        />
      </div>

      {status === 'loading' && <p role="status">Loading reports…</p>}

      {status === 'error' && (
        <div role="alert">
          <p>{errorMessage}</p>
          <button className="button secondary" onClick={() => setAttempt((count) => count + 1)}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <ReportSection title="Daily report" report={reports.daily} addDate={date}>
            {reports.daily.readings.length > 0 && (
              <table className="reading-table">
                <caption className="visually-hidden">Readings on the selected date</caption>
                <thead>
                  <tr>
                    <th scope="col">Time slot</th>
                    <th scope="col">Glucose</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.daily.readings.map((reading) => (
                    <tr key={reading.id}>
                      <td>{slotLabel(reading.slot)}</td>
                      <td><span className="number">{reading.value}</span> <span className="unit">mg/dl</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <ReportSection title="Month-to-date report" report={reports.monthToDate} addDate={date} />

          <ReportSection title="Monthly report (previous month)" report={reports.monthly} addDate={today} />
        </>
      )}
    </>
  );
}
