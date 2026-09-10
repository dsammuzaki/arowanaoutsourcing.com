"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

const APPROVER_ROLES = ["super_admin", "director", "operation"];

async function auth() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: "" };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, user, role: p?.role ?? "" };
}
const writer = (supabase: ReturnType<typeof createAdminClient>) => (hasAdmin() ? createAdminClient() : supabase);

export type NewTask = {
  projectId: string;
  title: string;
  desc?: string;
  column: string;
  priority: string;
  assignee: string;
  due?: string;
  approver?: string;
};

export async function createTask(input: NewTask): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { supabase, user } = await auth();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  if (!input.title?.trim()) return { ok: false, error: "Judul tugas wajib diisi." };

  const w = writer(supabase as never);
  const { error } = await w.from("tasks").insert({
    project_id: input.projectId,
    title: input.title.trim(),
    description: input.desc ?? "",
    column_key: input.column,
    priority: input.priority,
    assignee: input.assignee,
    due_date: input.due || null,
    checklist_done: 0,
    checklist_total: 0,
    comments: 0,
    approval_status: "draft",
    approver: input.approver ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/proyek");
  return { ok: true };
}

export async function moveTask(id: string, column: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { supabase, user } = await auth();
  if (!user) return { ok: false, error: "Sesi habis." };
  const w = writer(supabase as never);
  const { error } = await w.from("tasks").update({ column_key: column }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setApproval(
  id: string,
  status: "draft" | "menunggu" | "disetujui" | "ditolak"
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { supabase, user, role } = await auth();
  if (!user) return { ok: false, error: "Sesi habis." };
  // 'menunggu' (kirim approval) boleh siapa saja login; setujui/tolak khusus approver
  if ((status === "disetujui" || status === "ditolak") && !APPROVER_ROLES.includes(role)) {
    return { ok: false, error: "Role Anda tidak berwenang menyetujui/menolak." };
  }
  const w = writer(supabase as never);
  const { error } = await w.from("tasks").update({ approval_status: status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
