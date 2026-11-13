import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

// Wraps every private page: sends visitors without a login to the login page.
export default function Layout() {
  const { user, status, logout } = useAuth();

  if (status === 'loading') {
    return <p className="page-state">Loading…</p>;
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <span className="wordmark">Sweety</span>
          <nav aria-label="Main">
            {user.role === 'doctor' ? (
              <NavLink to="/" end>Patients</NavLink>
            ) : (
              <>
                <NavLink to="/" end>Readings</NavLink>
                <NavLink to="/reports">Reports</NavLink>
              </>
            )}
          </nav>
          <div className="account">
            <span>{user.name}</span>
            <button className="link-button" onClick={() => logout()}>Log out</button>
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
