import { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { saveDigitacionOffline, getAllDigitaciones } from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Wifi, WifiOff, CloudUpload, Loader2, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const opciones = ['A', 'B', 'C', 'D'];

interface Student {
  id: string;
  nombre_completo: string;
  dni: string;
}

// Memoized cell to prevent re-renders across the entire grid
const RespuestaCell = memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <td className="py-1 px-0.5 text-center">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-9 h-7 text-xs rounded border border-border bg-background text-center focus:ring-1 focus:ring-primary focus:border-primary"
    >
      <option value="">–</option>
      {opciones.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </td>
));
RespuestaCell.displayName = 'RespuestaCell';

// Memoized row
const StudentRow = memo(({ student, answers, numPreguntas, onRespuesta }: {
  student: Student;
  answers: string[];
  numPreguntas: number;
  onRespuesta: (studentId: string, idx: number, val: string) => void;
}) => {
  const answered = answers.filter(a => a !== '' && a !== undefined).length;
  return (
    <tr className="border-b border-border hover:bg-muted/30">
      <td className="sticky left-0 bg-card py-1.5 px-3 z-10 border-r border-border">
        <div className="text-xs font-medium text-foreground truncate max-w-[170px]">{student.nombre_completo}</div>
        <div className="text-[10px] text-muted-foreground font-mono">{student.dni}</div>
      </td>
      {Array.from({ length: numPreguntas }, (_, idx) => (
        <RespuestaCell
          key={idx}
          value={answers[idx] || ''}
          onChange={(val) => onRespuesta(student.id, idx, val)}
        />
      ))}
      <td className="py-1 px-2 text-center">
        <span className={`text-xs font-bold ${answered === numPreguntas ? 'text-accent' : 'text-muted-foreground'}`}>
          {answered}/{numPreguntas}
        </span>
        {answered === numPreguntas && <CheckCircle2 className="h-3 w-3 text-accent inline ml-0.5" />}
      </td>
    </tr>
  );
});
StudentRow.displayName = 'StudentRow';

const Digitacion = () => {
  const [numPreguntas] = useState(20);
  const [respuestas, setRespuestas] = useState<Record<string, string[]>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluacionId, setEvaluacionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { isOnline, pendingCount, isSyncing, syncToCloud, refreshPendingCount } = useOfflineSync();

  useEffect(() => {
    const loadStudents = async () => {
      if (!profile?.grado_seccion_id) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, nombre_completo, dni')
        .eq('grado_seccion_id', profile.grado_seccion_id)
        .order('nombre_completo');
      if (data && data.length > 0) setStudents(data);
    };
    loadStudents();
  }, [profile?.grado_seccion_id]);

  useEffect(() => {
    const loadOffline = async () => {
      const saved = await getAllDigitaciones();
      const restored: Record<string, string[]> = {};
      for (const record of saved) {
        restored[record.estudiante_id] = record.respuestas;
      }
      if (Object.keys(restored).length > 0) {
        setRespuestas(prev => ({ ...restored, ...prev }));
      }
    };
    loadOffline();
  }, []);

  const handleRespuesta = useCallback((studentId: string, preguntaIdx: number, valor: string) => {
    setRespuestas(prev => {
      const current = prev[studentId] || Array(numPreguntas).fill('');
      const updated = [...current];
      updated[preguntaIdx] = valor;
      return { ...prev, [studentId]: updated };
    });
  }, [numPreguntas]);

  const handleSaveLocal = async () => {
    setSaving(true);
    try {
      const evalId = evaluacionId || 'pending';
      for (const [studentId, answers] of Object.entries(respuestas)) {
        await saveDigitacionOffline(studentId, evalId, answers);
      }
      await refreshPendingCount();
      toast({ title: '💾 Guardado localmente', description: `${Object.keys(respuestas).length} registros guardados en el dispositivo.` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const displayStudents = students.length > 0 ? students : [
    { id: 'demo-1', nombre_completo: 'García López, Ana María', dni: '71234567' },
    { id: 'demo-2', nombre_completo: 'Pérez Torres, Carlos', dni: '71234568' },
    { id: 'demo-3', nombre_completo: 'Mendoza Ríos, Lucía', dni: '71234569' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Grilla de Digitación</h1>
          <p className="text-sm text-muted-foreground">Ingrese las respuestas de cada estudiante (A, B, C, D)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'En línea' : 'Sin conexión'}
          </Badge>
          {pendingCount > 0 && <Badge variant="secondary" className="gap-1">{pendingCount} pendientes</Badge>}
          <Button size="sm" variant="outline" onClick={handleSaveLocal} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline ml-1">Guardar</span>
          </Button>
          <Button size="sm" onClick={syncToCloud} disabled={!isOnline || isSyncing || pendingCount === 0} className="gap-1">
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0 z-20">
                <tr>
                  <th className="sticky left-0 bg-muted py-2 px-3 text-left font-medium text-muted-foreground min-w-[180px] z-30 border-r border-border">
                    Estudiante
                  </th>
                  {Array.from({ length: numPreguntas }, (_, i) => (
                    <th key={i} className="py-2 px-1 text-center font-medium text-muted-foreground min-w-[40px]">P{i + 1}</th>
                  ))}
                  <th className="py-2 px-2 text-center font-medium text-muted-foreground min-w-[50px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {displayStudents.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    answers={respuestas[student.id] || []}
                    numPreguntas={numPreguntas}
                    onRespuesta={handleRespuesta}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!isOnline && (
        <div className="rounded-lg bg-secondary/10 border border-secondary/30 p-3 text-sm text-foreground flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-secondary shrink-0" />
          <span>Trabajando sin conexión. Los datos se guardan en el dispositivo. Sincronice cuando tenga internet.</span>
        </div>
      )}
    </div>
  );
};

export default Digitacion;
