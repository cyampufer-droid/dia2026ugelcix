import { useEffect, useState, useMemo } from 'react';
import { Users, FileSpreadsheet, ClipboardList, BookOpen, School, Building2, RefreshCw } from 'lucide-react';
import EvaluacionesDownloadCard from '@/components/EvaluacionesDownloadCard';
import StatCard from '@/components/StatCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead, { useSort, sortData } from '@/components/SortableTableHead';

interface Aula {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
}

interface Estudiante {
  id: string;
  dni: string;
  nombre_completo: string;
}

const DocenteDashboard = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ students: 0, evaluaciones: 0, digitados: 0, pendientes: 0 });
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [selectedAula, setSelectedAula] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [institucionNombre, setInstitucionNombre] = useState<string>('');
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);

  // Load institution name
  useEffect(() => {
    const loadInstitucion = async () => {
      if (!profile?.institucion_id) return;
      const { data } = await supabase
        .from('instituciones')
        .select('nombre')
        .eq('id', profile.institucion_id)
        .single();
      if (data) setInstitucionNombre(data.nombre);
    };
    loadInstitucion();
  }, [profile?.institucion_id]);

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

  // Load students for the docente's aula
  const loadEstudiantes = async () => {
    if (!profile?.grado_seccion_id) { setEstudiantes([]); return; }
    setLoadingEstudiantes(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, dni, nombre_completo')
      .eq('grado_seccion_id', profile.grado_seccion_id)
      .neq('user_id', user?.id ?? '')
      .order('nombre_completo');
    setEstudiantes(data ?? []);
    setLoadingEstudiantes(false);
  };

  useEffect(() => {
    loadEstudiantes();
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

      {/* Institution & Aula info */}
      <div className="bg-card rounded-xl border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Mi Institución y Aula</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Institución</p>
            <p className="text-sm font-semibold text-foreground">{institucionNombre || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nivel</p>
            <p className="text-sm font-semibold text-foreground">{aulaActual?.nivel || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Grado</p>
            <p className="text-sm font-semibold text-foreground">{aulaActual?.grado || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sección</p>
            <p className="text-sm font-semibold text-foreground">{aulaActual?.seccion || '—'}</p>
          </div>
        </div>

        {/* Aula selector */}
        {aulas.length > 0 ? (
          <div className="flex items-end gap-3 flex-wrap border-t pt-4">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-muted-foreground mb-1">{aulaActual ? 'Cambiar aula' : 'Seleccionar aula'}</p>
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
          <p className="text-sm text-destructive border-t pt-4">No hay aulas registradas en su institución. Contacte a su director.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Estudiantes" value={String(stats.students)} icon={Users} />
        <StatCard title="Evaluaciones" value={String(stats.evaluaciones)} icon={BookOpen} variant="primary" />
        <StatCard title="Digitados" value={String(stats.digitados)} icon={FileSpreadsheet} variant="success" />
        <StatCard title="Pendientes" value={String(stats.pendientes)} icon={ClipboardList} variant="warning" />
      </div>

      {/* Students list */}
      {profile?.grado_seccion_id && (
        <div className="bg-card rounded-xl border p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Mis Estudiantes</h2>
              <span className="text-xs text-muted-foreground">({estudiantes.length})</span>
            </div>
            <Button variant="ghost" size="icon" onClick={loadEstudiantes} disabled={loadingEstudiantes}>
              <RefreshCw className={`h-4 w-4 ${loadingEstudiantes ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {estudiantes.length > 0 ? (
            <div className="rounded-md border overflow-auto max-h-[400px]">
              <StudentsSortableTable estudiantes={estudiantes} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay estudiantes registrados en esta aula aún.</p>
          )}
        </div>
      )}

      {aulaActual?.nivel === 'Primaria' && (
        <EvaluacionesDownloadCard
          gradoFilter={aulaActual.grado}
          title={`Cuadernillos de Evaluación – ${aulaActual.grado} Grado`}
        />
      )}

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
