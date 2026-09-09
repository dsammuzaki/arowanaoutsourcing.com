"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

const ALLOWED_ROLES = ["super_admin", "operation"];

export async function createEmployee(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Silakan login ulang." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role ?? "";
  if (!ALLOWED_ROLES.includes(role)) {
    return { ok: false, error: "Role Anda tidak berwenang menambah karyawan (khusus Super Admin / Operation)." };
  }

  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "Nama wajib diisi." };

  const g = (k: string, d = "") => String(formData.get(k) ?? d);
  const id = "emp-" + Date.now();

  // Upload foto (opsional) via admin/storage
  let photoUrl: string | null = null;
  const photo = formData.get("photo");
  if (photo && typeof photo === "object" && "arrayBuffer" in photo && (photo as File).size > 0 && hasAdmin()) {
    try {
      const file = photo as File;
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${id}.${ext}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const admin = createAdminClient();
      const { error: upErr } = await admin.storage
        .from("avatars")
        .upload(path, buf, { contentType: file.type || "image/jpeg", upsert: true });
      if (!upErr) photoUrl = admin.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    } catch {
      // abaikan kegagalan foto — karyawan tetap dibuat
    }
  }

  const row = {
    id,
    nik: g("nik") || "ABP" + Date.now(),
    name,
    gender: g("gender", "L") === "P" ? "P" : "L",
    position: g("position"),
    client_id: g("client_id") || null,
    contract_type: g("contract_type", "staff"),
    branch: g("branch"),
    marital_status: g("marital_status", "TK") === "K" ? "K" : "TK",
    dependents: Number(g("dependents", "0")) || 0,
    npwp: g("npwp") || "-",
    bank_name: g("bank_name"),
    bank_account: g("bank_account"),
    join_date: g("join_date") || null,
    basic_salary: Number(g("basic_salary", "0")) || 0,
    status: "aktif",
    photo_url: photoUrl,
  };

  const writer = hasAdmin() ? createAdminClient() : supabase;
  const { error } = await writer.from("employees").insert(row);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/karyawan");
  return { ok: true };
}
