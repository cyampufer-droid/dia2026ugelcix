import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompetenciaAnalisis {
  competencia: string;
  nivel: string;
  descripcion: string;
  preguntas_evaluadas: string;
  aciertos: number;
  total: number;
}

interface ConclusionesIA {
  resumen: string;
  fortalezas: string[];
  dificultades: string[];
  recomendaciones: string[];
  por_competencia: CompetenciaAnalisis[];
}

interface ConclusionInicialInput {
  area: string;
  competencia: string;
  logros: string;
  dificultades: string;
  mejora: string;
  nivel_logro: string;
}

interface Props {
  area: string;
  nivel?: string;
  grado?: string;
  respuestas_dadas?: string[];
  respuestas_correctas?: string[];
  puntaje?: number | null;
  nivel_logro?: string | null;
  nombre_estudiante: string;
  autoGenerate?: boolean;
  onDataReady?: (area: string, data: ConclusionesIA) => void;
  conclusionesInicial?: ConclusionInicialInput[];
}

export type { ConclusionesIA };

const nivelBadge: Record<string, string> = {
  'En Inicio': 'bg-nivel-inicio/20 text-destructive border-nivel-inicio',
  'En Proceso': 'bg-nivel-proceso/20 text-secondary-foreground border-nivel-proceso',
  'Logro Esperado': 'bg-nivel-logro/20 text-accent-foreground border-nivel-logro',
  'Logro Destacado': 'bg-nivel-destacado/20 text-primary-foreground border-nivel-destacado',
};

const AIConclusiones = ({ area, nivel, grado, respuestas_dadas, respuestas_correctas, puntaje, nivel_logro, nombre_estudiante, autoGenerate = false, onDataReady, conclusionesInicial }: Props) => {
  const [conclusiones, setConclusiones] = useState<ConclusionesIA | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerar = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        area,
        nivel,
        grado,
        nombre_estudiante,
      };

      if (conclusionesInicial && conclusionesInicial.length > 0) {
        body.conclusiones_inicial = conclusionesInicial;
      } else {
        body.respuestas_dadas = respuestas_dadas;
        body.respuestas_correctas = respuestas_correctas;
        body.puntaje = puntaje;
        body.nivel_logro = nivel_logro;
      }

      const { data, error: fnError } = await supabase.functions.invoke('analyze-results', { body });

      if (fnError) {
        throw new Error(fnError.message || 'Error al analizar');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setConclusiones(data);
      onDataReady?.(area, data);
    } catch (e: any) {
      const msg = e.message || 'Error al generar el análisis';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on mount if requested
  const didAuto = useRef(false);
  useEffect(() => {
    if (autoGenerate && !didAuto.current) {
      didAuto.current = true;
      handleGenerar();
    }
  }, [autoGenerate]);

  if (!conclusiones) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Button
          onClick={handleGenerar}
          disabled={loading}
          variant="outline"
          className="gap-2 border-primary/30 hover:bg-primary/10"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
          {loading ? 'Analizando...' : '🤖 Generar Análisis Personalizado'}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground text-center max-w-md">
          Se analizarán los resultados y se generarán conclusiones descriptivas personalizadas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkles className="h-4 w-4" />
        Análisis Personalizado
      </div>

      {/* Resumen */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-foreground leading-relaxed">{conclusiones.resumen}</p>
      </div>

      {/* Fortalezas y Dificultades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-nivel-logro/30 bg-nivel-logro/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-accent">
            <CheckCircle2 className="h-4 w-4" />
            Fortalezas
          </div>
          <ul className="space-y-1">
            {conclusiones.fortalezas.map((f, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-accent shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-nivel-inicio/30 bg-nivel-inicio/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Áreas de mejora
          </div>
          <ul className="space-y-1">
            {conclusiones.dificultades.map((d, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-destructive shrink-0">•</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Por Competencia */}
      {conclusiones.por_competencia?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <BarChart3 className="h-4 w-4" />
            Análisis por Competencia
          </div>
          {conclusiones.por_competencia.map((comp, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h5 className="text-sm font-medium text-foreground">{comp.competencia}</h5>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{comp.preguntas_evaluadas}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full border font-semibold',
                    nivelBadge[comp.nivel] || 'bg-muted text-muted-foreground border-border'
                  )}>
                    {comp.aciertos > 0 ? `${comp.aciertos}/${comp.total} — ` : ''}{comp.nivel}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{comp.descripcion}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recomendaciones */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Lightbulb className="h-4 w-4" />
          Recomendaciones para mejorar
        </div>
        <ul className="space-y-1">
          {conclusiones.recomendaciones.map((r, i) => (
            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
              <span className="text-primary shrink-0">💡</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleGenerar}
        disabled={loading}
        className="text-xs text-muted-foreground gap-1"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        Regenerar análisis
      </Button>
    </div>
  );
};

export default AIConclusiones;
