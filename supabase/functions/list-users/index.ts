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

// Redirects to list-users-optimized - this legacy endpoint now uses the same efficient logic
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "No autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) return jsonResponse({ error: "No autorizado" }, 401);

    const callerId = claimsData.claims.sub as string;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerRoles } = await adminClient.from("user_roles").select("role").eq("user_id", callerId);
    const isAdmin = (callerRoles || []).some((r: { role: string }) => r.role === "administrador");
    if (!isAdmin) return jsonResponse({ error: "Solo administradores pueden listar usuarios" }, 403);

    // Helper to query with batched .in() to avoid URL length limits
    async function batchedIn(table: string, selectCols: string, filterCol: string, ids: string[]) {
      const BATCH = 150;
      const all: any[] = [];
      for (let i = 0; i < ids.length; i += BATCH) {
        const { data, error } = await adminClient.from(table).select(selectCols).in(filterCol, ids.slice(i, i + BATCH));
        if (error) throw error;
        if (data) all.push(...data);
      }
      return all;
    }

    // Fetch profiles in batches
    const allProfiles: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await adminClient.from("profiles").select("*").order("nombre_completo").range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allProfiles.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // Fetch roles in batches
    const roleMap = new Map<string, string[]>();
    from = 0;
    while (true) {
      const { data: batch, error } = await adminClient.from("user_roles").select("user_id, role").range(from, from + pageSize - 1);
      if (error) throw error;
      if (!batch || batch.length === 0) break;
      for (const r of batch) {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      }
      if (batch.length < pageSize) break;
      from += pageSize;
    }

    // Fetch instituciones and niveles using batched .in()
    const instIds = [...new Set(allProfiles.map(p => p.institucion_id).filter(Boolean))];
    const nivelIds = [...new Set(allProfiles.map(p => p.grado_seccion_id).filter(Boolean))];

    const [instData, nivelData] = await Promise.all([
      instIds.length > 0 ? batchedIn("instituciones", "id, nombre, distrito, centro_poblado, direccion, tipo_gestion", "id", instIds) : Promise.resolve([]),
      nivelIds.length > 0 ? batchedIn("niveles_grados", "id, nivel, grado, seccion", "id", nivelIds) : Promise.resolve([]),
    ]);

    const institucionMap = new Map(instData.map((i: any) => [i.id, i]));
    const nivelMap = new Map(nivelData.map((n: any) => [n.id, n]));

    const result = allProfiles.map((p: any) => {
      const inst = p.institucion_id ? institucionMap.get(p.institucion_id) : null;
      const nivel = p.grado_seccion_id ? nivelMap.get(p.grado_seccion_id) : null;
      return {
        id: p.user_id || p.id,
        email: p.dni ? `${p.dni}@dia.ugel.local` : "",
        dni: p.dni || "",
        nombre_completo: p.nombre_completo || "",
        roles: p.user_id ? (roleMap.get(p.user_id) || []) : [],
        institucion_id: p.institucion_id,
        institucion_nombre: (inst as any)?.nombre || "",
        distrito: (inst as any)?.distrito || "",
        centro_poblado: (inst as any)?.centro_poblado || "",
        direccion: (inst as any)?.direccion || "",
        tipo_gestion: (inst as any)?.tipo_gestion || "",
        nivel: (nivel as any)?.nivel || "",
        grado: (nivel as any)?.grado || "",
        seccion: (nivel as any)?.seccion || "",
        created_at: p.created_at,
      };
    });

    return jsonResponse({ users: result }, 200);
  } catch (err) {
    console.error("Error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
