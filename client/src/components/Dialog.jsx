import { useEffect, useRef } from 'react';

// A modal built on the native <dialog> element: it traps focus and closes with Esc.
// Render it only while it should be visible; it opens when it mounts.
export default function Dialog({ title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current.open) ref.current.showModal();
  }, []);

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onClose={onClose}>
      <h2 id="dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}
