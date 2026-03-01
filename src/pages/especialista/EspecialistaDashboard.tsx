import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import { School, Users, BarChart3, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const dataByDistrito = [
  { name: 'Chiclayo', inicio: 25, proceso: 35, logro: 30, destacado: 10 },
  { name: 'JLO', inicio: 30, proceso: 32, logro: 28, destacado: 10 },
  { name: 'La Victoria', inicio: 28, proceso: 34, logro: 25, destacado: 13 },
  { name: 'Monsefú', inicio: 35, proceso: 30, logro: 25, destacado: 10 },
  { name: 'Pimentel', inicio: 20, proceso: 30, logro: 35, destacado: 15 },
  { name: 'Reque', inicio: 40, proceso: 28, logro: 22, destacado: 10 },
  { name: 'Pomalca', inicio: 38, proceso: 30, logro: 22, destacado: 10 },
  { name: 'Tumán', inicio: 33, proceso: 32, logro: 25, destacado: 10 },
];

const heatMapColors = (inicio: number) => {
  if (inicio >= 35) return 'hsl(0, 72%, 51%)';
  if (inicio >= 25) return 'hsl(38, 92%, 55%)';
  return 'hsl(160, 50%, 40%)';
};

const EspecialistaDashboard = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard Regional – UGEL Chiclayo</h1>
      <p className="text-muted-foreground">Vista consolidada de los aprendizajes por provincia y distrito</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Instituciones" value="—" icon={School} />
      <StatCard title="Estudiantes" value="—" icon={Users} variant="primary" />
      <StatCard title="Evaluaciones" value="—" icon={BarChart3} variant="success" />
      <StatCard title="Distritos" value="20" icon={MapPin} variant="warning" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-card">
        <CardHeader><CardTitle>Nivel de Logro por Distrito (% En Inicio)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataByDistrito} layout="vertical">
              <XAxis type="number" domain={[0, 50]} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="inicio" name="% En Inicio" radius={[0, 4, 4, 0]}>
                {dataByDistrito.map((entry, index) => (
                  <Cell key={index} fill={heatMapColors(entry.inicio)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle>Mapa de Calor – Distritos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {dataByDistrito.map(d => (
              <div
                key={d.name}
                className="rounded-lg p-3 text-center text-xs font-medium"
                style={{ backgroundColor: heatMapColors(d.inicio), color: d.inicio >= 35 ? 'white' : d.inicio >= 25 ? 'hsl(220, 40%, 13%)' : 'white' }}
              >
                <div className="font-bold">{d.name}</div>
                <div>{d.inicio}% Inicio</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 72%, 51%)' }} />
              Crítico (≥35%)
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(38, 92%, 55%)' }} />
              Alerta (25-34%)
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(160, 50%, 40%)' }} />
              Aceptable (&lt;25%)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default EspecialistaDashboard;
