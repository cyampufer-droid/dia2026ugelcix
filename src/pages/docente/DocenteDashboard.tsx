import { useEffect, useState } from 'react';
import { Users, FileSpreadsheet, ClipboardList, BookOpen, School } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Aula {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
}

const DocenteDashboard = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ students: 0, evaluaciones: 0, digitados: 0, pendientes: 0 });
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [selectedAula, setSelectedAula] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Load available aulas for the docente's institution
  useEffect(() => {
    const loadAulas = async () => {
      if (!profile?.institucion_id) return;
      const { data } = await supabase
        .from('niveles_grados')
        .select('id, nivel, grado, seccion')
        .eq('institucion_id', profile.institucion_id)
        .order('nivel')
        .order('grado')
        .order('seccion');
      if (data) setAulas(data);
    };
    loadAulas();
  }, [profile?.institucion_id]);

  useEffect(() => {
    if (profile?.grado_seccion_id) setSelectedAula(profile.grado_seccion_id);
  }, [profile?.grado_seccion_id]);

  const handleAsociarAula = async () => {
    if (!selectedAula || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ grado_seccion_id: selectedAula })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Error al asociar aula');
    } else {
      toast.success('Aula asociada correctamente');
      window.location.reload();
    }
  };

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

  const aulaActual = aulas.find(a => a.id === profile?.grado_seccion_id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel del Docente</h1>
        <p className="text-muted-foreground">Gestione sus estudiantes y registre resultados de evaluación</p>
      </div>

      {/* Aula association section */}
      <div className="bg-card rounded-xl border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <School className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Mi Aula</h2>
        </div>
        {aulaActual ? (
          <p className="text-sm text-muted-foreground mb-3">
            Actualmente asociado a: <span className="font-semibold text-foreground">{aulaActual.nivel} — {aulaActual.grado} «{aulaActual.seccion}»</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">No tiene un aula asociada. Seleccione una para comenzar.</p>
        )}
        {aulas.length > 0 ? (
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedAula} onValueChange={setSelectedAula}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un aula" />
                </SelectTrigger>
                <SelectContent>
                  {aulas.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nivel} — {a.grado} «{a.seccion}»
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAsociarAula} disabled={saving || !selectedAula || selectedAula === profile?.grado_seccion_id}>
              {saving ? 'Guardando...' : aulaActual ? 'Cambiar Aula' : 'Asociar Aula'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-destructive">No hay aulas registradas en su institución. Contacte a su director.</p>
        )}
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
          <li>Asocie su aula desde la sección de arriba</li>
          <li>Registre o importe sus estudiantes</li>
          <li>Ingrese a Digitación para registrar respuestas</li>
          <li>Revise los resultados automáticos</li>
        </ol>
      </div>
    </div>
  );
};

export default DocenteDashboard;
