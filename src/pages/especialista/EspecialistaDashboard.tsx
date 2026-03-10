import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/StatCard';
import { School, Users, BarChart3, MapPin, Calculator, BookOpen, Heart, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const ALL_DISTRITOS = [
  'Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Monsefú', 'Pimentel',
  'Reque', 'Pomalca', 'Tumán', 'Eten', 'Puerto Eten', 'Santa Rosa',
  'Pátapo', 'Lagunas', 'Zaña', 'Cayaltí', 'Oyotún', 'Nueva Arica',
  'Picsi', 'Chongoyape', 'Pucalá',
];

const AREAS = [
  { key: 'Matemática', label: 'Matemática', icon: Calculator },
  { key: 'Comprensión Lectora', label: 'Comprensión Lectora', icon: BookOpen },
  { key: 'Habilidades Socioemocionales', label: 'Socioemocional', icon: Heart },
] as const;

interface DistritoData {
  name: string;
  inicio: number;
  proceso: number;
  logro: number;
  destacado: number;
  total: number;
}

const heatMapColors = (pctInicio: number) => {
  if (pctInicio >= 35) return 'hsl(var(--nivel-inicio))';
  if (pctInicio >= 25) return 'hsl(var(--nivel-proceso))';
  return 'hsl(var(--nivel-logro))';
};

const EspecialistaDashboard = () => {
  const navigate = useNavigate();
  const [totalInst, setTotalInst] = useState(0);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [totalEvals, setTotalEvals] = useState(0);
  const [totalResultados, setTotalResultados] = useState(0);
  const [dataByArea, setDataByArea] = useState<Record<string, DistritoData[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Parallel queries: counts + aggregated stats in single RPC
      const [instRes, evalsRes, statsRes] = await Promise.all([
        supabase.from('instituciones').select('id', { count: 'exact', head: true }),
        supabase.from('evaluaciones').select('id', { count: 'exact', head: true }),
        supabase.rpc('get_especialista_stats'),
      ]);

      setTotalInst(instRes.count ?? 0);
      setTotalEvals(evalsRes.count ?? 0);

      const rawStats = statsRes.data || [];

      // Count total resultados and estudiantes from aggregated data
      let totalR = 0;
      let totalEst = 0;
      const countedEstudiantes = new Set<string>();
      for (const row of rawStats) {
        totalR += Number(row.total);
      }
      setTotalResultados(totalR);

      // Count distinct estudiantes via a separate optimized query
      const { count: estCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .not('grado_seccion_id', 'is', null);
      setTotalEstudiantes(estCount ?? 0);

      if (!rawStats.length) {
        setLoading(false);
        return;
      }

      // Build grouped data from aggregated RPC results
      const grouped: Record<string, Record<string, { inicio: number; proceso: number; logro: number; destacado: number }>> = {};
      for (const area of AREAS) {
        grouped[area.key] = {};
        for (const d of ALL_DISTRITOS) {
          grouped[area.key][d] = { inicio: 0, proceso: 0, logro: 0, destacado: 0 };
        }
      }

      for (const row of rawStats) {
        const { area, distrito, nivel_logro, total } = row;
        if (!area || !distrito || !grouped[area]?.[distrito]) continue;
        const count = Number(total);
        const target = grouped[area][distrito];
        if (nivel_logro === 'En Inicio') target.inicio += count;
        else if (nivel_logro === 'En Proceso') target.proceso += count;
        else if (nivel_logro === 'Logro Esperado') target.logro += count;
        else if (nivel_logro === 'Logro Destacado') target.destacado += count;
      }

      const result: Record<string, DistritoData[]> = {};
      for (const area of AREAS) {
        result[area.key] = ALL_DISTRITOS.map(d => ({
          name: d,
          ...grouped[area.key][d],
          total: grouped[area.key][d].inicio + grouped[area.key][d].proceso + grouped[area.key][d].logro + grouped[area.key][d].destacado,
        }));
      }
      setDataByArea(result);
      setLoading(false);
    };
    load();
  }, []);

  // Global heat data (sum all areas)
  const heatData = ALL_DISTRITOS.map(name => {
    let totalInicio = 0, totalSum = 0;
    for (const area of AREAS) {
      const d = dataByArea[area.key]?.find(dd => dd.name === name);
      if (d) {
        totalInicio += d.inicio;
        totalSum += d.total;
      }
    }
    return { name, pctInicio: totalSum > 0 ? Math.round((totalInicio / totalSum) * 100) : 0 };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Regional – UGEL Chiclayo</h1>
        <p className="text-muted-foreground">Vista consolidada de los aprendizajes por provincia y distrito</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Instituciones" value={String(totalInst)} icon={School} />
        <StatCard title="Estudiantes" value={String(totalEstudiantes)} icon={Users} variant="primary" />
        <StatCard title="Evaluaciones" value={String(totalEvals)} icon={BarChart3} variant="success" />
        <StatCard title="Resultados" value={String(totalResultados)} icon={MapPin} variant="warning" />
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

        {AREAS.map(area => {
          const areaData = (dataByArea[area.key] || []).filter(d => d.total > 0);
          return (
            <TabsContent key={area.key} value={area.key}>
              <Card className="shadow-card">
                <CardHeader><CardTitle className="text-sm sm:text-base">Niveles de Logro por Distrito – {area.label}</CardTitle></CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Cargando datos...</p>
                  ) : areaData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(300, areaData.length * 35)}>
                      <BarChart data={areaData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="inicio" name="En Inicio" stackId="a" fill="hsl(0, 72%, 51%)" />
                        <Bar dataKey="proceso" name="En Proceso" stackId="a" fill="hsl(38, 92%, 55%)" />
                        <Bar dataKey="logro" name="Logro Esperado" stackId="a" fill="hsl(160, 50%, 40%)" />
                        <Bar dataKey="destacado" name="Logro Destacado" stackId="a" fill="hsl(220, 65%, 28%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Sin datos de resultados aún para {area.label}.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-sm sm:text-base">Mapa de Calor – 20 Distritos (Global)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {heatData.map(d => (
              <div
                key={d.name}
                className="rounded-lg p-2 text-center text-[10px] sm:text-xs font-medium transition-transform hover:scale-105"
                style={{
                  backgroundColor: d.pctInicio > 0 ? heatMapColors(d.pctInicio) : 'hsl(var(--muted))',
                  color: d.pctInicio >= 35 ? 'white' : d.pctInicio >= 25 ? 'hsl(var(--foreground))' : d.pctInicio > 0 ? 'white' : 'hsl(var(--muted-foreground))',
                }}
              >
                <div className="font-bold truncate">{d.name}</div>
                <div>{d.pctInicio > 0 ? `${d.pctInicio}%` : '—'}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--nivel-inicio))' }} />
              Crítico (≥35%)
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--nivel-proceso))' }} />
              Alerta (25-34%)
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--nivel-logro))' }} />
              Aceptable (&lt;25%)
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              Sin datos
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EspecialistaDashboard;
