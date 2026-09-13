"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";
import { logAudit } from "@/lib/audit";

const MANAGE_ROLES = ["super_admin", "operation", "director"];

function addMonths(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export type ContractInput = {
  employeeId: string;
  type: string;
  startDate: string; // YYYY-MM-DD
  termMonths: number;
};

export async function saveContract(input: ContractInput): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const sb = createClient(await cookies());
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (!MANAGE_ROLES.includes(p?.role ?? ""))
    return { ok: false, error: "Hanya Super Admin / Operation / Director yang boleh mengatur kontrak." };

  if (!input.employeeId) return { ok: false, error: "Karyawan tidak dikenal." };
  if (!input.startDate) return { ok: false, error: "Tanggal mulai wajib diisi." };
  const term = Number(input.termMonths) || 12;
  const end = addMonths(input.startDate, term);

  const writer = hasAdmin() ? createAdminClient() : sb;
  const { error } = await writer.from("contracts").insert({
    employee_id: input.employeeId,
    type: input.type || "staff",
    start_date: input.startDate,
    end_date: end,
    term_months: term,
    status: "aktif",
  });
  if (error) return { ok: false, error: error.message };

  await logAudit("Atur/perpanjang kontrak", input.employeeId, `${term} bulan · mulai ${input.startDate}`);
  revalidatePath("/kontrak");
  revalidatePath(`/kontrak/${input.employeeId}`);
  return { ok: true };
}
