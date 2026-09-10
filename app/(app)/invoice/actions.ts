"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

const ALLOWED = ["super_admin", "finance", "operation"];
const BPJS_CLIENT_PCT = 3.7 + 0.24 + 0.3 + 2 + 4; // = 10.24
const ENTITY_PREFIX: Record<string, string> = { abp: "ABP", cpp: "CPP" };

export async function createInvoice(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED.includes(profile?.role ?? "")) return { ok: false, error: "Role Anda tidak berwenang membuat invoice." };

  const clientId = String(formData.get("client_id") || "");
  const period = String(formData.get("period") || "Agustus 2026");
  const salary = Number(formData.get("salary_subtotal") || 0);
  if (!clientId) return { ok: false, error: "Pilih klien dahulu." };
  if (!salary || salary <= 0) return { ok: false, error: "Subtotal gaji harus diisi." };

  const { data: client } = await supabase
    .from("clients")
    .select("management_fee_pct, ppn_pct, pph23_pct, entity_id")
    .eq("id", clientId)
    .single();
  if (!client) return { ok: false, error: "Klien tidak ditemukan." };

  const r = Math.round;
  const bpjs = r((salary * BPJS_CLIENT_PCT) / 100);
  const mgmt = r(((salary + bpjs) * (client.management_fee_pct ?? 0)) / 100);
  const dpp = salary + bpjs + mgmt;
  const ppn = r((dpp * (client.ppn_pct ?? 12)) / 100);
  const total = dpp + ppn;
  const pph23 = r((mgmt * (client.pph23_pct ?? 2)) / 100);
  const grand = total - pph23;
  const prefix = ENTITY_PREFIX[client.entity_id ?? "abp"] ?? "ABP";
  const seq = String(Date.now()).slice(-4);

  const row = {
    id: "inv-" + Date.now(),
    number: `${prefix}/INV/2026/${seq}`,
    client_id: clientId,
    entity_prefix: prefix,
    period,
    salary_subtotal: salary,
    bpjs_client: bpjs,
    management_fee: mgmt,
    dpp,
    ppn,
    total,
    pph23,
    grand_total: grand,
    status: "draft",
    due_date: String(formData.get("due_date") || "2026-09-25"),
  };
  const writer = hasAdmin() ? createAdminClient() : supabase;
  const { error } = await writer.from("invoices").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/invoice");
  return { ok: true };
}
