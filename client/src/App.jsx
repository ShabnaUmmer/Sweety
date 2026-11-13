import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import AuthPage from './pages/AuthPage.jsx';
import PatientPage from './pages/PatientPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import ReadingsPage from './pages/ReadingsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';

// Doctors start on their patient list, patients on their daily readings.
function Home() {
  const { user } = useAuth();
  return user.role === 'doctor' ? <PatientsPage /> : <ReadingsPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="patients/:patientId" element={<PatientPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
