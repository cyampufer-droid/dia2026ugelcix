import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { saveDigitacionOffline, getAllDigitaciones } from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Wifi, WifiOff, CloudUpload, Loader2, BookOpen, Calculator, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DigitacionGrid, { type Student } from '@/components/docente/DigitacionGrid';

const AREA_ICONS: Record<string, typeof Calculator> = {
  'Matemática': Calculator,
  'Comprensión Lectora': BookOpen,
  'Habilidades Socioemocionales': Heart,
};

const ESPECIALIDAD_AREA_MAP: Record<string, string> = {
  'Matemática': 'Matemática',
  'Comunicación': 'Comprensión Lectora',
  'DPCC': 'Habilidades Socioemocionales',
};

const GRADO_TO_ORDINAL: Record<string, string> = {
  'Primero': '1°',
  'Segundo': '2°',
  'Tercero': '3°',
  'Cuarto': '4°',
  'Quinto': '5°',
  'Sexto': '6°',
};

interface EvalInfo {
  id: string;
  area: string;
  nivel: string;
  grado: string;
  numero_preguntas: number;
  config_preguntas: { respuestas_correctas?: string[] };
}

const Digitacion = () => {
  const [respuestas, setRespuestas] = useState<Record<string, Record<string, string[]>>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvalInfo[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { isOnline, pendingCount, isSyncing, syncToCloud, refreshPendingCount } = useOfflineSync();

  // Load evaluaciones matching docente's grado
  useEffect(() => {
    const loadEvaluaciones = async () => {
      if (!profile?.grado_seccion_id) return;
      const { data: ng } = await supabase
        .from('niveles_grados')
        .select('nivel, grado')
        .eq('id', profile.grado_seccion_id)
        .single();
      if (!ng) return;

      const { data: evals } = await supabase
        .from('evaluaciones')
        .select('id, area, nivel, grado, numero_preguntas, config_preguntas')
        .eq('nivel', ng.nivel)
        .eq('grado', ng.grado);

      if (!evals?.length) return;

      let filtered = evals as EvalInfo[];

      // Secundaria: filter by especialidad
      if (ng.nivel === 'Secundaria' && profile.especialidad) {
        const allowedArea = ESPECIALIDAD_AREA_MAP[profile.especialidad];
        if (allowedArea) {
          filtered = filtered.filter(e => e.area === allowedArea);
        }
      }

      setEvaluaciones(filtered);
      if (filtered.length > 0) setActiveTab(filtered[0].id);

      // Init respuestas state
      const init: Record<string, Record<string, string[]>> = {};
      for (const ev of filtered) init[ev.id] = {};
      setRespuestas(prev => ({ ...init, ...prev }));
    };
    loadEvaluaciones();
  }, [profile?.grado_seccion_id, profile?.especialidad]);

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      if (!profile?.grado_seccion_id) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, nombre_completo, dni')
        .eq('grado_seccion_id', profile.grado_seccion_id)
        .order('nombre_completo');
      if (data?.length) setStudents(data);
    };
    loadStudents();
  }, [profile?.grado_seccion_id]);

  // Load saved offline data
  useEffect(() => {
    const loadOffline = async () => {
      const saved = await getAllDigitaciones();
      if (!saved.length) return;
      setRespuestas(prev => {
        const updated = { ...prev };
        for (const record of saved) {
          const evalId = record.evaluacion_id;
          if (!updated[evalId]) updated[evalId] = {};
          updated[evalId][record.estudiante_id] = record.respuestas;
        }
        return updated;
      });
    };
    loadOffline();
  }, []);

  // Also load existing results from cloud
  useEffect(() => {
    const loadCloudResults = async () => {
      if (!students.length || !evaluaciones.length) return;
      const studentIds = students.map(s => s.id);
      const evalIds = evaluaciones.map(e => e.id);
      const { data: resultados } = await supabase
        .from('resultados')
        .select('estudiante_id, evaluacion_id, respuestas_dadas')
        .in('estudiante_id', studentIds)
        .in('evaluacion_id', evalIds);

      if (!resultados?.length) return;
      setRespuestas(prev => {
        const updated = { ...prev };
        for (const r of resultados) {
          if (r.respuestas_dadas?.length) {
            if (!updated[r.evaluacion_id]) updated[r.evaluacion_id] = {};
            // Only set if not already locally modified
            if (!updated[r.evaluacion_id][r.estudiante_id]?.some(a => a !== '')) {
              updated[r.evaluacion_id][r.estudiante_id] = r.respuestas_dadas;
            }
          }
        }
        return updated;
      });
    };
    loadCloudResults();
  }, [students, evaluaciones]);

  const handleRespuesta = useCallback((evalId: string, studentId: string, preguntaIdx: number, valor: string) => {
    setRespuestas(prev => {
      const evalData = prev[evalId] || {};
      const numPreguntas = 20;
      const current = evalData[studentId] || Array(numPreguntas).fill('');
      const updated = [...current];
      updated[preguntaIdx] = valor;
      return { ...prev, [evalId]: { ...evalData, [studentId]: updated } };
    });
  }, []);

  const handleSaveLocal = async () => {
    setSaving(true);
    try {
      let totalRecords = 0;
      for (const ev of evaluaciones) {
        const evalData = respuestas[ev.id] || {};
        for (const [studentId, answers] of Object.entries(evalData)) {
          if (answers.some(a => a !== '')) {
            await saveDigitacionOffline(studentId, ev.id, answers);
            totalRecords++;
          }
        }
      }
      await refreshPendingCount();
      toast({ title: '💾 Guardado localmente', description: `${totalRecords} registros guardados en el dispositivo.` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const displayStudents = students.length > 0 ? students : [
    { id: 'demo-1', nombre_completo: 'García López, Ana María', dni: '71234567' },
    { id: 'demo-2', nombre_completo: 'Pérez Torres, Carlos', dni: '71234568' },
    { id: 'demo-3', nombre_completo: 'Mendoza Ríos, Lucía', dni: '71234569' },
  ];

  const getProgress = (evalId: string) => {
    const ev = evaluaciones.find(e => e.id === evalId);
    const numPreguntas = ev?.numero_preguntas || 20;
    const evalData = respuestas[evalId] || {};
    const total = displayStudents.length * numPreguntas;
    if (total === 0) return 0;
    let filled = 0;
    for (const s of displayStudents) {
      const answers = evalData[s.id] || [];
      filled += answers.filter(a => a !== '' && a !== undefined).length;
    }
    return Math.round((filled / total) * 100);
  };

  if (!evaluaciones.length) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Digitación de Respuestas</h1>
        <p className="text-muted-foreground text-sm">
          No se encontraron evaluaciones para su nivel y grado. Asegúrese de tener un aula asignada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Digitación de Respuestas</h1>
          <p className="text-sm text-muted-foreground">Registre las respuestas de cada evaluación de entrada (A, B, C, D)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'En línea' : 'Sin conexión'}
          </Badge>
          {pendingCount > 0 && <Badge variant="secondary" className="gap-1">{pendingCount} pendientes</Badge>}
          <Button size="sm" variant="outline" onClick={handleSaveLocal} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline ml-1">Guardar</span>
          </Button>
          <Button size="sm" onClick={syncToCloud} disabled={!isOnline || isSyncing || pendingCount === 0} className="gap-1">
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid h-auto" style={{ gridTemplateColumns: `repeat(${evaluaciones.length}, 1fr)` }}>
          {evaluaciones.map(ev => {
            const Icon = AREA_ICONS[ev.area] || BookOpen;
            const progress = getProgress(ev.id);
            const shortLabel = ev.area.split(' ')[0];
            return (
              <TabsTrigger key={ev.id} value={ev.id} className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{ev.area}</span>
                <span className="sm:hidden">{shortLabel}</span>
                {progress > 0 && (
                  <Badge variant={progress === 100 ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 ml-1">
                    {progress}%
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {evaluaciones.map(ev => (
          <TabsContent key={ev.id} value={ev.id} className="mt-3">
            <Card className="shadow-card">
              <CardContent className="p-0">
                <DigitacionGrid
                  students={displayStudents}
                  respuestas={respuestas[ev.id] || {}}
                  numPreguntas={ev.numero_preguntas}
                  onRespuesta={(studentId, idx, val) => handleRespuesta(ev.id, studentId, idx, val)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {!isOnline && (
        <div className="rounded-lg bg-secondary/10 border border-secondary/30 p-3 text-sm text-foreground flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-secondary shrink-0" />
          <span>Trabajando sin conexión. Los datos se guardan en el dispositivo. Sincronice cuando tenga internet.</span>
        </div>
      )}
    </div>
  );
};

export default Digitacion;
