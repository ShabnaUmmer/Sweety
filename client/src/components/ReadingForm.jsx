import { useState } from 'react';
import { api } from '../api.js';
import { useMeta } from '../meta.jsx';
import Field from './Field.jsx';

// Adds a new reading, or edits one when `reading.id` is set. The server does all validation;
// this form only shows the messages it sends back, next to the matching input.
export default function ReadingForm({ reading, onSaved, onCancel }) {
  const { slots, today } = useMeta();
  const isEditing = Boolean(reading.id);

  const [date, setDate] = useState(reading.date);
  const [slot, setSlot] = useState(reading.slot);
  const [value, setValue] = useState(String(reading.value ?? ''));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError('');

    const payload = { date, slot, value };
    try {
      const data = isEditing
        ? await api.put(`/readings/${reading.id}`, payload)
        : await api.post('/readings', payload);
      onSaved(data.reading, isEditing);
    } catch (error) {
      if (error.fields) {
        setErrors(error.fields);
      } else {
        setFormError(error.message);
      }
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field
        label="Date"
        type="date"
        max={today}
        value={date}
        onChange={(event) => setDate(event.target.value)}
        error={errors.date}
      />
      <Field
        label="Time slot"
        as="select"
        value={slot}
        onChange={(event) => setSlot(event.target.value)}
        error={errors.slot}
      >
        {slots.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </Field>
      <Field
        label="Glucose (mg/dl)"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={errors.value}
      />
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="button-row">
        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving…' : 'Save reading'}
        </button>
        <button type="button" className="button secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
