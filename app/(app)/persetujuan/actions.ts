"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

const REVIEW_ROLES = ["super_admin", "operation", "director"];
// field yang boleh diubah lewat permintaan (kind 'karyawan')
const KARYAWAN_FIELDS = ["position", "branch", "bank_name", "bank_account", "npwp", "marital_status", "dependents"];

async function auth() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: "", name: "" };
  const { data: p } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  return { supabase, user, role: p?.role ?? "", name: p?.full_name ?? user.email ?? "" };
}

export type ChangeInput = {
  kind: string; // 'karyawan'
  targetId: string;
  targetLabel: string;
  payload: Record<string, string | number>;
  note?: string;
};

export async function requestChange(input: ChangeInput): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { user, role, name } = await auth();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  if (!input.payload || Object.keys(input.payload).length === 0)
    return { ok: false, error: "Tidak ada perubahan untuk diajukan." };

  const writer = hasAdmin() ? createAdminClient() : createClient(await cookies());
  const { error } = await writer.from("change_requests").insert({
    requested_by: user.id,
    requester_name: name,
    requester_role: role,
    kind: input.kind,
    target_id: input.targetId,
    target_label: input.targetLabel,
    payload: input.payload,
    note: input.note ?? null,
    status: "pending",
  });
  if (error) {
    if (/schema cache|does not exist|could not find the table|PGRST205/i.test(error.message))
      return { ok: false, error: "Tabel persetujuan belum dibuat. Jalankan supabase/schema-4.sql." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/persetujuan");
  return { ok: true };
}

export async function reviewChange(
  id: string,
  action: "disetujui" | "ditolak",
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { user, role } = await auth();
  if (!user) return { ok: false, error: "Sesi habis." };
  if (!REVIEW_ROLES.includes(role)) return { ok: false, error: "Anda tidak berwenang meninjau permintaan." };
  if (!hasAdmin()) return { ok: false, error: "Server belum dikonfigurasi." };

  const admin = createAdminClient();
  const { data: cr } = await admin.from("change_requests").select("*").eq("id", id).single();
  if (!cr) return { ok: false, error: "Permintaan tidak ditemukan." };
  if (cr.status !== "pending") return { ok: false, error: "Permintaan sudah diproses." };

  // Terapkan perubahan bila disetujui
  if (action === "disetujui") {
    if (cr.kind === "karyawan" && cr.target_id) {
      const payload = (cr.payload ?? {}) as Record<string, unknown>;
      const clean: Record<string, unknown> = {};
      for (const k of KARYAWAN_FIELDS) if (k in payload) clean[k] = payload[k];
      if (Object.keys(clean).length) {
        const { error: upErr } = await admin.from("employees").update(clean).eq("id", cr.target_id);
        if (upErr) return { ok: false, error: "Gagal menerapkan: " + upErr.message };
      }
    }
  }

  const { error } = await admin
    .from("change_requests")
    .update({ status: action, reviewed_by: user.id, reviewer_note: note ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/persetujuan");
  revalidatePath("/karyawan");
  return { ok: true };
}
