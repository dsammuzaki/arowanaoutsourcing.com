"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

const ROLES = ["super_admin", "operation", "director", "finance", "hr_pic", "customer"] as const;
type Role = (typeof ROLES)[number];

async function requireSuperAdmin() {
  if (!isSupabaseConfigured()) return { ok: false as const, error: "Supabase belum aktif." };
  if (!hasAdmin()) return { ok: false as const, error: "SUPABASE_SECRET_KEY belum diset di server." };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sesi habis. Login ulang." };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "super_admin")
    return { ok: false as const, error: "Hanya Super Admin yang boleh mengelola akun." };
  return { ok: true as const, admin: createAdminClient(), meId: user.id };
}

export type NewAccount = {
  email: string;
  password: string;
  fullName: string;
  role: string;
};

export async function createAccount(input: NewAccount): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;
  const email = input.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, error: "Email tidak valid." };
  if (!input.password || input.password.length < 8)
    return { ok: false, error: "Password minimal 8 karakter." };
  const role = (ROLES.includes(input.role as Role) ? input.role : "operation") as Role;

  const { data, error } = await gate.admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName?.trim() || email.split("@")[0] },
  });
  if (error) return { ok: false, error: error.message };

  const uid = data.user?.id;
  if (uid) {
    const { error: pErr } = await gate.admin.from("profiles").upsert({
      id: uid,
      full_name: input.fullName?.trim() || email.split("@")[0],
      role,
    });
    if (pErr) return { ok: false, error: "Akun dibuat tapi profil gagal: " + pErr.message };
  }
  revalidatePath("/akun");
  return { ok: true };
}

export async function updateRole(id: string, role: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;
  if (id === gate.meId) return { ok: false, error: "Tidak bisa mengubah role akun sendiri." };
  if (!ROLES.includes(role as Role)) return { ok: false, error: "Role tidak dikenal." };
  const { error } = await gate.admin.from("profiles").update({ role }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/akun");
  return { ok: true };
}

export async function deleteAccount(id: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;
  if (id === gate.meId) return { ok: false, error: "Tidak bisa menghapus akun sendiri." };
  const { error } = await gate.admin.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };
  // profil ikut terhapus lewat ON DELETE CASCADE
  revalidatePath("/akun");
  return { ok: true };
}

// Ubah nama & role akun sekaligus
export async function updateAccount(
  id: string,
  input: { fullName: string; role: string }
): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;
  const fullName = input.fullName?.trim();
  if (!fullName) return { ok: false, error: "Nama tidak boleh kosong." };
  const role = (ROLES.includes(input.role as Role) ? input.role : "operation") as Role;

  // role akun sendiri tidak boleh diubah (hindari mengunci diri)
  const profilePatch: Record<string, string> = { full_name: fullName };
  if (id !== gate.meId) profilePatch.role = role;

  const { error } = await gate.admin.from("profiles").update(profilePatch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  // selaraskan nama di metadata auth
  try {
    await gate.admin.auth.admin.updateUserById(id, { user_metadata: { full_name: fullName } });
  } catch {
    /* abaikan */
  }
  revalidatePath("/akun");
  return { ok: true };
}

// Setel ulang password (password lama TIDAK bisa dilihat — tersimpan sebagai hash)
export async function resetPassword(id: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;
  if (!password || password.length < 8) return { ok: false, error: "Password minimal 8 karakter." };
  const { error } = await gate.admin.auth.admin.updateUserById(id, { password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
