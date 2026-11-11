// One of the four daily slots: shows the recorded value, or an empty slot with an "Add" action.
export default function SlotRow({ slot, reading, onAdd, onEdit, onDelete }) {
  if (!reading) {
    return (
      <li className="slot-row">
        <span className="slot-name">{slot.label}</span>
        <span className="slot-empty">Not recorded</span>
        <span className="slot-actions">
          <button className="link-button" onClick={onAdd} aria-label={`Add ${slot.label} reading`}>
            Add
          </button>
        </span>
      </li>
    );
  }

  return (
    <li className="slot-row">
      <span className="slot-name">{slot.label}</span>
      <span className="slot-value">
        <span className="number">{reading.value}</span> <span className="unit">mg/dl</span>
      </span>
      <span className="slot-actions">
        <button className="link-button" onClick={onEdit} aria-label={`Edit ${slot.label} reading`}>
          Edit
        </button>
        <button className="link-button danger-text" onClick={onDelete} aria-label={`Delete ${slot.label} reading`}>
          Delete
        </button>
      </span>
    </li>
  );
}
