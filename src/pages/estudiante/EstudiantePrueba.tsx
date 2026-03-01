import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, CheckCircle2, Volume2 } from 'lucide-react';

const mockPreguntas = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  texto: `Pregunta ${i + 1}: ¿Cuál es la respuesta correcta para el ejercicio ${i + 1}?`,
  opciones: ['A', 'B', 'C', 'D'],
}));

const playAudio = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE';
    utterance.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }
};

const EstudiantePrueba = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);

  const pregunta = mockPreguntas[currentIdx];
  const progress = (Object.keys(respuestas).length / mockPreguntas.length) * 100;

  const handleSelect = useCallback((opcion: string) => {
    setRespuestas(prev => ({ ...prev, [pregunta.id]: opcion }));
  }, [pregunta.id]);

  const handleFinish = () => setFinished(true);

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <Card className="max-w-md w-full text-center shadow-card">
          <CardContent className="py-12 space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-accent" />
            <h2 className="text-2xl font-bold text-foreground">¡Prueba Completada! 🎉</h2>
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
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-fade-in px-2">
      {/* Progress header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-base sm:text-lg font-bold text-foreground">Evaluación Diagnóstica</h1>
          <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
            {currentIdx + 1}/{mockPreguntas.length}
          </span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Question card */}
      <Card className="shadow-card border-2 border-primary/10">
        <CardContent className="py-6 sm:py-8 space-y-5">
          <div className="flex items-start gap-2">
            <p className="text-base sm:text-lg font-medium text-foreground flex-1">{pregunta.texto}</p>
            {/* Audio button for accessibility / Inicial / 1er Grado */}
            <button
              onClick={() => playAudio(pregunta.texto)}
              className="shrink-0 p-2.5 rounded-full bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors"
              aria-label="Escuchar pregunta"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {/* Large, touch-friendly option buttons */}
          <div className="grid grid-cols-1 gap-3">
            {pregunta.opciones.map(op => (
              <button
                key={op}
                onClick={() => handleSelect(op)}
                className={cn(
                  'w-full text-left px-5 py-5 sm:py-4 rounded-2xl border-2 text-base sm:text-lg font-semibold transition-all active:scale-[0.98]',
                  respuestas[pregunta.id] === op
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                    : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <span className="inline-flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-muted text-sm font-bold mr-3">
                  {op}
                </span>
                Opción {op}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-3 pb-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="text-sm sm:text-base"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />Anterior
        </Button>
        {currentIdx < mockPreguntas.length - 1 ? (
          <Button size="lg" onClick={() => setCurrentIdx(currentIdx + 1)} className="text-sm sm:text-base">
            Siguiente<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button size="lg" onClick={handleFinish} className="gradient-gold text-secondary-foreground text-sm sm:text-base">
            ✅ Finalizar
          </Button>
        )}
      </div>
    </div>
  );
};

export default EstudiantePrueba;
