import { Users, FileSpreadsheet, ClipboardList, BookOpen } from 'lucide-react';
import StatCard from '@/components/StatCard';

const DocenteDashboard = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Panel del Docente</h1>
      <p className="text-muted-foreground">Gestione sus estudiantes y registre resultados de evaluación</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Estudiantes" value="—" icon={Users} />
      <StatCard title="Evaluaciones" value="—" icon={BookOpen} variant="primary" />
      <StatCard title="Digitados" value="—" icon={FileSpreadsheet} variant="success" />
      <StatCard title="Pendientes" value="—" icon={ClipboardList} variant="warning" />
    </div>
    <div className="bg-card rounded-xl border p-6 shadow-card">
      <h2 className="text-lg font-semibold mb-2 text-foreground">Acciones Rápidas</h2>
      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
        <li>Registre o importe sus estudiantes</li>
        <li>Ingrese a Digitación para registrar respuestas</li>
        <li>Revise los resultados automáticos</li>
      </ol>
    </div>
  </div>
);

export default DocenteDashboard;
