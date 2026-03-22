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

interface RepairParams {
  dni: string;
  nombre_completo: string;
  email: string;
  password: string;
  role?: string;
  institucion_id?: string;
  grado_seccion_id?: string;
  grado_seccion_ids?: string[];
  especialidad?: string;
  is_pip?: boolean;
}

function buildProfileData(params: RepairParams) {
  const profileData: Record<string, unknown> = {
    dni: params.dni.trim(),
    nombre_completo: params.nombre_completo.trim(),
    must_change_password: true,
  };
  if (params.institucion_id) profileData.institucion_id = params.institucion_id;
  if (params.grado_seccion_id && !params.is_pip) profileData.grado_seccion_id = params.grado_seccion_id;
  if (params.especialidad) profileData.especialidad = params.especialidad;
  profileData.is_pip = !!params.is_pip;
  return profileData;
}

/** Find existing auth user by DNI via profiles table - O(1) instead of listing all users */
async function findAuthUserByDni(adminClient: any, dni: string) {
  const { data: profile } = await adminClient
    .from("profiles")
    .select("user_id")
    .eq("dni", dni.trim())
    .maybeSingle();

  if (!profile?.user_id) return null;

  const { data: { user }, error } = await adminClient.auth.admin.getUserById(profile.user_id);
  if (error || !user) return null;
  return user;
}

