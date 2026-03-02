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
    if (!authHeader) return jsonResponse({ error: "No autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) return jsonResponse({ error: "No autorizado" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is docente
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isDocente = (callerRoles || []).some((r: { role: string }) =>
      ["docente", "director", "subdirector", "administrador", "especialista"].includes(r.role)
    );
    if (!isDocente) return jsonResponse({ error: "No tiene permisos" }, 403);

    // Get caller's profile
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("institucion_id, grado_seccion_id")
      .eq("user_id", caller.id)
      .single();

    if (!callerProfile?.grado_seccion_id) {
      return jsonResponse({ students: [], message: "No tiene aula asignada" }, 200);
    }

    // Get aula info
    const { data: aulaInfo } = await adminClient
      .from("niveles_grados")
      .select("id, nivel, grado, seccion, institucion_id")
      .eq("id", callerProfile.grado_seccion_id)
      .single();

    // Get institution name
    let institucionNombre = "";
    if (aulaInfo?.institucion_id) {
      const { data: inst } = await adminClient
        .from("instituciones")
        .select("nombre")
        .eq("id", aulaInfo.institucion_id)
        .single();
      if (inst) institucionNombre = inst.nombre;
    }

    // Get student profiles in this grado_seccion
    const { data: studentProfiles } = await adminClient
      .from("profiles")
      .select("id, user_id, dni, nombre_completo")
      .eq("grado_seccion_id", callerProfile.grado_seccion_id)
      .order("nombre_completo", { ascending: true });

    // Filter only students by checking user_roles
    const studentUserIds = (studentProfiles || [])
      .filter((p: any) => p.user_id)
      .map((p: any) => p.user_id);

    const { data: studentRoles } = await adminClient
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", studentUserIds.length > 0 ? studentUserIds : ["__none__"]);

    const studentUserIdSet = new Set(
      (studentRoles || [])
        .filter((r: any) => r.role === "estudiante")
        .map((r: any) => r.user_id)
    );

    // Get emails from auth for student users
    const emailMap = new Map<string, string>();
    if (studentUserIdSet.size > 0) {
      // Fetch users in batches
      const { data: { users: allAuthUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      for (const u of allAuthUsers || []) {
        if (studentUserIdSet.has(u.id)) {
          emailMap.set(u.id, u.email || "");
        }
      }
    }

    const students = (studentProfiles || [])
      .filter((p: any) => p.user_id && studentUserIdSet.has(p.user_id))
      .map((p: any) => ({
        id: p.id,
        dni: p.dni,
        nombre_completo: p.nombre_completo,
        email: emailMap.get(p.user_id) || "",
        institucion: institucionNombre,
        nivel: aulaInfo?.nivel || "",
        grado: aulaInfo?.grado || "",
        seccion: aulaInfo?.seccion || "",
      }));

    return jsonResponse({ students }, 200);
  } catch (err) {
    console.error("Error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
