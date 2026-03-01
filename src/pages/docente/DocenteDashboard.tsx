import { useEffect, useState } from 'react';
import { Users, FileSpreadsheet, ClipboardList, BookOpen } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DocenteDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, evaluaciones: 0, digitados: 0, pendientes: 0 });

  useEffect(() => {
    const load = async () => {
      if (!profile?.grado_seccion_id) return;

      const [studentsRes, evalsRes, resultadosRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('grado_seccion_id', profile.grado_seccion_id),
        supabase.from('evaluaciones').select('id', { count: 'exact', head: true }),
        supabase.from('resultados').select('id', { count: 'exact', head: true }),
      ]);

      const studentCount = studentsRes.count ?? 0;
      const evalCount = evalsRes.count ?? 0;
      const digitadoCount = resultadosRes.count ?? 0;
      const total = studentCount * evalCount;

      setStats({
        students: studentCount,
        evaluaciones: evalCount,
        digitados: digitadoCount,
        pendientes: Math.max(0, total - digitadoCount),
      });
    };
    load();
  }, [profile?.grado_seccion_id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel del Docente</h1>
        <p className="text-muted-foreground">Gestione sus estudiantes y registre resultados de evaluación</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Estudiantes" value={String(stats.students)} icon={Users} />
        <StatCard title="Evaluaciones" value={String(stats.evaluaciones)} icon={BookOpen} variant="primary" />
        <StatCard title="Digitados" value={String(stats.digitados)} icon={FileSpreadsheet} variant="success" />
        <StatCard title="Pendientes" value={String(stats.pendientes)} icon={ClipboardList} variant="warning" />
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
};

export default DocenteDashboard;
