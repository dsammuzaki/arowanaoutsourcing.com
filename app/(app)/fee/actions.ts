"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

const ALLOWED = ["super_admin", "finance"];

export async function createFee(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED.includes(profile?.role ?? "")) return { ok: false, error: "Role Anda tidak berwenang mencatat fee (khusus Finance/Super Admin)." };

  const recipient = String(formData.get("recipient") || "").trim();
  const base = Number(formData.get("base") || 0);
  const feePct = Number(formData.get("fee_pct") || 0);
  if (!recipient) return { ok: false, error: "Nama penerima wajib diisi." };
  if (!base || base <= 0) return { ok: false, error: "Dasar (MF neto) harus diisi." };

  const row = {
    recipient,
    client_id: String(formData.get("client_id") || "") || null,
    period: String(formData.get("period") || "Agustus 2026"),
    base,
    fee_pct: feePct,
    total: Math.round((base * feePct) / 100),
    status: "pending",
  };
  const writer = hasAdmin() ? createAdminClient() : supabase;
  const { error } = await writer.from("referral_fees").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fee");
  return { ok: true };
}
