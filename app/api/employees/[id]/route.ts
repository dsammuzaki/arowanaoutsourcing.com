import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { getEmployees } from "@/lib/server-data";
import { deriveContract, contractNumber, calcPayroll } from "@/lib/data";

// GET /api/employees/:id — profil lengkap 1 karyawan (sumber: DB Supabase)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const emps = await getEmployees();
  const emp = emps.find((e) => e.id === id);
  if (!emp) {
    return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
  }

  const contract = deriveContract(emp);

  // Cuti & absensi diambil langsung dari DB bila aktif.
  let leaves: unknown[] = [];
  let attendance: { hadir: number; total: number } | null = null;
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const [{ data: lv }, { data: att }] = await Promise.all([
        sb.from("leave_applications").select("id,type,start_date,end_date,days,reason,status").eq("employee_id", id).order("start_date", { ascending: false }),
        sb.from("attendance").select("kind").eq("employee_id", id),
      ]);
      leaves = lv ?? [];
      const rows = att ?? [];
      attendance = { hadir: rows.filter((r) => r.kind === "masuk").length, total: rows.length };
    } catch {
      /* biarkan default */
    }
  }

  return NextResponse.json({
    data: {
      ...emp,
      contractNumber: contractNumber(emp),
      contract: {
        start: contract.start,
        end: contract.end,
        termMonths: contract.termMonths,
        remainingDays: contract.remainingDays,
        progressPct: contract.progressPct,
        status: contract.status,
      },
      payroll: calcPayroll(emp),
      attendance,
      leaves,
    },
  });
}
