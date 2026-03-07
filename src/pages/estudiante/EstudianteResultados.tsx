import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, BookOpen, Heart, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AIConclusiones from '@/components/estudiante/AIConclusiones';
const AREAS = [
  { key: 'Matemática', label: 'Matemática', icon: Calculator },
  { key: 'Comprensión Lectora', label: 'Comprensión Lectora', icon: BookOpen },
  { key: 'Habilidades Socioemocionales', label: 'Habilidades Socioemocionales', icon: Heart },
] as const;

const nivelStyle: Record<string, string> = {
  'En Inicio': 'border-nivel-inicio bg-nivel-inicio/10 text-foreground',
  'En Proceso': 'border-nivel-proceso bg-nivel-proceso/10 text-foreground',
  'Logro Esperado': 'border-nivel-logro bg-nivel-logro/10 text-foreground',
  'Logro Destacado': 'border-nivel-destacado bg-nivel-destacado/10 text-foreground',
};

const nivelLetter: Record<string, string> = {
  'En Inicio': 'C',
  'En Proceso': 'B',
  'Logro Esperado': 'A',
  'Logro Destacado': 'AD',
};

// ── Competencias del CNEB por área ──
interface Competencia {
  nombre: string;
  conclusiones: Record<string, { logros: string; dificultades: string; mejora: string }>;
}

