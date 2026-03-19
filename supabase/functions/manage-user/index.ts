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
    if (!authHeader) return jsonResponse({ error: "No autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) return jsonResponse({ error: "No autorizado" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const roles = (callerRoles || []).map((r: { role: string }) => r.role);
    const isAdmin = roles.includes("administrador");
    let isDirector = roles.includes("director") || roles.includes("subdirector");
    const isDocente = roles.includes("docente");

    // Check if caller is a PIP docente (equivalent to director)
    if (!isAdmin && !isDirector && isDocente) {
      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("is_pip")
        .eq("user_id", caller.id)
        .single();
      if (callerProfile?.is_pip) isDirector = true;
    }

    if (!isAdmin && !isDirector && !isDocente) {
      return jsonResponse({ error: "No tiene permisos para esta acción" }, 403);
    }

    const body = await req.json();
    const { action, user_id } = body;

    if (!user_id || typeof user_id !== "string") {
      return jsonResponse({ error: "user_id requerido" }, 400);
    }

    // Prevent self-modification/deletion
    if (user_id === caller.id) {
      return jsonResponse({ error: "No puede modificarse a sí mismo" }, 400);
    }

    // Non-admin authorization checks
    if (!isAdmin) {
      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("institucion_id, grado_seccion_id")
        .eq("user_id", caller.id)
        .single();

      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("institucion_id, grado_seccion_id")
        .eq("user_id", user_id)
        .single();

      // Verify target is a student
      const { data: targetRoles } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id);
      const targetRoleList = (targetRoles || []).map((r: { role: string }) => r.role);

      if (isDirector) {
        // Directors: same institution, target cannot be admin/director/especialista
        if (!callerProfile?.institucion_id) {
          return jsonResponse({ error: "No tiene una institución asociada" }, 400);
        }
        if (!targetProfile || targetProfile.institucion_id !== callerProfile.institucion_id) {
          return jsonResponse({ error: "Solo puede gestionar personal de su institución" }, 403);
        }
        if (targetRoleList.includes("administrador") || targetRoleList.includes("director") || targetRoleList.includes("especialista")) {
          return jsonResponse({ error: "No tiene permisos para gestionar este usuario" }, 403);
        }
      } else if (isDocente) {
        // Docentes: can only manage students in their own grado_seccion
        if (!targetRoleList.includes("estudiante")) {
          return jsonResponse({ error: "Solo puede gestionar estudiantes" }, 403);
        }
        // Check caller's grado_seccion_ids (primary + docente_grados)
        const gradoIds: string[] = [];
        if (callerProfile?.grado_seccion_id) gradoIds.push(callerProfile.grado_seccion_id);
        const { data: docenteGrados } = await adminClient
          .from("docente_grados")
          .select("grado_seccion_id")
          .eq("user_id", caller.id);
        for (const dg of docenteGrados || []) gradoIds.push(dg.grado_seccion_id);

        if (gradoIds.length === 0 || !targetProfile?.grado_seccion_id || !gradoIds.includes(targetProfile.grado_seccion_id)) {
          return jsonResponse({ error: "Solo puede gestionar estudiantes de su aula" }, 403);
        }
      }
    }

    if (action === "update") {
      const { email, dni, nombre_completo, role, password } = body;

      const updateData: any = {};
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || email.length > 255) {
          return jsonResponse({ error: "Correo electrónico inválido" }, 400);
        }
        updateData.email = email.trim().toLowerCase();
      }
      if (password) {
        if (password.length < 6 || password.length > 128) {
          return jsonResponse({ error: "La contraseña debe tener entre 6 y 128 caracteres" }, 400);
        }
        updateData.password = password;
      }

      const metaUpdate: any = {};
      if (dni) {
        if (!/^\d{8}$/.test(dni)) return jsonResponse({ error: "DNI debe ser exactamente 8 dígitos" }, 400);
        metaUpdate.dni = dni.trim();
      }
      if (nombre_completo) {
        if (nombre_completo.trim().length < 2 || nombre_completo.length > 200) {
          return jsonResponse({ error: "Nombre completo inválido" }, 400);
        }
        metaUpdate.nombre_completo = nombre_completo.trim();
      }
      if (Object.keys(metaUpdate).length > 0) {
        updateData.user_metadata = metaUpdate;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(user_id, updateData);
        if (updateError) {
          console.error("Update auth error:", updateError.message);
          return jsonResponse({ error: "Error al actualizar usuario" }, 400);
        }
      }

      const profileUpdate: any = {};
      if (dni) profileUpdate.dni = dni.trim();
      if (nombre_completo) profileUpdate.nombre_completo = nombre_completo.trim();
      if (Object.keys(profileUpdate).length > 0) {
        await adminClient.from("profiles").update(profileUpdate).eq("user_id", user_id);
      }

      if (role) {
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        await adminClient.from("user_roles").insert({ user_id, role });
      }

      return jsonResponse({ success: true }, 200);
    }

    if (action === "delete") {
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("user_id", user_id)
        .single();

      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      if (targetProfile?.id) {
        await adminClient.from("resultados").delete().eq("estudiante_id", targetProfile.id);
      }
      await adminClient.from("profiles").delete().eq("user_id", user_id);
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
      if (deleteError && !deleteError.message.includes("not found")) {
        console.error("Delete error:", deleteError.message);
        return jsonResponse({ error: "Error al eliminar usuario" }, 400);
      }
      return jsonResponse({ success: true }, 200);
    }

    if (action === "reset-password") {
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("dni")
        .eq("user_id", user_id)
        .single();

      if (!targetProfile?.dni) {
        return jsonResponse({ error: "No se encontró el DNI del usuario" }, 400);
      }

      const { error: resetError } = await adminClient.auth.admin.updateUserById(user_id, {
        password: targetProfile.dni,
      });
      if (resetError) {
        return jsonResponse({ error: "Error al resetear contraseña" }, 400);
      }

      await adminClient
        .from("profiles")
        .update({ must_change_password: true })
        .eq("user_id", user_id);

      return jsonResponse({ success: true }, 200);
    }

    return jsonResponse({ error: "Acción no válida" }, 400);
  } catch (err) {
    console.error("Error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
