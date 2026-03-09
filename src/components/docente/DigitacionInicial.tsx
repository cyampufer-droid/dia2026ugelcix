import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Loader2, ChevronDown, ChevronUp, Calculator, BookOpen, Heart, User, CheckCircle2 } from 'lucide-react';
import type { Student } from '@/components/docente/DigitacionGrid';

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

interface ConclusionData {
  logros: string;
  dificultades: string;
  mejora: string;
  nivel_logro: string;
}

// key: `${studentId}_${area}_${competencia}`
type ConclusionesState = Record<string, ConclusionData>;

interface Props {
  students: Student[];
}

const DigitacionInicial = ({ students }: Props) => {
  const [conclusiones, setConclusiones] = useState<ConclusionesState>({});
  const [openStudents, setOpenStudents] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const makeKey = (studentId: string, area: string, competencia: string) =>
    `${studentId}_${area}_${competencia}`;

  // Load existing conclusions from DB
  useEffect(() => {
    const load = async () => {
      if (!students.length) { setLoadingData(false); return; }
      const studentIds = students.map(s => s.id);
      const { data, error } = await supabase
        .from('conclusiones_inicial')
        .select('estudiante_id, area, competencia, logros, dificultades, mejora, nivel_logro')
        .in('estudiante_id', studentIds);

      if (error) {
        console.error('Error loading conclusiones:', error);
        setLoadingData(false);
        return;
      }

      const state: ConclusionesState = {};
      for (const row of data || []) {
        const key = makeKey(row.estudiante_id, row.area, row.competencia);
        state[key] = {
          logros: row.logros || '',
          dificultades: row.dificultades || '',
          mejora: row.mejora || '',
          nivel_logro: row.nivel_logro || 'En Inicio',
        };
      }
      setConclusiones(state);
      setLoadingData(false);
    };
    load();
  }, [students]);

  const updateField = useCallback((studentId: string, area: string, competencia: string, field: keyof ConclusionData, value: string) => {
    const key = makeKey(studentId, area, competencia);
    setConclusiones(prev => ({
      ...prev,
      [key]: {
        logros: prev[key]?.logros || '',
        dificultades: prev[key]?.dificultades || '',
        mejora: prev[key]?.mejora || '',
        nivel_logro: prev[key]?.nivel_logro || 'En Inicio',
        [field]: value,
      },
    }));
  }, []);

  const getStudentProgress = (studentId: string) => {
    let total = 0;
    let filled = 0;
    for (const areaInfo of AREAS_INICIAL) {
      for (const comp of areaInfo.competencias) {
        total++;
        const key = makeKey(studentId, areaInfo.area, comp);
        const data = conclusiones[key];
        if (data && data.logros.trim() && data.dificultades.trim() && data.mejora.trim()) {
          filled++;
        }
      }
    }
    return { filled, total };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records: Array<{
        estudiante_id: string;
        area: string;
        competencia: string;
        logros: string;
        dificultades: string;
        mejora: string;
        nivel_logro: string;
        docente_user_id: string;
      }> = [];

      for (const student of students) {
        for (const areaInfo of AREAS_INICIAL) {
          for (const comp of areaInfo.competencias) {
            const key = makeKey(student.id, areaInfo.area, comp);
            const data = conclusiones[key];
            if (data && (data.logros.trim() || data.dificultades.trim() || data.mejora.trim())) {
              records.push({
                estudiante_id: student.id,
                area: areaInfo.area,
                competencia: comp,
                logros: data.logros,
                dificultades: data.dificultades,
                mejora: data.mejora,
                nivel_logro: data.nivel_logro || 'En Inicio',
                docente_user_id: user?.id || '',
              });
            }
          }
        }
      }

      if (records.length === 0) {
        toast({ title: 'No hay datos para guardar', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('conclusiones_inicial')
        .upsert(records, { onConflict: 'estudiante_id,area,competencia' });

      if (error) throw error;

      toast({ title: '✅ Guardado exitosamente', description: `${records.length} conclusiones guardadas.` });
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
            Redacte las conclusiones descriptivas por competencia para cada estudiante
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar todo
        </Button>
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
                          const data = conclusiones[key] || { logros: '', dificultades: '', mejora: '', nivel_logro: 'En Inicio' };
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
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar todas las conclusiones
          </Button>
        </div>
      )}
    </div>
  );
};

export default DigitacionInicial;
