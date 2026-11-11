import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import Dialog from '../components/Dialog.jsx';
import Field from '../components/Field.jsx';
import ReadingForm from '../components/ReadingForm.jsx';
import SlotRow from '../components/SlotRow.jsx';
import { formatDate } from '../dates.js';
import { useMeta } from '../meta.jsx';

export default function ReadingsPage() {
  const { slots, today } = useMeta();
  const [searchParams] = useSearchParams();

  const [date, setDate] = useState(searchParams.get('date') || today);
  const [readings, setReadings] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [message, setMessage] = useState('');

  const [formReading, setFormReading] = useState(null); // reading being added or edited
  const [deleting, setDeleting] = useState(null); // reading waiting for delete confirmation
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    api
      .get(`/readings?date=${date}`)
      .then((data) => {
        if (ignore) return;
        setReadings(data.readings);
        setStatus('ready');
      })
      .catch((error) => {
        if (ignore) return;
        setLoadError(error.message);
        setStatus('error');
      });
    return () => {
      ignore = true;
    };
  }, [date, reloadCount]);

  const readingBySlot = Object.fromEntries(readings.map((reading) => [reading.slot, reading]));
  const firstEmptySlot = slots.find((slot) => !readingBySlot[slot.value]);
  const reload = () => setReloadCount((count) => count + 1);

  function handleDateChange(event) {
    if (event.target.value) {
      setMessage('');
      setDate(event.target.value);
    }
  }

  function handleSaved(saved, wasEditing) {
    setFormReading(null);
    setMessage(wasEditing ? 'Reading updated.' : 'Reading saved.');
    setDate(saved.date);
    reload();
  }

  function closeDeleteDialog() {
    setDeleting(null);
    setDeleteError('');
  }

  async function confirmDelete() {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/readings/${deleting.id}`);
      closeDeleteDialog();
      setMessage('Reading deleted.');
      reload();
    } catch (error) {
      setDeleteError(error.message);
    }
    setIsDeleting(false);
  }

  const deletingSlotLabel = deleting && slots.find((slot) => slot.value === deleting.slot)?.label;

  return (
    <>
      <h1>{date === today ? "Today's readings" : `Readings for ${formatDate(date)}`}</h1>

      <div className="toolbar">
        <Field label="Date" type="date" max={today} value={date} onChange={handleDateChange} />
        {firstEmptySlot && status === 'ready' && (
          <button
            className="button"
            onClick={() => setFormReading({ date, slot: firstEmptySlot.value, value: '' })}
          >
            Add reading
          </button>
        )}
      </div>

      <p className="status-message" role="status">{message}</p>

      {status === 'loading' && <p>Loading readings…</p>}

      {status === 'error' && (
        <div role="alert">
          <p>{loadError}</p>
          <button className="button secondary" onClick={reload}>Try again</button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <p className="summary-line">
            {readings.length === 0
              ? 'No readings recorded for this date.'
              : `${readings.length} of ${slots.length} readings recorded.`}
          </p>
          <ul className="slot-list">
            {slots.map((slot) => {
              const reading = readingBySlot[slot.value];
              return (
                <SlotRow
                  key={slot.value}
                  slot={slot}
                  reading={reading}
                  onAdd={() => setFormReading({ date, slot: slot.value, value: '' })}
                  onEdit={() => setFormReading(reading)}
                  onDelete={() => setDeleting(reading)}
                />
              );
            })}
          </ul>
        </>
      )}

      {formReading && (
        <Dialog title={formReading.id ? 'Edit reading' : 'Add reading'} onClose={() => setFormReading(null)}>
          <ReadingForm reading={formReading} onSaved={handleSaved} onCancel={() => setFormReading(null)} />
        </Dialog>
      )}

      {deleting && (
        <Dialog title="Delete this reading?" onClose={closeDeleteDialog}>
          <p>
            {deletingSlotLabel}, {formatDate(deleting.date)}:{' '}
            <strong>{deleting.value} mg/dl</strong>
          </p>
          {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
          <div className="button-row">
            <button className="button danger" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
            <button className="button secondary" onClick={closeDeleteDialog}>Cancel</button>
          </div>
        </Dialog>
      )}
    </>
  );
}
