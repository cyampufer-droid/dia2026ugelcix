import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
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
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) return jsonResponse({ error: "No autorizado" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is director or subdirector
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleList = (callerRoles || []).map((r: { role: string }) => r.role);
    const isDirectorOrSub = roleList.includes("director") || roleList.includes("subdirector");
    if (!isDirectorOrSub) {
      return jsonResponse({ error: "Solo directores y subdirectores pueden usar esta función" }, 403);
    }

    const { action, grado_seccion_id } = await req.json();

    if (action === "activate") {
      // Add docente role if not already present
      if (!roleList.includes("docente")) {
        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: user.id, role: "docente" });
        if (roleError) {
          console.error("Role insert error:", roleError.message);
          return jsonResponse({ error: "Error al asignar rol docente" }, 500);
        }
      }

      // Update grado_seccion_id in profile
      if (grado_seccion_id) {
        const { error: profileError } = await adminClient
          .from("profiles")
          .update({ grado_seccion_id })
          .eq("user_id", user.id);
        if (profileError) {
          console.error("Profile update error:", profileError.message);
          return jsonResponse({ error: "Error al asignar aula" }, 500);
        }
      }

      return jsonResponse({ success: true, message: "Rol docente activado" }, 200);

    } else if (action === "deactivate") {
      // Remove docente role
      const { error: deleteError } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", user.id)
        .eq("role", "docente");
      if (deleteError) {
        console.error("Role delete error:", deleteError.message);
        return jsonResponse({ error: "Error al remover rol docente" }, 500);
      }

      // Clear grado_seccion_id
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ grado_seccion_id: null })
        .eq("user_id", user.id);
      if (profileError) {
        console.error("Profile update error:", profileError.message);
      }

      return jsonResponse({ success: true, message: "Rol docente desactivado" }, 200);

    } else {
      return jsonResponse({ error: "Acción inválida. Use 'activate' o 'deactivate'" }, 400);
    }
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});
