"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

const ALLOWED = ["super_admin", "operation"];

export async function createJobPosting(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED.includes(profile?.role ?? "")) return { ok: false, error: "Role Anda tidak berwenang membuat lowongan." };

  const title = String(formData.get("title") || "").trim();
  if (!title) return { ok: false, error: "Judul lowongan wajib diisi." };

  const row = {
    id: "job-" + Date.now(),
    title,
    client_id: String(formData.get("client_id") || "") || null,
    type: String(formData.get("type") || "staff"),
    location: String(formData.get("location") || ""),
    target: Number(formData.get("target") || 1) || 1,
    applicants: 0,
    status: String(formData.get("status") || "dibuka"),
  };
  const writer = hasAdmin() ? createAdminClient() : supabase;
  const { error } = await writer.from("job_postings").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/rekrutmen");
  return { ok: true };
}
