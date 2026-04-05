import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
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

    // Verify the calling user is a docente
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check user is docente
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["docente", "administrador"])
      .limit(1)
      .single();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Solo docentes pueden guardar digitación" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { records } = body as {
      records: { estudiante_id: string; evaluacion_id: string; respuestas: string[] }[];
    };

    if (!records?.length) {
      return new Response(JSON.stringify({ error: "No hay registros" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the docente's allowed student IDs (from their grado_seccion)
    // First get docente's grado_seccion_id(s)
    const { data: profile } = await adminClient
      .from("profiles")
      .select("grado_seccion_id, institucion_id")
      .eq("user_id", user.id)
      .single();

    const { data: docenteGrados } = await adminClient
      .from("docente_grados")
      .select("grado_seccion_id")
      .eq("user_id", user.id);

    const gradoIds = new Set<string>();
    if (profile?.grado_seccion_id) gradoIds.add(profile.grado_seccion_id);
    if (docenteGrados) {
      for (const dg of docenteGrados) gradoIds.add(dg.grado_seccion_id);
    }

    // For admin, skip student validation
    const isAdmin = roleRow.role === "administrador";

    let allowedStudentIds: Set<string> | null = null;
    if (!isAdmin && gradoIds.size > 0) {
      const { data: students } = await adminClient
        .from("profiles")
        .select("id")
        .in("grado_seccion_id", [...gradoIds]);
      allowedStudentIds = new Set((students || []).map((s) => s.id));
    }

    // Load answer keys for score calculation
    const evalIds = [...new Set(records.map((r) => r.evaluacion_id))];
    const { data: evaluaciones } = await adminClient
      .from("evaluaciones")
      .select("id, config_preguntas")
      .in("id", evalIds);

    const answerKeyMap: Record<string, string[]> = {};
    for (const ev of evaluaciones || []) {
      const config = ev.config_preguntas as { respuestas_correctas?: string[] } | null;
      if (config?.respuestas_correctas) {
        answerKeyMap[ev.id] = config.respuestas_correctas;
      }
    }

    // Build upsert rows, filtering unauthorized students
    const upsertRows = [];
    let skipped = 0;

    for (const r of records) {
      if (allowedStudentIds && !allowedStudentIds.has(r.estudiante_id)) {
        skipped++;
        continue;
      }

      const answerKey = answerKeyMap[r.evaluacion_id];
      let puntaje = 0;
      if (answerKey) {
        for (let i = 0; i < r.respuestas.length; i++) {
          if (r.respuestas[i] && r.respuestas[i] === answerKey[i]) puntaje++;
        }
      }

      upsertRows.push({
        estudiante_id: r.estudiante_id,
        evaluacion_id: r.evaluacion_id,
        respuestas_dadas: r.respuestas,
        puntaje_total: puntaje,
        fecha_sincronizacion: new Date().toISOString(),
      });
    }

    // Batch upsert
    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 100;

    for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
      const batch = upsertRows.slice(i, i + BATCH_SIZE);
      const { error } = await adminClient
        .from("resultados")
        .upsert(batch, { onConflict: "estudiante_id,evaluacion_id" });

      if (error) {
        console.error("Batch upsert error:", error);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ success: successCount, errors: errorCount, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("save-digitacion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
