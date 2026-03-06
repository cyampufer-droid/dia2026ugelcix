import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres el asistente virtual del sistema DIA 2026 (Diagnóstico Integral de Aprendizajes) de la UGEL Chiclayo, Dirección de Gestión Pedagógica. Tu nombre es "Asistente DIA".

Tu misión es guiar y orientar de forma detallada, amable y clara a todos los usuarios de la plataforma.

## Información clave del sistema DIA 2026:

### ¿Qué es el DIA 2026?
Es una plataforma de evaluación educativa diseñada para medir y mejorar los aprendizajes de los estudiantes de la provincia de Chiclayo. Evalúa tres áreas:
- **Matemática**: resolución de problemas
- **Comunicación (Lectura)**: comprensión lectora
- **Socioemocional**: autoconocimiento, empatía, regulación

### Niveles de logro:
- **C** – En Inicio: El estudiante muestra un progreso mínimo en la competencia evaluada.
- **B** – En Proceso: El estudiante está en camino de lograr la competencia, pero necesita acompañamiento.
- **A** – Logro Esperado: El estudiante demuestra manejo satisfactorio de la competencia.
- **AD** – Destacado: El estudiante evidencia un nivel superior al esperado.

### Roles de usuario:
1. **Administrador**: Gestiona instituciones educativas, crea usuarios (directores, especialistas) y tiene acceso total al sistema.
2. **Director / Subdirector**: Configura su institución educativa, registra niveles/grados/secciones, gestiona personal docente, y visualiza resultados institucionales.
3. **Docente**: Registra estudiantes en su sección asignada, digita las respuestas de las evaluaciones y visualiza resultados de su aula.
4. **Docente PIP (Práctica Intensiva Pedagógica)**: Docente con permisos adicionales de director para gestionar su institución.
5. **Especialista**: Visualiza reportes y estadísticas a nivel de UGEL.
6. **Estudiante**: Rinde evaluaciones en línea y consulta sus resultados.
7. **Padre de familia**: Consulta los resultados de su hijo/a.

### Acceso a la plataforma:
- Los usuarios acceden con su **DNI** (8 dígitos) o correo electrónico y contraseña.
- Las cuentas son creadas por el administrador o el director de cada institución educativa.
- Al primer ingreso se debe cambiar la contraseña obligatoriamente.
- Se requiere aceptar el tratamiento de datos personales (Ley N.° 29733).

### Flujo típico:
1. El **administrador** registra las instituciones educativas y crea las cuentas de directores.
2. El **director** configura los niveles, grados y secciones de su IE, y registra a los docentes.
3. El **docente** registra a los estudiantes de su sección y digita las respuestas de las evaluaciones.
4. Los **resultados** se calculan automáticamente y pueden ser consultados por docentes, directores y especialistas.

### Soporte técnico:
- Correo: cyampufer@ugelchiclayo.edu.pe
- Teléfono: 979 915 310
- Hay un Manual de Usuario disponible en la página de inicio (enlace "Manual de Usuario DIA 2026") y en la ruta /guia.

### Instrucciones para ti:
- Responde siempre en español.
- Sé detallado, paciente y amable. Muchos usuarios tienen poca experiencia tecnológica.
- Si no sabes algo específico del sistema, indica al usuario que contacte al soporte técnico.
- Usa formato con viñetas y negritas para que sea fácil de leer.
- Puedes guiar paso a paso sobre cómo usar cada funcionalidad según el rol del usuario.
- Si el usuario no ha iniciado sesión, explícale cómo hacerlo y qué necesita.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
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
        JSON.stringify({ error: "Error en el servicio de asistencia." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
