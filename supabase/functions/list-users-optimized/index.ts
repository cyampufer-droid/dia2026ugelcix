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

    // Check admin or especialista role
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    const roleList = (callerRoles || []).map((r: { role: string }) => r.role);
    const isAdmin = roleList.includes("administrador");
    const isEspecialista = roleList.includes("especialista");
    if (!isAdmin && !isEspecialista) return jsonResponse({ error: "Solo administradores y especialistas pueden listar usuarios" }, 403);

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

    // Helper to query with batched .in() to avoid URL length limits
    async function batchedIn(table: string, selectCols: string, filterCol: string, ids: string[], extraBuilder?: (q: any) => any) {
      const BATCH = 150; // safe batch size for URL length
      const all: any[] = [];
      for (let i = 0; i < ids.length; i += BATCH) {
        let q = adminClient.from(table).select(selectCols).in(filterCol, ids.slice(i, i + BATCH));
        if (extraBuilder) q = extraBuilder(q);
        const { data, error } = await q;
        if (error) throw error;
        if (data) all.push(...data);
      }
      return all;
    }

    // When filtering by role, get user_ids first
    let roleFilterUserIds: Set<string> | null = null;
    if (roleFilter) {
      const roleUserIds: string[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data: batch, error } = await adminClient
          .from("user_roles")
          .select("user_id")
          .eq("role", roleFilter)
          .range(from, from + batchSize - 1);
        if (error) throw error;
        if (!batch || batch.length === 0) break;
        for (const r of batch) roleUserIds.push(r.user_id);
        if (batch.length < batchSize) break;
        from += batchSize;
      }
      if (roleUserIds.length === 0) return jsonResponse({ users: [], total: 0, page, pageSize }, 200);
      roleFilterUserIds = new Set(roleUserIds);
    }

    // Build profile query - when role filtering, fetch ALL matching profiles client-side
    // because .in() with thousands of IDs breaks URL limits
    let profiles: any[] = [];
    let totalCount = 0;

    if (roleFilterUserIds) {
      // Fetch profiles in batches using the role-filtered user_ids
      const idArray = [...roleFilterUserIds];
      let allMatchingProfiles = await batchedIn("profiles", "*", "user_id", idArray);

      // Apply search filter client-side
      if (search) {
        const s = search.toLowerCase();
        allMatchingProfiles = allMatchingProfiles.filter((p: any) =>
          (p.dni && p.dni.toLowerCase().includes(s)) ||
          (p.nombre_completo && p.nombre_completo.toLowerCase().includes(s))
        );
      }

      // Sort by nombre_completo
      allMatchingProfiles.sort((a: any, b: any) =>
        (a.nombre_completo || "").localeCompare(b.nombre_completo || "")
      );

      totalCount = allMatchingProfiles.length;
      profiles = allMatchingProfiles.slice(page * pageSize, (page + 1) * pageSize);
    } else {
      // No role filter - use server-side pagination directly
      let profileQuery = adminClient.from("profiles").select("*", { count: "exact" });
      if (search) {
        profileQuery = profileQuery.or(`dni.ilike.%${search}%,nombre_completo.ilike.%${search}%`);
      }
      profileQuery = profileQuery.order("nombre_completo").range(page * pageSize, (page + 1) * pageSize - 1);
      const { data, error: profilesErr, count } = await profileQuery;
      if (profilesErr) throw profilesErr;
      profiles = data || [];
      totalCount = count || 0;
    }

    if (!profiles || profiles.length === 0) return jsonResponse({ users: [], total: totalCount, page, pageSize }, 200);

    // Fetch roles, instituciones, niveles only for this page's profiles
    const pageUserIds = profiles.filter((p: any) => p.user_id).map((p: any) => p.user_id);
    const instIds = [...new Set(profiles.map((p: any) => p.institucion_id).filter(Boolean))];
    const nivelIds = [...new Set(profiles.map((p: any) => p.grado_seccion_id).filter(Boolean))];

    const [rolesData, instituciones, niveles] = await Promise.all([
      pageUserIds.length > 0
        ? batchedIn("user_roles", "user_id, role", "user_id", pageUserIds)
        : Promise.resolve([]),
      instIds.length > 0
        ? batchedIn("instituciones", "id, nombre, distrito, centro_poblado, direccion, tipo_gestion", "id", instIds)
        : Promise.resolve([]),
      nivelIds.length > 0
        ? batchedIn("niveles_grados", "id, nivel, grado, seccion", "id", nivelIds)
        : Promise.resolve([]),
    ]);

    const roleMap = new Map<string, string[]>();
    for (const r of rolesData) {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    }
    const institucionMap = new Map(instituciones.map((i: any) => [i.id, i]));
    const nivelMap = new Map(niveles.map((n: any) => [n.id, n]));

    const result = profiles.map((profile: any) => {
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
