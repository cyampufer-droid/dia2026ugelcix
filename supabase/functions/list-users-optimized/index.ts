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

// Helper to fetch ALL rows from a table, paginating in chunks of 1000
async function fetchAll(client: any, table: string, selectCols: string, orderCol?: string) {
  const pageSize = 1000;
  let allData: any[] = [];
  let from = 0;
  while (true) {
    let query = client.from(table).select(selectCols).range(from, from + pageSize - 1);
    if (orderCol) query = query.order(orderCol);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
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

    // Verify caller using getClaims
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return jsonResponse({ error: "No autorizado" }, 401);

    const callerId = claimsData.claims.sub as string;

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    const isAdmin = (callerRoles || []).some((r: { role: string }) => r.role === "administrador");
    if (!isAdmin) return jsonResponse({ error: "Solo administradores pueden listar usuarios" }, 403);

    // Parse search param
    let search = "";
    if (req.method === "POST") {
      try {
        const body = await req.json();
        search = body.search || "";
      } catch { /* use defaults */ }
    } else {
      const url = new URL(req.url);
      search = url.searchParams.get("search") || "";
    }

    // Fetch ALL profiles, roles, instituciones, niveles in parallel (paginated)
    const [profiles, allRoles, instituciones, niveles] = await Promise.all([
      fetchAll(adminClient, "profiles", "*", "nombre_completo"),
      fetchAll(adminClient, "user_roles", "*"),
      fetchAll(adminClient, "instituciones", "id, nombre, distrito, centro_poblado, direccion, tipo_gestion"),
      fetchAll(adminClient, "niveles_grados", "id, nivel, grado, seccion"),
    ]);

    // Build lookup maps
    const roleMap = new Map<string, string[]>();
    for (const r of allRoles) {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    }
    const institucionMap = new Map(instituciones.map((i: any) => [i.id, i]));
    const nivelMap = new Map(niveles.map((n: any) => [n.id, n]));

    // Transform data - derive email from DNI pattern instead of fetching auth users
    let result = profiles.map((profile: any) => {
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

    // Apply search filter
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((u: any) =>
        u.nombre_completo.toLowerCase().includes(s) || u.dni.includes(s)
      );
    }

    return jsonResponse({ users: result, total: result.length }, 200);
  } catch (err) {
    console.error("Error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
