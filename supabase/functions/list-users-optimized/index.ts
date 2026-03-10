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

    // Parse query parameters
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "1000"), 1000);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || "";

    // Fetch profiles, roles, instituciones, niveles in parallel (separate queries, no JOINs)
    const [profilesRes, rolesRes, institucionesRes, nivelesRes] = await Promise.all([
      adminClient.from("profiles").select("*").order("nombre_completo").range(offset, offset + limit - 1),
      adminClient.from("user_roles").select("*"),
      adminClient.from("instituciones").select("*"),
      adminClient.from("niveles_grados").select("*"),
    ]);

    const profiles = profilesRes.data || [];
    const allRoles = rolesRes.data || [];
    const instituciones = institucionesRes.data || [];
    const niveles = nivelesRes.data || [];

    // Build lookup maps
    const roleMap = new Map<string, string[]>();
    for (const r of allRoles) {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    }
    const institucionMap = new Map(instituciones.map((i: any) => [i.id, i]));
    const nivelMap = new Map(niveles.map((n: any) => [n.id, n]));

    // Get auth data for users with user_id
    const userIds = profiles.map((p: any) => p.user_id).filter(Boolean) as string[];
    const authDataMap = new Map();
    
    // Batch fetch auth users
    const chunkSize = 100;
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      for (const userId of chunk) {
        try {
          const { data: { user } } = await adminClient.auth.admin.getUserById(userId);
          if (user) authDataMap.set(userId, user);
        } catch (err) {
          console.warn(`Failed to get user ${userId}`);
        }
      }
    }

    // Transform data
    let result = profiles.map((profile: any) => {
      const authUser = profile.user_id ? authDataMap.get(profile.user_id) : null;
      const institucion = profile.institucion_id ? institucionMap.get(profile.institucion_id) : null;
      const gradoSeccion = profile.grado_seccion_id ? nivelMap.get(profile.grado_seccion_id) : null;

      return {
        id: profile.user_id || profile.id,
        email: authUser?.email || "",
        dni: profile.dni || "",
        nombre_completo: profile.nombre_completo || "",
        roles: profile.user_id ? (roleMap.get(profile.user_id) || []) : [],
        institucion_id: profile.institucion_id,
        institucion_nombre: institucion?.nombre || "",
        distrito: institucion?.distrito || "",
        centro_poblado: institucion?.centro_poblado || "",
        direccion: institucion?.direccion || "",
        tipo_gestion: institucion?.tipo_gestion || "",
        nivel: gradoSeccion?.nivel || "",
        grado: gradoSeccion?.grado || "",
        seccion: gradoSeccion?.seccion || "",
        created_at: authUser?.created_at || profile.created_at,
        is_pip: profile.is_pip || false,
      };
    });

    // Apply search filter in memory
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((u: any) =>
        u.nombre_completo.toLowerCase().includes(s) || u.dni.includes(s)
      );
    }

    return jsonResponse({
      users: result,
      total: result.length,
      limit,
      offset,
    }, 200);
  } catch (err) {
    console.error("Error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
