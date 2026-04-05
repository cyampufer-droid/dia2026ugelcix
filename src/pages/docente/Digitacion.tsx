import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { saveDigitacionOffline, getAllDigitaciones, markAsSynced, clearSyncedRecords } from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Wifi, WifiOff, CloudUpload, Loader2, BookOpen, Calculator, Heart, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DigitacionGrid, { type Student } from '@/components/docente/DigitacionGrid';
import DigitacionInicial from '@/components/docente/DigitacionInicial';

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
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [nivelDocente, setNivelDocente] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { isOnline, pendingCount, isSyncing, syncToCloud, refreshPendingCount } = useOfflineSync();
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const respuestasRef = useRef(respuestas);
  respuestasRef.current = respuestas;
  const evaluacionesRef = useRef(evaluaciones);
  evaluacionesRef.current = evaluaciones;

  // Load students directly from Supabase using docente's grado_seccion_id
  useEffect(() => {
    const loadStudents = async () => {
      if (!profile?.grado_seccion_id) {
        setLoadingStudents(false);
        return;
      }
      setLoadingStudents(true);
      try {
        const { data: studentData } = await supabase
          .from('profiles')
          .select('id, nombre_completo, dni')
          .eq('grado_seccion_id', profile.grado_seccion_id)
          .order('nombre_completo');
        if (studentData?.length) {
          setStudents(studentData.map(s => ({
            id: s.id,
            nombre_completo: s.nombre_completo,
            dni: s.dni,
          })));
        }
      } catch (err) {
        console.error('Error loading students:', err);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [profile]);

  // Load evaluaciones matching docente's grado
  useEffect(() => {
    const loadEvaluaciones = async () => {
      if (!profile?.grado_seccion_id) return;

      const gradoSeccionId = profile.grado_seccion_id;

      const { data: ng } = await supabase
        .from('niveles_grados')
        .select('nivel, grado')
        .eq('id', gradoSeccionId)
        .single();
      if (!ng) return;

      if (!nivelDocente) setNivelDocente(ng.nivel);

      if (ng.nivel === 'Inicial') return;

      const gradoEval = GRADO_TO_ORDINAL[ng.grado] || ng.grado;

      const { data: evals } = await supabase
        .from('evaluaciones')
        .select('id, area, nivel, grado, numero_preguntas, config_preguntas')
        .eq('nivel', ng.nivel)
        .eq('grado', gradoEval);

      if (!evals?.length) return;

      let filtered = evals as EvalInfo[];

      if (ng.nivel === 'Secundaria' && profile.especialidad) {
        const allowedArea = ESPECIALIDAD_AREA_MAP[profile.especialidad];
        if (allowedArea) {
          filtered = filtered.filter(e => e.area === allowedArea);
        }
      }

      setEvaluaciones(filtered);
      if (filtered.length > 0) setActiveTab(filtered[0].id);

      const init: Record<string, Record<string, string[]>> = {};
      for (const ev of filtered) init[ev.id] = {};
      setRespuestas(prev => ({ ...init, ...prev }));
    };
    loadEvaluaciones();
  }, [profile, nivelDocente]);

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

  // Load existing results from cloud
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

    // Auto-save locally after 3 seconds of inactivity
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      doAutoSave();
    }, 3000);
  }, []);

  const doAutoSave = useCallback(async () => {
    try {
      const currentResp = respuestasRef.current;
      const currentEvals = evaluacionesRef.current;
      let totalRecords = 0;
      for (const ev of currentEvals) {
        const evalData = currentResp[ev.id] || {};
        for (const [studentId, answers] of Object.entries(evalData)) {
          if (answers.some(a => a !== '')) {
            await saveDigitacionOffline(studentId, ev.id, answers);
            totalRecords++;
          }
        }
      }
      if (totalRecords > 0) {
        await refreshPendingCount();
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Auto-save error:', err);
    }
  }, [refreshPendingCount]);

  const handleSaveLocal = async () => {
    setSaving(true);
    try {
      // Collect all records to save
      const records: { studentId: string; evalId: string; answers: string[] }[] = [];
      for (const ev of evaluaciones) {
        const evalData = respuestas[ev.id] || {};
        for (const [studentId, answers] of Object.entries(evalData)) {
          if (answers.some(a => a !== '')) {
            records.push({ studentId, evalId: ev.id, answers });
          }
        }
      }

      if (records.length === 0) {
        toast({ title: 'No hay datos para guardar' });
        setSaving(false);
        return;
      }

      // Always save locally first as backup
      for (const r of records) {
        await saveDigitacionOffline(r.studentId, r.evalId, r.answers);
      }

      // If online, save directly to Supabase with score calculation
      if (isOnline) {
        const upsertRows = records.map(r => {
          const ev = evaluaciones.find(e => e.id === r.evalId);
          const answerKey = ev?.config_preguntas?.respuestas_correctas || [];
          let puntaje = 0;
          for (let i = 0; i < r.answers.length; i++) {
            if (r.answers[i] && answerKey[i] && r.answers[i] === answerKey[i]) puntaje++;
          }
          return {
            estudiante_id: r.studentId,
            evaluacion_id: r.evalId,
            respuestas_dadas: r.answers,
            puntaje_total: puntaje,
            fecha_sincronizacion: new Date().toISOString(),
          };
        });

        let successCount = 0;
        let errorCount = 0;
        const BATCH_SIZE = 50;

        for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
          const batch = upsertRows.slice(i, i + BATCH_SIZE);
          const { error } = await supabase
            .from('resultados')
            .upsert(batch, { onConflict: 'estudiante_id,evaluacion_id' });

          if (error) {
            console.error('Batch upsert error:', error);
            errorCount += batch.length;
          } else {
            successCount += batch.length;
            for (const row of batch) {
              await markAsSynced(`${row.estudiante_id}_${row.evaluacion_id}`);
            }
          }
        }

        await clearSyncedRecords();
        await refreshPendingCount();
        setLastSaved(new Date());

        if (errorCount > 0) {
          toast({
            title: 'Guardado parcial',
            description: `${successCount} registros guardados en la nube, ${errorCount} con error. Los datos están seguros en el dispositivo.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '✅ Guardado en la nube',
            description: `${successCount} registros guardados y sincronizados correctamente.`,
          });
        }
      } else {
        // Offline: just confirm local save
        await refreshPendingCount();
        setLastSaved(new Date());
        toast({
          title: '💾 Guardado en dispositivo',
          description: `${records.length} registros guardados localmente. Se sincronizarán automáticamente al tener internet.`,
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al guardar', description: 'Intente nuevamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      const timer = setTimeout(() => {
        syncToCloud();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, syncToCloud]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      doAutoSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [doAutoSave]);

  const getProgress = (evalId: string) => {
    const ev = evaluaciones.find(e => e.id === evalId);
    const numPreguntas = ev?.numero_preguntas || 20;
    const evalData = respuestas[evalId] || {};
    const total = students.length * numPreguntas;
    if (total === 0) return 0;
    let filled = 0;
    for (const s of students) {
      const answers = evalData[s.id] || [];
      filled += answers.filter(a => a !== '' && a !== undefined).length;
    }
    return Math.round((filled / total) * 100);
  };

  // Loading state
  if (loadingStudents) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Digitación de Respuestas</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando estudiantes…</span>
        </div>
      </div>
    );
  }

  // Inicial level: show descriptive conclusions UI
  if (nivelDocente === 'Inicial') {
    if (students.length === 0) {
      return (
        <div className="space-y-4 animate-fade-in">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Conclusiones Descriptivas – Inicial</h1>
          <p className="text-muted-foreground text-sm">
            No se encontraron estudiantes registrados en su aula. Registre estudiantes primero.
          </p>
        </div>
      );
    }
    return <DigitacionInicial students={students} />;
  }

  if (students.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Digitación de Respuestas</h1>
        <p className="text-muted-foreground text-sm">
          No se encontraron estudiantes en su aula. Registre estudiantes primero desde "Mis Estudiantes".
        </p>
      </div>
    );
  }

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
          <p className="text-sm text-muted-foreground">Registre las respuestas de cada evaluación (A, B, C, D). Se guarda automáticamente.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'En línea' : 'Sin conexión'}
          </Badge>
          {pendingCount > 0 && <Badge variant="secondary" className="gap-1">{pendingCount} pendientes</Badge>}
          {lastSaved && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Guardado {lastSaved.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
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
                  students={students}
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
          <span>Trabajando sin conexión. Los datos se guardan automáticamente en el dispositivo. Cuando tenga internet, se sincronizará automáticamente.</span>
        </div>
      )}
    </div>
  );
};

export default Digitacion;
