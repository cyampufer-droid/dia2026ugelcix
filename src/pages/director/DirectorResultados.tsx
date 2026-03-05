import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calculator, BookOpen, Heart } from 'lucide-react';

const AREAS = [
  { key: 'Matemática', label: 'Matemática', icon: Calculator },
  { key: 'Comprensión Lectora', label: 'Comprensión Lectora', icon: BookOpen },
  { key: 'Habilidades Socioemocionales', label: 'Socioemocional', icon: Heart },
] as const;

interface GradoData {
  grado: string;
  inicio: number;
  proceso: number;
  logro: number;
  destacado: number;
}

const DirectorResultados = () => {
  const { profile } = useAuth();
  const [dataByArea, setDataByArea] = useState<Record<string, GradoData[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.institucion_id) return;
    const fetch = async () => {
      setLoading(true);
      const { data: grados } = await supabase
        .from('niveles_grados')
        .select('id, nivel, grado, seccion')
        .eq('institucion_id', profile.institucion_id!)
        .order('nivel').order('grado');

      const { data: students } = await supabase
        .from('profiles')
        .select('id, grado_seccion_id')
        .eq('institucion_id', profile.institucion_id!);

      const { data: evaluaciones } = await supabase
        .from('evaluaciones')
        .select('id, area');

      if (!students?.length || !evaluaciones?.length || !grados?.length) {
        setLoading(false);
        return;
      }

      const studentIds = students.map(s => s.id);
      const { data: resultados } = await supabase
        .from('resultados')
        .select('estudiante_id, evaluacion_id, nivel_logro')
        .in('estudiante_id', studentIds);

      const studentGradoMap = Object.fromEntries(students.map(s => [s.id, s.grado_seccion_id]));
      const gradoLabelMap = Object.fromEntries(grados.map(g => [g.id, `${g.grado} ${g.seccion}`]));

      const grouped: Record<string, GradoData[]> = {};
      for (const area of AREAS) {
        const areaEvalIds = evaluaciones.filter(e => e.area === area.key).map(e => e.id);
        const areaResults = (resultados || []).filter(r => areaEvalIds.includes(r.evaluacion_id));

        const byGrado: Record<string, { inicio: number; proceso: number; logro: number; destacado: number }> = {};
        for (const g of grados) {
          byGrado[g.id] = { inicio: 0, proceso: 0, logro: 0, destacado: 0 };
        }

        for (const r of areaResults) {
          const gsId = studentGradoMap[r.estudiante_id];
          if (!gsId || !byGrado[gsId]) continue;
          if (r.nivel_logro === 'En Inicio') byGrado[gsId].inicio++;
          else if (r.nivel_logro === 'En Proceso') byGrado[gsId].proceso++;
          else if (r.nivel_logro === 'Logro Esperado') byGrado[gsId].logro++;
          else if (r.nivel_logro === 'Logro Destacado') byGrado[gsId].destacado++;
        }

        grouped[area.key] = grados.map(g => ({
          grado: gradoLabelMap[g.id] || g.grado,
          ...byGrado[g.id],
        })).filter(d => d.inicio + d.proceso + d.logro + d.destacado > 0);
      }
      setDataByArea(grouped);
      setLoading(false);
    };
    fetch();
  }, [profile?.institucion_id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resultados Institucionales</h1>
        <p className="text-muted-foreground">Distribución de niveles de logro por grado y área</p>
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
              <CardHeader><CardTitle>Niveles de Logro – {area.label}</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-sm">Cargando resultados...</p>
                ) : !dataByArea[area.key]?.length ? (
                  <p className="text-muted-foreground text-sm">No hay resultados registrados para esta área.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={dataByArea[area.key]}>
                      <XAxis dataKey="grado" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="inicio" name="En Inicio" stackId="a" fill="hsl(0, 72%, 51%)" />
                      <Bar dataKey="proceso" name="En Proceso" stackId="a" fill="hsl(38, 92%, 55%)" />
                      <Bar dataKey="logro" name="Logro Esperado" stackId="a" fill="hsl(160, 50%, 40%)" />
                      <Bar dataKey="destacado" name="Logro Destacado" stackId="a" fill="hsl(220, 65%, 28%)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DirectorResultados;
