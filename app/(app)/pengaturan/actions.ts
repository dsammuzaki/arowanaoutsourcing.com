"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";
import type { PayrollConfig } from "@/lib/data";

const ALLOWED = ["super_admin", "operation", "finance", "director"];

export async function saveSettings(data: PayrollConfig): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const sb = createClient(await cookies());
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED.includes(p?.role ?? "")) return { ok: false, error: "Anda tidak berwenang mengubah pengaturan." };

  const writer = hasAdmin() ? createAdminClient() : sb;
  const { error } = await writer.from("app_settings").upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) {
    if (/schema cache|does not exist|PGRST205/i.test(error.message))
      return { ok: false, error: "Tabel app_settings belum dibuat. Jalankan schema-5.sql." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/pengaturan");
  revalidatePath("/payroll");
  revalidatePath("/pencairan");
  revalidatePath("/bpjs");
  return { ok: true };
}
