import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

// Tukar kode OAuth (Google) / verifikasi menjadi sesi, lalu arahkan ke aplikasi.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code && isSupabaseConfigured()) {
    const supabase = createClient(await cookies());
    await supabase.auth.exchangeCodeForSession(code);
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || origin;
  return NextResponse.redirect(`${base}${next}`);
}
