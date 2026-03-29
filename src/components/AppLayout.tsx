import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from './AppSidebar';
import HelpWidget from './HelpWidget';
import { Badge } from '@/components/ui/badge';
import { Shield, GraduationCap, School, Users, BookOpen, Briefcase } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  administrador: { label: 'Administrador', icon: Shield, color: 'bg-destructive text-destructive-foreground' },
  director: { label: 'Director(a)', icon: School, color: 'bg-primary text-primary-foreground' },
  subdirector: { label: 'Subdirector(a)', icon: School, color: 'bg-primary text-primary-foreground' },
  docente: { label: 'Docente', icon: GraduationCap, color: 'bg-secondary text-secondary-foreground' },
  especialista: { label: 'Especialista UGEL', icon: Briefcase, color: 'bg-accent text-accent-foreground' },
  estudiante: { label: 'Estudiante', icon: BookOpen, color: 'bg-muted text-muted-foreground' },
  padre: { label: 'Padre de Familia', icon: Users, color: 'bg-muted text-muted-foreground' },
};

const AppLayout = () => {
  const { user, loading, primaryRole, profile } = useAuth();
  usePresenceHeartbeat();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const rc = primaryRole ? roleConfig[primaryRole] : null;

  return (
    <SidebarProvider>
      <HelpWidget />
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-foreground" />
              {rc && (
                <Badge className={`gap-1.5 px-3 py-1 text-xs font-semibold ${rc.color}`}>
                  <rc.icon className="h-3.5 w-3.5" />
                  {rc.label}
                </Badge>
              )}
              <span className="text-sm font-medium text-foreground hidden sm:inline">{profile?.nombre_completo}</span>
            </div>
            <span className="text-xs text-muted-foreground hidden md:inline">DIA 2026 · GRED Lambayeque</span>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
