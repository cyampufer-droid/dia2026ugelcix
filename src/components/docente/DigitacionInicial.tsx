import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Loader2, ChevronDown, ChevronUp, Calculator, BookOpen, Heart, User, CheckCircle2 } from 'lucide-react';
import type { Student } from '@/components/docente/DigitacionGrid';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';
import {
  areConclusionDataEqual,
  DEFAULT_NIVEL_LOGRO,
  filterConclusionesState,
  hasMeaningfulConclusionContent,
  loadDigitacionInicialDraft,
  normalizeConclusionData,
  saveDigitacionInicialDraft,
  type ConclusionData,
  type ConclusionesState,
} from '@/lib/digitacionInicialDrafts';

const AREAS_INICIAL = [
  {
    area: 'Matemática',
    icon: Calculator,
    competencias: [
      'Resuelve problemas de cantidad',
      'Resuelve problemas de forma, movimiento y localización',
    ],
  },
  {
    area: 'Comunicación',
    icon: BookOpen,
    competencias: [
      'Se comunica oralmente en su lengua materna',
      'Lee diversos tipos de textos en su lengua materna',
      'Escribe diversos tipos de textos en su lengua materna',
      'Crea proyectos desde los lenguajes artísticos',
    ],
  },
  {
    area: 'Personal Social - Habilidades Socioemocionales',
    icon: Heart,
    competencias: [
      'Construye su identidad',
      'Convive y participa democráticamente en la búsqueda del bien común',
    ],
  },
];

const NIVELES_LOGRO = [
  { value: 'En Inicio', label: 'C - En Inicio', letter: 'C', color: 'bg-nivel-inicio text-destructive-foreground' },
  { value: 'En Proceso', label: 'B - En Proceso', letter: 'B', color: 'bg-nivel-proceso text-secondary-foreground' },
  { value: 'Logro Esperado', label: 'A - Esperado', letter: 'A', color: 'bg-nivel-logro text-accent-foreground' },
  { value: 'Logro Destacado', label: 'AD - Destacado', letter: 'AD', color: 'bg-nivel-destacado text-primary-foreground' },
];

interface Props {
  students: Student[];
}

const AUTO_SAVE_DELAY_MS = 4000;

interface ConclusionRecord {
  estudiante_id: string;
  area: string;
  competencia: string;
  logros: string;
  dificultades: string;
  mejora: string;
  nivel_logro: string;
  docente_user_id: string;
}

interface ConclusionDeleteTarget {
  key: string;
  estudiante_id: string;
  area: string;
  competencia: string;
}

