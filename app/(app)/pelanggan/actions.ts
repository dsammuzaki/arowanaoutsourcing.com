"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";
import { logAudit } from "@/lib/audit";

const MANAGER_ROLES = ["super_admin", "operation", "director"];
const CONTRACT_TYPES = ["staff", "security", "cleaning", "driver"];

async function gate() {
  if (!isSupabaseConfigured()) return { ok: false as const, error: "Supabase belum aktif." };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sesi habis. Login ulang." };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!MANAGER_ROLES.includes(p?.role ?? ""))
    return { ok: false as const, error: "Hanya manajer ke atas yang boleh mengelola pelanggan." };
  const writer = hasAdmin() ? createAdminClient() : supabase;
  return { ok: true as const, writer };
}

export type CustomerInput = {
  name: string;
  entityId: string;
  contractType: string;
  headcount: number;
  managementFeePct: number;
  ppnPct: number;
  pph23Pct: number;
  spkNumber: string;
  periodStart: string;
  periodEnd: string;
};

function slugId(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "cust";
  return base + "-" + Math.random().toString(36).slice(2, 6);
}

function toRow(input: CustomerInput) {
  const ct = CONTRACT_TYPES.includes(input.contractType) ? input.contractType : "staff";
  const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  return {
    name: input.name.trim(),
    entity_id: input.entityId || null,
    contract_type: ct,
    headcount: Math.max(0, Math.round(num(input.headcount))),
    management_fee_pct: num(input.managementFeePct),
    ppn_pct: num(input.ppnPct, 12),
    pph23_pct: num(input.pph23Pct, 2),
    spk_number: input.spkNumber?.trim() || null,
    period_start: input.periodStart || null,
    period_end: input.periodEnd || null,
  };
}

export async function createCustomer(input: CustomerInput): Promise<{ ok: boolean; error?: string }> {
  const g = await gate();
  if (!g.ok) return g;
  if (!input.name?.trim()) return { ok: false, error: "Nama pelanggan wajib diisi." };

  let id = slugId(input.name);
  // pastikan id unik
  for (let i = 0; i < 3; i++) {
    const { data: exist } = await g.writer.from("clients").select("id").eq("id", id).maybeSingle();
    if (!exist) break;
    id = slugId(input.name);
  }
  const { error } = await g.writer.from("clients").insert({ id, ...toRow(input) });
  if (error) return { ok: false, error: error.message };
  await logAudit("create_customer", id, `Pelanggan "${input.name.trim()}" ditambahkan`);
  revalidatePath("/pelanggan");
  return { ok: true };
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<{ ok: boolean; error?: string }> {
  const g = await gate();
  if (!g.ok) return g;
  if (!input.name?.trim()) return { ok: false, error: "Nama pelanggan wajib diisi." };
  const { error } = await g.writer.from("clients").update(toRow(input)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAudit("update_customer", id, `Pelanggan "${input.name.trim()}" diperbarui`);
  revalidatePath("/pelanggan");
  return { ok: true };
}

export async function deleteCustomer(id: string, name: string): Promise<{ ok: boolean; error?: string }> {
  const g = await gate();
  if (!g.ok) return g;
  const { error } = await g.writer.from("clients").delete().eq("id", id);
  if (error) {
    // biasanya gagal bila masih ada invoice yang mereferensikan pelanggan ini
    return { ok: false, error: "Gagal menghapus. Pastikan tidak ada invoice terkait pelanggan ini. (" + error.message + ")" };
  }
  await logAudit("delete_customer", id, `Pelanggan "${name}" dihapus`);
  revalidatePath("/pelanggan");
  return { ok: true };
}
