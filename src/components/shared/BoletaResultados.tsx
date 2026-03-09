import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, BookOpen, Heart, ChevronDown, ChevronUp, CheckCircle2, XCircle, Users, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AIConclusiones, { type ConclusionesIA } from '@/components/estudiante/AIConclusiones';
import RecomendacionesPadres, { type RecomendacionesPadresData } from '@/components/estudiante/RecomendacionesPadres';

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

interface Competencia {
  nombre: string;
  conclusiones: Record<string, { logros: string; dificultades: string; mejora: string }>;
}

// Condensed competencias - same structure as EstudianteResultados
const COMPETENCIAS: Record<string, Competencia[]> = {
  'Matemática': [
    { nombre: 'Resuelve problemas de cantidad', conclusiones: {
      'En Inicio': { logros: 'Identifica cantidades en situaciones cotidianas sencillas y realiza conteo básico con apoyo de material concreto.', dificultades: 'Presenta dificultades para traducir problemas a expresiones numéricas y aplicar estrategias de cálculo de manera autónoma.', mejora: 'Reforzar con material concreto (Base 10, regletas) y problemas contextualizados de su entorno.' },
      'En Proceso': { logros: 'Traduce algunas situaciones a expresiones numéricas y emplea estrategias de cálculo con apoyo parcial.', dificultades: 'Requiere apoyo para resolver problemas de varias etapas y justificar sus procedimientos.', mejora: 'Proponer problemas de complejidad creciente con contextos variados.' },
      'Logro Esperado': { logros: 'Traduce correctamente cantidades a expresiones numéricas y emplea estrategias de cálculo pertinentes con autonomía.', dificultades: 'Puede presentar imprecisiones al argumentar procedimientos con datos implícitos.', mejora: 'Plantear retos que exijan argumentación y problemas abiertos.' },
      'Logro Destacado': { logros: 'Domina la traducción de situaciones complejas a expresiones numéricas con estrategias eficientes.', dificultades: 'Mínimas.', mejora: 'Ofrecer desafíos de mayor complejidad y promover la creación de problemas.' },
    }},
    { nombre: 'Resuelve problemas de regularidad, equivalencia y cambio', conclusiones: {
      'En Inicio': { logros: 'Reconoce patrones simples de repetición en secuencias.', dificultades: 'Dificultades para identificar regularidades y equivalencias.', mejora: 'Trabajar con patrones visuales y concretos.' },
      'En Proceso': { logros: 'Identifica patrones en secuencias numéricas y gráficas.', dificultades: 'Dificultades al generalizar patrones y resolver ecuaciones autónomamente.', mejora: 'Actividades con tablas de valores y gráficos.' },
      'Logro Esperado': { logros: 'Traduce datos a patrones y expresiones algebraicas con pertinencia.', dificultades: 'Ocasional dificultad al generalizar a contextos abstractos.', mejora: 'Situaciones que requieran modelación algebraica.' },
      'Logro Destacado': { logros: 'Domina la traducción a expresiones algebraicas y generaliza patrones complejos.', dificultades: 'Mínimas.', mejora: 'Investigaciones matemáticas y mentorías.' },
    }},
    { nombre: 'Resuelve problemas de forma, movimiento y localización', conclusiones: {
      'En Inicio': { logros: 'Reconoce formas geométricas básicas en su entorno.', dificultades: 'Dificultades para describir propiedades y transformaciones geométricas.', mejora: 'Usar material concreto (bloques, tangram).' },
      'En Proceso': { logros: 'Describe algunas propiedades de formas geométricas.', dificultades: 'Requiere apoyo para transformaciones y cálculo de medidas.', mejora: 'Actividades de construcción y medición.' },
      'Logro Esperado': { logros: 'Modela formas geométricas con propiedades y transformaciones autónomamente.', dificultades: 'Puede mejorar en argumentación formal.', mejora: 'Problemas de diseño que integren varias propiedades.' },
      'Logro Destacado': { logros: 'Dominio en modelación geométrica y transformaciones complejas.', dificultades: 'Mínimas.', mejora: 'Proyectos de diseño y arquitectura.' },
    }},
    { nombre: 'Resuelve problemas de gestión de datos e incertidumbre', conclusiones: {
      'En Inicio': { logros: 'Recopila datos sencillos de su entorno.', dificultades: 'Dificultades para representar datos en tablas y gráficos.', mejora: 'Encuestas sencillas y gráficos con material concreto.' },
      'En Proceso': { logros: 'Representa datos en tablas y gráficos básicos.', dificultades: 'Requiere apoyo para analizar datos y extraer conclusiones.', mejora: 'Proyectos de investigación sencillos.' },
      'Logro Esperado': { logros: 'Recopila, organiza y representa datos pertinentemente.', dificultades: 'Puede fortalecer análisis de datos complejos.', mejora: 'Investigaciones estadísticas con datos reales.' },
      'Logro Destacado': { logros: 'Domina la representación e interpretación de datos.', dificultades: 'Mínimas.', mejora: 'Análisis comparativos y proyectos interdisciplinarios.' },
    }},
  ],
  'Comprensión Lectora': [
    { nombre: 'Nivel Literal', conclusiones: {
      'En Inicio': { logros: 'Identifica información explícita muy evidente con apoyo.', dificultades: 'Dificultades para localizar información en textos extensos.', mejora: 'Practicar lectura de textos cortos y subrayar ideas principales.' },
      'En Proceso': { logros: 'Obtiene información explícita y relevante del texto.', dificultades: 'Dificultades al localizar detalles dispersos.', mejora: 'Ejercicios de búsqueda de información específica.' },
      'Logro Esperado': { logros: 'Localiza y selecciona información explícita en diversas partes del texto.', dificultades: 'Puede omitir detalles secundarios sutiles.', mejora: 'Lectura de textos con estructura compleja.' },
      'Logro Destacado': { logros: 'Excelente dominio para ubicar, seleccionar y organizar información explícita.', dificultades: 'Mínimas.', mejora: 'Análisis de textos especializados.' },
    }},
    { nombre: 'Nivel Inferencial', conclusiones: {
      'En Inicio': { logros: 'Realiza deducciones muy básicas guiadas.', dificultades: 'Dificultades para deducir el tema y propósito del texto.', mejora: 'Hacer preguntas de qué pasaría sí o por qué.' },
      'En Proceso': { logros: 'Deduce relaciones lógicas sencillas y el tema central.', dificultades: 'Requiere apoyo para inferencias complejas de causa-efecto.', mejora: 'Trabajar predicciones antes y durante la lectura.' },
      'Logro Esperado': { logros: 'Infiere el tema, propósito y relaciones lógicas complejas.', dificultades: 'Puede dudar en inferencias de doble sentido.', mejora: 'Lecturas con lenguaje figurado e ironía.' },
      'Logro Destacado': { logros: 'Deduce información implícita sutil y propósito comunicativo con precisión.', dificultades: 'Mínimas.', mejora: 'Lectura de textos literarios e históricos profundos.' },
    }},
    { nombre: 'Nivel Crítico Reflexivo', conclusiones: {
      'En Inicio': { logros: 'Emite opiniones simples sobre lo leído.', dificultades: 'Dificultades para justificar su postura.', mejora: 'Fomentar la expresión de opiniones sobre cuentos.' },
      'En Proceso': { logros: 'Opina sobre el contenido y justifica brevemente.', dificultades: 'Dificulta evaluar la forma y el contexto del texto.', mejora: 'Debatir sobre noticias y artículos breves.' },
      'Logro Esperado': { logros: 'Evalúa el contenido, la forma y el contexto del texto, justificando su postura.', dificultades: 'Puede fortalecer contraargumentación.', mejora: 'Lecturas de opinión y ensayos cortos.' },
      'Logro Destacado': { logros: 'Juicio crítico profundo, sustenta argumentos contrastando fuentes.', dificultades: 'Mínimas.', mejora: 'Análisis crítico de ensayos y medios de comunicación.' },
    }},
  ],
  'Habilidades Socioemocionales': [
    { nombre: 'Construye su identidad', conclusiones: {
      'En Inicio': { logros: 'Reconoce algunas características personales y emociones básicas.', dificultades: 'Dificultades para identificar y regular emociones.', mejora: 'Actividades de autoconocimiento y acompañamiento socioemocional.' },
      'En Proceso': { logros: 'Identifica emociones propias y ajenas.', dificultades: 'Requiere apoyo para regular emociones en conflictos.', mejora: 'Técnicas de regulación emocional.' },
      'Logro Esperado': { logros: 'Se valora, regula emociones y toma decisiones éticas.', dificultades: 'Puede fortalecer gestión en alta presión.', mejora: 'Proyectos de servicio comunitario y dilemas éticos.' },
      'Logro Destacado': { logros: 'Sólida identidad, regulación eficaz y autonomía ética.', dificultades: 'Mínimas.', mejora: 'Roles de mediador y líder de proyectos sociales.' },
    }},
    { nombre: 'Convive y participa democráticamente en la búsqueda del bien común', conclusiones: {
      'En Inicio': { logros: 'Interactúa con compañeros y reconoce normas de convivencia.', dificultades: 'Dificultades para respetar acuerdos y manejar conflictos.', mejora: 'Acuerdos de convivencia participativos y juegos cooperativos.' },
      'En Proceso': { logros: 'Respeta la mayoría de acuerdos y participa en actividades grupales.', dificultades: 'Requiere apoyo para asumir responsabilidades compartidas.', mejora: 'Responsabilidades rotativas y role-playing.' },
      'Logro Esperado': { logros: 'Convive respetando derechos y normas, maneja conflictos constructivamente.', dificultades: 'Puede fortalecer liderazgo de iniciativas.', mejora: 'Participación en municipio escolar y ciudadanía activa.' },
      'Logro Destacado': { logros: 'Ciudadanía activa: promueve respeto y lidera resolución de conflictos.', dificultades: 'Mínimas.', mejora: 'Liderazgo interinstitucional y voluntariado comunitario.' },
    }},
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

interface Props {
  studentProfileId: string;
  studentName: string;
  showAI?: boolean;
}

const getPreguntas = (config: any): { correcta: string; texto?: string }[] => {
  if (!config) return [];
  if (Array.isArray(config)) return config;
  if (config.preguntas && Array.isArray(config.preguntas)) return config.preguntas;
  if (config.respuestas_correctas && Array.isArray(config.respuestas_correctas)) {
    return config.respuestas_correctas.map((r: string) => ({ correcta: r }));
  }
  return [];
};

const ConclusionDescriptiva = ({ competencia, nivel }: { competencia: Competencia; nivel: string }) => {
  const data = competencia.conclusiones[nivel];
  if (!data) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 boleta-conclusion">
      <h4 className="text-sm font-semibold text-foreground">{competencia.nombre}</h4>
      <div className="space-y-2 text-sm">
        <div><span className="font-medium text-accent">✅ Logros: </span><span className="text-muted-foreground">{data.logros}</span></div>
        <div><span className="font-medium text-destructive">⚠️ Dificultades: </span><span className="text-muted-foreground">{data.dificultades}</span></div>
        <div><span className="font-medium text-primary">💡 Sugerencias: </span><span className="text-muted-foreground">{data.mejora}</span></div>
      </div>
    </div>
  );
};

const BoletaResultados = ({ studentProfileId, studentName, showAI = false }: Props) => {
  const [results, setResults] = useState<AreaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({
    'Matemática': true, 'Comprensión Lectora': true, 'Habilidades Socioemocionales': true
  });
  const [openRespuestas, setOpenRespuestas] = useState<Record<string, boolean>>({});
  const [gradoInfo, setGradoInfo] = useState<{ nivel: string; grado: string; seccion: string } | null>(null);
  const [institucionData, setInstitucionData] = useState<{ nombre: string; distrito: string; codigo_local: string | null }>({ nombre: '', distrito: '', codigo_local: null });
  const [studentDni, setStudentDni] = useState('');
  const boletaRef = useRef<HTMLDivElement>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, ConclusionesIA>>({});
  const [parentRecs, setParentRecs] = useState<RecomendacionesPadresData | null>(null);

  const handleAIDataReady = useCallback((area: string, data: ConclusionesIA) => {
    setAiAnalysis(prev => ({ ...prev, [area]: data }));
  }, []);

  const handleParentRecsReady = useCallback((data: RecomendacionesPadresData) => {
    setParentRecs(data);
  }, []);

  useEffect(() => {
    if (!studentProfileId) return;
    const fetchData = async () => {
      setLoading(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('grado_seccion_id, institucion_id, dni')
        .eq('id', studentProfileId)
        .single();

      if (profileData?.dni) setStudentDni(profileData.dni);

      if (profileData?.grado_seccion_id) {
        const { data: gd } = await supabase
          .from('niveles_grados')
          .select('nivel, grado, seccion')
          .eq('id', profileData.grado_seccion_id)
          .single();
        if (gd) {
          setGradoInfo({ nivel: gd.nivel, grado: gd.grado, seccion: gd.seccion });
        }
      }

      if (profileData?.institucion_id) {
        const { data: inst } = await supabase
          .from('instituciones')
          .select('nombre, distrito, codigo_local')
          .eq('id', profileData.institucion_id)
          .single();
        if (inst) setInstitucionData({ nombre: inst.nombre, distrito: inst.distrito, codigo_local: inst.codigo_local });
      }

      const { data: evaluaciones } = await supabase
        .from('evaluaciones')
        .select('id, area, config_preguntas, nivel, grado');

      const { data: resultados } = await supabase
        .from('resultados')
        .select('evaluacion_id, puntaje_total, nivel_logro, respuestas_dadas')
        .eq('estudiante_id', studentProfileId);

      const mapped: AreaResult[] = AREAS.map(a => {
        const evals = (evaluaciones || []).filter(e => e.area === a.key);
        const evalIds = evals.map(e => e.id);
        const res = (resultados || []).find(r => evalIds.includes(r.evaluacion_id));
        const evalMatch = res ? evals.find(e => e.id === res.evaluacion_id) : null;
        return {
          area: a.key, label: a.label, icon: a.icon,
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
  }, [studentProfileId]);

  const toggleArea = (area: string) => setOpenAreas(prev => ({ ...prev, [area]: !prev[area] }));
  const toggleRespuestas = (area: string) => setOpenRespuestas(prev => ({ ...prev, [area]: !prev[area] }));

  const handleDownloadPDF = () => {
    if (!boletaRef.current) return;

    // Build a clean printable HTML from the boleta data
    const areasHtml = results.map(area => {
      if (area.puntaje === null) return '';
      const competencias = COMPETENCIAS[area.area] || [];
      const preguntas = getPreguntas(area.configPreguntas);
      const hasConfig = preguntas.length > 0;

      const borderColor = area.nivel === 'En Inicio' ? '#ef4444' : area.nivel === 'En Proceso' ? '#f59e0b' : area.nivel === 'Logro Esperado' ? '#22c55e' : '#1e40af';
      const badgeBg = area.nivel === 'En Inicio' ? '#fee2e2' : area.nivel === 'En Proceso' ? '#fef3c7' : area.nivel === 'Logro Esperado' ? '#dcfce7' : '#dbeafe';
      const badgeColor = area.nivel === 'En Inicio' ? '#991b1b' : area.nivel === 'En Proceso' ? '#92400e' : area.nivel === 'Logro Esperado' ? '#166534' : '#1e3a5f';
      const letter = nivelLetter[area.nivel || ''] || '—';

      // Respuestas grid
      let respuestasHtml = '';
      if (area.respuestas && area.respuestas.length > 0 && hasConfig) {
        const items = area.respuestas.map((resp, i) => {
          const correcta = preguntas[i]?.correcta?.toUpperCase() || '';
          const dada = resp?.toUpperCase() || '—';
          const ok = correcta && dada === correcta;
          const bg = ok ? '#f0fdf4' : '#fef2f2';
          const bc = ok ? '#bbf7d0' : '#fecaca';
          const symbol = ok ? '✓' : '✗';
          const extra = !ok && correcta ? ` → ${correcta}` : '';
          return `<div style="display:flex;align-items:center;gap:4px;padding:3px 6px;border-radius:4px;border:1px solid ${bc};background:${bg};font-size:10px;">
            <span>${symbol}</span><b>P${i+1}:</b> ${dada}${extra}
          </div>`;
        }).join('');
        const totalCorrectas = area.respuestas.filter((r, i) => {
          const c = preguntas[i]?.correcta;
          return c && r?.toUpperCase() === c.toUpperCase();
        }).length;
        respuestasHtml = `<div style="margin-top:8px;"><b style="font-size:11px;">📝 Detalle de Respuestas (${totalCorrectas}/${area.respuestas.length} correctas)</b>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px;">${items}</div></div>`;
      }

      // Conclusiones
      const conclusionesHtml = area.nivel ? competencias.map(comp => {
        const d = comp.conclusiones[area.nivel!];
        if (!d) return '';
        return `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:6px;">
          <b style="font-size:11px;">${comp.nombre}</b>
          <div style="font-size:10px;margin-top:4px;">
            <div>✅ <b>Logros:</b> ${d.logros}</div>
            <div style="margin-top:2px;">⚠️ <b>Dificultades:</b> ${d.dificultades}</div>
            <div style="margin-top:2px;">💡 <b>Sugerencias:</b> ${d.mejora}</div>
          </div>
        </div>`;
      }).join('') : '';

      return `<div style="border-left:4px solid ${borderColor};border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:12px;page-break-inside:avoid;">
        <h2 style="font-size:14px;margin-bottom:8px;">${area.label}</h2>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div><span style="color:#666;font-size:11px;">Puntaje:</span> <b style="font-size:18px;">${area.puntaje}/20</b>
            <span style="margin-left:12px;color:#666;font-size:11px;">Nivel:</span> <b>${area.nivel}</b></div>
          <span style="background:${badgeBg};color:${badgeColor};padding:2px 10px;border-radius:12px;font-weight:bold;font-size:12px;">${letter}</span>
        </div>
        ${respuestasHtml}
        ${conclusionesHtml ? `<div style="margin-top:8px;"><b style="font-size:11px;">📋 Conclusiones Descriptivas por Competencia</b><div style="margin-top:4px;">${conclusionesHtml}</div></div>` : ''}
        ${(() => {
          const ai = aiAnalysis[area.area];
          if (!ai) return '';
          const nivelBadgePdf: Record<string, string> = {
            'En Inicio': 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;',
            'En Proceso': 'background:#fef3c7;color:#92400e;border:1px solid #fcd34d;',
            'Logro Esperado': 'background:#dcfce7;color:#166534;border:1px solid #86efac;',
            'Logro Destacado': 'background:#dbeafe;color:#1e3a5f;border:1px solid #93c5fd;',
          };
          return `<div style="margin-top:10px;page-break-inside:avoid;">
            <b style="font-size:11px;color:#6d28d9;">🤖 Análisis Personalizado</b>
            <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:6px;padding:8px;margin-top:4px;font-size:10px;">
              <p>${ai.resumen}</p>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;">
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px;">
                <b style="font-size:10px;color:#166534;">✅ Fortalezas</b>
                <ul style="font-size:9px;margin:2px 0 0 12px;">${ai.fortalezas.map(f => `<li>${f}</li>`).join('')}</ul>
              </div>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:6px;">
                <b style="font-size:10px;color:#991b1b;">⚠️ Áreas de mejora</b>
                <ul style="font-size:9px;margin:2px 0 0 12px;">${ai.dificultades.map(d => `<li>${d}</li>`).join('')}</ul>
              </div>
            </div>
            ${ai.por_competencia?.length ? `<div style="margin-top:6px;">
              <b style="font-size:10px;">📊 Por Competencia</b>
              ${ai.por_competencia.map(c => `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:6px;margin-top:4px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <b style="font-size:10px;">${c.competencia}</b>
                  <span style="font-size:9px;padding:1px 6px;border-radius:8px;${nivelBadgePdf[c.nivel] || ''}">${c.aciertos}/${c.total} — ${c.nivel}</span>
                </div>
                <p style="font-size:9px;margin-top:2px;color:#555;">${c.descripcion}</p>
              </div>`).join('')}
            </div>` : ''}
            <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:6px;padding:6px;margin-top:6px;">
              <b style="font-size:10px;color:#6d28d9;">💡 Recomendaciones</b>
              <ul style="font-size:9px;margin:2px 0 0 12px;">${ai.recomendaciones.map(r => `<li>${r}</li>`).join('')}</ul>
            </div>
          </div>`;
        })()}
      </div>`;
    }).join('');

    // Parent recommendations HTML for PDF
    const parentRecsHtml = parentRecs ? `<div style="border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:12px;page-break-inside:avoid;border-left:4px solid #f59e0b;">
      <h2 style="font-size:14px;margin-bottom:8px;">👨‍👩‍👧 Recomendaciones para Padres de Familia</h2>
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:8px;font-size:10px;margin-bottom:8px;">
        <p>${parentRecs.introduccion}</p>
      </div>
      <div style="margin-bottom:8px;">
        <b style="font-size:11px;">📋 Recomendaciones Generales</b>
        <ul style="font-size:10px;margin:4px 0 0 14px;">${parentRecs.recomendaciones_generales.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
      ${parentRecs.por_area?.map(a => `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <b style="font-size:11px;">${a.area}</b>
          <span style="font-size:9px;padding:1px 6px;border-radius:8px;background:#fef3c7;color:#92400e;">${a.nivel_logro}</span>
        </div>
        <div style="font-size:9px;">
          <div><b>🏠 En el hogar:</b><ul style="margin:2px 0 0 12px;">${a.consejos_hogar.map(c => `<li>${c}</li>`).join('')}</ul></div>
          <div style="margin-top:4px;"><b>🎯 Actividades:</b><ul style="margin:2px 0 0 12px;">${a.actividades_sugeridas.map(c => `<li>${c}</li>`).join('')}</ul></div>
          ${a.recursos_apoyo?.length ? `<div style="margin-top:4px;"><b>📚 Recursos:</b><ul style="margin:2px 0 0 12px;">${a.recursos_apoyo.map(c => `<li>${c}</li>`).join('')}</ul></div>` : ''}
        </div>
      </div>`).join('') || ''}
      <div style="background:#ecfdf5;border:1px solid #86efac;border-radius:6px;padding:8px;font-size:10px;font-style:italic;margin-top:6px;">
        💪 ${parentRecs.mensaje_motivacional}
      </div>
    </div>` : '';

    const logoUrl = window.location.origin + '/images/logo-dia-boleta.png';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Boleta - ${studentName}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;font-size:12px;color:#1a1a1a}
      .header{display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;border-bottom:2px solid #1e3a5f;padding-bottom:12px;}
      .header img{width:90px;height:auto;}
      .header-info{flex:1;}
      .header-info h1{font-size:16px;color:#1e3a5f;margin-bottom:4px;}
      .header-info p{font-size:10px;color:#444;line-height:1.5;}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;margin-top:6px;font-size:10px;}
      .info-grid .label{color:#666;font-weight:normal;} .info-grid .value{font-weight:600;color:#1a1a1a;}
      .student-box{background:#f0f4f8;border:1px solid #c8d6e5;border-radius:6px;padding:8px 12px;margin:10px 0 16px;display:flex;justify-content:space-between;align-items:center;}
      .student-box .name{font-size:13px;font-weight:700;color:#1e3a5f;} .student-box .dni{font-size:11px;color:#555;}
      @media print{body{padding:10px}}</style></head><body>
      <div class="header">
        <img src="${logoUrl}" alt="DIA UGEL Chiclayo" />
        <div class="header-info">
          <h1>BOLETA DE RESULTADOS – DIA 2026</h1>
          <p>Diagnóstico Integral de Aprendizajes – UGEL Chiclayo</p>
          <div class="info-grid">
            <div><span class="label">Región:</span> <span class="value">Lambayeque</span></div>
            <div><span class="label">UGEL:</span> <span class="value">Chiclayo</span></div>
            <div><span class="label">Distrito:</span> <span class="value">${institucionData.distrito || '—'}</span></div>
            <div><span class="label">Código de Local:</span> <span class="value">${institucionData.codigo_local || '—'}</span></div>
            <div><span class="label">Institución Educativa:</span> <span class="value">${institucionData.nombre || '—'}</span></div>
            <div><span class="label">Nivel:</span> <span class="value">${gradoInfo?.nivel || '—'}</span></div>
            <div><span class="label">Grado:</span> <span class="value">${gradoInfo?.grado || '—'}</span></div>
            <div><span class="label">Sección:</span> <span class="value">${gradoInfo?.seccion || '—'}</span></div>
          </div>
        </div>
      </div>
      <div class="student-box">
        <div class="name">${studentName}</div>
        <div class="dni">DNI: ${studentDni || '—'}</div>
      </div>
      ${areasHtml}
      ${parentRecsHtml}
      <script>window.onload=function(){window.print();window.close();}<\/script></body></html>`);
    printWindow.document.close();
  };

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Cargando boleta...</p>;
  }

  if (results.every(r => r.puntaje === null)) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Aún no hay resultados registrados para este estudiante.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      </div>

      <div ref={boletaRef} className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Boleta de Resultados</h2>
          <p className="text-muted-foreground font-semibold">{studentName}</p>
          {studentDni && <p className="text-xs text-muted-foreground">DNI: {studentDni}</p>}
          {institucionData.nombre && <p className="text-xs text-muted-foreground">I.E. {institucionData.nombre} – {institucionData.distrito}</p>}
          {gradoInfo && <p className="text-xs text-muted-foreground">{gradoInfo.nivel} – {gradoInfo.grado} "{gradoInfo.seccion}"</p>}
          <p className="text-xs text-muted-foreground mt-1">Diagnóstico Integral de Aprendizajes 2026 – UGEL Chiclayo</p>
        </div>

        {results.map((area) => {
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
                            <span>📝 Detalle ({totalCorrectas}/{area.respuestas.length} correctas)</span>
                            {isRespOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3">
                            {!hasConfig && (
                              <div className="mb-3 p-3 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground">
                                ℹ️ Las claves de respuesta aún no han sido cargadas.
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
                                  <div key={i} className={cn(
                                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                                    hasConfig ? esCorrecta ? 'border-nivel-logro/50 bg-nivel-logro/10' : 'border-nivel-inicio/50 bg-nivel-inicio/10' : 'border-border bg-muted/20'
                                  )}>
                                    {hasConfig ? (
                                      esCorrecta ? <CheckCircle2 className="h-4 w-4 text-nivel-logro shrink-0" /> : <XCircle className="h-4 w-4 text-nivel-inicio shrink-0" />
                                    ) : (
                                      <span className="h-4 w-4 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
                                    )}
                                    <span className="font-medium">P{i + 1}:</span>
                                    <span className={cn(hasConfig && esCorrecta && 'text-nivel-logro font-semibold', hasConfig && esIncorrecta && 'line-through text-muted-foreground')}>{dada}</span>
                                    {hasConfig && esCorrecta && <span className="text-nivel-logro text-xs">✓</span>}
                                    {hasConfig && esIncorrecta && <span className="text-nivel-logro font-medium ml-1">→ {correcta}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })()}

                    {/* Conclusiones Descriptivas */}
                    {area.nivel && competencias.length > 0 && (
                      <Collapsible open={isOpen ?? true} onOpenChange={() => toggleArea(area.area)}>
                        <CollapsibleTrigger className="w-full flex items-center justify-between bg-primary/10 rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary/20 transition-colors">
                          <span>📋 Conclusiones por Competencia</span>
                          {(isOpen ?? true) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {competencias.map((comp, i) => (
                            <ConclusionDescriptiva key={i} competencia={comp} nivel={area.nivel!} />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* AI Analysis - auto-generated for student/parent view */}
                    {showAI && area.respuestas && area.respuestas.length > 0 && (() => {
                      const preguntas = getPreguntas(area.configPreguntas);
                      if (preguntas.length === 0) return null;
                      return (
                        <div className="mt-3">
                          <AIConclusiones
                            area={area.area}
                            nivel={gradoInfo?.nivel}
                            grado={gradoInfo?.grado}
                            respuestas_dadas={area.respuestas!}
                            respuestas_correctas={preguntas.map(p => p.correcta)}
                            puntaje={area.puntaje}
                            nivel_logro={area.nivel}
                            nombre_estudiante={studentName}
                            autoGenerate
                            onDataReady={handleAIDataReady}
                          />
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin evaluar aún.</p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Parent recommendations - auto-generated */}
        {showAI && results.some(r => r.puntaje !== null) && (
          <Card className="shadow-card border-l-4 border-secondary">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Recomendaciones para Padres de Familia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecomendacionesPadres
                nombre_estudiante={studentName}
                resultados={results.map(r => ({ area: r.area, puntaje: r.puntaje, nivel_logro: r.nivel }))}
                nivel_educativo={gradoInfo?.nivel}
                grado={gradoInfo?.grado}
                autoGenerate
                onDataReady={handleParentRecsReady}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BoletaResultados;
