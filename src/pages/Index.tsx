import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const roleRoutes: Record<string, string> = {
  administrador: '/admin',
  director: '/director',
  subdirector: '/director',
  docente: '/docente',
  especialista: '/especialista',
  estudiante: '/estudiante',
  padre: '/estudiante/resultados',
};

const Index = () => {
  const { user, primaryRole, loading, isPIP } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // PIP docentes go to director dashboard
  if (isPIP && primaryRole === 'docente') return <Navigate to="/director" replace />;

  const destination = primaryRole ? (roleRoutes[primaryRole] || '/login') : '/login';
  return <Navigate to={destination} replace />;
};

export default Index;
