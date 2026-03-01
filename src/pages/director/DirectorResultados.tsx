import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const mockData = [
  { grado: '1° Prim', inicio: 30, proceso: 35, logro: 25, destacado: 10 },
  { grado: '2° Prim', inicio: 25, proceso: 30, logro: 30, destacado: 15 },
  { grado: '3° Prim', inicio: 20, proceso: 35, logro: 30, destacado: 15 },
  { grado: '4° Prim', inicio: 22, proceso: 28, logro: 35, destacado: 15 },
  { grado: '5° Prim', inicio: 18, proceso: 30, logro: 32, destacado: 20 },
  { grado: '6° Prim', inicio: 15, proceso: 25, logro: 40, destacado: 20 },
];

const DirectorResultados = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Resultados Institucionales</h1>
      <p className="text-muted-foreground">Distribución de niveles de logro por grado</p>
    </div>
    <Card className="shadow-card">
      <CardHeader><CardTitle>Niveles de Logro por Grado</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={mockData}>
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
      </CardContent>
    </Card>
  </div>
);

export default DirectorResultados;
