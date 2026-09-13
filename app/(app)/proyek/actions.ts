"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";
import { sendEmail, emailHtml, getEmailsByRoles, getUserEmail } from "@/lib/email";
import { canManageTasks } from "@/lib/data";

async function auth() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: "", name: "" };
  const { data: p } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  return { supabase, user, role: p?.role ?? "", name: p?.full_name ?? "" };
}
const writer = (supabase: ReturnType<typeof createAdminClient>) => (hasAdmin() ? createAdminClient() : supabase);

export type NewTask = {
  projectId: string;
  title: string;
  desc?: string;
  column: string;
  priority: string;
  assignee: string;
  assigneeId?: string;
  reviewer?: string;
  reviewerId?: string;
  due?: string;
};

export async function createTask(input: NewTask): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { supabase, user, role } = await auth();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  if (!canManageTasks(role)) return { ok: false, error: "Hanya manajer ke atas yang boleh membuat task." };
  if (!input.title?.trim()) return { ok: false, error: "Judul task wajib diisi." };

  const w = writer(supabase as never);
  const { error } = await w.from("tasks").insert({
    project_id: input.projectId,
    title: input.title.trim(),
    description: input.desc ?? "",
    column_key: input.column,
    priority: input.priority,
    assignee: input.assignee,
    assignee_id: input.assigneeId || null,
    reviewer_id: input.reviewerId || null,
    approver: input.reviewer ?? null,
    created_by: user.id,
    due_date: input.due || null,
    checklist_done: 0,
    checklist_total: 0,
    comments: 0,
    approval_status: "draft",
  });
  if (error) return { ok: false, error: error.message };

  // Beri tahu penerima tugas
  const to = input.assigneeId ? await getUserEmail(input.assigneeId) : null;
  if (to)
    await sendEmail(
      to,
      "Anda mendapat task baru",
      emailHtml({
        title: "Task baru untuk Anda",
        intro: `Anda ditugaskan: "${input.title.trim()}". Silakan kerjakan lalu unggah hasilnya untuk ditinjau.`,
        ctaPath: "/proyek",
        ctaLabel: "Buka Task",
      })
    );
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

// Staf mengirim hasil pekerjaan (keterangan + lampiran) untuk ditinjau.
export async function submitResult(
  id: string,
  note: string,
  fileUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { supabase, user, name } = await auth();
  if (!user) return { ok: false, error: "Sesi habis." };
  if (!note?.trim() && !fileUrl) return { ok: false, error: "Isi keterangan hasil atau unggah lampiran." };

  const w = writer(supabase as never);
  const { data: task, error } = await w
    .from("tasks")
    .update({
      result_note: note?.trim() || null,
      result_url: fileUrl || null,
      submitted_at: new Date().toISOString(),
      approval_status: "menunggu",
      column_key: "review",
    })
    .eq("id", id)
    .select("title, reviewer_id, approver")
    .single();
  if (error) return { ok: false, error: error.message };

  // Beri tahu peninjau (reviewer) — fallback ke manajer bila reviewer tak diset.
  const to = task?.reviewer_id
    ? await getUserEmail(task.reviewer_id)
    : await getEmailsByRoles(["super_admin", "operation", "director"]);
  if (to && (Array.isArray(to) ? to.length : true))
    await sendEmail(
      to,
      "Hasil task menunggu ditinjau",
      emailHtml({
        title: "Hasil task menunggu tinjauan",
        intro: `${name || "Staf"} telah mengunggah hasil untuk task "${task?.title ?? ""}". Mohon ditinjau (setujui / tolak).`,
        ctaPath: "/proyek",
        ctaLabel: "Tinjau Task",
      })
    );
  revalidatePath("/proyek");
  return { ok: true };
}

// Manajer/peninjau menyetujui atau menolak hasil.
export async function reviewTask(
  id: string,
  decision: "disetujui" | "ditolak",
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { supabase, user, role } = await auth();
  if (!user) return { ok: false, error: "Sesi habis." };
  if (!canManageTasks(role)) return { ok: false, error: "Role Anda tidak berwenang meninjau task." };

  const w = writer(supabase as never);
  const { data: task, error } = await w
    .from("tasks")
    .update({
      approval_status: decision,
      review_note: note?.trim() || null,
      reviewed_at: new Date().toISOString(),
      column_key: decision === "disetujui" ? "done" : "progress",
    })
    .eq("id", id)
    .select("title, assignee_id")
    .single();
  if (error) return { ok: false, error: error.message };

  const to = task?.assignee_id ? await getUserEmail(task.assignee_id) : null;
  if (to)
    await sendEmail(
      to,
      decision === "disetujui" ? "Hasil task disetujui" : "Hasil task perlu diperbaiki",
      emailHtml({
        title: decision === "disetujui" ? "Task Anda disetujui" : "Task Anda ditolak",
        intro:
          decision === "disetujui"
            ? `Hasil task "${task?.title ?? ""}" telah disetujui. Terima kasih!`
            : `Hasil task "${task?.title ?? ""}" ditolak.${note?.trim() ? ` Catatan: ${note.trim()}` : " Mohon perbaiki lalu kirim ulang."}`,
        ctaPath: "/proyek",
        ctaLabel: "Buka Task",
      })
    );
  revalidatePath("/proyek");
  return { ok: true };
}

// Kompatibilitas lama (kirim untuk approval / set status manual).
export async function setApproval(
  id: string,
  status: "draft" | "menunggu" | "disetujui" | "ditolak"
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const { supabase, user, role } = await auth();
  if (!user) return { ok: false, error: "Sesi habis." };
  if ((status === "disetujui" || status === "ditolak") && !canManageTasks(role)) {
    return { ok: false, error: "Role Anda tidak berwenang menyetujui/menolak." };
  }
  const w = writer(supabase as never);
  const { error } = await w.from("tasks").update({ approval_status: status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
