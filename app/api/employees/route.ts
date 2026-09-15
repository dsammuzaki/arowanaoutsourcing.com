import { NextResponse } from "next/server";
import { getEmployees } from "@/lib/server-data";

// GET /api/employees?clientId=als&status=aktif&q=budi
// Sumber: tabel employees (Supabase). Fallback ke data contoh hanya bila DB tidak aktif.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") || undefined;
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.toLowerCase();

  let data = await getEmployees(clientId);
  if (status) data = data.filter((e) => e.status === status);
  if (q) data = data.filter((e) => e.name.toLowerCase().includes(q) || e.nik.toLowerCase().includes(q));

  return NextResponse.json({ count: data.length, data });
}
