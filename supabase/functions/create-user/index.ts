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

// Allowed role assignments per caller role
const ALLOWED_ROLE_MAP: Record<string, string[]> = {
  administrador: ["director", "subdirector", "docente", "estudiante", "especialista", "padre", "administrador"],
  director: ["subdirector", "docente", "estudiante"],
  subdirector: ["docente", "estudiante"],
  docente: ["estudiante"],
};

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
    const roleHierarchy = ["administrador", "director", "subdirector", "docente"];
    const callerBestRole = roleHierarchy.find((r) => callerRoleList.includes(r));
    if (!callerBestRole) {
      return jsonResponse({ error: "No tiene permisos para crear usuarios" }, 403);
    }

    const body = await req.json();
    const { email, password, dni, nombre_completo, role, institucion_id, grado_seccion_id } = body;

    if (!email || !password || !dni || !nombre_completo) {
      return jsonResponse({ error: "Faltan campos obligatorios" }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== "string" || !emailRegex.test(email) || email.length > 255) {
      return jsonResponse({ error: "Correo electrónico inválido" }, 400);
    }

    if (typeof dni !== "string" || !/^\d{8}$/.test(dni)) {
      return jsonResponse({ error: "DNI debe ser exactamente 8 dígitos" }, 400);
    }

    if (typeof nombre_completo !== "string" || nombre_completo.trim().length < 2 || nombre_completo.length > 200) {
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
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { dni: dni.trim(), nombre_completo: nombre_completo.trim() },
    });

    if (createError) {
      console.error("User creation error:", createError.message);
      return jsonResponse({ error: "No se pudo crear el usuario. Verifique que el correo no esté registrado." }, 400);
    }

    if (role && newUser.user) {
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role });

      if (roleError) {
        console.error("Role assignment error:", roleError.message);
        await adminClient.auth.admin.deleteUser(newUser.user.id);
        return jsonResponse({ error: "Error al asignar rol. Intente nuevamente." }, 500);
      }
    }

    // Update profile with institucion_id and grado_seccion_id if provided
    if (newUser.user && (institucion_id || grado_seccion_id)) {
      const updateData: Record<string, string> = {};
      if (institucion_id) updateData.institucion_id = institucion_id;
      if (grado_seccion_id) updateData.grado_seccion_id = grado_seccion_id;

      const { error: profileError } = await adminClient
        .from("profiles")
        .update(updateData)
        .eq("user_id", newUser.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError.message);
      }
    }

    return jsonResponse({ user: { id: newUser.user?.id, email: newUser.user?.email } }, 200);
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
