import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const MetaContext = createContext(null);

// Loads the server's slot list, limits and "today" once, before anything else is shown.
export function MetaProvider({ children }) {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setError('');
    api
      .get('/meta')
      .then((data) => {
        if (!ignore) setMeta(data);
      })
      .catch((requestError) => {
        if (!ignore) setError(requestError.message);
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <div className="page-state" role="alert">
        <p>{error}</p>
        <button className="button" onClick={() => setAttempt((count) => count + 1)}>
          Try again
        </button>
      </div>
    );
  }
  if (!meta) {
    return <p className="page-state">Loading…</p>;
  }
  return <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>;
}

export function useMeta() {
  return useContext(MetaContext);
}
