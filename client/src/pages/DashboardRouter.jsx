import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'Citizen') return <Navigate to="/citizen" replace />;
  if (user.role === 'Volunteer') return <Navigate to="/volunteer" replace />;
  if (user.role === 'Admin') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
}
