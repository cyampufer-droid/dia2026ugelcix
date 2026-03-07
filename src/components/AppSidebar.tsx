import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, School, BookOpen, ClipboardList,
  BarChart3, LogOut, GraduationCap, UserCog, Building2, FileSpreadsheet, UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const roleNavItems: Record<string, NavItem[]> = {
  administrador: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Usuarios', icon: Users, path: '/admin/usuarios' },
    { label: 'Instituciones', icon: Building2, path: '/admin/instituciones' },
    { label: 'Resultados', icon: BarChart3, path: '/admin/resultados' },
    { label: 'Mi Perfil', icon: UserCircle, path: '/perfil' },
  ],
  director: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/director' },
    { label: 'Institución', icon: School, path: '/director/institucion' },
    { label: 'Niveles y Grados', icon: GraduationCap, path: '/director/niveles' },
    { label: 'Personal', icon: UserCog, path: '/director/personal' },
    { label: 'Resultados', icon: BarChart3, path: '/director/resultados' },
    { label: 'Mi Perfil', icon: UserCircle, path: '/perfil' },
  ],
  subdirector: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/director' },
    { label: 'Institución', icon: School, path: '/director/institucion' },
    { label: 'Niveles y Grados', icon: GraduationCap, path: '/director/niveles' },
    { label: 'Personal', icon: UserCog, path: '/director/personal' },
    { label: 'Resultados', icon: BarChart3, path: '/director/resultados' },
    { label: 'Mi Perfil', icon: UserCircle, path: '/perfil' },
  ],
  docente: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/docente' },
    { label: 'Estudiantes', icon: Users, path: '/docente/estudiantes' },
    { label: 'Digitación', icon: FileSpreadsheet, path: '/docente/digitacion' },
    { label: 'Resultados', icon: ClipboardList, path: '/docente/resultados' },
    { label: 'Mi Perfil', icon: UserCircle, path: '/perfil' },
  ],
  especialista: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/especialista' },
    { label: 'Reportes', icon: BarChart3, path: '/especialista/reportes' },
    { label: 'Mi Perfil', icon: UserCircle, path: '/perfil' },
  ],
  estudiante: [
    { label: 'Mis Pruebas', icon: BookOpen, path: '/estudiante' },
    { label: 'Resultados', icon: ClipboardList, path: '/estudiante/resultados' },
    { label: 'Mi Perfil', icon: UserCircle, path: '/perfil' },
  ],
  padre: [
    { label: 'Resultados', icon: ClipboardList, path: '/estudiante/resultados' },
    { label: 'Mi Perfil', icon: UserCircle, path: '/perfil' },
  ],
};

const AppSidebar = () => {
  const { primaryRole, profile, signOut, isPIP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // PIP docentes see director navigation
  const effectiveRole = (isPIP && primaryRole === 'docente') ? 'director' : primaryRole;
  const items = effectiveRole ? (roleNavItems[effectiveRole] || []) : [];

  const roleLabels: Record<string, string> = {
    administrador: 'Administrador',
    director: 'Director',
    subdirector: 'Subdirector',
    docente: 'Docente',
    especialista: 'Especialista UGEL',
    estudiante: 'Estudiante',
    padre: 'Padre de Familia',
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold tracking-tight">UGEL Chiclayo</h1>
        <p className="text-xs opacity-70 mt-1">Diagnóstico Integral 2026</p>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <p className="text-sm font-medium truncate">{profile?.nombre_completo || 'Usuario'}</p>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
          {isPIP ? 'Docente PIP' : (primaryRole ? roleLabels[primaryRole] : 'Sin rol')}
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => { signOut(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
