import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const mockResults = [
  { nombre: 'García López, Ana María', puntaje: 18, nivel: 'Logro Esperado' },
  { nombre: 'Pérez Torres, Carlos', puntaje: 12, nivel: 'En Proceso' },
  { nombre: 'Mendoza Ríos, Lucía', puntaje: 20, nivel: 'Logro Destacado' },
  { nombre: 'Torres Vega, Juan', puntaje: 8, nivel: 'En Inicio' },
  { nombre: 'Ríos Castillo, María', puntaje: 15, nivel: 'Logro Esperado' },
];

const nivelColor: Record<string, string> = {
  'En Inicio': 'bg-nivel-inicio text-destructive-foreground',
  'En Proceso': 'bg-nivel-proceso text-secondary-foreground',
  'Logro Esperado': 'bg-nivel-logro text-success-foreground',
  'Logro Destacado': 'bg-nivel-destacado text-primary-foreground',
};

const DocenteResultados = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Resultados de Mi Aula</h1>
      <p className="text-muted-foreground">Niveles de logro calculados automáticamente</p>
    </div>
    <Card className="shadow-card">
      <CardHeader><CardTitle>Resultados por Estudiante</CardTitle></CardHeader>
      <CardContent>
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
              {mockResults.map((r, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/50">
                  <td className="py-2 px-3">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">{r.nombre}</td>
                  <td className="py-2 px-3 text-center font-bold">{r.puntaje}/20</td>
                  <td className="py-2 px-3 text-center">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', nivelColor[r.nivel])}>
                      {r.nivel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default DocenteResultados;
