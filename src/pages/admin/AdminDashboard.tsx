import { Users, School, ClipboardList, BarChart3 } from 'lucide-react';
import StatCard from '@/components/StatCard';

const AdminDashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
        <p className="text-muted-foreground">Gestión integral del sistema de diagnóstico UGEL Chiclayo 2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Instituciones" value="—" icon={School} description="Registradas" />
        <StatCard title="Docentes" value="—" icon={Users} description="Activos" variant="primary" />
        <StatCard title="Estudiantes" value="—" icon={Users} description="Registrados" variant="success" />
        <StatCard title="Evaluaciones" value="—" icon={ClipboardList} description="Configuradas" variant="warning" />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-2">Inicio Rápido</h2>
        <p className="text-sm text-muted-foreground">
          Para comenzar, registre instituciones educativas y asigne roles a directores, docentes y especialistas desde el módulo de Usuarios.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
