"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

async function writer() {
  const sb = createClient(await cookies());
  const {
    data: { user },
  } = await sb.auth.getUser();
  return { w: hasAdmin() ? createAdminClient() : sb, user };
}

export async function createGoal(input: {
  title: string;
  employeeName: string;
  due: string;
  progress: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { w, user } = await writer();
  if (!user) return { ok: false, error: "Sesi habis." };
  if (!input.title?.trim()) return { ok: false, error: "Judul goal wajib diisi." };
  const { error } = await w.from("goals").insert({
    title: input.title.trim(),
    employee_name: input.employeeName || null,
    due_date: input.due || null,
    progress: Math.max(0, Math.min(100, Number(input.progress) || 0)),
  });
  if (error) {
    if (/schema cache|does not exist|PGRST205/i.test(error.message))
      return { ok: false, error: "Tabel goals belum dibuat. Jalankan schema-6.sql." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/kinerja");
  return { ok: true };
}

export async function updateGoalProgress(id: string, progress: number): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { w, user } = await writer();
  if (!user) return { ok: false, error: "Sesi habis." };
  const { error } = await w
    .from("goals")
    .update({ progress: Math.max(0, Math.min(100, Number(progress) || 0)) })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/kinerja");
  return { ok: true };
}
