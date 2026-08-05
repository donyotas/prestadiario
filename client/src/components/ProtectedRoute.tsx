import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Rol } from '../types';

export function ProtectedRoute({ roles }: { roles?: Rol[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;

  return <Outlet />;
}
