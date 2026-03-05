import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, BookOpen, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AREAS = [
  { key: 'Matemática', label: 'Matemática', icon: Calculator },
  { key: 'Comprensión Lectora', label: 'Comprensión Lectora', icon: BookOpen },
  { key: 'Habilidades Socioemocionales', label: 'Habilidades Socioemocionales', icon: Heart },
] as const;

const nivelRecomendacion: Record<string, string> = {
  'En Inicio': 'Se recomienda acompañamiento individualizado con actividades lúdicas de refuerzo. Trabajar con material concreto y apoyo familiar constante.',
  'En Proceso': 'El estudiante está avanzando. Reforzar con ejercicios prácticos y retroalimentación frecuente. Fomentar la lectura diaria.',
  'Logro Esperado': '¡Buen desempeño! Continuar con actividades desafiantes que promuevan el pensamiento crítico y la creatividad.',
  'Logro Destacado': '¡Excelente! El estudiante demuestra dominio. Ofrecer retos adicionales y oportunidades de liderazgo académico.',
};

const nivelStyle: Record<string, string> = {
  'En Inicio': 'border-nivel-inicio bg-nivel-inicio/10 text-foreground',
  'En Proceso': 'border-nivel-proceso bg-nivel-proceso/10 text-foreground',
  'Logro Esperado': 'border-nivel-logro bg-nivel-logro/10 text-foreground',
  'Logro Destacado': 'border-nivel-destacado bg-nivel-destacado/10 text-foreground',
};

interface AreaResult {
  area: string;
  label: string;
  icon: typeof Calculator;
  puntaje: number | null;
  nivel: string | null;
}

const EstudianteResultados = () => {
  const { profile, user } = useAuth();
  const [results, setResults] = useState<AreaResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const fetch = async () => {
      setLoading(true);
      const { data: evaluaciones } = await supabase
        .from('evaluaciones')
        .select('id, area');

      const { data: resultados } = await supabase
        .from('resultados')
        .select('evaluacion_id, puntaje_total, nivel_logro')
        .eq('estudiante_id', profile.id);

      const evalMap = Object.fromEntries((evaluaciones || []).map(e => [e.id, e.area]));

      const mapped: AreaResult[] = AREAS.map(a => {
        const evalIds = (evaluaciones || []).filter(e => e.area === a.key).map(e => e.id);
        const res = (resultados || []).find(r => evalIds.includes(r.evaluacion_id));
        return {
          area: a.key,
          label: a.label,
          icon: a.icon,
          puntaje: res?.puntaje_total ?? null,
          nivel: res?.nivel_logro ?? null,
        };
      });
      setResults(mapped);
      setLoading(false);
    };
    fetch();
  }, [profile?.id]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Mi Boleta de Resultados</h1>
        <p className="text-muted-foreground">{profile?.nombre_completo}</p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Cargando resultados...</p>
      ) : results.every(r => r.puntaje === null) ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            Aún no hay resultados registrados para tus evaluaciones.
          </CardContent>
        </Card>
      ) : (
        results.map((area, i) => (
          <Card key={i} className={cn('shadow-card border-l-4', area.nivel ? nivelStyle[area.nivel] : 'border-muted')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <area.icon className="h-5 w-5" />
                {area.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {area.puntaje !== null ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Puntaje:</span>
                    <span className="text-2xl font-bold">{area.puntaje}/20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nivel:</span>
                    <span className="font-semibold">{area.nivel}</span>
                  </div>
                  {area.nivel && (
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Recomendación:</p>
                      <p className="text-sm text-foreground">{nivelRecomendacion[area.nivel]}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sin evaluar aún.</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default EstudianteResultados;
