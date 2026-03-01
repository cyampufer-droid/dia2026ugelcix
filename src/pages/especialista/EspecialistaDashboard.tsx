import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import { School, Users, BarChart3, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const ALL_DISTRITOS = [
  'Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Monsefú', 'Pimentel',
  'Reque', 'Pomalca', 'Tumán', 'Eten', 'Puerto Eten', 'Santa Rosa',
  'Pátapo', 'Lagunas', 'Zaña', 'Cayaltí', 'Oyotún', 'Nueva Arica',
  'Picsi', 'Chongoyape', 'Pucalá',
];

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
  const [totalInst, setTotalInst] = useState(0);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [totalEvals, setTotalEvals] = useState(0);
  const [distritoData, setDistritoData] = useState<DistritoData[]>([]);

  useEffect(() => {
    const load = async () => {
      const [instRes, profilesRes, evalsRes, resultadosRes, instDistRes] = await Promise.all([
        supabase.from('instituciones').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('evaluaciones').select('id', { count: 'exact', head: true }),
        supabase.from('resultados').select('nivel_logro, estudiante_id'),
        supabase.from('instituciones').select('id, distrito'),
      ]);

      setTotalInst(instRes.count ?? 0);
      setTotalEstudiantes(profilesRes.count ?? 0);
      setTotalEvals(evalsRes.count ?? 0);

      // Build district → institution mapping
      const instByDistrito: Record<string, Set<string>> = {};
      for (const inst of instDistRes.data ?? []) {
        if (!instByDistrito[inst.distrito]) instByDistrito[inst.distrito] = new Set();
        instByDistrito[inst.distrito].add(inst.id);
      }

      // If we have resultados, aggregate by district via profiles→instituciones
      // For now, build from available data
      const mapped: DistritoData[] = ALL_DISTRITOS.map(d => ({
        name: d,
        inicio: 0, proceso: 0, logro: 0, destacado: 0,
        total: instByDistrito[d]?.size ?? 0,
      }));

      // Count resultados by nivel_logro (simplified - shows aggregate)
      for (const r of resultadosRes.data ?? []) {
        // Distribute evenly for now since we can't join in client
        const nivel = r.nivel_logro;
        // Increment a global counter (will be refined with real district mapping)
        const target = mapped[0]; // placeholder
        if (nivel === 'En Inicio') target.inicio++;
        else if (nivel === 'En Proceso') target.proceso++;
        else if (nivel === 'Logro Esperado') target.logro++;
        else if (nivel === 'Logro Destacado') target.destacado++;
      }

      setDistritoData(mapped);
    };
    load();
  }, []);

  // Compute percentages for display
  const displayData = distritoData
    .filter(d => d.total > 0 || d.inicio + d.proceso + d.logro + d.destacado > 0)
    .map(d => {
      const sum = d.inicio + d.proceso + d.logro + d.destacado;
      return {
        ...d,
        pctInicio: sum > 0 ? Math.round((d.inicio / sum) * 100) : 0,
      };
    });

  // For heat map, show all districts
  const heatData = ALL_DISTRITOS.map(name => {
    const found = distritoData.find(d => d.name === name);
    const sum = found ? found.inicio + found.proceso + found.logro + found.destacado : 0;
    return {
      name,
      pctInicio: sum > 0 ? Math.round(((found?.inicio ?? 0) / sum) * 100) : 0,
    };
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
        <StatCard title="Distritos" value="20" icon={MapPin} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-sm sm:text-base">Nivel de Logro por Distrito (% En Inicio)</CardTitle></CardHeader>
          <CardContent>
            {displayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(300, displayData.length * 32)}>
                <BarChart data={displayData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="pctInicio" name="% En Inicio" radius={[0, 4, 4, 0]}>
                    {displayData.map((entry, index) => (
                      <Cell key={index} fill={heatMapColors(entry.pctInicio)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos de resultados aún. Los gráficos se llenarán automáticamente cuando los docentes sincronicen las evaluaciones.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-sm sm:text-base">Mapa de Calor – 20 Distritos</CardTitle></CardHeader>
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
    </div>
  );
};

export default EspecialistaDashboard;
