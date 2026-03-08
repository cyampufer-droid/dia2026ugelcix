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
    const { nombre_estudiante, resultados, nivel_educativo, grado } = await req.json();

    if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
      return new Response(
        JSON.stringify({ error: "Se requieren resultados del estudiante" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build results summary
    const resumenResultados = resultados
      .filter((r: any) => r.puntaje !== null)
      .map((r: any) => `- ${r.area}: ${r.puntaje}/20 - ${r.nivel_logro}`)
      .join("\n");

    const systemPrompt = `Eres un orientador educativo especializado en el sistema educativo peruano (CNEB), 
experto en comunicación con padres de familia. Tu rol es generar recomendaciones prácticas, claras y empáticas 
para que los padres apoyen el aprendizaje de sus hijos en el hogar.

CONTEXTO:
- Sistema DIA 2026 (Diagnóstico Integral de Aprendizajes) de la UGEL Chiclayo, Perú
- Niveles de logro: C (En Inicio), B (En Proceso), A (Logro Esperado), AD (Logro Destacado)
- Áreas evaluadas: Matemática, Comprensión Lectora, Habilidades Socioemocionales

PRINCIPIOS:
- Usa un lenguaje sencillo, cálido y motivador
- Las recomendaciones deben ser PRÁCTICAS y realizables en casa
- Evita tecnicismos pedagógicos
- Incluye actividades que se puedan hacer en familia
- Considera el contexto socioeconómico diverso (no todos tienen acceso a tecnología avanzada)
- Resalta siempre lo positivo antes de las áreas de mejora
- Adapta el nivel de complejidad al grado educativo del estudiante`;

    const userPrompt = `Genera recomendaciones para los padres del estudiante ${nombre_estudiante || ""}:

**Nivel educativo:** ${nivel_educativo || "No especificado"}
**Grado:** ${grado || "No especificado"}

**Resultados del diagnóstico:**
${resumenResultados}

Genera un JSON con la siguiente estructura exacta:
{
  "introduccion": "Mensaje de bienvenida y contexto para los padres (2-3 oraciones)",
  "recomendaciones_generales": ["Lista de 3-4 recomendaciones generales aplicables a todas las áreas"],
  "por_area": [
    {
      "area": "Nombre del área",
      "nivel_logro": "Nivel obtenido",
      "consejos_hogar": ["2-3 consejos específicos para aplicar en casa"],
      "actividades_sugeridas": ["2-3 actividades concretas que pueden hacer en familia"],
      "recursos_apoyo": ["1-2 recursos accesibles (libros de texto, cuadernos de trabajo, etc.)"]
    }
  ],
  "mensaje_motivacional": "Un mensaje positivo y motivador para cerrar (1-2 oraciones)"
}`;

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
                name: "generar_recomendaciones_padres",
                description: "Genera recomendaciones personalizadas para padres de familia",
                parameters: {
                  type: "object",
                  properties: {
                    introduccion: { type: "string", description: "Mensaje introductorio para los padres" },
                    recomendaciones_generales: { 
                      type: "array", 
                      items: { type: "string" }, 
                      description: "Recomendaciones generales" 
                    },
                    por_area: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          area: { type: "string" },
                          nivel_logro: { type: "string" },
                          consejos_hogar: { type: "array", items: { type: "string" } },
                          actividades_sugeridas: { type: "array", items: { type: "string" } },
                          recursos_apoyo: { type: "array", items: { type: "string" } },
                        },
                        required: ["area", "nivel_logro", "consejos_hogar", "actividades_sugeridas", "recursos_apoyo"],
                        additionalProperties: false,
                      },
                    },
                    mensaje_motivacional: { type: "string", description: "Mensaje final motivacional" },
                  },
                  required: ["introduccion", "recomendaciones_generales", "por_area", "mensaje_motivacional"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generar_recomendaciones_padres" } },
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
        JSON.stringify({ error: "Error en el servicio de generación." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const recomendaciones = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
      
      return new Response(
        JSON.stringify(recomendaciones),
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
      JSON.stringify({ error: "No se pudieron generar las recomendaciones." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parent-recommendations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
