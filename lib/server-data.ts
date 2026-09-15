import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import {
  employees as mockEmployees,
  clients as mockClients,
  type Employee,
  type ContractType,
  type Client,
} from "@/lib/data";

type Row = Record<string, unknown>;

function mapEmployee(e: Row): Employee {
  return {
    id: String(e.id),
    nik: (e.nik as string) ?? "-",
    name: (e.name as string) ?? "-",
    gender: e.gender === "P" ? "P" : "L",
    position: (e.position as string) ?? "-",
    clientId: (e.client_id as string) ?? "",
    contractType: ((e.contract_type as string) ?? "staff") as ContractType,
    branch: (e.branch as string) ?? "-",
    maritalStatus: e.marital_status === "K" ? "K" : "TK",
    dependents: (e.dependents as number) ?? 0,
    npwp: (e.npwp as string) ?? "-",
    bankName: (e.bank_name as string) ?? "-",
    bankAccount: (e.bank_account as string) ?? "-",
    joinDate: (e.join_date as string) ?? "2024-01-01",
    exitDate: (e.exit_date as string) ?? null,
    basicSalary: Number(e.basic_salary) || 0,
    status: e.status === "keluar" ? "keluar" : "aktif",
  };
}

/**
 * Ambil daftar karyawan dari database (fallback data contoh).
 * `clientId` opsional: batasi hanya karyawan milik klien tertentu (untuk role Customer).
 */
export async function getEmployees(clientId?: string): Promise<Employee[]> {
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      let q = sb.from("employees").select("*").order("name");
      if (clientId) q = q.eq("client_id", clientId);
      const { data } = await q;
      if (data && data.length) return data.map((e) => mapEmployee(e as Row));
      if (data && !clientId) return []; // DB aktif tapi kosong
    } catch {
      /* fallback */
    }
  }
  return clientId ? mockEmployees.filter((e) => e.clientId === clientId) : mockEmployees;
}

function mapClient(c: Row): Client {
  return {
    id: String(c.id),
    name: (c.name as string) ?? "-",
    entityId: (c.entity_id as string) ?? "",
    contractType: ((c.contract_type as string) ?? "staff") as ContractType,
    headcount: (c.headcount as number) ?? 0,
    managementFeePct: Number(c.management_fee_pct) || 0,
    ppnPct: Number(c.ppn_pct) || 12,
    pph23Pct: Number(c.pph23_pct) || 2,
    spkNumber: (c.spk_number as string) ?? "",
    periodStart: (c.period_start as string) ?? "",
    periodEnd: (c.period_end as string) ?? "",
  };
}

/**
 * Ambil daftar pelanggan (klien) dari database — sumber tunggal untuk
 * semua menu (payroll, absensi, kontrak, bpjs, dst). Fallback data contoh
 * hanya bila Supabase tidak aktif. Jika DB aktif tapi kosong → [] (klien
 * yang dihapus tidak muncul lagi di mana pun).
 */
export async function getClients(): Promise<Client[]> {
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const { data } = await sb.from("clients").select("*").order("name");
      if (data && data.length) return data.map((c) => mapClient(c as Row));
      if (data) return []; // DB aktif tapi kosong
    } catch {
      /* fallback */
    }
  }
  return mockClients;
}
