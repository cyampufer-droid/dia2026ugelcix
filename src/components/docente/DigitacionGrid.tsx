import { memo, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';

const opciones = ['A', 'B', 'C', 'D'];

interface Student {
  id: string;
  nombre_completo: string;
  dni: string;
}

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

interface DigitacionGridProps {
  students: Student[];
  respuestas: Record<string, string[]>;
  numPreguntas: number;
  onRespuesta: (studentId: string, idx: number, val: string) => void;
}

const DigitacionGrid = ({ students, respuestas, numPreguntas, onRespuesta }: DigitacionGridProps) => {
  return (
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
          {students.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              answers={respuestas[student.id] || []}
              numPreguntas={numPreguntas}
              onRespuesta={onRespuesta}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DigitacionGrid;
export type { Student };
