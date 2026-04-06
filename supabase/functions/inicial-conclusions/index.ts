import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AppRole = "estudiante" | "docente" | "director" | "subdirector" | "especialista" | "padre" | "administrador";

interface CallerProfile {
  id: string;
  user_id: string | null;
  institucion_id: string | null;
  grado_seccion_id: string | null;
}

interface ConclusionRecord {
  estudiante_id: string;
  area: string;
  competencia: string;
  logros: string;
  dificultades: string;
  mejora: string;
  nivel_logro: string;
  docente_user_id?: string;
}

interface DeleteTarget {
  estudiante_id: string;
  area: string;
  competencia: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeRecord(value: unknown): ConclusionRecord | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const estudiante_id = normalizeString(record.estudiante_id).trim();
  const area = normalizeString(record.area).trim();
  const competencia = normalizeString(record.competencia).trim();

  if (!estudiante_id || !area || !competencia) return null;

  return {
    estudiante_id,
    area,
    competencia,
    logros: normalizeString(record.logros),
    dificultades: normalizeString(record.dificultades),
    mejora: normalizeString(record.mejora),
    nivel_logro: normalizeString(record.nivel_logro) || "En Inicio",
    docente_user_id: normalizeString(record.docente_user_id) || undefined,
  };
}

function normalizeDeleteTarget(value: unknown): DeleteTarget | null {
  if (!value || typeof value !== "object") return null;

  const target = value as Record<string, unknown>;
  const estudiante_id = normalizeString(target.estudiante_id).trim();
  const area = normalizeString(target.area).trim();
  const competencia = normalizeString(target.competencia).trim();

  if (!estudiante_id || !area || !competencia) return null;

  return { estudiante_id, area, competencia };
}

async function getCallerContext(authHeader: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    throw new Error("No autorizado");
  }

  const callerId = claimsData.claims.sub as string;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const [rolesRes, profileRes, gradosRes] = await Promise.all([
    adminClient.from("user_roles").select("role").eq("user_id", callerId),
    adminClient.from("profiles").select("id, user_id, institucion_id, grado_seccion_id").eq("user_id", callerId).single(),
    adminClient.from("docente_grados").select("grado_seccion_id").eq("user_id", callerId),
  ]);

  if (rolesRes.error) throw rolesRes.error;
  if (profileRes.error && profileRes.error.code !== "PGRST116") throw profileRes.error;
  if (gradosRes.error) throw gradosRes.error;

  const roles = (rolesRes.data || []).map((row) => row.role as AppRole);
  const profile = (profileRes.data ?? null) as CallerProfile | null;
  const gradoSeccionIds = unique([
    profile?.grado_seccion_id,
    ...(gradosRes.data || []).map((row) => row.grado_seccion_id),
  ]);

  return { adminClient, callerId, roles, profile, gradoSeccionIds };
}

