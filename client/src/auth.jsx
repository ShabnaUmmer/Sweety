import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setSessionEndedHandler, tokenStore } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' while a saved token is being checked, then 'authenticated' or 'anonymous'.
  const [status, setStatus] = useState(tokenStore.get() ? 'loading' : 'anonymous');
  // Shown on the login page, e.g. "Your session has expired."
  const [notice, setNotice] = useState('');

  const logout = useCallback((message = '') => {
    tokenStore.clear();
    setUser(null);
    setStatus('anonymous');
    setNotice(message);
  }, []);

  useEffect(() => {
    setSessionEndedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get('/auth/me')
      .then((data) => {
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch((error) => {
        // A 401 has already logged the user out with its own message.
        if (error.status !== 401) logout('Could not restore your session. Please log in again.');
      });
  }, [logout]);

  function startSession(data) {
    tokenStore.set(data.token);
    setUser(data.user);
    setStatus('authenticated');
    setNotice('');
  }

  async function login(email, password) {
    startSession(await api.post('/auth/login', { email, password }));
  }

  async function register(values) {
    startSession(await api.post('/auth/register', values));
  }

  return (
    <AuthContext.Provider value={{ user, status, notice, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