async function repairIncompleteUser(adminClient: any, params: RepairParams) {
  // Look up by DNI (fast) instead of listing all auth users
  const existingAuthUser = await findAuthUserByDni(adminClient, params.dni);

  if (!existingAuthUser) {
    return { repaired: false, reason: "not_found" };
  }

  const [{ data: existingProfile, error: profileReadError }, { data: existingRoles, error: rolesReadError }] = await Promise.all([
    adminClient.from("profiles").select("id, user_id").eq("user_id", existingAuthUser.id).maybeSingle(),
    adminClient.from("user_roles").select("role").eq("user_id", existingAuthUser.id),
  ]);

  if (profileReadError) throw profileReadError;
  if (rolesReadError) throw rolesReadError;

  const hasProfile = !!existingProfile;
  const hasRoles = (existingRoles || []).length > 0;

  if (hasProfile && hasRoles) {
    return { repaired: false, reason: "already_complete" };
  }

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
    email: params.email.trim().toLowerCase(),
    password: params.password,
    user_metadata: {
      ...(existingAuthUser.user_metadata || {}),
      dni: params.dni.trim(),
      nombre_completo: params.nombre_completo.trim(),
    },
  });

  if (authUpdateError) {
    console.error("Repair auth update error:", authUpdateError.message);
    return { repaired: false, reason: "auth_update_failed" };
  }

  const profileData = buildProfileData(params);
  const profileResult = hasProfile
    ? await adminClient.from("profiles").update(profileData).eq("user_id", existingAuthUser.id)
    : await adminClient.from("profiles").insert({ user_id: existingAuthUser.id, ...profileData });

  if (profileResult.error) {
    console.error("Repair profile error:", profileResult.error.message);
    if (profileResult.error.code === "23505") {
      return { repaired: false, reason: "dni_taken" };
    }
    return { repaired: false, reason: "profile_failed" };
  }

  if (params.role) {
    const { error: deleteRolesError } = await adminClient.from("user_roles").delete().eq("user_id", existingAuthUser.id);
    if (deleteRolesError) {
      console.error("Repair role cleanup error:", deleteRolesError.message);
      return { repaired: false, reason: "role_cleanup_failed" };
    }
    const { error: insertRoleError } = await adminClient.from("user_roles").insert({ user_id: existingAuthUser.id, role: params.role });
    if (insertRoleError) {
      console.error("Repair role insert error:", insertRoleError.message);
      return { repaired: false, reason: "role_insert_failed" };
    }
  }

  await adminClient.from("docente_grados").delete().eq("user_id", existingAuthUser.id);

  if (Array.isArray(params.grado_seccion_ids) && params.grado_seccion_ids.length > 0 && !params.is_pip) {
    const inserts = params.grado_seccion_ids.map((gsId: string) => ({
      user_id: existingAuthUser.id,
      grado_seccion_id: gsId,
    }));
    const { error: docenteGradosError } = await adminClient.from("docente_grados").insert(inserts);
    if (docenteGradosError) {
      console.error("Repair docente_grados insert error:", docenteGradosError.message);
      return { repaired: false, reason: "docente_grados_failed" };
    }
  }

  return { repaired: true, user: { id: existingAuthUser.id, email: existingAuthUser.email } };
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
    const { email, password, dni, nombre_completo, role, institucion_id, grado_seccion_id, grado_seccion_ids, especialidad, is_pip } = body;

    if (!email || !password || !dni || !nombre_completo) {
      return jsonResponse({ error: "Faltan campos obligatorios" }, 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedDni = String(dni).trim();
    const normalizedName = String(nombre_completo).trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 255) {
      return jsonResponse({ error: "Correo electrónico inválido" }, 400);
    }
    if (!/^\d{8}$/.test(normalizedDni)) {
      return jsonResponse({ error: "DNI debe ser exactamente 8 dígitos" }, 400);
    }
    if (normalizedName.length < 2 || normalizedName.length > 200) {
      return jsonResponse({ error: "Nombre completo inválido" }, 400);
    }
    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      return jsonResponse({ error: "La contraseña debe tener entre 6 y 128 caracteres" }, 400);
    }

    if (role) {
      const allowedRoles = ALLOWED_ROLE_MAP[callerBestRole] || [];
      if (!allowedRoles.includes(role)) {
        return jsonResponse({ error: `No tiene permisos para asignar el rol '${role}'` }, 403);
      }
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { dni: normalizedDni, nombre_completo: normalizedName },
    });

    if (createError) {
      console.error("User creation error:", createError.message);
      const msg = createError.message.toLowerCase();

      if (msg.includes("already been registered") || msg.includes("already exists")) {
        const repaired = await repairIncompleteUser(adminClient, {
          email: normalizedEmail, password, dni: normalizedDni, nombre_completo: normalizedName,
          role, institucion_id, grado_seccion_id, grado_seccion_ids, especialidad, is_pip,
        });

        if (repaired.repaired) return jsonResponse({ user: repaired.user, repaired: true }, 200);
        if (repaired.reason === "dni_taken") return jsonResponse({ error: "El DNI ya está registrado en el sistema." }, 400);
        return jsonResponse({ error: "El correo electrónico ya está registrado." }, 400);
      }

      if (msg.includes("profiles_dni_key") || msg.includes("duplicate key") || msg.includes("database error")) {
        return jsonResponse({ error: "El DNI ya está registrado en el sistema." }, 400);
      }
      return jsonResponse({ error: `No se pudo crear el usuario. ${createError.message}` }, 400);
    }

    if (role && newUser.user) {
      const { error: roleError } = await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role });
      if (roleError) {
        console.error("Role assignment error:", roleError.message);
        await Promise.allSettled([
          adminClient.from("docente_grados").delete().eq("user_id", newUser.user.id),
          adminClient.from("user_roles").delete().eq("user_id", newUser.user.id),
          adminClient.from("profiles").delete().eq("user_id", newUser.user.id),
          adminClient.auth.admin.deleteUser(newUser.user.id),
        ]);
        return jsonResponse({ error: "Error al asignar rol. Intente nuevamente." }, 500);
      }
    }

    if (newUser.user) {
      const updateData: Record<string, unknown> = {};
      if (institucion_id) updateData.institucion_id = institucion_id;
      if (grado_seccion_id && !is_pip) updateData.grado_seccion_id = grado_seccion_id;
      if (especialidad) updateData.especialidad = especialidad;
      updateData.is_pip = !!is_pip;
      updateData.must_change_password = true;

      if (Object.keys(updateData).length > 0) {
        await adminClient.from("profiles").update(updateData).eq("user_id", newUser.user.id);
      }

      if (Array.isArray(grado_seccion_ids) && grado_seccion_ids.length > 0 && !is_pip) {
        const inserts = grado_seccion_ids.map((gsId: string) => ({ user_id: newUser.user.id, grado_seccion_id: gsId }));
        await adminClient.from("docente_grados").insert(inserts);
      }
    }

    return jsonResponse({ user: { id: newUser.user?.id, email: newUser.user?.email } }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unexpected error:", message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
