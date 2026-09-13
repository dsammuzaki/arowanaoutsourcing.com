import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

// Catat aktivitas ke audit_log (best-effort; tidak pernah melempar error).
export async function logAudit(action: string, target?: string, detail?: string) {
  if (!isSupabaseConfigured() || !hasAdmin()) return;
  try {
    const sb = createClient(await cookies());
    const {
      data: { user },
    } = await sb.auth.getUser();
    let name = user?.email ?? "";
    let role = "";
    if (user) {
      const { data: p } = await sb.from("profiles").select("full_name, role").eq("id", user.id).single();
      name = p?.full_name || name;
      role = p?.role ?? "";
    }
    await createAdminClient().from("audit_log").insert({
      actor_id: user?.id ?? null,
      actor_name: name,
      actor_role: role,
      action,
      target: target ?? null,
      detail: detail ?? null,
    });
  } catch {
    /* abaikan */
  }
}
