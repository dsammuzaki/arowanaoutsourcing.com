import { NextResponse } from "next/server";
import {
  employeeById,
  contractByEmployeeId,
  contractNumber,
  calcPayroll,
  attendanceSummaryFor,
  leaveApplications,
} from "@/lib/data";

// GET /api/employees/:id — profil lengkap 1 karyawan
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const emp = employeeById(id);
  if (!emp) {
    return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
  }
  const contract = contractByEmployeeId(id);
  return NextResponse.json({
    data: {
      ...emp,
      contractNumber: contractNumber(emp),
      contract: contract
        ? {
            start: contract.start,
            end: contract.end,
            termMonths: contract.termMonths,
            remainingDays: contract.remainingDays,
            progressPct: contract.progressPct,
            status: contract.status,
          }
        : null,
      payroll: calcPayroll(emp),
      attendance: attendanceSummaryFor(id),
      leaves: leaveApplications.filter((l) => l.employeeId === id),
    },
  });
}
