import { NextResponse } from "next/server";
import { employees } from "@/lib/data";

// GET /api/employees?clientId=als&status=aktif
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.toLowerCase();

  let data = employees;
  if (clientId) data = data.filter((e) => e.clientId === clientId);
  if (status) data = data.filter((e) => e.status === status);
  if (q) data = data.filter((e) => e.name.toLowerCase().includes(q) || e.nik.toLowerCase().includes(q));

  return NextResponse.json({ count: data.length, data });
}
