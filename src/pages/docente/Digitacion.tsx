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

const NUM_PREGUNTAS = 20;

const EVALUACIONES = [
  { key: 'matematica', label: 'Matemática', icon: Calculator },
  { key: 'comprension_lectora', label: 'Comprensión Lectora', icon: BookOpen },
  { key: 'socioemocional', label: 'Habilidades Socioemocionales', icon: Heart },
] as const;

type EvalKey = typeof EVALUACIONES[number]['key'];

const Digitacion = () => {
  // respuestas keyed by evaluacion then by student
  const [respuestas, setRespuestas] = useState<Record<EvalKey, Record<string, string[]>>>({
    matematica: {},
    comprension_lectora: {},
    socioemocional: {},
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<EvalKey>('matematica');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { isOnline, pendingCount, isSyncing, syncToCloud, refreshPendingCount } = useOfflineSync();

  useEffect(() => {
    const loadStudents = async () => {
      if (!profile?.grado_seccion_id) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, nombre_completo, dni')
        .eq('grado_seccion_id', profile.grado_seccion_id)
        .order('nombre_completo');
      if (data && data.length > 0) setStudents(data);
    };
    loadStudents();
  }, [profile?.grado_seccion_id]);

  useEffect(() => {
    const loadOffline = async () => {
      const saved = await getAllDigitaciones();
      const restored: Record<EvalKey, Record<string, string[]>> = {
        matematica: {},
        comprension_lectora: {},
        socioemocional: {},
      };
      for (const record of saved) {
        // evaluacion_id format: "evalKey" or "evalKey_pending"
        const evalKey = record.evaluacion_id.replace('_pending', '') as EvalKey;
        if (evalKey in restored) {
          restored[evalKey][record.estudiante_id] = record.respuestas;
        }
      }
      setRespuestas(prev => ({
        matematica: { ...restored.matematica, ...prev.matematica },
        comprension_lectora: { ...restored.comprension_lectora, ...prev.comprension_lectora },
        socioemocional: { ...restored.socioemocional, ...prev.socioemocional },
      }));
    };
    loadOffline();
  }, []);

  const handleRespuesta = useCallback((evalKey: EvalKey, studentId: string, preguntaIdx: number, valor: string) => {
    setRespuestas(prev => {
      const evalData = prev[evalKey] || {};
      const current = evalData[studentId] || Array(NUM_PREGUNTAS).fill('');
      const updated = [...current];
      updated[preguntaIdx] = valor;
      return { ...prev, [evalKey]: { ...evalData, [studentId]: updated } };
    });
  }, []);

  const handleSaveLocal = async () => {
    setSaving(true);
    try {
      let totalRecords = 0;
      for (const evalDef of EVALUACIONES) {
        const evalData = respuestas[evalDef.key];
        for (const [studentId, answers] of Object.entries(evalData)) {
          await saveDigitacionOffline(studentId, `${evalDef.key}_pending`, answers);
          totalRecords++;
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

  // Calculate progress per evaluation
  const getProgress = (evalKey: EvalKey) => {
    const evalData = respuestas[evalKey];
    const total = displayStudents.length * NUM_PREGUNTAS;
    if (total === 0) return 0;
    let filled = 0;
    for (const s of displayStudents) {
      const answers = evalData[s.id] || [];
      filled += answers.filter(a => a !== '' && a !== undefined).length;
    }
    return Math.round((filled / total) * 100);
  };

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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EvalKey)}>
        <TabsList className="w-full grid grid-cols-3 h-auto">
          {EVALUACIONES.map(ev => {
            const Icon = ev.icon;
            const progress = getProgress(ev.key);
            return (
              <TabsTrigger key={ev.key} value={ev.key} className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{ev.label}</span>
                <span className="sm:hidden">{ev.label.split(' ')[0]}</span>
                {progress > 0 && (
                  <Badge variant={progress === 100 ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 ml-1">
                    {progress}%
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {EVALUACIONES.map(ev => (
          <TabsContent key={ev.key} value={ev.key} className="mt-3">
            <Card className="shadow-card">
              <CardContent className="p-0">
                <DigitacionGrid
                  students={displayStudents}
                  respuestas={respuestas[ev.key]}
                  numPreguntas={NUM_PREGUNTAS}
                  onRespuesta={(studentId, idx, val) => handleRespuesta(ev.key, studentId, idx, val)}
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
