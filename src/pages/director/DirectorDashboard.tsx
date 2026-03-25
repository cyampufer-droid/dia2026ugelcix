import { useEffect, useState } from 'react';
import { School, Users, ClipboardList, UserCog, GraduationCap, Lightbulb } from 'lucide-react';
import StatCard from '@/components/StatCard';
import EvaluacionesDownloadCard from '@/components/EvaluacionesDownloadCard';
import PlanRefuerzoButton from '@/components/PlanRefuerzoButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const DirectorDashboard = () => {
  const { profile } = useAuth();
  const [tienePrimaria, setTienePrimaria] = useState(false);
  const [tieneSecundaria, setTieneSecundaria] = useState(false);
  const [stats, setStats] = useState({
    aulas: 0, directores: 0, subdirectores: 0, docentes: 0, docentesPip: 0, estudiantes: 0, evaluaciones: 0, tieneResultados: false,
  });

  useEffect(() => {
    const load = async () => {
      if (!profile?.institucion_id) return;

      try {
        // Get institution levels first
        const { data: nivelesRes } = await supabase
          .from('niveles_grados')
          .select('id, nivel')
          .eq('institucion_id', profile.institucion_id);
        
        const nivelesData = nivelesRes || [];
        setTienePrimaria(nivelesData.some(n => n.nivel === 'Primaria'));
        setTieneSecundaria(nivelesData.some(n => n.nivel === 'Secundaria'));

        // Optimized: Use RPC for director stats
        const { data: statsData, error } = await supabase.rpc('get_director_stats', { 
          _institucion_id: profile.institucion_id 
        });

        if (!error && statsData && statsData.length > 0) {
          const s = statsData[0];
          // Quick check: just get 1 student with a result to know if results exist
          const { data: sampleStudent } = await supabase
            .from('profiles')
            .select('id')
            .eq('institucion_id', profile.institucion_id)
            .not('grado_seccion_id', 'is', null)
            .limit(1);
          
          let resCount = 0;
          if (sampleStudent?.length) {
            const { count } = await supabase
              .from('resultados')
              .select('id', { count: 'exact', head: true })
              .eq('estudiante_id', sampleStudent[0].id);
            resCount = count ?? 0;
          }

          setStats({
            aulas: Number(s.aulas_count) || nivelesData.length,
            directores: Number(s.directores_count) || 0,
            subdirectores: Number(s.subdirectores_count) || 0,
            docentes: Number(s.docentes_count) || 0,
            docentesPip: Number(s.pip_count) || 0,
            estudiantes: Number(s.estudiantes_count) || 0,
            evaluaciones: Number(s.evaluaciones_count) || 0,
            tieneResultados: (resCount ?? 0) > 0,
          });
        } else {
          console.warn('Director RPC failed, using fallback:', error);
          // Fallback to original method
          const instId = profile.institucion_id;
          const [rolesRes, estudiantesRes, evalsRes, pipRes] = await Promise.all([
            supabase.from('profiles').select('id, user_id').eq('institucion_id', instId).not('user_id', 'is', null),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('institucion_id', instId).not('grado_seccion_id', 'is', null),
            supabase.from('evaluaciones').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('institucion_id', instId).eq('is_pip', true),
          ]);

          // Get roles for institution users
          const userIds = (rolesRes.data ?? []).map(p => p.user_id).filter(Boolean) as string[];
          let dirCount = 0, subdirCount = 0, docCount = 0;
          if (userIds.length > 0) {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('user_id, role')
              .in('user_id', userIds);
            if (roleData) {
              dirCount = roleData.filter(r => r.role === 'director').length;
              subdirCount = roleData.filter(r => r.role === 'subdirector').length;
              docCount = roleData.filter(r => r.role === 'docente').length;
            }
          }

          setStats({
            aulas: nivelesData.length,
            directores: dirCount,
            subdirectores: subdirCount,
            docentes: docCount,
            docentesPip: pipRes.count ?? 0,
            estudiantes: estudiantesRes.count ?? 0,
            evaluaciones: evalsRes.count ?? 0,
            tieneResultados: false,
          });
        }
      } catch (err) {
        console.error('Error loading director stats:', err);
      }
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
        <StatCard title="Aulas" value={String(stats.aulas)} icon={School} href="/director/niveles" />
        <StatCard title="Director" value={String(stats.directores)} icon={UserCog} variant="primary" href="/director/personal" />
        <StatCard title="Subdirectores" value={String(stats.subdirectores)} icon={GraduationCap} variant="warning" href="/director/personal" />
        <StatCard title="Docentes" value={String(stats.docentes)} icon={Users} href="/director/personal" />
        <StatCard title="Docentes PIP" value={String(stats.docentesPip)} icon={Lightbulb} variant="primary" href="/director/personal" />
        <StatCard title="Estudiantes" value={String(stats.estudiantes)} icon={Users} variant="success" href="/director/personal" />
        <StatCard title="Evaluaciones" value={String(stats.evaluaciones)} icon={ClipboardList} variant="warning" href="/director/resultados" />
      </div>

      {stats.tieneResultados && (
        <div className="bg-card rounded-xl border p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Herramientas de Gestión Pedagógica</h2>
          <PlanRefuerzoButton tipo="institucional" label="Plan de Refuerzo Escolar Institucional" />
        </div>
      )}

      {tienePrimaria && <EvaluacionesDownloadCard nivelFilter="Primaria" />}
      {tieneSecundaria && <EvaluacionesDownloadCard nivelFilter="Secundaria" />}

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
