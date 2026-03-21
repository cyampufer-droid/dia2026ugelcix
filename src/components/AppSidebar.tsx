import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, School, BookOpen, ClipboardList,
  BarChart3, LogOut, GraduationCap, UserCog, Building2, FileSpreadsheet, UserCircle, FileText
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

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
    { label: 'Planes de Refuerzo', icon: FileText, path: '/admin/planes-refuerzo' },
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
    { label: 'Usuarios', icon: Users, path: '/especialista/usuarios' },
    { label: 'Reportes', icon: BarChart3, path: '/especialista/reportes' },
    { label: 'Planes de Refuerzo', icon: FileText, path: '/especialista/planes-refuerzo' },
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

const roleLabels: Record<string, string> = {
  administrador: 'Administrador',
  director: 'Director',
  subdirector: 'Subdirector',
  docente: 'Docente',
  especialista: 'Especialista UGEL',
  estudiante: 'Estudiante',
  padre: 'Padre de Familia',
};

const AppSidebar = () => {
  const { primaryRole, profile, signOut, isPIP, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';

  const effectiveRole = (isPIP && primaryRole === 'docente') ? 'director' : primaryRole;
  const baseItems = effectiveRole ? (roleNavItems[effectiveRole] || []) : [];
  const isDirectorWithDocente = (primaryRole === 'director' || primaryRole === 'subdirector') && roles.includes('docente');
  const docenteExtras = isDirectorWithDocente
    ? (roleNavItems['docente'] || []).filter(item => !baseItems.some(b => b.path === item.path))
    : [];
  const items = [...baseItems, ...docenteExtras];

  const handleNav = (path: string) => {
    navigate(path);
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">UGEL Chiclayo</h1>
        {!collapsed && <p className="text-xs text-sidebar-foreground/70 mt-1">Diagnóstico Integral 2026</p>}
      </SidebarHeader>

      {!collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <p className="text-sm font-medium truncate text-sidebar-foreground">{profile?.nombre_completo || 'Usuario'}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
            {isPIP ? 'Docente PIP' : (primaryRole ? roleLabels[primaryRole] : 'Sin rol')}
          </span>
        </div>
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => handleNav(item.path)}
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { signOut(); navigate('/login'); }}
              tooltip="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
