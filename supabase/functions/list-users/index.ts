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

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isAdmin = (callerRoles || []).some((r: { role: string }) => r.role === "administrador");
    if (!isAdmin) return jsonResponse({ error: "Solo administradores pueden listar usuarios" }, 403);

    // Fetch all auth users (paginated)
    const allUsers: any[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      allUsers.push(...users);
      if (users.length < perPage) break;
      page++;
    }

    // Fetch all profiles, roles, instituciones, and niveles_grados
    const [profilesRes, rolesRes, institucionesRes, nivelesRes] = await Promise.all([
      adminClient.from("profiles").select("*"),
      adminClient.from("user_roles").select("*"),
      adminClient.from("instituciones").select("*"),
      adminClient.from("niveles_grados").select("*"),
    ]);

    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];
    const instituciones = institucionesRes.data || [];
    const niveles = nivelesRes.data || [];

    const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
    const roleMap = new Map<string, string[]>();
    for (const r of roles) {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    }
    const institucionMap = new Map(instituciones.map((i: any) => [i.id, i]));
    const nivelMap = new Map(niveles.map((n: any) => [n.id, n]));

    const result = allUsers.map((u) => {
      const profile = profileMap.get(u.id);
      const institucion = profile?.institucion_id ? institucionMap.get(profile.institucion_id) : null;
      const gradoSeccion = profile?.grado_seccion_id ? nivelMap.get(profile.grado_seccion_id) : null;

      return {
        id: u.id,
        email: u.email,
        dni: profile?.dni || u.user_metadata?.dni || "",
        nombre_completo: profile?.nombre_completo || u.user_metadata?.nombre_completo || "",
        roles: roleMap.get(u.id) || [],
        institucion_id: profile?.institucion_id,
        institucion_nombre: institucion?.nombre || "",
        distrito: institucion?.distrito || "",
        centro_poblado: institucion?.centro_poblado || "",
        direccion: institucion?.direccion || "",
        tipo_gestion: institucion?.tipo_gestion || "",
        nivel: gradoSeccion?.nivel || "",
        grado: gradoSeccion?.grado || "",
        seccion: gradoSeccion?.seccion || "",
        created_at: u.created_at,
      };
    });

    return jsonResponse({ users: result }, 200);
  } catch (err) {
    console.error("Error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
