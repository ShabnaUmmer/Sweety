import { useId } from 'react';

export default function Field({ label, error, as: Control = 'input', children, ...controlProps }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...controlProps}
      >
        {children}
      </Control>
      {error && (
        <p className="field-error" id={errorId}>
          <span className="visually-hidden">Error: </span>
          {error}
        </p>
      )}
    </div>
  );
}