const COMPETENCIAS: Record<string, Competencia[]> = {
  'Matemática': [
    {
      nombre: 'Resuelve problemas de cantidad',
      conclusiones: {
        'En Inicio': {
          logros: 'Identifica cantidades en situaciones cotidianas sencillas y realiza conteo básico con apoyo de material concreto.',
          dificultades: 'Presenta dificultades para traducir problemas a expresiones numéricas, establecer relaciones entre números y aplicar estrategias de cálculo de manera autónoma.',
          mejora: 'Reforzar con material concreto (Base 10, regletas) y problemas contextualizados de su entorno. Practicar operaciones básicas con retroalimentación inmediata y acompañamiento individualizado.',
        },
        'En Proceso': {
          logros: 'Traduce algunas situaciones a expresiones numéricas y emplea estrategias de cálculo con apoyo parcial. Establece relaciones entre cantidades de forma básica.',
          dificultades: 'Aún requiere apoyo para resolver problemas de varias etapas, justificar sus procedimientos y aplicar propiedades numéricas en situaciones nuevas.',
          mejora: 'Proponer problemas de complejidad creciente con contextos variados. Fomentar la explicación oral de sus estrategias y el uso de representaciones gráficas para organizar datos.',
        },
        'Logro Esperado': {
          logros: 'Traduce correctamente cantidades a expresiones numéricas, emplea estrategias de cálculo pertinentes y establece relaciones entre datos con autonomía.',
          dificultades: 'Puede presentar imprecisiones al argumentar sus procedimientos o al enfrentar problemas con datos implícitos o múltiples operaciones combinadas.',
          mejora: 'Plantear retos matemáticos que exijan argumentación y problemas abiertos con varias soluciones posibles. Promover el trabajo colaborativo para enriquecer estrategias.',
        },
        'Logro Destacado': {
          logros: 'Demuestra dominio al traducir situaciones complejas a expresiones numéricas, emplea diversas estrategias de cálculo eficientes y justifica sus procedimientos con solidez.',
          dificultades: 'Mínimas. Puede potenciar aún más la formulación de problemas propios y la conexión con otras áreas del conocimiento.',
          mejora: 'Ofrecer desafíos de mayor complejidad, promover la creación de problemas para sus compañeros y participar como tutor par en actividades colaborativas.',
        },
      },
    },
    {
      nombre: 'Resuelve problemas de regularidad, equivalencia y cambio',
      conclusiones: {
        'En Inicio': {
          logros: 'Reconoce patrones simples de repetición en secuencias presentadas con material concreto.',
          dificultades: 'Tiene dificultades para identificar regularidades, establecer equivalencias y traducir condiciones de cambio a expresiones algebraicas básicas.',
          mejora: 'Trabajar con patrones visuales y concretos. Usar juegos de secuencias y actividades manipulativas para construir la noción de equivalencia paso a paso.',
        },
        'En Proceso': {
          logros: 'Identifica patrones y regularidades en secuencias numéricas y gráficas. Realiza equivalencias sencillas con apoyo.',
          dificultades: 'Presenta dificultades al generalizar patrones, formular reglas y resolver ecuaciones o inecuaciones de forma autónoma.',
          mejora: 'Proponer actividades con tablas de valores y gráficos para visualizar relaciones de cambio. Practicar la verbalización de reglas encontradas.',
        },
        'Logro Esperado': {
          logros: 'Traduce datos a patrones y expresiones algebraicas, identifica equivalencias y analiza relaciones de cambio con pertinencia.',
          dificultades: 'Ocasionalmente tiene dificultad al generalizar a contextos más abstractos o al justificar formalmente sus hallazgos.',
          mejora: 'Introducir situaciones que requieran modelación algebraica y resolución de problemas con variables. Fomentar la argumentación de regularidades.',
        },
        'Logro Destacado': {
          logros: 'Domina la traducción de situaciones a expresiones algebraicas, identifica y generaliza patrones complejos, y justifica equivalencias con rigor.',
          dificultades: 'Mínimas. Puede profundizar en modelación matemática y conexiones interdisciplinarias.',
          mejora: 'Proponer investigaciones matemáticas, creación de modelos propios y mentorías entre compañeros.',
        },
      },
    },
    {
      nombre: 'Resuelve problemas de forma, movimiento y localización',
      conclusiones: {
        'En Inicio': {
          logros: 'Reconoce algunas formas geométricas básicas en su entorno inmediato.',
          dificultades: 'Presenta dificultades para describir propiedades de formas, establecer relaciones espaciales y realizar transformaciones geométricas.',
          mejora: 'Usar material concreto (bloques, tangram) y actividades de exploración espacial. Relacionar formas con objetos del entorno cotidiano.',
        },
        'En Proceso': {
          logros: 'Describe algunas propiedades de formas geométricas y establece relaciones de ubicación básicas.',
          dificultades: 'Requiere apoyo para aplicar transformaciones, calcular medidas y argumentar relaciones geométricas.',
          mejora: 'Realizar actividades de construcción y medición. Usar aplicaciones interactivas de geometría y problemas contextualizados.',
        },
        'Logro Esperado': {
          logros: 'Modela formas geométricas con sus propiedades, establece relaciones de medida y aplica transformaciones con autonomía.',
          dificultades: 'Puede mejorar en la argumentación formal de relaciones geométricas y la resolución de problemas espaciales complejos.',
          mejora: 'Proponer problemas de diseño y construcción que integren varias propiedades geométricas. Fomentar la demostración y argumentación.',
        },
        'Logro Destacado': {
          logros: 'Demuestra dominio en la modelación geométrica, aplica transformaciones complejas y justifica relaciones espaciales con solidez.',
          dificultades: 'Mínimas. Puede ampliar hacia geometría analítica y aplicaciones del mundo real.',
          mejora: 'Ofrecer proyectos de diseño, arquitectura o arte que integren geometría avanzada.',
        },
      },
    },
    {
      nombre: 'Resuelve problemas de gestión de datos e incertidumbre',
      conclusiones: {
        'En Inicio': {
          logros: 'Recopila datos sencillos de su entorno y los organiza en listas simples.',
          dificultades: 'Tiene dificultades para representar datos en tablas y gráficos, interpretar información estadística y comprender la noción de probabilidad.',
          mejora: 'Realizar encuestas sencillas en el aula, construir gráficos de barras con material concreto y practicar la lectura de datos en tablas.',
        },
        'En Proceso': {
          logros: 'Representa datos en tablas y gráficos básicos. Interpreta información estadística sencilla con apoyo.',
          dificultades: 'Requiere apoyo para analizar datos, extraer conclusiones y realizar predicciones basadas en información estadística.',
          mejora: 'Proponer proyectos de investigación sencillos donde recolecten, organicen y presenten datos. Practicar la interpretación de gráficos diversos.',
        },
        'Logro Esperado': {
          logros: 'Recopila, organiza y representa datos de forma pertinente. Interpreta y toma decisiones basadas en información estadística.',
          dificultades: 'Puede fortalecer el análisis de datos complejos y la argumentación de conclusiones probabilísticas.',
          mejora: 'Plantear investigaciones estadísticas con datos reales y fomentar el pensamiento crítico ante la información.',
        },
        'Logro Destacado': {
          logros: 'Domina la recopilación, representación e interpretación de datos. Realiza análisis estadísticos y predicciones fundamentadas.',
          dificultades: 'Mínimas. Puede profundizar en análisis de datos más complejos y proyectos interdisciplinarios.',
          mejora: 'Proponer investigaciones con conjuntos de datos reales, análisis comparativos y presentación de hallazgos a la comunidad educativa.',
        },
      },
    },
  ],
  'Comprensión Lectora': [
    {
      nombre: 'Lee diversos tipos de textos escritos en su lengua materna',
      conclusiones: {
        'En Inicio': {
          logros: 'Obtiene información explícita ubicada en lugares evidentes del texto. Identifica el tema en textos breves y sencillos.',
          dificultades: 'Presenta dificultades para inferir información, interpretar el sentido global del texto, reflexionar sobre su contenido y evaluar su forma.',
          mejora: 'Fomentar la lectura diaria con textos de su interés. Aplicar estrategias de antes, durante y después de la lectura con preguntas orientadoras y acompañamiento cercano.',
        },
        'En Proceso': {
          logros: 'Obtiene información explícita del texto y realiza algunas inferencias sencillas. Identifica el propósito del texto en casos conocidos.',
          dificultades: 'Requiere apoyo para realizar inferencias complejas, interpretar recursos textuales y emitir opiniones fundamentadas sobre el contenido.',
          mejora: 'Diversificar los tipos de textos (narrativos, informativos, argumentativos). Practicar el subrayado de ideas principales y la elaboración de resúmenes con sus propias palabras.',
        },
        'Logro Esperado': {
          logros: 'Obtiene e infiere información del texto, interpreta el sentido global integrando partes del texto y reflexiona sobre su contenido y forma.',
          dificultades: 'Puede fortalecer la evaluación crítica de textos y la comparación entre fuentes diferentes.',
          mejora: 'Proponer lecturas de textos argumentativos y comparativos. Fomentar los círculos de lectura y el debate sobre textos leídos.',
        },
        'Logro Destacado': {
          logros: 'Demuestra comprensión profunda: obtiene información implícita, interpreta significados figurados, reflexiona y evalúa críticamente contenido y forma del texto.',
          dificultades: 'Mínimas. Puede ampliar hacia la lectura crítica de medios y la intertextualidad.',
          mejora: 'Ofrecer textos de mayor complejidad, lectura crítica de noticias y medios digitales, y producción de reseñas y ensayos.',
        },
      },
    },
    {
      nombre: 'Se comunica oralmente en su lengua materna',
      conclusiones: {
        'En Inicio': {
          logros: 'Se expresa con vocabulario básico en situaciones comunicativas familiares. Escucha a sus interlocutores en contextos cercanos.',
          dificultades: 'Presenta dificultades para organizar sus ideas, adecuar su registro al contexto, utilizar recursos expresivos y reflexionar sobre su comunicación oral.',
          mejora: 'Crear espacios seguros de expresión oral (conversaciones guiadas, relatos personales). Modelar la escucha activa y la organización de ideas antes de hablar.',
        },
        'En Proceso': {
          logros: 'Expresa sus ideas con cierta coherencia y adecúa parcialmente su lenguaje al interlocutor. Recupera información de textos orales.',
          dificultades: 'Requiere apoyo para argumentar sus puntos de vista, utilizar recursos paraverbales y no verbales de manera intencional.',
          mejora: 'Practicar exposiciones breves, debates sencillos y narración de experiencias. Brindar retroalimentación constructiva sobre su desempeño oral.',
        },
        'Logro Esperado': {
          logros: 'Se comunica de forma coherente y adecuada al propósito, utiliza recursos expresivos pertinentes y reflexiona sobre su comunicación.',
          dificultades: 'Puede mejorar en la argumentación sostenida y la interacción en contextos formales.',
          mejora: 'Fomentar debates, entrevistas y presentaciones formales. Promover la autoevaluación y coevaluación de la comunicación oral.',
        },
        'Logro Destacado': {
          logros: 'Domina la comunicación oral: se expresa con fluidez, coherencia y adecuación; argumenta y persuade; evalúa críticamente textos orales.',
          dificultades: 'Mínimas. Puede desarrollar habilidades de oratoria, mediación y liderazgo comunicativo.',
          mejora: 'Ofrecer oportunidades de liderazgo en proyectos, conducción de eventos y mentoría a compañeros.',
        },
      },
    },
    {
      nombre: 'Escribe diversos tipos de textos en su lengua materna',
      conclusiones: {
        'En Inicio': {
          logros: 'Escribe textos breves con ideas sencillas relacionadas a situaciones cotidianas.',
          dificultades: 'Presenta dificultades para organizar sus ideas de forma coherente, adecuar el texto al destinatario y propósito, y revisar su producción.',
          mejora: 'Proponer escritura libre y guiada con temas de interés personal. Usar organizadores gráficos antes de escribir y practicar la revisión con apoyo del docente.',
        },
        'En Proceso': {
          logros: 'Organiza algunas ideas en párrafos y adecúa parcialmente el texto al propósito. Utiliza conectores básicos.',
          dificultades: 'Requiere apoyo para mantener coherencia en textos extensos, usar vocabulario variado y revisar convenciones ortográficas.',
          mejora: 'Practicar la planificación textual, la escritura en etapas (borrador, revisión, versión final) y la lectura entre pares para retroalimentación.',
        },
        'Logro Esperado': {
          logros: 'Escribe textos coherentes y cohesionados, adecuados al propósito y destinatario, utilizando recursos textuales pertinentes.',
          dificultades: 'Puede mejorar en la producción de textos argumentativos complejos y en el uso de recursos estilísticos.',
          mejora: 'Fomentar la producción de ensayos, artículos de opinión y textos creativos. Promover la publicación y socialización de sus escritos.',
        },
        'Logro Destacado': {
          logros: 'Produce textos de alta calidad con coherencia, cohesión, adecuación y creatividad. Revisa y mejora sus textos de forma autónoma.',
          dificultades: 'Mínimas. Puede explorar géneros literarios y periodísticos avanzados.',
          mejora: 'Incentivar la participación en concursos literarios, blogs escolares y proyectos de publicación.',
        },
      },
    },
  ],
  'Habilidades Socioemocionales': [
    {
      nombre: 'Construye su identidad',
      conclusiones: {
        'En Inicio': {
          logros: 'Reconoce algunas de sus características personales y emociones básicas en situaciones cotidianas.',
          dificultades: 'Presenta dificultades para identificar y regular sus emociones, reconocer sus fortalezas y limitaciones, y reflexionar sobre sus acciones y consecuencias.',
          mejora: 'Realizar actividades de autoconocimiento (diario emocional, dinámicas de identidad). Brindar acompañamiento socioemocional individualizado y crear un clima de aula seguro.',
        },
        'En Proceso': {
          logros: 'Identifica sus emociones y las de otros en diversas situaciones. Reconoce algunas de sus cualidades y aspectos a mejorar.',
          dificultades: 'Requiere apoyo para regular sus emociones en situaciones de conflicto, tomar decisiones autónomas y asumir consecuencias de sus acciones.',
          mejora: 'Practicar técnicas de regulación emocional (respiración, tiempo fuera positivo). Fomentar la toma de decisiones con análisis de alternativas y consecuencias.',
        },
        'Logro Esperado': {
          logros: 'Se valora a sí mismo, regula sus emociones de manera pertinente, reflexiona sobre su conducta y toma decisiones éticas.',
          dificultades: 'Puede fortalecer la gestión emocional en situaciones de alta presión y la empatía en contextos diversos.',
          mejora: 'Proponer proyectos de servicio comunitario, dilemas éticos y actividades que fortalezcan la resiliencia y el liderazgo positivo.',
        },
        'Logro Destacado': {
          logros: 'Demuestra sólida identidad personal, regula sus emociones eficazmente, actúa con autonomía ética y contribuye al bienestar de otros.',
          dificultades: 'Mínimas. Puede desarrollar mayor liderazgo emocional y mentoría entre pares.',
          mejora: 'Ofrecer roles de mediador escolar, líder de proyectos sociales y promotor del bienestar en su comunidad educativa.',
        },
      },
    },
    {
      nombre: 'Convive y participa democráticamente en la búsqueda del bien común',
      conclusiones: {
        'En Inicio': {
          logros: 'Interactúa con sus compañeros en actividades cotidianas y reconoce algunas normas de convivencia.',
          dificultades: 'Presenta dificultades para respetar acuerdos de convivencia, manejar conflictos de manera constructiva y participar en acciones colectivas.',
          mejora: 'Establecer acuerdos de convivencia participativos, practicar la resolución pacífica de conflictos con mediación y fomentar juegos cooperativos.',
        },
        'En Proceso': {
          logros: 'Respeta la mayoría de los acuerdos de convivencia y participa en actividades grupales. Muestra disposición para resolver conflictos.',
          dificultades: 'Requiere apoyo para asumir responsabilidades compartidas, dialogar asertivamente y proponer acciones para el bien común.',
          mejora: 'Asignar responsabilidades rotativas en el aula. Practicar el diálogo asertivo mediante role-playing y promover proyectos colaborativos.',
        },
        'Logro Esperado': {
          logros: 'Convive respetando derechos y normas, maneja conflictos constructivamente, participa activamente en asuntos de interés común.',
          dificultades: 'Puede fortalecer su capacidad de proponer y liderar iniciativas de mejora en su entorno.',
          mejora: 'Fomentar la participación en el municipio escolar, proyectos de mejora comunitaria y actividades de ciudadanía activa.',
        },
        'Logro Destacado': {
          logros: 'Demuestra ciudadanía activa: promueve el respeto, lidera la resolución de conflictos, propone y ejecuta acciones para el bien común.',
          dificultades: 'Mínimas. Puede ampliar su impacto hacia la comunidad local.',
          mejora: 'Proponer liderazgo en proyectos interinstitucionales, voluntariado comunitario y promoción de derechos.',
        },
      },
    },
  ],
};

