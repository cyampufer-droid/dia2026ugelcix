import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Wifi, WifiOff } from 'lucide-react';

const opciones = ['A', 'B', 'C', 'D'];

// Mock students for demo
const mockStudents = [
  { id: '1', nombre: 'García López, Ana María', dni: '71234567' },
  { id: '2', nombre: 'Pérez Torres, Carlos', dni: '71234568' },
  { id: '3', nombre: 'Mendoza Ríos, Lucía', dni: '71234569' },
];

const Digitacion = () => {
  const [numPreguntas] = useState(20);
  const [respuestas, setRespuestas] = useState<Record<string, string[]>>({});
  const [isOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  const handleRespuesta = (studentId: string, preguntaIdx: number, valor: string) => {
    setRespuestas(prev => {
      const current = prev[studentId] || Array(numPreguntas).fill('');
      const updated = [...current];
      updated[preguntaIdx] = valor;
      return { ...prev, [studentId]: updated };
    });
  };

  const handleSave = () => {
    // Save to localStorage for offline support
    localStorage.setItem('digitacion_respuestas', JSON.stringify(respuestas));
    toast({ title: 'Guardado localmente', description: 'Los datos se sincronizarán cuando haya conexión.' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grilla de Digitación</h1>
          <p className="text-muted-foreground">Ingrese las respuestas de cada estudiante</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm">
            {isOnline ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-destructive" />}
            {isOnline ? 'En línea' : 'Sin conexión'}
          </span>
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Guardar</Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="sticky left-0 bg-muted py-2 px-3 text-left font-medium text-muted-foreground min-w-[200px] z-10">Estudiante</th>
                  {Array.from({ length: numPreguntas }, (_, i) => (
                    <th key={i} className="py-2 px-1 text-center font-medium text-muted-foreground min-w-[44px]">P{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockStudents.map((student) => (
                  <tr key={student.id} className="border-b border-border hover:bg-muted/30">
                    <td className="sticky left-0 bg-card py-1.5 px-3 font-medium text-foreground z-10 border-r border-border">
                      <div className="text-xs">{student.nombre}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{student.dni}</div>
                    </td>
                    {Array.from({ length: numPreguntas }, (_, idx) => (
                      <td key={idx} className="py-1 px-0.5 text-center">
                        <select
                          value={respuestas[student.id]?.[idx] || ''}
                          onChange={e => handleRespuesta(student.id, idx, e.target.value)}
                          className="w-10 h-7 text-xs rounded border border-border bg-background text-center focus:ring-1 focus:ring-primary"
                        >
                          <option value="">–</option>
                          {opciones.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Digitacion;
