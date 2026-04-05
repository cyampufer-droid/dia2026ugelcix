import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { area, nivel, grado, nombre_estudiante, conclusiones_inicial } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let userPrompt: string;

    // ===== INICIAL MODE: Use teacher-written descriptive conclusions =====
    if (conclusiones_inicial && Array.isArray(conclusiones_inicial) && conclusiones_inicial.length > 0) {
      const resumenConclusiones = conclusiones_inicial.map((c: any) =>
        `- Competencia: ${c.competencia} (${c.area})\n  Nivel de logro: ${c.nivel_logro}\n  Logros: ${c.logros || 'No registrado'}\n  Dificultades: ${c.dificultades || 'No registrado'}\n  Sugerencias de mejora: ${c.mejora || 'No registrado'}`
      ).join("\n\n");

      systemPrompt = `Eres un especialista pedagógico del sistema DIA 2026 (Diagnóstico Integral de Aprendizajes) de la GRED Lambayeque, Perú, experto en educación Inicial.
Tu tarea es generar un análisis personalizado integral basado en las conclusiones descriptivas que el/la docente ha registrado para cada competencia del estudiante.

CONTEXTO:
- Nivel educativo: Inicial
- Sistema de evaluación diagnóstica del CNEB (Currículo Nacional de Educación Básica) del Perú
- Niveles de logro: C (En Inicio), B (En Proceso), A (Logro Esperado), AD (Logro Destacado)
- Las conclusiones fueron escritas por el/la docente de aula

INSTRUCCIONES:
- Genera un análisis INTEGRAL que sintetice todas las conclusiones del docente
- Identifica patrones transversales de fortalezas y dificultades
- Usa un lenguaje cálido, profesional y empático, apropiado para educación inicial
- Las recomendaciones deben ser prácticas y lúdicas, apropiadas para niños de inicial
- Responde SIEMPRE en español`;

      userPrompt = `Analiza las conclusiones descriptivas del docente para este estudiante de Inicial y genera un análisis integral:

**Estudiante:** ${nombre_estudiante || "Estudiante"}
**Nivel:** Inicial - ${grado || "No especificado"}

CONCLUSIONES DESCRIPTIVAS DEL DOCENTE:
${resumenConclusiones}

Genera un JSON con esta estructura exacta:
{
  "resumen": "Resumen general del desarrollo del niño/niña en 2-3 oraciones, basado en las conclusiones del docente",
  "fortalezas": ["Lista de fortalezas transversales identificadas a partir de los logros reportados"],
  "dificultades": ["Lista de dificultades transversales identificadas"],
  "recomendaciones": ["Lista de recomendaciones pedagógicas lúdicas y prácticas para el nivel inicial"],
  "por_competencia": [
    {
      "competencia": "Nombre de la competencia",
      "nivel": "Nivel de logro asignado por el docente",
      "descripcion": "Síntesis del desempeño basada en lo reportado por el docente",
      "preguntas_evaluadas": "Evaluación descriptiva",
      "aciertos": 0,
      "total": 0
    }
  ]
}`;
    } else {
      // ===== STANDARD MODE: Use respuestas_dadas/correctas =====
      const { respuestas_dadas, respuestas_correctas, puntaje, nivel_logro } = body;

      if (!area || !respuestas_dadas || !respuestas_correctas) {
        return new Response(
          JSON.stringify({ error: "Faltan datos requeridos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const totalPreguntas = respuestas_correctas.length;
      const detallePreguntas = respuestas_correctas.map((correcta: string, i: number) => {
        const dada = respuestas_dadas[i] || "—";
        const esCorrecta = dada.toUpperCase() === correcta.toUpperCase();
        return `P${i + 1}: Respuesta dada="${dada}", Correcta="${correcta}" → ${esCorrecta ? "✓ CORRECTA" : "✗ INCORRECTA"}`;
      }).join("\n");

      const correctas = respuestas_correctas.filter((c: string, i: number) => {
        const d = respuestas_dadas[i] || "";
        return d.toUpperCase() === c.toUpperCase();
      }).length;

      const incorrectas = totalPreguntas - correctas;
      const preguntasIncorrectas = respuestas_correctas
        .map((c: string, i: number) => {
          const d = respuestas_dadas[i] || "";
          return d.toUpperCase() !== c.toUpperCase() ? `P${i + 1}` : null;
        })
        .filter(Boolean)
        .join(", ");

      systemPrompt = `Eres un especialista pedagógico del sistema DIA 2026 (Diagnóstico Integral de Aprendizajes) de la GRED Lambayeque, Perú. Tu tarea es generar conclusiones descriptivas personalizadas para un estudiante basándote en su patrón específico de respuestas.

CONTEXTO EDUCATIVO:
- Sistema de evaluación diagnóstica del Currículo Nacional de Educación Básica (CNEB) del Perú
- Niveles de logro: C (En Inicio), B (En Proceso), A (Logro Esperado), AD (Logro Destacado)
- Áreas evaluadas: Matemática, Comprensión Lectora, Habilidades Socioemocionales

COMPETENCIAS POR ÁREA:
- Matemática: "Resuelve problemas de cantidad", "Resuelve problemas de regularidad, equivalencia y cambio", "Resuelve problemas de forma, movimiento y localización", "Resuelve problemas de gestión de datos e incertidumbre"
- Comprensión Lectora: "Nivel Literal", "Nivel Inferencial", "Nivel Crítico Reflexivo"
- Habilidades Socioemocionales: "Construye su identidad", "Convive y participa democráticamente"

INSTRUCCIONES:
- Genera conclusiones descriptivas PERSONALIZADAS basadas en el patrón exacto de respuestas del estudiante
- Identifica fortalezas (preguntas correctas) y áreas de mejora (preguntas incorrectas)
- Agrupa las preguntas por competencia según su posición (las primeras preguntas evalúan la primera competencia, etc.)
- Responde SIEMPRE en español
- Usa un tono profesional, empático y constructivo
- Sé específico sobre qué competencias domina y cuáles necesita reforzar`;

      userPrompt = `Analiza los resultados de este estudiante y genera conclusiones descriptivas detalladas:

**Estudiante:** ${nombre_estudiante || "Estudiante"}
**Área:** ${area}
**Nivel educativo:** ${nivel || "No especificado"} - ${grado || "No especificado"}
**Puntaje:** ${puntaje || correctas}/${totalPreguntas}
**Nivel de logro:** ${nivel_logro || "No determinado"}
**Respuestas correctas:** ${correctas} | **Incorrectas:** ${incorrectas}
**Preguntas incorrectas:** ${preguntasIncorrectas || "Ninguna"}

DETALLE PREGUNTA POR PREGUNTA:
${detallePreguntas}

Genera un análisis con este formato JSON exacto:
{
  "resumen": "Resumen general del desempeño del estudiante en 2-3 oraciones",
  "fortalezas": ["Lista de fortalezas específicas identificadas"],
  "dificultades": ["Lista de dificultades específicas identificadas"],
  "recomendaciones": ["Lista de recomendaciones pedagógicas específicas para mejorar"],
  "por_competencia": [
    {
      "competencia": "Nombre de la competencia",
      "nivel": "En Inicio|En Proceso|Logro Esperado|Logro Destacado",
      "descripcion": "Descripción del desempeño en esta competencia",
      "preguntas_evaluadas": "P1-P5",
      "aciertos": 3,
      "total": 5
    }
  ]
}`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generar_conclusiones",
                description: "Genera conclusiones descriptivas personalizadas del estudiante",
                parameters: {
                  type: "object",
                  properties: {
                    resumen: { type: "string", description: "Resumen general del desempeño" },
                    fortalezas: { type: "array", items: { type: "string" }, description: "Lista de fortalezas" },
                    dificultades: { type: "array", items: { type: "string" }, description: "Lista de dificultades" },
                    recomendaciones: { type: "array", items: { type: "string" }, description: "Recomendaciones pedagógicas" },
                    por_competencia: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          competencia: { type: "string" },
                          nivel: { type: "string" },
                          descripcion: { type: "string" },
                          preguntas_evaluadas: { type: "string" },
                          aciertos: { type: "number" },
                          total: { type: "number" },
                        },
                        required: ["competencia", "nivel", "descripcion", "preguntas_evaluadas", "aciertos", "total"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["resumen", "fortalezas", "dificultades", "recomendaciones", "por_competencia"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generar_conclusiones" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes, intente de nuevo en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Error en el servicio de análisis." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const conclusiones = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
      
      return new Response(
        JSON.stringify(conclusiones),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: try to parse from content
    const content = data.choices?.[0]?.message?.content || "";
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch { /* ignore */ }

    return new Response(
      JSON.stringify({ error: "No se pudo generar el análisis." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-results error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
