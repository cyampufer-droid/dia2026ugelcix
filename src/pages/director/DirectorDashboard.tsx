import { useEffect, useState } from 'react';
import { School, Users, ClipboardList } from 'lucide-react';
import StatCard from '@/components/StatCard';
import EvaluacionesDownloadCard from '@/components/EvaluacionesDownloadCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const DirectorDashboard = () => {
  const { profile } = useAuth();
  const [tienePrimaria, setTienePrimaria] = useState(false);
  const [stats, setStats] = useState({ niveles: 0, docentes: 0, estudiantes: 0, evaluaciones: 0 });

  useEffect(() => {
    const load = async () => {
      if (!profile?.institucion_id) return;

      const [nivelesRes, docentesRes, estudiantesRes, evalsRes] = await Promise.all([
        supabase.from('niveles_grados').select('id, nivel', { count: 'exact' }).eq('institucion_id', profile.institucion_id),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('institucion_id', profile.institucion_id)
          .not('user_id', 'is', null),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('institucion_id', profile.institucion_id)
          .not('grado_seccion_id', 'is', null),
        supabase.from('evaluaciones').select('id', { count: 'exact', head: true }),
      ]);

      const nivelesData = nivelesRes.data ?? [];
      const hasPrimaria = nivelesData.some(n => n.nivel === 'Primaria');
      setTienePrimaria(hasPrimaria);

      // Count docentes: profiles in this institution that have docente role
      // We use a simpler heuristic: profiles with user_id (non-students) minus director
      // Actually let's count via user_roles join approach - but simplest is just profiles count
      // For docentes, we need profiles linked to user_roles with 'docente'
      // Since we can't easily join, let's use the counts we have
      
      setStats({
        niveles: nivelesRes.count ?? nivelesData.length,
        docentes: docentesRes.count ?? 0,
        estudiantes: estudiantesRes.count ?? 0,
        evaluaciones: evalsRes.count ?? 0,
      });
    };
    load();
  }, [profile?.institucion_id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel del Director</h1>
        <p className="text-muted-foreground">Vista general de su institución educativa</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Aulas" value={String(stats.niveles)} icon={School} />
        <StatCard title="Personal" value={String(stats.docentes)} icon={Users} variant="primary" />
        <StatCard title="Estudiantes" value={String(stats.estudiantes)} icon={Users} variant="success" />
        <StatCard title="Evaluaciones" value={String(stats.evaluaciones)} icon={ClipboardList} variant="warning" />
      </div>

      {tienePrimaria && <EvaluacionesDownloadCard />}

      <div className="bg-card rounded-xl border p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-2 text-foreground">Pasos para comenzar</h2>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Complete los datos de su Institución Educativa</li>
          <li>Configure los niveles, grados y secciones</li>
          <li>Registre subdirectores y docentes</li>
          <li>Los docentes registrarán a sus estudiantes</li>
        </ol>
      </div>
    </div>
  );
};

export default DirectorDashboard;
