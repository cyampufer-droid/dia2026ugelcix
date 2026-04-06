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

async function fetchAllPaginated(query: any, pageSize = 1000) {
  const allData: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allData;
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

    // Get caller info
    const [rolesRes, profileRes, dgRes] = await Promise.all([
      adminClient.from("user_roles").select("role").eq("user_id", callerId),
      adminClient.from("profiles").select("institucion_id, grado_seccion_id, is_pip").eq("user_id", callerId).single(),
      adminClient.from("docente_grados").select("grado_seccion_id").eq("user_id", callerId),
    ]);

    const callerRoles = (rolesRes.data || []).map((r: any) => r.role);
    const callerProfile = profileRes.data;
    const isAdmin = callerRoles.includes("administrador");
    const isEspecialista = callerRoles.includes("especialista");
    const isDirector = callerRoles.includes("director") || callerRoles.includes("subdirector");
    const isPIP = callerRoles.includes("docente") && callerProfile?.is_pip;
    const isDocente = callerRoles.includes("docente");

    // Determine scope
    type Scope = "all" | "institution" | "classroom";
    let scope: Scope = "classroom";
    let filterInstitucionId: string | null = null;
    let filterGradoIds: string[] = [];

    if (isAdmin || isEspecialista) {
      scope = "all";
    } else if (isDirector || isPIP) {
      scope = "institution";
      filterInstitucionId = callerProfile?.institucion_id || null;
      if (!filterInstitucionId) return jsonResponse({ error: "No tiene institución asignada" }, 400);
    } else if (isDocente) {
      scope = "classroom";
      const multiGradoIds = (dgRes.data || []).map((dg: any) => dg.grado_seccion_id);
      if (multiGradoIds.length > 0) {
        filterGradoIds = multiGradoIds;
      } else if (callerProfile?.grado_seccion_id) {
        filterGradoIds = [callerProfile.grado_seccion_id];
      }
      filterInstitucionId = callerProfile?.institucion_id || null;
      if (filterGradoIds.length === 0) return jsonResponse({ error: "No tiene aula asignada" }, 400);
    } else {
      return jsonResponse({ error: "No tiene permisos para exportar usuarios" }, 403);
    }

    // Fetch profiles based on scope (paginated to handle large datasets)
    let allProfiles: any[] = [];
    if (scope === "all") {
      // Fetch all profiles in batches
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await adminClient
          .from("profiles")
          .select("*")
          .order("nombre_completo")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allProfiles.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
    } else if (scope === "institution") {
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await adminClient
          .from("profiles")
          .select("*")
          .eq("institucion_id", filterInstitucionId!)
          .order("nombre_completo")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allProfiles.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
    } else {
      // Classroom scope: students in teacher's grados + orphans from same institution
      const [assignedRes, orphanRes] = await Promise.all([
        adminClient.from("profiles").select("*").in("grado_seccion_id", filterGradoIds).order("nombre_completo"),
        filterInstitucionId
          ? adminClient.from("profiles").select("*").eq("institucion_id", filterInstitucionId).is("grado_seccion_id", null).order("nombre_completo")
          : Promise.resolve({ data: [] }),
      ]);
      const seenIds = new Set<string>();
      for (const p of [...(assignedRes.data || []), ...((orphanRes as any).data || [])]) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          allProfiles.push(p);
        }
      }
    }

    // Fetch all roles for these profiles
    const userIds = allProfiles.filter(p => p.user_id).map(p => p.user_id);
    const roleMap = new Map<string, string[]>();

    // Fetch roles in batches of 500 to avoid query limits
    for (let i = 0; i < userIds.length; i += 500) {
      const batch = userIds.slice(i, i + 500);
      const { data: batchRoles } = await adminClient
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", batch);
      for (const r of (batchRoles || [])) {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      }
    }

    // For docentes (classroom scope), filter only students
    if (scope === "classroom") {
      allProfiles = allProfiles.filter(p => {
        const roles = p.user_id ? (roleMap.get(p.user_id) || []) : [];
        return roles.includes("estudiante");
      });
    }

    // Fetch instituciones and niveles for enrichment
    const instIds = [...new Set(allProfiles.map(p => p.institucion_id).filter(Boolean))];
    const nivelIds = [...new Set(allProfiles.map(p => p.grado_seccion_id).filter(Boolean))];

    const [instRes, nivelRes] = await Promise.all([
      instIds.length > 0
        ? adminClient.from("instituciones").select("id, nombre, distrito, centro_poblado, direccion, tipo_gestion").in("id", instIds)
        : Promise.resolve({ data: [] }),
      nivelIds.length > 0
        ? adminClient.from("niveles_grados").select("id, nivel, grado, seccion").in("id", nivelIds)
        : Promise.resolve({ data: [] }),
    ]);

    const institucionMap = new Map((instRes.data || []).map((i: any) => [i.id, i]));
    const nivelMap = new Map((nivelRes.data || []).map((n: any) => [n.id, n]));

    const users = allProfiles.map((p: any) => {
      const inst = p.institucion_id ? institucionMap.get(p.institucion_id) : null;
      const nivel = p.grado_seccion_id ? nivelMap.get(p.grado_seccion_id) : null;
      const roles = p.user_id ? (roleMap.get(p.user_id) || []) : [];

      return {
        dni: p.dni || "",
        nombre_completo: p.nombre_completo || "",
        roles: roles.join(", "),
        email: p.dni ? `${p.dni}@dia.ugel.local` : "",
        institucion: (inst as any)?.nombre || "",
        distrito: (inst as any)?.distrito || "",
        centro_poblado: (inst as any)?.centro_poblado || "",
        tipo_gestion: (inst as any)?.tipo_gestion || "",
        nivel: (nivel as any)?.nivel || "",
        grado: (nivel as any)?.grado || "",
        seccion: (nivel as any)?.seccion || "",
        is_pip: p.is_pip || false,
        created_at: p.created_at ? new Date(p.created_at).toLocaleDateString("es-PE") : "",
      };
    });

    return jsonResponse({
      users,
      total: users.length,
      scope,
    }, 200);
  } catch (err: unknown) {
    console.error("Error:", (err as Error).message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
