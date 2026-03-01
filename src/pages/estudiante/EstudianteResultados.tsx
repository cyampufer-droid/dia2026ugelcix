import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, BookOpen, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockBoleta = {
  nombre: 'García López, Ana María',
  grado: '4° Primaria',
  areas: [
    { area: 'Matemática', puntaje: 16, nivel: 'Logro Esperado' },
    { area: 'Lectura', puntaje: 12, nivel: 'En Proceso' },
    { area: 'Socioemocional', puntaje: 19, nivel: 'Logro Destacado' },
  ],
};

const nivelRecomendacion: Record<string, string> = {
  'En Inicio': 'Se recomienda acompañamiento individualizado con actividades lúdicas de refuerzo. Trabajar con material concreto y apoyo familiar constante.',
  'En Proceso': 'El estudiante está avanzando. Reforzar con ejercicios prácticos y retroalimentación frecuente. Fomentar la lectura diaria.',
  'Logro Esperado': '¡Buen desempeño! Continuar con actividades desafiantes que promuevan el pensamiento crítico y la creatividad.',
  'Logro Destacado': '¡Excelente! El estudiante demuestra dominio. Ofrecer retos adicionales y oportunidades de liderazgo académico.',
};

const nivelStyle: Record<string, string> = {
  'En Inicio': 'border-nivel-inicio bg-nivel-inicio/10 text-foreground',
  'En Proceso': 'border-nivel-proceso bg-nivel-proceso/10 text-foreground',
  'Logro Esperado': 'border-nivel-logro bg-nivel-logro/10 text-foreground',
  'Logro Destacado': 'border-nivel-destacado bg-nivel-destacado/10 text-foreground',
};

const EstudianteResultados = () => (
  <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-foreground">Mi Boleta de Resultados</h1>
      <p className="text-muted-foreground">{mockBoleta.nombre} – {mockBoleta.grado}</p>
    </div>

    {mockBoleta.areas.map((area, i) => (
      <Card key={i} className={cn('shadow-card border-l-4', nivelStyle[area.nivel])}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {i === 0 && <Brain className="h-5 w-5" />}
            {i === 1 && <BookOpen className="h-5 w-5" />}
            {i === 2 && <CheckCircle2 className="h-5 w-5" />}
            {area.area}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Puntaje:</span>
            <span className="text-2xl font-bold">{area.puntaje}/20</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Nivel:</span>
            <span className="font-semibold">{area.nivel}</span>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Recomendación:</p>
            <p className="text-sm text-foreground">{nivelRecomendacion[area.nivel]}</p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default EstudianteResultados;
