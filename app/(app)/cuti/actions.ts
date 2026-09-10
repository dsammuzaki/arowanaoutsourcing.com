"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

const APPROVER_ROLES = ["super_admin", "director", "operation"];

async function getAuth() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: "" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, user, role: profile?.role ?? "" };
}

function daysBetween(a: string, b: string) {
  const d = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
  return d > 0 ? d : 1;
}

export async function createLeave(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { supabase, user } = await getAuth();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };

  const employee_id = String(formData.get("employee_id") || "");
  const type = String(formData.get("type") || "Tahunan");
  const start_date = String(formData.get("start_date") || "");
  const end_date = String(formData.get("end_date") || "");
  const reason = String(formData.get("reason") || "");
  if (!employee_id || !start_date || !end_date) return { ok: false, error: "Karyawan & tanggal wajib diisi." };

  const row = {
    employee_id,
    type,
    start_date,
    end_date,
    days: daysBetween(start_date, end_date),
    reason,
    status: "pending",
  };
  const writer = hasAdmin() ? createAdminClient() : supabase;
  const { error } = await writer.from("leave_applications").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/cuti");
  return { ok: true };
}

export async function updateLeaveStatus(
  id: string,
  status: "disetujui" | "ditolak"
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { supabase, user, role } = await getAuth();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  if (!APPROVER_ROLES.includes(role)) {
    return { ok: false, error: "Role Anda tidak berwenang menyetujui/menolak cuti." };
  }
  const writer = hasAdmin() ? createAdminClient() : supabase;
  const { error } = await writer.from("leave_applications").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/cuti");
  return { ok: true };
}
