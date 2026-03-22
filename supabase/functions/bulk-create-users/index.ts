import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const ALLOWED_ROLE_MAP: Record<string, string[]> = {
  administrador: ["director", "subdirector", "docente", "estudiante", "especialista", "padre", "administrador"],
  director: ["subdirector", "docente", "estudiante"],
  subdirector: ["docente", "estudiante"],
  docente: ["estudiante"],
};

const VALID_ROLES = ["director", "subdirector", "docente", "estudiante", "especialista", "padre", "administrador"];

interface UserInput {
  dni: string;
  nombre_completo: string;
  email: string;
  rol: string;
  password: string;
  institucion_id?: string;
  grado_seccion_id?: string;
  grado_seccion_ids?: string[];
  especialidad?: string;
  is_pip?: boolean;
}

interface ResultItem {
  dni: string;
  nombre_completo: string;
  success: boolean;
  error?: string;
}

function buildProfileData(user: UserInput, defaultInstitucionId?: string) {
  const profileData: Record<string, unknown> = {
    dni: user.dni.trim(),
    nombre_completo: user.nombre_completo.trim(),
    must_change_password: true,
    is_pip: !!user.is_pip,
  };
  const institucionId = user.institucion_id || defaultInstitucionId;
  if (institucionId) profileData.institucion_id = institucionId;
  if (user.grado_seccion_id && !user.is_pip) profileData.grado_seccion_id = user.grado_seccion_id;
  if (user.especialidad) profileData.especialidad = user.especialidad;
  return profileData;
}

/** Build a DNI->profile map for quick lookups instead of listing all auth users */
async function buildDniProfileMap(adminClient: any, dnis: string[]) {
  const map = new Map<string, { user_id: string }>();
  // Batch in groups of 500
  for (let i = 0; i < dnis.length; i += 500) {
    const batch = dnis.slice(i, i + 500);
    const { data } = await adminClient
      .from("profiles")
      .select("dni, user_id")
      .in("dni", batch);
    for (const p of data || []) {
      if (p.user_id) map.set(p.dni, { user_id: p.user_id });
    }
  }
  return map;
}

