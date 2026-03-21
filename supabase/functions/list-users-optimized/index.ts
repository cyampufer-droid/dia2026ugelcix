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
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "No autorizado" }, 401);

    const callerId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    const isAdmin = (callerRoles || []).some((r: { role: string }) => r.role === "administrador");
    if (!isAdmin) return jsonResponse({ error: "Solo administradores pueden listar usuarios" }, 403);

    // Parse params
    let page = 0;
    let pageSize = 500;
    let search = "";
    let roleFilter = "";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        page = parseInt(body.page) || 0;
        pageSize = Math.min(parseInt(body.pageSize) || 500, 500);
        search = body.search || "";
        roleFilter = body.roleFilter || "";
      } catch { /* defaults */ }
    }

    // Step 1: Fetch ALL roles in batches (table can exceed 1000 default limit)
    const roleMap = new Map<string, string[]>();
    {
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data: batch, error: rolesErr } = await adminClient
          .from("user_roles")
          .select("user_id, role")
          .range(from, from + batchSize - 1);
        if (rolesErr) throw rolesErr;
        if (!batch || batch.length === 0) break;
        for (const r of batch) {
          const existing = roleMap.get(r.user_id) || [];
          existing.push(r.role);
          roleMap.set(r.user_id, existing);
        }
        if (batch.length < batchSize) break;
        from += batchSize;
      }
    }

    // Step 2: Build query for profiles with server-side filtering
    let profileQuery = adminClient.from("profiles").select("*", { count: "exact" });
    
    if (search) {
      profileQuery = profileQuery.or(`dni.ilike.%${search}%,nombre_completo.ilike.%${search}%`);
    }

    if (roleFilter) {
      // Get user_ids with this role
      const roleUserIds: string[] = [];
      for (const [userId, roles] of roleMap) {
        if (roles.includes(roleFilter)) roleUserIds.push(userId);
      }
      
      if (roleUserIds.length === 0) {
        return jsonResponse({ users: [], total: 0, page, pageSize }, 200);
      }
      profileQuery = profileQuery.in("user_id", roleUserIds);
    }

    profileQuery = profileQuery
      .order("nombre_completo")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    const { data: profiles, error: profilesErr, count } = await profileQuery;
    if (profilesErr) throw profilesErr;

    // Step 3: Fetch related data only for the profiles in this page
    const instIds = [...new Set((profiles || []).map((p: any) => p.institucion_id).filter(Boolean))];
    const nivelIds = [...new Set((profiles || []).map((p: any) => p.grado_seccion_id).filter(Boolean))];

    const [instituciones, niveles] = await Promise.all([
      instIds.length > 0
        ? adminClient.from("instituciones").select("id, nombre, distrito, centro_poblado, direccion, tipo_gestion").in("id", instIds).then(r => r.data || [])
        : Promise.resolve([]),
      nivelIds.length > 0
        ? adminClient.from("niveles_grados").select("id, nivel, grado, seccion").in("id", nivelIds).then(r => r.data || [])
        : Promise.resolve([]),
    ]);

    const institucionMap = new Map(instituciones.map((i: any) => [i.id, i]));
    const nivelMap = new Map(niveles.map((n: any) => [n.id, n]));

    const result = (profiles || []).map((profile: any) => {
      const institucion = profile.institucion_id ? institucionMap.get(profile.institucion_id) : null;
      const gradoSeccion = profile.grado_seccion_id ? nivelMap.get(profile.grado_seccion_id) : null;

      return {
        id: profile.user_id || profile.id,
        email: profile.dni ? `${profile.dni}@dia.ugel.local` : "",
        dni: profile.dni || "",
        nombre_completo: profile.nombre_completo || "",
        roles: profile.user_id ? (roleMap.get(profile.user_id) || []) : [],
        institucion_id: profile.institucion_id,
        institucion_nombre: (institucion as any)?.nombre || "",
        distrito: (institucion as any)?.distrito || "",
        centro_poblado: (institucion as any)?.centro_poblado || "",
        direccion: (institucion as any)?.direccion || "",
        tipo_gestion: (institucion as any)?.tipo_gestion || "",
        nivel: (gradoSeccion as any)?.nivel || "",
        grado: (gradoSeccion as any)?.grado || "",
        seccion: (gradoSeccion as any)?.seccion || "",
        created_at: profile.created_at,
        is_pip: profile.is_pip || false,
      };
    });

    return jsonResponse({ users: result, total: count || 0, page, pageSize }, 200);
  } catch (err) {
    console.error("Error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
