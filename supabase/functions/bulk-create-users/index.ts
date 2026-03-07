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
  is_pip?: boolean;
}

interface ResultItem {
  dni: string;
  nombre_completo: string;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const callerRoleList = (callerRoles || []).map((r: { role: string }) => r.role);

    // Check if caller is a PIP docente (equivalent to director)
    let isPIPDocente = false;
    if (callerRoleList.includes("docente")) {
      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("is_pip")
        .eq("user_id", caller.id)
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
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: u.email.trim().toLowerCase(),
          password,
          email_confirm: true,
          user_metadata: { dni: u.dni.trim(), nombre_completo: u.nombre_completo.trim() },
        });

        if (createError) {
          item.error = createError.message.includes("already been registered")
            ? "El correo ya está registrado"
            : createError.message;
          results.push(item);
          continue;
        }

        if (newUser.user) {
          const { error: roleError } = await adminClient
            .from("user_roles")
            .insert({ user_id: newUser.user.id, role: rol });

          if (roleError) {
            await adminClient.auth.admin.deleteUser(newUser.user.id);
            item.error = "Error al asignar rol";
            results.push(item);
            continue;
          }

          // Update profile with institucion_id, grado_seccion_id, and is_pip
          const profileUpdate: Record<string, unknown> = {};
          const instId = u.institucion_id || default_institucion_id;
          if (instId) profileUpdate.institucion_id = instId;
          // PIP docentes don't get grado_seccion_id
          if (u.grado_seccion_id && !u.is_pip) profileUpdate.grado_seccion_id = u.grado_seccion_id;
          if (u.is_pip) profileUpdate.is_pip = true;
          if (Object.keys(profileUpdate).length > 0) {
            await adminClient.from("profiles").update(profileUpdate).eq("user_id", newUser.user.id);
          }
        }

        item.success = true;
        results.push(item);
      } catch (err) {
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
