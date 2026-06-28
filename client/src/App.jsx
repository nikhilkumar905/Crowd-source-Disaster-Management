import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import Spinner from './components/ui/Spinner';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardRouter = lazy(() => import('./pages/DashboardRouter'));
const HeroPage = lazy(() => import('./pages/HeroPage'));

const CitizenDashboard = lazy(() => import('./pages/citizen/CitizenDashboard'));
const VolunteerDashboard = lazy(() => import('./pages/volunteer/VolunteerDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function RouteFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100svh', background: 'rgb(8,12,20)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1.5rem 2rem', borderRadius: '16px',
        background: 'rgba(13,20,34,0.9)', border: '1px solid rgba(30,42,70,0.6)',
        fontSize: '0.9rem', fontWeight: 700, color: '#e8f0ff',
      }}>
        <span className="spinner" />
        <span>Loading NEXUS Response...</span>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HeroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardRouter />} />

            <Route element={<ProtectedRoute roles={['Citizen']} />}>
              <Route path="/citizen" element={<CitizenDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Volunteer']} />}>
              <Route path="/volunteer" element={<VolunteerDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
