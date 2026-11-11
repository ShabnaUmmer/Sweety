import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Field from '../components/Field.jsx';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { status, notice, login, register } = useAuth();

  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'loading') {
    return <p className="page-state">Loading…</p>;
  }
  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  function updateValue(name) {
    return (event) => setValues({ ...values, [name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError('');
    try {
      if (isRegister) {
        await register(values);
      } else {
        await login(values.email, values.password);
      }
    } catch (error) {
      if (error.fields) {
        setErrors(error.fields);
      } else {
        setFormError(error.message);
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <p className="wordmark">Sweety</p>
      <h1>{isRegister ? 'Create account' : 'Log in'}</h1>

      {notice && <p className="form-error" role="alert">{notice}</p>}

      <form onSubmit={handleSubmit} noValidate>
        {isRegister && (
          <Field label="Name" autoComplete="name" value={values.name} onChange={updateValue('name')} error={errors.name} />
        )}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={updateValue('email')}
          error={errors.email}
        />
        <Field
          label="Password"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={values.password}
          onChange={updateValue('password')}
          error={errors.password}
        />
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="auth-switch">
        {isRegister ? (
          <>Already have an account? <Link to="/login">Log in</Link></>
        ) : (
          <>New to Sweety? <Link to="/register">Create an account</Link></>
        )}
      </p>
    </main>
  );
}