const DigitacionInicial = ({ students }: Props) => {
  const [conclusiones, setConclusiones] = useState<ConclusionesState>({});
  const [openStudents, setOpenStudents] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conclusionesRef = useRef(conclusiones);
  const dirtyKeysRef = useRef<Set<string>>(new Set());
  const serverStateRef = useRef<ConclusionesState>({});
  const saveInFlightRef = useRef(false);
  const queuedSaveRef = useRef(false);
  conclusionesRef.current = conclusiones;

  const makeKey = (studentId: string, area: string, competencia: string) =>
    `${studentId}_${area}_${competencia}`;

  const allowedKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const student of students) {
      for (const areaInfo of AREAS_INICIAL) {
        for (const comp of areaInfo.competencias) {
          keys.add(makeKey(student.id, areaInfo.area, comp));
        }
      }
    }

    return keys;
  }, [students]);

  const persistDraftLocally = useCallback((state: ConclusionesState) => {
    saveDigitacionInicialDraft(filterConclusionesState(state, allowedKeys), user?.id);
  }, [allowedKeys, user?.id]);

  const collectChangedKeys = useCallback((state: ConclusionesState) => {
    const changedKeys = new Set<string>();

    for (const key of allowedKeys) {
      if (!areConclusionDataEqual(state[key], serverStateRef.current[key])) {
        changedKeys.add(key);
      }
    }

    return changedKeys;
  }, [allowedKeys]);

  // Load existing conclusions from DB
  useEffect(() => {
    const load = async () => {
      const draftState = filterConclusionesState(loadDigitacionInicialDraft(user?.id), allowedKeys);

      if (!students.length) {
        serverStateRef.current = {};
        setConclusiones(draftState);
        setLoadingData(false);
        return;
      }

      const studentIds = students.map(s => s.id);
      let data: ConclusionRecord[] = [];

      try {
        const response = await invokeEdgeFunction<{ conclusions: ConclusionRecord[] }>('inicial-conclusions', {
          action: 'list',
          student_ids: studentIds,
        });
        data = response?.conclusions || [];
      } catch (error) {
        console.error('Error loading conclusiones:', error);
        setConclusiones(draftState);
        setLoadingData(false);
        return;
      }

      const remoteState: ConclusionesState = {};
      for (const row of data || []) {
        const key = makeKey(row.estudiante_id, row.area, row.competencia);
        remoteState[key] = {
          logros: row.logros || '',
          dificultades: row.dificultades || '',
          mejora: row.mejora || '',
          nivel_logro: row.nivel_logro || DEFAULT_NIVEL_LOGRO,
        };
      }

      serverStateRef.current = remoteState;
      const mergedState = {
        ...remoteState,
        ...draftState,
      };

      setConclusiones(mergedState);
      persistDraftLocally(mergedState);
      setLoadingData(false);
    };
    void load();
  }, [allowedKeys, persistDraftLocally, students, user?.id]);

  const buildMutationPlan = useCallback((state: ConclusionesState, keys: Set<string>) => {
    const upserts: ConclusionRecord[] = [];
    const deletes: ConclusionDeleteTarget[] = [];

    for (const student of students) {
      for (const areaInfo of AREAS_INICIAL) {
        for (const comp of areaInfo.competencias) {
          const key = makeKey(student.id, areaInfo.area, comp);
          if (!keys.has(key)) continue;

          const data = normalizeConclusionData(state[key]);

          if (hasMeaningfulConclusionContent(data)) {
            upserts.push({
              estudiante_id: student.id,
              area: areaInfo.area,
              competencia: comp,
              logros: data.logros,
              dificultades: data.dificultades,
              mejora: data.mejora,
              nivel_logro: data.nivel_logro,
              docente_user_id: user?.id || '',
            });
          } else {
            deletes.push({
              key,
              estudiante_id: student.id,
              area: areaInfo.area,
              competencia: comp,
            });
          }
        }
      }
    }

    return { upserts, deletes };
  }, [students, user?.id]);

  // Batch persistence helper to avoid statement timeout
  const persistMutations = useCallback(async (keysToPersist?: Set<string>) => {
    const targetKeys = keysToPersist && keysToPersist.size > 0
      ? new Set(keysToPersist)
      : collectChangedKeys(conclusionesRef.current);

    if (targetKeys.size === 0) {
      return { successCount: 0, deleteCount: 0, errorCount: 0, hadChanges: false };
    }

    if (saveInFlightRef.current) {
      queuedSaveRef.current = true;
      return { successCount: 0, deleteCount: 0, errorCount: 0, hadChanges: true };
    }

    saveInFlightRef.current = true;

    let successCount = 0;
    let deleteCount = 0;
    let errorCount = 0;

    try {
      const { upserts, deletes } = buildMutationPlan(conclusionesRef.current, targetKeys);

      const response = await invokeEdgeFunction<{ upserts_saved: number; deletes_processed: number }>('inicial-conclusions', {
        action: 'sync',
        upserts,
        deletes,
      });

      successCount = response?.upserts_saved ?? 0;
      deleteCount = response?.deletes_processed ?? 0;

      if (errorCount === 0) {
        const currentState = conclusionesRef.current;

        for (const key of targetKeys) {
          dirtyKeysRef.current.delete(key);

          if (hasMeaningfulConclusionContent(currentState[key])) {
            serverStateRef.current[key] = normalizeConclusionData(currentState[key]);
          } else {
            delete serverStateRef.current[key];
          }
        }

        setLastSaved(new Date());
      }

      return { successCount, deleteCount, errorCount, hadChanges: true };
    } finally {
      saveInFlightRef.current = false;

      if (queuedSaveRef.current) {
        queuedSaveRef.current = false;
        void persistMutations(new Set(dirtyKeysRef.current));
      }
    }
  }, [buildMutationPlan, collectChangedKeys]);

  // Auto-save: triggers after inactivity and only persists changed records
  const doAutoSave = useCallback(async () => {
    const dirtyKeys = new Set(dirtyKeysRef.current);
    if (dirtyKeys.size === 0) return;

    setAutoSaving(true);
    try {
      await persistMutations(dirtyKeys);
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setAutoSaving(false);
    }
  }, [persistMutations]);

  const updateField = useCallback((studentId: string, area: string, competencia: string, field: keyof ConclusionData, value: string) => {
    const key = makeKey(studentId, area, competencia);
    dirtyKeysRef.current.add(key);

    setConclusiones(prev => {
      const nextState = {
        ...prev,
        [key]: {
          ...normalizeConclusionData(prev[key]),
          [field]: value,
        },
      };

      persistDraftLocally(nextState);
      return nextState;
    });

    // Reset auto-save timer
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      void doAutoSave();
    }, AUTO_SAVE_DELAY_MS);
  }, [doAutoSave, persistDraftLocally]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Preserve draft before page unload; sync continues on next edit/manual save
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistDraftLocally(conclusionesRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [persistDraftLocally]);

  const getStudentProgress = (studentId: string) => {
    let total = 0;
    let filled = 0;
    for (const areaInfo of AREAS_INICIAL) {
      for (const comp of areaInfo.competencias) {
        total++;
        const key = makeKey(studentId, areaInfo.area, comp);
        const data = normalizeConclusionData(conclusiones[key]);
        if (data.logros.trim() && data.dificultades.trim() && data.mejora.trim()) {
          filled++;
        }
      }
    }
    return { filled, total };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await persistMutations();

      if (!result.hadChanges) {
        toast({ title: 'No hay cambios pendientes por guardar' });
        setSaving(false);
        return;
      }

      if (result.errorCount > 0) {
        toast({
          title: 'Guardado parcial',
          description: `${result.successCount} guardados, ${result.deleteCount} eliminados y ${result.errorCount} con error. Intente nuevamente.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '✅ Guardado exitosamente',
          description: `${result.successCount} conclusiones guardadas${result.deleteCount > 0 ? ` y ${result.deleteCount} limpiadas` : ''}.`,
        });
      }
    } catch (err: any) {
      console.error('Save error:', err);
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando conclusiones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Conclusiones Descriptivas – Inicial</h1>
          <p className="text-sm text-muted-foreground">
            Redacte las conclusiones descriptivas por competencia para cada estudiante. Se guarda automáticamente.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {autoSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Guardando…
            </span>
          )}
          {lastSaved && !autoSaving && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Guardado {lastSaved.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving || autoSaving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar todo
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {NIVELES_LOGRO.map(n => (
          <Badge key={n.value} className={`${n.color} text-xs`}>{n.letter} – {n.value.replace('Logro ', '')}</Badge>
        ))}
      </div>

      {students.map(student => {
        const progress = getStudentProgress(student.id);
        const isOpen = openStudents[student.id] ?? false;

        return (
          <Card key={student.id} className="shadow-card">
            <Collapsible open={isOpen} onOpenChange={() => setOpenStudents(prev => ({ ...prev, [student.id]: !prev[student.id] }))}>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span>{student.nombre_completo}</span>
                      <span className="text-xs font-mono text-muted-foreground">({student.dni})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={progress.filled === progress.total ? 'default' : 'secondary'} className="text-xs">
                        {progress.filled}/{progress.total}
                        {progress.filled === progress.total && <CheckCircle2 className="h-3 w-3 ml-1" />}
                      </Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="space-y-6 pt-0">
                  {AREAS_INICIAL.map(areaInfo => {
                    const AreaIcon = areaInfo.icon;
                    return (
                      <div key={areaInfo.area} className="space-y-3">
                        <h3 className="flex items-center gap-2 font-semibold text-sm text-primary border-b border-border pb-1">
                          <AreaIcon className="h-4 w-4" />
                          {areaInfo.area}
                        </h3>

                        {areaInfo.competencias.map(comp => {
                          const key = makeKey(student.id, areaInfo.area, comp);
                          const data = normalizeConclusionData(conclusiones[key]);
                          const nivelInfo = NIVELES_LOGRO.find(n => n.value === data.nivel_logro);

                          return (
                            <div key={comp} className="rounded-lg border border-border bg-card p-3 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h4 className="text-sm font-medium text-foreground">{comp}</h4>
                                <Select
                                  value={data.nivel_logro}
                                  onValueChange={(v) => updateField(student.id, areaInfo.area, comp, 'nivel_logro', v)}
                                >
                                  <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {NIVELES_LOGRO.map(n => (
                                      <SelectItem key={n.value} value={n.value} className="text-xs">
                                        <span className="font-bold">{n.letter}</span> – {n.value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-accent flex items-center gap-1">
                                    ✅ ¿Qué logros ha obtenido?
                                  </label>
                                  <Textarea
                                    value={data.logros}
                                    onChange={(e) => updateField(student.id, areaInfo.area, comp, 'logros', e.target.value)}
                                    placeholder="Describa los logros del estudiante..."
                                    className="min-h-[80px] text-xs resize-y"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-destructive flex items-center gap-1">
                                    ⚠️ ¿Qué dificultades presenta?
                                  </label>
                                  <Textarea
                                    value={data.dificultades}
                                    onChange={(e) => updateField(student.id, areaInfo.area, comp, 'dificultades', e.target.value)}
                                    placeholder="Describa las dificultades observadas..."
                                    className="min-h-[80px] text-xs resize-y"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-primary flex items-center gap-1">
                                    💡 ¿Cómo puede mejorar?
                                  </label>
                                  <Textarea
                                    value={data.mejora}
                                    onChange={(e) => updateField(student.id, areaInfo.area, comp, 'mejora', e.target.value)}
                                    placeholder="Sugerencias de mejora..."
                                    className="min-h-[80px] text-xs resize-y"
                                  />
                                </div>
                              </div>

                              {nivelInfo && (
                                <div className="flex justify-end">
                                  <Badge className={`${nivelInfo.color} text-xs`}>
                                    Nivel: {nivelInfo.letter} – {nivelInfo.value}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {students.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || autoSaving} size="lg" className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar todas las conclusiones
          </Button>
        </div>
      )}
    </div>
  );
};

export default DigitacionInicial;
