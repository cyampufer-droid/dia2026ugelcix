import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTH_LIST_PAGE_SIZE = 1000;

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

async function listAllAuthUsers(adminClient: any) {
  const users: any[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: AUTH_LIST_PAGE_SIZE,
    });

    if (error) throw error;

    const batch = data.users || [];
    users.push(...batch);

    if (batch.length < AUTH_LIST_PAGE_SIZE) break;
    page += 1;
  }

  return users;
}

async function repairIncompleteUser(
  adminClient: any,
  authUserByEmail: Map<string, any>,
  user: UserInput,
  rol: string,
  defaultInstitucionId?: string,
) {
  const normalizedEmail = user.email.trim().toLowerCase();
  const existingAuthUser = authUserByEmail.get(normalizedEmail);

  if (!existingAuthUser) {
    return { repaired: false, reason: "not_found" };
  }

  const [{ data: existingProfile, error: profileReadError }, { data: existingRoles, error: rolesReadError }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, user_id")
      .eq("user_id", existingAuthUser.id)
      .maybeSingle(),
    adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", existingAuthUser.id),
  ]);

  if (profileReadError) throw profileReadError;
  if (rolesReadError) throw rolesReadError;

  const hasProfile = !!existingProfile;
  const hasRoles = (existingRoles || []).length > 0;

  if (hasProfile && hasRoles) {
    return { repaired: false, reason: "already_complete" };
  }

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
    email: normalizedEmail,
    password: user.password.trim() || user.dni.trim(),
    user_metadata: {
      ...(existingAuthUser.user_metadata || {}),
      dni: user.dni.trim(),
      nombre_completo: user.nombre_completo.trim(),
    },
  });

  if (authUpdateError) {
    console.error("Bulk repair auth update error:", authUpdateError.message);
    return { repaired: false, reason: "auth_update_failed" };
  }

  const profileData = buildProfileData(user, defaultInstitucionId);
  const profileResult = hasProfile
    ? await adminClient.from("profiles").update(profileData).eq("user_id", existingAuthUser.id)
    : await adminClient.from("profiles").insert({ user_id: existingAuthUser.id, ...profileData });

  if (profileResult.error) {
    console.error("Bulk repair profile error:", profileResult.error.message);
    if (profileResult.error.code === "23505") {
      return { repaired: false, reason: "dni_taken" };
    }
    return { repaired: false, reason: "profile_failed" };
  }

  const { error: deleteRolesError } = await adminClient.from("user_roles").delete().eq("user_id", existingAuthUser.id);
  if (deleteRolesError) {
    console.error("Bulk repair role cleanup error:", deleteRolesError.message);
    return { repaired: false, reason: "role_cleanup_failed" };
  }

  const { error: roleInsertError } = await adminClient
    .from("user_roles")
    .insert({ user_id: existingAuthUser.id, role: rol });

  if (roleInsertError) {
    console.error("Bulk repair role insert error:", roleInsertError.message);
    return { repaired: false, reason: "role_insert_failed" };
  }

  const { error: clearDocenteGradosError } = await adminClient
    .from("docente_grados")
    .delete()
    .eq("user_id", existingAuthUser.id);

  if (clearDocenteGradosError) {
    console.error("Bulk repair docente_grados cleanup error:", clearDocenteGradosError.message);
  }

  if (Array.isArray(user.grado_seccion_ids) && user.grado_seccion_ids.length > 0 && !user.is_pip) {
    const inserts = user.grado_seccion_ids.map((gsId: string) => ({
      user_id: existingAuthUser.id,
      grado_seccion_id: gsId,
    }));

    const { error: docenteGradosError } = await adminClient.from("docente_grados").insert(inserts);
    if (docenteGradosError) {
      console.error("Bulk repair docente_grados insert error:", docenteGradosError.message);
      return { repaired: false, reason: "docente_grados_failed" };
    }
  }

  authUserByEmail.set(normalizedEmail, {
    ...existingAuthUser,
    email: normalizedEmail,
    user_metadata: {
      ...(existingAuthUser.user_metadata || {}),
      dni: user.dni.trim(),
      nombre_completo: user.nombre_completo.trim(),
    },
  });

  return { repaired: true };
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const callerId = claimsData.claims.sub as string;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    const callerRoleList = (callerRoles || []).map((r: { role: string }) => r.role);

    // Check if caller is a PIP docente (equivalent to director)
    let isPIPDocente = false;
    if (callerRoleList.includes("docente")) {
      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("is_pip")
        .eq("user_id", callerId)
        .single();
      isPIPDocente = !!callerProfile?.is_pip;
    }

    const roleHierarchy = ["administrador", "director", "subdirector", "docente"];
    let callerBestRole = roleHierarchy.find((r) => callerRoleList.includes(r));
    if (isPIPDocente && callerBestRole === "docente") {
      callerBestRole = "director";
    }
    if (!callerBestRole) {
      return jsonResponse({ error: "No tiene permisos para crear usuarios" }, 403);
    }

    const body = await req.json();
    const { users, default_institucion_id } = body as { users: UserInput[]; default_institucion_id?: string };

    if (!Array.isArray(users) || users.length === 0) {
      return jsonResponse({ error: "Debe enviar un arreglo de usuarios" }, 400);
    }

    if (users.length > 2000) {
      return jsonResponse({ error: "Máximo 2000 usuarios por lote" }, 400);
    }

    const allowedRoles = ALLOWED_ROLE_MAP[callerBestRole] || [];
    const results: ResultItem[] = [];
    const authUsers = await listAllAuthUsers(adminClient);
    const authUserByEmail = new Map(authUsers.map((user: any) => [user.email?.toLowerCase(), user]));

    for (const u of users) {
      const item: ResultItem = { dni: u.dni || "", nombre_completo: u.nombre_completo || "", success: false };

      // Validate fields
      if (!u.dni || !/^\d{8}$/.test(u.dni.trim())) {
        item.error = "DNI debe ser exactamente 8 dígitos";
        results.push(item);
        continue;
      }
      if (!u.nombre_completo || u.nombre_completo.trim().length < 2) {
        item.error = "Nombre completo inválido";
        results.push(item);
        continue;
      }
      if (!u.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email.trim())) {
        item.error = "Correo electrónico inválido";
        results.push(item);
        continue;
      }

      const rol = (u.rol || "").trim().toLowerCase();
      if (!rol || !VALID_ROLES.includes(rol)) {
        item.error = `Rol inválido: '${u.rol}'. Roles válidos: ${VALID_ROLES.join(", ")}`;
        results.push(item);
        continue;
      }
      if (!allowedRoles.includes(rol)) {
        item.error = `No tiene permisos para asignar el rol '${rol}'`;
        results.push(item);
        continue;
      }

      const password = u.password?.trim() || u.dni.trim();
      if (password.length < 6) {
        item.error = "La contraseña debe tener al menos 6 caracteres";
        results.push(item);
        continue;
      }

      try {
        const normalizedEmail = u.email.trim().toLowerCase();
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { dni: u.dni.trim(), nombre_completo: u.nombre_completo.trim() },
        });

        if (createError) {
          const createErrorMessage = createError.message.toLowerCase();

          if (createErrorMessage.includes("already been registered") || createErrorMessage.includes("already exists")) {
            const repaired = await repairIncompleteUser(adminClient, authUserByEmail, u, rol, default_institucion_id);

            if (repaired.repaired) {
              item.success = true;
              results.push(item);
              continue;
            }

            item.error = repaired.reason === "dni_taken"
              ? "El DNI ya está registrado en el sistema"
              : "El correo ya está registrado";
            results.push(item);
            continue;
          }

          item.error = createErrorMessage.includes("profiles_dni_key") || createErrorMessage.includes("duplicate key") || createErrorMessage.includes("database error")
            ? "El DNI ya está registrado en el sistema"
            : createError.message;
          results.push(item);
          continue;
        }

        if (newUser.user) {
          authUserByEmail.set(normalizedEmail, newUser.user);

          const { error: roleError } = await adminClient
            .from("user_roles")
            .insert({ user_id: newUser.user.id, role: rol });

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

          // Update profile with institucion_id, grado_seccion_id, especialidad, and is_pip
          const profileUpdate = buildProfileData(u, default_institucion_id);
          await adminClient.from("profiles").update(profileUpdate).eq("user_id", newUser.user.id);

          // Insert multiple grado_seccion assignments for secondary teachers
          if (Array.isArray(u.grado_seccion_ids) && u.grado_seccion_ids.length > 0 && !u.is_pip) {
            const inserts = u.grado_seccion_ids.map((gsId: string) => ({
              user_id: newUser.user.id,
              grado_seccion_id: gsId,
            }));
            await adminClient.from("docente_grados").insert(inserts);
          }
        }

        item.success = true;
        results.push(item);
      } catch (err) {
        console.error("Bulk create unexpected error:", err);
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