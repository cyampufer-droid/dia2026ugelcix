import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "No autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) return jsonResponse({ error: "No autorizado" }, 401);
    
    const callerId = claimsData.claims.sub as string;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Parallel: get caller roles + profile + docente_grados
    const [rolesRes, profileRes, dgRes] = await Promise.all([
      adminClient.from("user_roles").select("role").eq("user_id", callerId),
      adminClient.from("profiles").select("institucion_id, grado_seccion_id").eq("user_id", callerId).single(),
      adminClient.from("docente_grados").select("grado_seccion_id").eq("user_id", callerId),
    ]);

    const isDocente = (rolesRes.data || []).some((r: { role: string }) =>
      ["docente", "director", "subdirector", "administrador", "especialista"].includes(r.role)
    );
    if (!isDocente) return jsonResponse({ error: "No tiene permisos" }, 403);

    const callerProfile = profileRes.data;
    const multiGradoIds = (dgRes.data || []).map((dg: any) => dg.grado_seccion_id);

    let gradoSeccionIds: string[] = [];
    if (multiGradoIds.length > 0) {
      gradoSeccionIds = multiGradoIds;
    } else if (callerProfile?.grado_seccion_id) {
      gradoSeccionIds = [callerProfile.grado_seccion_id];
    }

    // Optionally filter by a specific grado_seccion_id from request body
    let filterGradoId: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.grado_seccion_id) {
          filterGradoId = body.grado_seccion_id;
        }
      } catch { /* no body */ }
    }

    const activeIds = filterGradoId ? [filterGradoId] : gradoSeccionIds;

    if (activeIds.length === 0) {
      return jsonResponse({ students: [], aulas: [], message: "No tiene aula asignada" }, 200);
    }

    // Parallel: get aulas info + student profiles
    const [aulasRes, studentsRes] = await Promise.all([
      adminClient.from("niveles_grados").select("id, nivel, grado, seccion, institucion_id").in("id", activeIds),
      adminClient.from("profiles").select("id, user_id, dni, nombre_completo, grado_seccion_id").in("grado_seccion_id", activeIds).order("nombre_completo", { ascending: true }),
    ]);

    const aulasInfo = aulasRes.data || [];
    const studentProfiles = studentsRes.data || [];

    // Get institution name
    let institucionNombre = "";
    const instId = aulasInfo[0]?.institucion_id || callerProfile?.institucion_id;
    if (instId) {
      const { data: inst } = await adminClient.from("instituciones").select("nombre").eq("id", instId).single();
      if (inst) institucionNombre = inst.nombre;
    }

    // Filter only students by checking user_roles
    const studentUserIds = studentProfiles.filter((p: any) => p.user_id).map((p: any) => p.user_id);

    const { data: studentRoles } = await adminClient
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", studentUserIds.length > 0 ? studentUserIds : ["__none__"]);

    const studentUserIdSet = new Set(
      (studentRoles || []).filter((r: any) => r.role === "estudiante").map((r: any) => r.user_id)
    );

    // Build aula lookup
    const aulaMap = new Map<string, any>();
    for (const a of aulasInfo) aulaMap.set(a.id, a);

    // Derive emails from DNI pattern instead of fetching from auth (major perf improvement)
    const students = studentProfiles
      .filter((p: any) => p.user_id && studentUserIdSet.has(p.user_id))
      .map((p: any) => {
        const aula = aulaMap.get(p.grado_seccion_id);
        return {
          id: p.id,
          user_id: p.user_id,
          dni: p.dni,
          nombre_completo: p.nombre_completo,
          email: p.dni ? `${p.dni}@dia.ugel.local` : "",
          institucion: institucionNombre,
          nivel: aula?.nivel || "",
          grado: aula?.grado || "",
          seccion: aula?.seccion || "",
        };
      });

    return jsonResponse({
      students,
      aulas: aulasInfo.map((a: any) => ({
        id: a.id, nivel: a.nivel, grado: a.grado, seccion: a.seccion,
      })),
    }, 200);
  } catch (err) {
    console.error("Error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
