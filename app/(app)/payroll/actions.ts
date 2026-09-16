"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";
import { logAudit } from "@/lib/audit";

const MANAGER_ROLES = ["super_admin", "operation", "director", "finance"];

async function gate() {
  if (!isSupabaseConfigured()) return { ok: false as const, error: "Supabase belum aktif." };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sesi habis. Login ulang." };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!MANAGER_ROLES.includes(p?.role ?? ""))
    return { ok: false as const, error: "Hanya manajer/finance yang boleh mengubah komponen rekap." };
  if (!hasAdmin()) return { ok: false as const, error: "SUPABASE_SECRET_KEY belum diset di server." };
  return { ok: true as const, admin: createAdminClient() };
}

export type RecapComponentInput = {
  days: number;
  tambahan: number;
  kompensasi: number;
  rapel: number;
  potKedukaan: number;
  potKoperasi: number;
  iph: number;
  tunjJabatan: number;
  tunjKehadiran: number;
  tunjEquipment: number;
};

export async function saveRecapComponent(
  employeeId: string,
  period: string,
  input: RecapComponentInput
): Promise<{ ok: boolean; error?: string }> {
  const g = await gate();
  if (!g.ok) return g;
  if (!employeeId || !/^\d{4}-\d{2}$/.test(period)) return { ok: false, error: "Periode tidak valid." };

  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  const { error } = await g.admin.from("recap_components").upsert(
    {
      employee_id: employeeId,
      period,
      days: Math.max(0, Math.min(31, Math.round(n(input.days)))),
      tambahan: n(input.tambahan),
      kompensasi: n(input.kompensasi),
      rapel: n(input.rapel),
      pot_kedukaan: n(input.potKedukaan),
      pot_koperasi: n(input.potKoperasi),
      iph: n(input.iph),
      tunj_jabatan: n(input.tunjJabatan),
      tunj_kehadiran: n(input.tunjKehadiran),
      tunj_equipment: n(input.tunjEquipment),
    },
    { onConflict: "employee_id,period" }
  );
  if (error) return { ok: false, error: error.message };
  await logAudit("save_recap_component", employeeId, `Komponen rekap ${period} diperbarui`);
  revalidatePath("/payroll");
  return { ok: true };
}