interface AreaResult {
  area: string;
  label: string;
  icon: typeof Calculator;
  puntaje: number | null;
  nivel: string | null;
  respuestas: string[] | null;
  configPreguntas: any;
}

const ConclusionDescriptiva = ({ competencia, nivel }: { competencia: Competencia; nivel: string }) => {
  const data = competencia.conclusiones[nivel];
  if (!data) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{competencia.nombre}</h4>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-accent">✅ Logros: </span>
          <span className="text-muted-foreground">{data.logros}</span>
        </div>
        <div>
          <span className="font-medium text-destructive">⚠️ Dificultades: </span>
          <span className="text-muted-foreground">{data.dificultades}</span>
        </div>
        <div>
          <span className="font-medium text-primary">💡 Sugerencias para mejorar: </span>
          <span className="text-muted-foreground">{data.mejora}</span>
        </div>
      </div>
    </div>
  );
};

const EstudianteResultados = () => {
  const { profile } = useAuth();
  const [results, setResults] = useState<AreaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({ 'Matemática': true, 'Comprensión Lectora': true, 'Habilidades Socioemocionales': true });
  const [openRespuestas, setOpenRespuestas] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!profile?.id) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: evaluaciones } = await supabase
        .from('evaluaciones')
        .select('id, area, config_preguntas');

      const { data: resultados } = await supabase
        .from('resultados')
        .select('evaluacion_id, puntaje_total, nivel_logro, respuestas_dadas')
        .eq('estudiante_id', profile.id);

      const mapped: AreaResult[] = AREAS.map(a => {
        const evals = (evaluaciones || []).filter(e => e.area === a.key);
        const evalIds = evals.map(e => e.id);
        const res = (resultados || []).find(r => evalIds.includes(r.evaluacion_id));
        const evalMatch = res ? evals.find(e => e.id === res.evaluacion_id) : null;
        return {
          area: a.key,
          label: a.label,
          icon: a.icon,
          puntaje: res?.puntaje_total ?? null,
          nivel: res?.nivel_logro ?? null,
          respuestas: res?.respuestas_dadas ?? null,
          configPreguntas: evalMatch?.config_preguntas ?? null,
        };
      });
      setResults(mapped);
      setLoading(false);
    };
    fetchData();
  }, [profile?.id]);

  const toggleArea = (area: string) => {
    setOpenAreas(prev => ({ ...prev, [area]: !prev[area] }));
  };

  const toggleRespuestas = (area: string) => {
    setOpenRespuestas(prev => ({ ...prev, [area]: !prev[area] }));
  };

  // Parse config_preguntas to get correct answers
  const getPreguntas = (config: any): { correcta: string; texto?: string }[] => {
    if (!config) return [];
    if (Array.isArray(config)) return config;
    if (config.preguntas && Array.isArray(config.preguntas)) return config.preguntas;
    // Handle { respuestas_correctas: ["A", "B", ...] } format
    if (config.respuestas_correctas && Array.isArray(config.respuestas_correctas)) {
      return config.respuestas_correctas.map((r: string) => ({ correcta: r }));
    }
    return [];
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Mi Boleta de Resultados</h1>
        <p className="text-muted-foreground">{profile?.nombre_completo}</p>
        <p className="text-xs text-muted-foreground mt-1">Diagnóstico Integral de Aprendizajes 2026 – UGEL Chiclayo</p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Cargando resultados...</p>
      ) : results.every(r => r.puntaje === null) ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            Aún no hay resultados registrados para tus evaluaciones.
          </CardContent>
        </Card>
      ) : (
        results.map((area) => {
          const competencias = COMPETENCIAS[area.area] || [];
          const isOpen = openAreas[area.area] ?? false;

          return (
            <Card key={area.area} className={cn('shadow-card border-l-4', area.nivel ? nivelStyle[area.nivel] : 'border-muted')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <area.icon className="h-5 w-5" />
                  {area.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {area.puntaje !== null ? (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Puntaje:</span>
                          <span className="text-2xl font-bold ml-2">{area.puntaje}/20</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Nivel:</span>
                          <span className="font-semibold ml-2">{area.nivel}</span>
                        </div>
                      </div>
                      <div className={cn(
                        'px-3 py-1 rounded-full text-sm font-bold',
                        area.nivel === 'En Inicio' && 'bg-nivel-inicio text-destructive-foreground',
                        area.nivel === 'En Proceso' && 'bg-nivel-proceso text-secondary-foreground',
                        area.nivel === 'Logro Esperado' && 'bg-nivel-logro text-accent-foreground',
                        area.nivel === 'Logro Destacado' && 'bg-nivel-destacado text-primary-foreground',
                      )}>
                        {nivelLetter[area.nivel || ''] || '—'}
                      </div>
                    </div>

                    {/* Detalle de Respuestas */}
                    {area.respuestas && area.respuestas.length > 0 && (() => {
                      const preguntas = getPreguntas(area.configPreguntas);
                      const isRespOpen = openRespuestas[area.area] ?? false;
                      const hasConfig = preguntas.length > 0;
                      const totalCorrectas = hasConfig
                        ? area.respuestas.filter((r, i) => {
                            const correcta = preguntas[i]?.correcta;
                            return correcta && r?.toUpperCase() === correcta.toUpperCase();
                          }).length
                        : (area.puntaje ?? 0);
                      return (
                        <Collapsible open={isRespOpen} onOpenChange={() => toggleRespuestas(area.area)}>
                          <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                            <span>📝 Detalle de Respuestas ({totalCorrectas}/{area.respuestas.length} correctas)</span>
                            {isRespOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3">
                            {!hasConfig && (
                              <div className="mb-3 p-3 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground">
                                ℹ️ Las claves de respuesta aún no han sido cargadas. El puntaje mostrado ({area.puntaje}/20) fue registrado por tu docente. Cuando se carguen las claves, podrás ver el detalle pregunta por pregunta.
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {area.respuestas.map((resp, i) => {
                                const pregunta = preguntas[i];
                                const correcta = pregunta?.correcta?.toUpperCase() || null;
                                const dada = resp?.toUpperCase() || '—';
                                const esCorrecta = correcta !== null && dada === correcta;
                                const esIncorrecta = correcta !== null && dada !== correcta;
                                return (
                                  <div
                                    key={i}
                                    className={cn(
                                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                                      hasConfig
                                        ? esCorrecta
                                          ? 'border-nivel-logro/50 bg-nivel-logro/10'
                                          : 'border-nivel-inicio/50 bg-nivel-inicio/10'
                                        : 'border-border bg-muted/20'
                                    )}
                                  >
                                    {hasConfig ? (
                                      esCorrecta ? (
                                        <CheckCircle2 className="h-4 w-4 text-nivel-logro shrink-0" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-nivel-inicio shrink-0" />
                                      )
                                    ) : (
                                      <span className="h-4 w-4 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
                                    )}
                                    <span className="font-medium">P{i + 1}:</span>
                                    <span className={cn(
                                      hasConfig && esCorrecta && 'text-nivel-logro font-semibold',
                                      hasConfig && esIncorrecta && 'line-through text-muted-foreground',
                                    )}>{dada}</span>
                                    {hasConfig && esCorrecta && (
                                      <span className="text-nivel-logro text-xs">✓ Correcta</span>
                                    )}
                                    {hasConfig && esIncorrecta && (
                                      <span className="text-nivel-logro font-medium ml-1">→ Correcta: {correcta}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })()}

                    {/* Conclusiones Descriptivas Estáticas */}
                    {area.nivel && competencias.length > 0 && (
                      <Collapsible open={isOpen ?? true} onOpenChange={() => toggleArea(area.area)}>
                        <CollapsibleTrigger className="w-full flex items-center justify-between bg-primary/10 rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary/20 transition-colors">
                          <span>📋 Conclusiones Descriptivas por Competencia</span>
                          {(isOpen ?? true) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {competencias.map((comp, i) => (
                            <ConclusionDescriptiva key={i} competencia={comp} nivel={area.nivel!} />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Análisis Personalizado con IA */}
                    {area.respuestas && area.respuestas.length > 0 && (() => {
                      const preguntas = getPreguntas(area.configPreguntas);
                      if (preguntas.length === 0) return null;
                      return (
                        <Collapsible>
                          <CollapsibleTrigger className="w-full flex items-center justify-between bg-accent/10 rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent/20 transition-colors">
                            <span>🤖 Análisis Personalizado con IA</span>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3">
                            <AIConclusiones
                              area={area.area}
                              respuestas_dadas={area.respuestas!}
                              respuestas_correctas={preguntas.map(p => p.correcta)}
                              puntaje={area.puntaje}
                              nivel_logro={area.nivel}
                              nombre_estudiante={profile?.nombre_completo || ''}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin evaluar aún.</p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default EstudianteResultados;
