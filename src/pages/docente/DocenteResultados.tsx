import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calculator, BookOpen, Heart } from 'lucide-react';

const AREAS = [
  { key: 'Matemática', label: 'Matemática', icon: Calculator },
  { key: 'Comprensión Lectora', label: 'Comprensión Lectora', icon: BookOpen },
  { key: 'Habilidades Socioemocionales', label: 'Socioemocional', icon: Heart },
] as const;

const nivelColor: Record<string, string> = {
  'En Inicio': 'bg-nivel-inicio text-destructive-foreground',
  'En Proceso': 'bg-nivel-proceso text-secondary-foreground',
  'Logro Esperado': 'bg-nivel-logro text-success-foreground',
  'Logro Destacado': 'bg-nivel-destacado text-primary-foreground',
};

interface ResultRow {
  estudiante_nombre: string;
  estudiante_dni: string;
  puntaje_total: number | null;
  nivel_logro: string | null;
}

const DocenteResultados = () => {
  const { profile } = useAuth();
  const [resultsByArea, setResultsByArea] = useState<Record<string, ResultRow[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.grado_seccion_id) return;
    const fetchResults = async () => {
      setLoading(true);
      // Get students in this classroom
      const { data: students } = await supabase
        .from('profiles')
        .select('id, nombre_completo, dni')
        .eq('grado_seccion_id', profile.grado_seccion_id!)
        .order('nombre_completo');

      if (!students?.length) { setLoading(false); return; }

      // Get evaluaciones
      const { data: evaluaciones } = await supabase
        .from('evaluaciones')
        .select('id, area');

      if (!evaluaciones?.length) { setLoading(false); return; }

      const studentIds = students.map(s => s.id);
      const { data: resultados } = await supabase
        .from('resultados')
        .select('estudiante_id, evaluacion_id, puntaje_total, nivel_logro')
        .in('estudiante_id', studentIds);

      const evalMap = Object.fromEntries(evaluaciones.map(e => [e.id, e.area]));
      const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

      const grouped: Record<string, ResultRow[]> = {};
      for (const area of AREAS) {
        const areaEvalIds = evaluaciones.filter(e => e.area === area.key).map(e => e.id);
        const areaResults = (resultados || []).filter(r => areaEvalIds.includes(r.evaluacion_id));
        
        grouped[area.key] = students.map(s => {
          const res = areaResults.find(r => r.estudiante_id === s.id);
          return {
            estudiante_nombre: s.nombre_completo,
            estudiante_dni: s.dni,
            puntaje_total: res?.puntaje_total ?? null,
            nivel_logro: res?.nivel_logro ?? null,
          };
        });
      }
      setResultsByArea(grouped);
      setLoading(false);
    };
    fetchResults();
  }, [profile?.grado_seccion_id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resultados de Mi Aula</h1>
        <p className="text-muted-foreground">Niveles de logro por área de evaluación</p>
      </div>

      <Tabs defaultValue="Matemática" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {AREAS.map(a => (
            <TabsTrigger key={a.key} value={a.key} className="flex items-center gap-1 text-xs sm:text-sm">
              <a.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{a.label}</span>
              <span className="sm:hidden">{a.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {AREAS.map(area => (
          <TabsContent key={area.key} value={area.key}>
            <Card className="shadow-card">
              <CardHeader><CardTitle>Resultados – {area.label}</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-sm">Cargando resultados...</p>
                ) : !resultsByArea[area.key]?.length ? (
                  <p className="text-muted-foreground text-sm">No hay estudiantes registrados en esta aula.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">N°</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Estudiante</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">Puntaje</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">Nivel de Logro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultsByArea[area.key].map((r, i) => (
                          <tr key={i} className="border-b border-border hover:bg-muted/50">
                            <td className="py-2 px-3">{i + 1}</td>
                            <td className="py-2 px-3 font-medium">{r.estudiante_nombre}</td>
                            <td className="py-2 px-3 text-center font-bold">
                              {r.puntaje_total !== null ? `${r.puntaje_total}/20` : '—'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {r.nivel_logro ? (
                                <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', nivelColor[r.nivel_logro] || 'bg-muted')}>
                                  {r.nivel_logro}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">Sin evaluar</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DocenteResultados;
