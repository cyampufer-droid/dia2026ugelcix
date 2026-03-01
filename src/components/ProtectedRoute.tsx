import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'estudiante' | 'docente' | 'director' | 'subdirector' | 'especialista' | 'padre' | 'administrador';

interface ProtectedRouteProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const hasAccess = roles.some(role => allowedRoles.includes(role));
  if (!hasAccess) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
