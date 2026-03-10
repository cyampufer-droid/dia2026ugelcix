import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Auth client to verify user
    const authClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for unrestricted data access
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { tipo, institucion_id_override, grado_seccion_id_override } = await req.json();
    if (!tipo || !["institucional", "aula"].includes(tipo)) {
      return new Response(JSON.stringify({ error: "Tipo inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre_completo, institucion_id, grado_seccion_id, dni")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Perfil no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use overrides if provided (for admin/especialista)
    const effectiveInstId = institucion_id_override || profile.institucion_id;
    const effectiveGradoId = grado_seccion_id_override || profile.grado_seccion_id;

    // Get institution info
    let institucionNombre = "";
    let institucionDistrito = "";
    if (effectiveInstId) {
      const { data: inst } = await supabase
        .from("instituciones")
        .select("nombre, distrito, provincia, direccion, codigo_modular")
        .eq("id", effectiveInstId)
        .single();
      if (inst) {
        institucionNombre = inst.nombre;
        institucionDistrito = `${inst.distrito}, ${inst.provincia}`;
      }
    }

    // Get aula info if aula type
    let aulaNivel = "", aulaGrado = "", aulaSeccion = "";
    let aulaInstId = effectiveInstId;
    if (tipo === "aula" && effectiveGradoId) {
      const { data: aula } = await supabase
        .from("niveles_grados")
        .select("nivel, grado, seccion, institucion_id")
        .eq("id", effectiveGradoId)
        .single();
      if (aula) {
        aulaNivel = aula.nivel;
        aulaGrado = aula.grado;
        aulaSeccion = aula.seccion;
        aulaInstId = aula.institucion_id;
        // Get institution name if not already fetched
        if (!institucionNombre) {
          const { data: inst } = await supabase
            .from("instituciones")
            .select("nombre, distrito, provincia")
            .eq("id", aula.institucion_id)
            .single();
          if (inst) {
            institucionNombre = inst.nombre;
            institucionDistrito = `${inst.distrito}, ${inst.provincia}`;
          }
        }
      }
    }

    // Get results data
    let resultadosQuery;
    if (tipo === "institucional") {
      const targetInstId = effectiveInstId;
      if (!targetInstId) {
        return new Response(
          JSON.stringify({ error: "No se encontró institución asociada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: instStudents } = await supabase
        .from("profiles")
        .select("id")
        .eq("institucion_id", targetInstId)
        .not("grado_seccion_id", "is", null);

      const studentIds = (instStudents || []).map((s) => s.id);
      if (studentIds.length === 0) {
        return new Response(
          JSON.stringify({ error: "No hay estudiantes registrados en la institución." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: resultados } = await supabase
        .from("resultados")
        .select("puntaje_total, nivel_logro, evaluacion_id")
        .in("estudiante_id", studentIds.slice(0, 500));

      const { data: evaluaciones } = await supabase
        .from("evaluaciones")
        .select("id, area, grado, nivel");

      resultadosQuery = { resultados: resultados || [], evaluaciones: evaluaciones || [], totalEstudiantes: studentIds.length };
    } else {
      const targetGradoId = effectiveGradoId;
      if (!targetGradoId) {
        return new Response(
          JSON.stringify({ error: "No se encontró aula asociada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: aulaStudents } = await supabase
        .from("profiles")
        .select("id")
        .eq("grado_seccion_id", targetGradoId);

      const studentIds = (aulaStudents || []).map((s) => s.id);
      if (studentIds.length === 0) {
        return new Response(
          JSON.stringify({ error: "No hay estudiantes registrados en el aula." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: resultados } = await supabase
        .from("resultados")
        .select("puntaje_total, nivel_logro, evaluacion_id")
        .in("estudiante_id", studentIds.slice(0, 500));

      const { data: evaluaciones } = await supabase
        .from("evaluaciones")
        .select("id, area, grado, nivel");

      resultadosQuery = { resultados: resultados || [], evaluaciones: evaluaciones || [], totalEstudiantes: studentIds.length };
    }

    if (!resultadosQuery.resultados.length) {
      return new Response(
        JSON.stringify({ error: "No hay resultados de evaluaciones digitados para generar el plan." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate results by area and nivel_logro
    const evalMap = new Map();
    for (const ev of resultadosQuery.evaluaciones) {
      evalMap.set(ev.id, { area: ev.area, grado: ev.grado, nivel: ev.nivel });
    }

    const resumenPorArea = {};
    for (const r of resultadosQuery.resultados) {
      const ev = evalMap.get(r.evaluacion_id);
      if (!ev) continue;
      if (!resumenPorArea[ev.area]) {
        resumenPorArea[ev.area] = { total: 0, enInicio: 0, enProceso: 0, logroEsperado: 0, logroDestacado: 0, puntajes: [] };
      }
      const a = resumenPorArea[ev.area];
      a.total++;
      if (r.puntaje_total != null) a.puntajes.push(r.puntaje_total);
      switch (r.nivel_logro) {
        case "En Inicio": a.enInicio++; break;
        case "En Proceso": a.enProceso++; break;
        case "Logro Esperado": a.logroEsperado++; break;
        case "Logro Destacado": a.logroDestacado++; break;
      }
    }

    const resumenTexto = Object.entries(resumenPorArea)
      .map(([area, d]) => {
        const promedio = d.puntajes.length > 0 ? (d.puntajes.reduce((a, b) => a + b, 0) / d.puntajes.length).toFixed(1) : "N/A";
        return `${area}: ${d.total} evaluaciones, Promedio=${promedio}/20, En Inicio=${d.enInicio}, En Proceso=${d.enProceso}, Logro Esperado=${d.logroEsperado}, Logro Destacado=${d.logroDestacado}`;
      })
      .join("\n");

    if (!resumenTexto) {
      return new Response(
        JSON.stringify({ error: "No hay resultados de evaluaciones para generar el plan." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tipoLabel = tipo === "institucional" ? "Plan de Refuerzo Escolar Institucional" : "Plan de Refuerzo Escolar de Aula";
    const contextoAula = tipo === "aula" ? `\nAula: ${aulaNivel} - ${aulaGrado} grado, sección "${aulaSeccion}"` : "";

    const systemPrompt = `Eres un experto pedagógico del sistema educativo peruano (CNEB). Genera un "${tipoLabel}" completo y profesional basándote en los resultados diagnósticos proporcionados.

CONTEXTO:
- Sistema DIA 2026 (Diagnóstico Integral de Aprendizajes)
- UGEL Chiclayo, Lambayeque, Perú
- Año escolar 2026
- Niveles de logro: En Inicio (C), En Proceso (B), Logro Esperado (A), Logro Destacado (AD)

El plan debe ser práctico, realista y alineado al Currículo Nacional de Educación Básica (CNEB).
Responde SIEMPRE en español.`;

    const userPrompt = `Genera un "${tipoLabel}" con la siguiente información:

DATOS INFORMATIVOS:
- Institución: ${institucionNombre}
- Ubicación: ${institucionDistrito}
- Responsable: ${profile.nombre_completo}${contextoAula}
- Total de estudiantes: ${resultadosQuery.totalEstudiantes}
- Año: 2026

RESULTADOS DIAGNÓSTICOS:
${resumenTexto}

Genera el plan en formato JSON con esta estructura exacta:
{
  "datos_informativos": {
    "institucion": "string",
    "ubicacion": "string",
    "responsable": "string",
    "aula": "string (solo para aula, vacío para institucional)",
    "total_estudiantes": number,
    "anio": "2026",
    "fecha_elaboracion": "string"
  },
  "diagnostico": "Párrafo detallado identificando las principales dificultades de aprendizaje basado en los resultados",
  "objetivos": ["Lista de 3-5 objetivos específicos para fortalecer aprendizajes en competencias priorizadas"],
  "competencias_priorizadas": [
    {
      "competencia": "Nombre de la competencia",
      "area": "Área curricular",
      "justificacion": "Por qué se prioriza esta competencia basado en los datos"
    }
  ],
  "estrategias": [
    {
      "estrategia": "Nombre de la estrategia metodológica",
      "descripcion": "Descripción de la metodología activa y diferenciada"
    }
  ],
  "actividades": [
    {
      "actividad": "Nombre de la actividad",
      "descripcion": "Descripción del ejercicio o tarea de refuerzo",
      "responsable": "Quién ejecuta",
      "competencia_relacionada": "Competencia que refuerza"
    }
  ],
  "cronograma": [
    {
      "mes": "Nombre del mes",
      "actividades": ["Lista de actividades planificadas para ese mes"]
    }
  ],
  "recursos": [
    {
      "recurso": "Nombre del material o herramienta",
      "descripcion": "Cómo se utilizará"
    }
  ],
  "evaluacion_seguimiento": [
    {
      "indicador": "Indicador de progreso",
      "instrumento": "Instrumento de evaluación",
      "frecuencia": "Frecuencia de monitoreo",
      "responsable": "Quién monitorea"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes, intente en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response:", content.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "No se pudo generar el plan." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const plan = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-plan-refuerzo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
