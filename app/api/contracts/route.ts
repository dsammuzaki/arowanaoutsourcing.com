import { NextResponse } from "next/server";
import { employeeContracts, kontrakStats } from "@/lib/data";

// GET /api/contracts?status=segera_berakhir
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let data = employeeContracts;
  if (status) data = data.filter((c) => c.status === status);

  const slim = data.map((c) => ({
    employeeId: c.employee.id,
    name: c.employee.name,
    position: c.employee.position,
    clientId: c.employee.clientId,
    contractType: c.contractType,
    start: c.start,
    end: c.end,
    termMonths: c.termMonths,
    remainingDays: c.remainingDays,
    progressPct: c.progressPct,
    status: c.status,
  }));

  return NextResponse.json({ stats: kontrakStats, count: slim.length, data: slim });
}
