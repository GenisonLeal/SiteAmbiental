import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, signed, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={40} className="spinner" color="var(--color-primary)" />
      </div>
    );
  }

  // Se não tem usuário ou não tem token, não logado
  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  // Se tem rota protegida por Role
  if (allowedRoles && user.role) {
    if (!allowedRoles.includes(user.role)) {
      // Redirecionamento por default (Admin para /dashboard, cliente para /portal)
      return <Navigate to={user.role === 'cliente' ? '/portal' : '/dashboard'} replace />;
    }
  }

  return <Outlet />;
}
