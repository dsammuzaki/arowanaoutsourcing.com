import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

// GET /api/supabase/health — cek koneksi & apakah skema sudah dibuat
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      reason: "Environment variable Supabase belum diisi (.env.local / Vercel).",
    });
  }
  try {
    const supabase = createClient(await cookies());
    const { count, error } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });
    if (error) {
      return NextResponse.json({
        connected: true,
        schemaReady: false,
        hint: "Koneksi OK, tapi tabel belum ada. Jalankan supabase/schema.sql di SQL Editor.",
        error: error.message,
      });
    }
    return NextResponse.json({ connected: true, schemaReady: true, clients: count ?? 0 });
  } catch (e) {
    return NextResponse.json({ connected: false, error: e instanceof Error ? e.message : "unknown" });
  }
}