async function repairIncompleteUser(
  adminClient: any,
  existingUserId: string,
  user: UserInput,
  rol: string,
  defaultInstitucionId?: string,
) {
  const { data: { user: existingAuthUser }, error: getUserErr } = await adminClient.auth.admin.getUserById(existingUserId);
  if (getUserErr || !existingAuthUser) return { repaired: false, reason: "not_found" };

  const [{ data: existingProfile }, { data: existingRoles }] = await Promise.all([
    adminClient.from("profiles").select("id, user_id").eq("user_id", existingUserId).maybeSingle(),
    adminClient.from("user_roles").select("role").eq("user_id", existingUserId),
  ]);

  const hasProfile = !!existingProfile;
  const hasRoles = (existingRoles || []).length > 0;

  if (hasProfile && hasRoles) return { repaired: false, reason: "already_complete" };

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(existingUserId, {
    email: user.email.trim().toLowerCase(),
    password: user.password.trim() || user.dni.trim(),
    user_metadata: {
      ...(existingAuthUser.user_metadata || {}),
      dni: user.dni.trim(),
      nombre_completo: user.nombre_completo.trim(),
    },
  });
  if (authUpdateError) return { repaired: false, reason: "auth_update_failed" };

  const profileData = buildProfileData(user, defaultInstitucionId);
  const profileResult = hasProfile
    ? await adminClient.from("profiles").update(profileData).eq("user_id", existingUserId)
    : await adminClient.from("profiles").insert({ user_id: existingUserId, ...profileData });

  if (profileResult.error) {
    if (profileResult.error.code === "23505") return { repaired: false, reason: "dni_taken" };
    return { repaired: false, reason: "profile_failed" };
  }

  await adminClient.from("user_roles").delete().eq("user_id", existingUserId);
  const { error: roleInsertError } = await adminClient.from("user_roles").insert({ user_id: existingUserId, role: rol });
  if (roleInsertError) return { repaired: false, reason: "role_insert_failed" };

  await adminClient.from("docente_grados").delete().eq("user_id", existingUserId);

  if (Array.isArray(user.grado_seccion_ids) && user.grado_seccion_ids.length > 0 && !user.is_pip) {
    const inserts = user.grado_seccion_ids.map((gsId: string) => ({ user_id: existingUserId, grado_seccion_id: gsId }));
    await adminClient.from("docente_grados").insert(inserts);
  }

  return { repaired: true };
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
    const { data: callerRoles } = await adminClient.from("user_roles").select("role").eq("user_id", callerId);

    const callerRoleList = (callerRoles || []).map((r: { role: string }) => r.role);

    let isPIPDocente = false;
    if (callerRoleList.includes("docente")) {
      const { data: callerProfile } = await adminClient.from("profiles").select("is_pip").eq("user_id", callerId).single();
      isPIPDocente = !!callerProfile?.is_pip;
    }

    const roleHierarchy = ["administrador", "director", "subdirector", "docente"];
    let callerBestRole = roleHierarchy.find((r) => callerRoleList.includes(r));
    if (isPIPDocente && callerBestRole === "docente") callerBestRole = "director";
    if (!callerBestRole) return jsonResponse({ error: "No tiene permisos para crear usuarios" }, 403);

    const body = await req.json();
    const { users, default_institucion_id } = body as { users: UserInput[]; default_institucion_id?: string };

    if (!Array.isArray(users) || users.length === 0) return jsonResponse({ error: "Debe enviar un arreglo de usuarios" }, 400);
    if (users.length > 2000) return jsonResponse({ error: "Máximo 2000 usuarios por lote" }, 400);

    const allowedRoles = ALLOWED_ROLE_MAP[callerBestRole] || [];

    // Pre-build DNI lookup map instead of fetching ALL auth users
    const allDnis = users.map(u => u.dni?.trim()).filter(Boolean);
    const dniProfileMap = await buildDniProfileMap(adminClient, allDnis);

    const results: ResultItem[] = [];

    for (const u of users) {
      const item: ResultItem = { dni: u.dni || "", nombre_completo: u.nombre_completo || "", success: false };

      if (!u.dni || !/^\d{8}$/.test(u.dni.trim())) { item.error = "DNI debe ser exactamente 8 dígitos"; results.push(item); continue; }
      if (!u.nombre_completo || u.nombre_completo.trim().length < 2) { item.error = "Nombre completo inválido"; results.push(item); continue; }
      if (!u.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email.trim())) { item.error = "Correo electrónico inválido"; results.push(item); continue; }

      const rol = (u.rol || "").trim().toLowerCase();
      if (!rol || !VALID_ROLES.includes(rol)) { item.error = `Rol inválido: '${u.rol}'`; results.push(item); continue; }
      if (!allowedRoles.includes(rol)) { item.error = `No tiene permisos para asignar el rol '${rol}'`; results.push(item); continue; }

      const password = u.password?.trim() || u.dni.trim();
      if (password.length < 6) { item.error = "La contraseña debe tener al menos 6 caracteres"; results.push(item); continue; }

      try {
        const normalizedEmail = u.email.trim().toLowerCase();
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { dni: u.dni.trim(), nombre_completo: u.nombre_completo.trim() },
        });

        if (createError) {
          const msg = createError.message.toLowerCase();
          if (msg.includes("already been registered") || msg.includes("already exists")) {
            // Use pre-built map for O(1) lookup instead of fetching all auth users
            const existing = dniProfileMap.get(u.dni.trim());
            if (existing) {
              const repaired = await repairIncompleteUser(adminClient, existing.user_id, u, rol, default_institucion_id);
              if (repaired.repaired) { item.success = true; results.push(item); continue; }
              item.error = repaired.reason === "dni_taken" ? "El DNI ya está registrado" : "El correo ya está registrado";
            } else {
              item.error = "El correo ya está registrado";
            }
            results.push(item);
            continue;
          }

          item.error = (msg.includes("profiles_dni_key") || msg.includes("duplicate key") || msg.includes("database error"))
            ? "El DNI ya está registrado en el sistema"
            : createError.message;
          results.push(item);
          continue;
        }

        if (newUser.user) {
          // Update the map for future lookups in this batch
          dniProfileMap.set(u.dni.trim(), { user_id: newUser.user.id });

          const { error: roleError } = await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: rol });
          if (roleError) {
            await Promise.allSettled([
              adminClient.from("docente_grados").delete().eq("user_id", newUser.user.id),
              adminClient.from("user_roles").delete().eq("user_id", newUser.user.id),
              adminClient.from("profiles").delete().eq("user_id", newUser.user.id),
              adminClient.auth.admin.deleteUser(newUser.user.id),
            ]);
            item.error = "Error al asignar rol";
            results.push(item);
            continue;
          }

          const profileUpdate = buildProfileData(u, default_institucion_id);
          await adminClient.from("profiles").update(profileUpdate).eq("user_id", newUser.user.id);

          if (Array.isArray(u.grado_seccion_ids) && u.grado_seccion_ids.length > 0 && !u.is_pip) {
            const inserts = u.grado_seccion_ids.map((gsId: string) => ({ user_id: newUser.user.id, grado_seccion_id: gsId }));
            await adminClient.from("docente_grados").insert(inserts);
          }
        }

        item.success = true;
        results.push(item);
      } catch (err) {
        console.error("Bulk create error:", err);
        item.error = "Error inesperado al crear usuario";
        results.push(item);
      }
    }

    const created = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    return jsonResponse({ results, summary: { total: results.length, created, failed } }, 200);
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
