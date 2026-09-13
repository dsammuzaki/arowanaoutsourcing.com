import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { bpjsRates, ptkpTable, pph21Brackets, type PayrollConfig } from "@/lib/data";

export const defaultPayrollConfig: PayrollConfig = { bpjsRates, ptkpTable, pph21Brackets };

// Ambil konfigurasi payroll (default digabung dengan yang tersimpan di app_settings).
export async function getPayrollConfig(): Promise<PayrollConfig> {
  if (!isSupabaseConfigured()) return defaultPayrollConfig;
  try {
    const sb = createClient(await cookies());
    const { data } = await sb.from("app_settings").select("data").eq("id", 1).single();
    const saved = (data?.data ?? {}) as Partial<PayrollConfig>;
    return {
      bpjsRates: { ...bpjsRates, ...(saved.bpjsRates ?? {}) },
      ptkpTable: { ...ptkpTable, ...(saved.ptkpTable ?? {}) },
      pph21Brackets: saved.pph21Brackets && saved.pph21Brackets.length ? saved.pph21Brackets : pph21Brackets,
    };
  } catch {
    return defaultPayrollConfig;
  }
}
