import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Users, BookOpen, Heart, GraduationCap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecomendacionesPadresData {
  introduccion: string;
  recomendaciones_generales: string[];
  por_area: {
    area: string;
    nivel_logro: string;
    consejos_hogar: string[];
    actividades_sugeridas: string[];
    recursos_apoyo: string[];
  }[];
  mensaje_motivacional: string;
}

interface Props {
  nombre_estudiante: string;
  resultados: {
    area: string;
    puntaje: number | null;
    nivel_logro: string | null;
  }[];
  nivel_educativo?: string;
  grado?: string;
}

const areaIcons: Record<string, typeof BookOpen> = {
  'Matemática': GraduationCap,
  'Comprensión Lectora': BookOpen,
  'Habilidades Socioemocionales': Heart,
};

const RecomendacionesPadres = ({ nombre_estudiante, resultados, nivel_educativo, grado }: Props) => {
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionesPadresData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter out areas without results
  const areasConResultados = resultados.filter(r => r.puntaje !== null);

  const handleGenerar = async () => {
    if (areasConResultados.length === 0) {
      toast({ title: 'Sin resultados', description: 'No hay resultados disponibles para generar recomendaciones.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('parent-recommendations', {
        body: {
          nombre_estudiante,
          resultados: areasConResultados,
          nivel_educativo,
          grado,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Error al generar recomendaciones');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setRecomendaciones(data);
    } catch (e: any) {
      const msg = e.message || 'Error al generar las recomendaciones';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (areasConResultados.length === 0) {
    return null;
  }

  if (!recomendaciones) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Button
          onClick={handleGenerar}
          disabled={loading}
          variant="outline"
          className="gap-2 border-secondary/50 hover:bg-secondary/10"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Users className="h-4 w-4 text-secondary-foreground" />
          )}
          {loading ? 'Generando...' : '👨‍👩‍👧 Generar Recomendaciones para Padres'}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground text-center max-w-md">
          Se generarán recomendaciones prácticas para que los padres de familia apoyen el aprendizaje en casa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
        <Users className="h-4 w-4" />
        Recomendaciones para la Familia
      </div>

      {/* Introducción */}
      <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-4">
        <p className="text-sm text-foreground leading-relaxed">{recomendaciones.introduccion}</p>
      </div>

      {/* Recomendaciones Generales */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <h5 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-primary" />
          Recomendaciones Generales
        </h5>
        <ul className="space-y-1">
          {recomendaciones.recomendaciones_generales.map((rec, i) => (
            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
              <span className="text-primary shrink-0">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* Por Área */}
      {recomendaciones.por_area?.map((areaRec, idx) => {
        const Icon = areaIcons[areaRec.area] || BookOpen;
        return (
          <div key={idx} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {areaRec.area}
              </h5>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full border font-medium',
                areaRec.nivel_logro === 'En Inicio' && 'bg-nivel-inicio/20 border-nivel-inicio text-destructive',
                areaRec.nivel_logro === 'En Proceso' && 'bg-nivel-proceso/20 border-nivel-proceso text-secondary-foreground',
                areaRec.nivel_logro === 'Logro Esperado' && 'bg-nivel-logro/20 border-nivel-logro text-accent-foreground',
                areaRec.nivel_logro === 'Logro Destacado' && 'bg-nivel-destacado/20 border-nivel-destacado text-primary-foreground',
              )}>
                {areaRec.nivel_logro}
              </span>
            </div>

            {/* Consejos en el hogar */}
            <div className="space-y-1">
              <h6 className="text-xs font-medium text-accent">🏠 En el hogar:</h6>
              <ul className="space-y-0.5">
                {areaRec.consejos_hogar.map((consejo, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-accent shrink-0">✓</span>
                    {consejo}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actividades sugeridas */}
            <div className="space-y-1">
              <h6 className="text-xs font-medium text-primary">🎯 Actividades sugeridas:</h6>
              <ul className="space-y-0.5">
                {areaRec.actividades_sugeridas.map((act, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-primary shrink-0">→</span>
                    {act}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recursos de apoyo */}
            {areaRec.recursos_apoyo?.length > 0 && (
              <div className="space-y-1">
                <h6 className="text-xs font-medium text-muted-foreground">📚 Recursos:</h6>
                <ul className="space-y-0.5">
                  {areaRec.recursos_apoyo.map((rec, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="shrink-0">📎</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {/* Mensaje motivacional */}
      <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
        <p className="text-sm text-foreground leading-relaxed italic">
          💪 {recomendaciones.mensaje_motivacional}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleGenerar}
        disabled={loading}
        className="text-xs text-muted-foreground gap-1"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />}
        Regenerar recomendaciones
      </Button>
    </div>
  );
};

export default RecomendacionesPadres;