async function resolveAllowedStudentIds(
  adminClient: any,
  callerId: string,
  roles: AppRole[],
  profile: CallerProfile | null,
  gradoSeccionIds: string[],
  requestedStudentIds: string[],
) {
  const uniqueIds = unique(requestedStudentIds);
  if (uniqueIds.length === 0) return [];

  const { data: students, error } = await adminClient
    .from("profiles")
    .select("id, user_id, institucion_id, grado_seccion_id")
    .in("id", uniqueIds);

  if (error) throw error;

  const isAdmin = roles.includes("administrador") || roles.includes("especialista");
  const isDirector = roles.includes("director") || roles.includes("subdirector");
  const isDocente = roles.includes("docente");
  const isStudent = roles.includes("estudiante");

  return (students || [])
    .filter((student) => {
      if (isAdmin) return true;

      if (isDirector) {
        return Boolean(profile?.institucion_id) && student.institucion_id === profile?.institucion_id;
      }

      if (isDocente) {
        const sameAssignedGrade = Boolean(student.grado_seccion_id) && gradoSeccionIds.includes(student.grado_seccion_id);
        const sameInstitutionWithoutGrade = Boolean(profile?.institucion_id) &&
          student.institucion_id === profile?.institucion_id &&
          student.grado_seccion_id === null;
        return sameAssignedGrade || sameInstitutionWithoutGrade;
      }

      if (isStudent) {
        return student.id === profile?.id || student.user_id === callerId;
      }

      return false;
    })
    .map((student) => student.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const { adminClient, callerId, roles, profile, gradoSeccionIds } = await getCallerContext(authHeader);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = normalizeString((body as Record<string, unknown>).action) || "list";

    if (!["administrador", "especialista", "director", "subdirector", "docente", "estudiante"].some((role) => roles.includes(role as AppRole))) {
      return jsonResponse({ error: "No tiene permisos" }, 403);
    }

    if (action === "list") {
      const requestedIds = unique([
        normalizeString((body as Record<string, unknown>).student_id),
        ...((((body as Record<string, unknown>).student_ids as unknown[]) || []).map((id) => normalizeString(id))),
      ]);

      const allowedIds = await resolveAllowedStudentIds(adminClient, callerId, roles, profile, gradoSeccionIds, requestedIds);
      if (requestedIds.length > 0 && allowedIds.length === 0) {
        return jsonResponse({ conclusions: [] }, 200);
      }

      const query = adminClient
        .from("conclusiones_inicial")
        .select("estudiante_id, area, competencia, logros, dificultades, mejora, nivel_logro")
        .order("area", { ascending: true })
        .order("competencia", { ascending: true });

      const { data, error } = allowedIds.length > 0
        ? await query.in("estudiante_id", allowedIds)
        : await query.limit(0);

      if (error) throw error;
      return jsonResponse({ conclusions: data || [] }, 200);
    }

    if (action === "sync") {
      if (!(roles.includes("docente") || roles.includes("director") || roles.includes("subdirector") || roles.includes("administrador") || roles.includes("especialista"))) {
        return jsonResponse({ error: "No tiene permisos para guardar conclusiones" }, 403);
      }

      const rawUpserts = Array.isArray((body as Record<string, unknown>).upserts) ? (body as Record<string, unknown>).upserts as unknown[] : [];
      const rawDeletes = Array.isArray((body as Record<string, unknown>).deletes) ? (body as Record<string, unknown>).deletes as unknown[] : [];

      const upserts = rawUpserts.map(normalizeRecord).filter((value): value is ConclusionRecord => Boolean(value));
      const deletes = rawDeletes.map(normalizeDeleteTarget).filter((value): value is DeleteTarget => Boolean(value));

      const requestedIds = unique([
        ...upserts.map((record) => record.estudiante_id),
        ...deletes.map((target) => target.estudiante_id),
      ]);

      const allowedIds = await resolveAllowedStudentIds(adminClient, callerId, roles, profile, gradoSeccionIds, requestedIds);
      const allowedSet = new Set(allowedIds);

      if (requestedIds.some((id) => !allowedSet.has(id))) {
        return jsonResponse({ error: "Solo puede registrar conclusiones de estudiantes autorizados" }, 403);
      }

      let upsertsSaved = 0;
      let deletesProcessed = 0;

      if (upserts.length > 0) {
        const payload = upserts.map((record) => ({ ...record, docente_user_id: callerId }));
        const { error } = await adminClient
          .from("conclusiones_inicial")
          .upsert(payload, { onConflict: "estudiante_id,area,competencia" });

        if (error) throw error;
        upsertsSaved = payload.length;
      }

      for (const target of deletes) {
        const { error } = await adminClient
          .from("conclusiones_inicial")
          .delete()
          .match({
            estudiante_id: target.estudiante_id,
            area: target.area,
            competencia: target.competencia,
          });

        if (error) throw error;
        deletesProcessed += 1;
      }

      return jsonResponse({ upserts_saved: upsertsSaved, deletes_processed: deletesProcessed }, 200);
    }

    return jsonResponse({ error: "Acción no soportada" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    console.error("inicial-conclusions error:", message);
    return jsonResponse({ error: message }, 500);
  }
});