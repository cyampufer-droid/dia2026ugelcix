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

    const isAdmin = (callerRoles || []).some((r: { role: string }) => r.role === "administrador");
    if (!isAdmin) return jsonResponse({ error: "Solo administradores" }, 403);

    const body = await req.json();
    const { action, user_id } = body;

    if (!user_id || typeof user_id !== "string") {
      return jsonResponse({ error: "user_id requerido" }, 400);
    }

    // Prevent self-deletion
    if (action === "delete" && user_id === caller.id) {
      return jsonResponse({ error: "No puede eliminarse a sí mismo" }, 400);
    }

    if (action === "update") {
      const { email, dni, nombre_completo, role, password } = body;

      // Update auth user
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

      // Update profile
      const profileUpdate: any = {};
      if (dni) profileUpdate.dni = dni.trim();
      if (nombre_completo) profileUpdate.nombre_completo = nombre_completo.trim();
      if (Object.keys(profileUpdate).length > 0) {
        await adminClient.from("profiles").update(profileUpdate).eq("user_id", user_id);
      }

      // Update role
      if (role) {
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        await adminClient.from("user_roles").insert({ user_id, role });
      }

      return jsonResponse({ success: true }, 200);
    }

    if (action === "delete") {
      // Delete role, profile will cascade via trigger or we delete manually
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      await adminClient.from("profiles").delete().eq("user_id", user_id);
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
      if (deleteError) {
        console.error("Delete error:", deleteError.message);
        return jsonResponse({ error: "Error al eliminar usuario" }, 400);
      }
      return jsonResponse({ success: true }, 200);
    }

    return jsonResponse({ error: "Acción no válida" }, 400);
  } catch (err) {
    console.error("Error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
