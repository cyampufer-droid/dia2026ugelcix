import { useEffect, useState } from 'react';
import { School, Users, ClipboardList, BarChart3 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import EvaluacionesDownloadCard from '@/components/EvaluacionesDownloadCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const DirectorDashboard = () => {
  const { profile } = useAuth();
  const [tienePrimaria, setTienePrimaria] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!profile?.institucion_id) return;
      const { count } = await supabase
        .from('niveles_grados')
        .select('id', { count: 'exact', head: true })
        .eq('institucion_id', profile.institucion_id)
        .eq('nivel', 'Primaria');
      setTienePrimaria((count ?? 0) > 0);
    };
    check();
  }, [profile?.institucion_id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel del Director</h1>
        <p className="text-muted-foreground">Vista general de su institución educativa</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Niveles" value="—" icon={School} />
        <StatCard title="Docentes" value="—" icon={Users} variant="primary" />
        <StatCard title="Estudiantes" value="—" icon={Users} variant="success" />
        <StatCard title="Evaluaciones" value="—" icon={ClipboardList} variant="warning" />
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
