import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

const mockPreguntas = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  texto: `Pregunta ${i + 1}: ¿Cuál es la respuesta correcta para el ejercicio ${i + 1}?`,
  opciones: ['A', 'B', 'C', 'D'],
}));

const EstudiantePrueba = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);

  const pregunta = mockPreguntas[currentIdx];
  const progress = (Object.keys(respuestas).length / mockPreguntas.length) * 100;

  const handleSelect = (opcion: string) => {
    setRespuestas({ ...respuestas, [pregunta.id]: opcion });
  };

  const handleFinish = () => {
    setFinished(true);
  };

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <Card className="max-w-md w-full text-center shadow-card">
          <CardContent className="py-12 space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
            <h2 className="text-2xl font-bold text-foreground">¡Prueba Completada!</h2>
            <p className="text-muted-foreground">
              Has respondido {Object.keys(respuestas).length} de {mockPreguntas.length} preguntas.
              Tus resultados serán procesados automáticamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-foreground">Evaluación Diagnóstica</h1>
          <span className="text-sm text-muted-foreground">
            {currentIdx + 1} de {mockPreguntas.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="shadow-card">
        <CardContent className="py-8 space-y-6">
          <p className="text-lg font-medium text-foreground">{pregunta.texto}</p>
          <div className="grid grid-cols-1 gap-3">
            {pregunta.opciones.map(op => (
              <button
                key={op}
                onClick={() => handleSelect(op)}
                className={cn(
                  'w-full text-left px-5 py-4 rounded-xl border-2 text-base font-medium transition-all',
                  respuestas[pregunta.id] === op
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:border-primary/50'
                )}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold mr-3">
                  {op}
                </span>
                Opción {op}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />Anterior
        </Button>
        {currentIdx < mockPreguntas.length - 1 ? (
          <Button onClick={() => setCurrentIdx(currentIdx + 1)}>
            Siguiente<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleFinish} className="gradient-gold text-secondary-foreground">
            Finalizar Prueba
          </Button>
        )}
      </div>
    </div>
  );
};

export default EstudiantePrueba;
