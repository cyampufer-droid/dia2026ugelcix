import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, CheckCircle2, Volume2, Calculator, BookOpen, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import EvaluacionesDownloadCard from '@/components/EvaluacionesDownloadCard';

const AREAS = [
  { key: 'Matemática', label: 'Matemática', icon: Calculator },
  { key: 'Comprensión Lectora', label: 'C. Lectora', icon: BookOpen },
  { key: 'Habilidades Socioemocionales', label: 'Socioemocional', icon: Heart },
] as const;

const GRADO_TO_ORDINAL: Record<string, string> = {
  'Primero': '1°', 'Segundo': '2°', 'Tercero': '3°',
  'Cuarto': '4°', 'Quinto': '5°', 'Sexto': '6°',
};

const playAudio = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE';
    utterance.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }
};

interface Evaluacion {
  id: string;
  area: string;
  numero_preguntas: number;
  config_preguntas: any;
}

const EstudiantePrueba = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [completedAreas, setCompletedAreas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [gradoNombre, setGradoNombre] = useState<string | null>(null);
  const [nivelNombre, setNivelNombre] = useState<string | null>(null);

  // Active test state
  const [activeEval, setActiveEval] = useState<Evaluacion | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<string>(AREAS[0].key);

  // Fetch evaluaciones and existing results
  useEffect(() => {
    if (!profile?.id || !profile?.grado_seccion_id) return;

    const load = async () => {
      setLoading(true);
      try {
        // Get student's nivel/grado
        const { data: ng } = await supabase
          .from('niveles_grados')
          .select('nivel, grado')
          .eq('id', profile.grado_seccion_id)
          .single();

        if (!ng) { setLoading(false); return; }

        setGradoNombre(ng.grado);
        setNivelNombre(ng.nivel);
        const gradoEval = GRADO_TO_ORDINAL[ng.grado] || ng.grado;

        // Fetch evaluaciones for this nivel/grado
        const { data: evals } = await supabase
          .from('evaluaciones')
          .select('id, area, numero_preguntas, config_preguntas')
          .eq('nivel', ng.nivel)
          .eq('grado', gradoEval);

        setEvaluaciones(evals || []);

        // Check which areas already have results
        if (evals && evals.length > 0) {
          const evalIds = evals.map(e => e.id);
          const { data: resultados } = await supabase
            .from('resultados')
            .select('evaluacion_id')
            .eq('estudiante_id', profile.id)
            .in('evaluacion_id', evalIds);

          const completedEvalIds = new Set((resultados || []).map(r => r.evaluacion_id));
          const completed = new Set<string>();
          for (const ev of evals) {
            if (completedEvalIds.has(ev.id)) completed.add(ev.area);
          }
          setCompletedAreas(completed);

          // If all completed, go to results
          if (completed.size === evals.length && evals.length > 0) {
            navigate('/estudiante/resultados', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('Error loading evaluaciones:', err);
      }
      setLoading(false);
    };
    load();
  }, [profile?.id, profile?.grado_seccion_id]);

  const startEval = (eval_: Evaluacion) => {
    setActiveEval(eval_);
    setCurrentIdx(0);
    setRespuestas({});
  };

  const handleSelect = useCallback((opcion: string) => {
    setRespuestas(prev => ({ ...prev, [currentIdx]: opcion }));
  }, [currentIdx]);

  const handleFinish = async () => {
    if (!activeEval || !profile?.id) return;
    setSubmitting(true);

    try {
      // Build respuestas_dadas array
      const respArray: string[] = [];
      for (let i = 0; i < activeEval.numero_preguntas; i++) {
        respArray.push(respuestas[i] || '');
      }

      // Calculate score using config_preguntas
      let puntaje = 0;
      const config = activeEval.config_preguntas as any;
      const claves = config?.claves || config?.respuestas_correctas || [];
      for (let i = 0; i < respArray.length; i++) {
        if (claves[i] && respArray[i] === claves[i]) puntaje++;
      }

      const { error } = await supabase.from('resultados').upsert({
        estudiante_id: profile.id,
        evaluacion_id: activeEval.id,
        respuestas_dadas: respArray,
        puntaje_total: puntaje,
        fecha_sincronizacion: new Date().toISOString(),
      }, { onConflict: 'estudiante_id,evaluacion_id' });

      if (error) throw error;

      toast({ title: '¡Evaluación completada!', description: `Puntaje: ${puntaje}/${activeEval.numero_preguntas}` });

      // Mark area as completed
      setCompletedAreas(prev => new Set([...prev, activeEval.area]));
      setActiveEval(null);

      // Check if all done
      const newCompleted = new Set([...completedAreas, activeEval.area]);
      if (newCompleted.size >= evaluaciones.length && evaluaciones.length > 0) {
        navigate('/estudiante/resultados', { replace: true });
      }
    } catch (err: any) {
      console.error('Error saving result:', err);
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  // If taking an active evaluation, show quiz UI
  if (activeEval) {
    const numPreguntas = activeEval.numero_preguntas;
    const pregunta = {
      id: currentIdx,
      texto: `Pregunta ${currentIdx + 1}`,
      opciones: ['A', 'B', 'C', 'D'],
    };
    const progress = (Object.keys(respuestas).length / numPreguntas) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-fade-in px-2">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-base sm:text-lg font-bold text-foreground">{activeEval.area}</h1>
            <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              {currentIdx + 1}/{numPreguntas}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <Card className="shadow-card border-2 border-primary/10">
          <CardContent className="py-6 sm:py-8 space-y-5">
            <div className="flex items-start gap-2">
              <p className="text-base sm:text-lg font-medium text-foreground flex-1">{pregunta.texto}</p>
              <button
                onClick={() => playAudio(pregunta.texto)}
                className="shrink-0 p-2.5 rounded-full bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors"
                aria-label="Escuchar pregunta"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {pregunta.opciones.map(op => (
                <button
                  key={op}
                  onClick={() => handleSelect(op)}
                  className={cn(
                    'w-full text-left px-5 py-5 sm:py-4 rounded-2xl border-2 text-base sm:text-lg font-semibold transition-all active:scale-[0.98]',
                    respuestas[currentIdx] === op
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                      : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <span className="inline-flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-muted text-sm font-bold mr-3">
                    {op}
                  </span>
                  Opción {op}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between gap-3 pb-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => activeEval ? setActiveEval(null) : null}
            className="text-sm sm:text-base"
          >
            ← Salir
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="text-sm sm:text-base"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />Anterior
            </Button>
            {currentIdx < numPreguntas - 1 ? (
              <Button size="lg" onClick={() => setCurrentIdx(currentIdx + 1)} className="text-sm sm:text-base">
                Siguiente<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleFinish}
                disabled={submitting}
                className="gradient-gold text-secondary-foreground text-sm sm:text-base"
              >
                {submitting ? 'Guardando…' : '✅ Finalizar'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main view: tabs per area
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const allCompleted = evaluaciones.length > 0 && completedAreas.size >= evaluaciones.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Evaluación Diagnóstica 2026</h1>
        <p className="text-muted-foreground mt-1">Responde las evaluaciones de cada área</p>
      </div>

      {(nivelNombre === 'Primaria' || nivelNombre === 'Secundaria') && gradoNombre && (
        <EvaluacionesDownloadCard
          gradoFilter={gradoNombre}
          nivelFilter={nivelNombre as 'Primaria' | 'Secundaria'}
          title="Cuadernillos de Evaluación"
        />
      )}

      {evaluaciones.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            No se encontraron evaluaciones asignadas para tu grado.
          </CardContent>
        </Card>
      ) : allCompleted ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-accent" />
            <h2 className="text-xl font-bold text-foreground">¡Todas las evaluaciones completadas! 🎉</h2>
            <Button onClick={() => navigate('/estudiante/resultados')}>Ver mis Resultados</Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {AREAS.map(a => {
              const completed = completedAreas.has(a.key);
              return (
                <TabsTrigger key={a.key} value={a.key} className="text-xs sm:text-sm gap-1">
                  {completed && <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
                  <a.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{a.label}</span>
                  <span className="sm:hidden">{a.label.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {AREAS.map(a => {
            const eval_ = evaluaciones.find(e => e.area === a.key);
            const completed = completedAreas.has(a.key);

            return (
              <TabsContent key={a.key} value={a.key}>
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <a.icon className="h-5 w-5" />
                      {a.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!eval_ ? (
                      <p className="text-muted-foreground text-center py-4">No hay evaluación disponible para esta área.</p>
                    ) : completed ? (
                      <div className="text-center py-6 space-y-3">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-accent" />
                        <p className="font-semibold text-foreground">Evaluación completada</p>
                        <p className="text-sm text-muted-foreground">Tus respuestas ya fueron registradas.</p>
                        <Button variant="outline" onClick={() => navigate('/estudiante/resultados')}>
                          Ver Resultados
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-4">
                        <p className="text-muted-foreground">
                          Esta evaluación tiene <span className="font-bold text-foreground">{eval_.numero_preguntas} preguntas</span>.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Selecciona la respuesta correcta para cada pregunta. Al finalizar se guardarán tus respuestas automáticamente.
                        </p>
                        <Button size="lg" onClick={() => startEval(eval_)}>
                          🚀 Iniciar Evaluación
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
};

export default EstudiantePrueba;
