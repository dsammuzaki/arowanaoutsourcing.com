import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Role terbatas hanya boleh mengakses halaman ini (termasuk sub-rute detail).
const ROLE_PAGES: Record<string, string[]> = {
  hr_pic: ["/dashboard", "/karyawan", "/kontrak", "/absensi"],
  customer: ["/dashboard", "/absensi", "/karyawan", "/kontrak", "/bpjs", "/payroll"],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res; // biar layout yang mengarahkan ke halaman login

  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (p?.role as string) || "";
  const allowed = ROLE_PAGES[role];
  if (!allowed) return res; // role penuh — akses semua

  const path = req.nextUrl.pathname;
  const ok = allowed.some((a) => path === a || path.startsWith(a + "/"));
  if (!ok) {
    const dash = req.nextUrl.clone();
    dash.pathname = "/dashboard";
    return NextResponse.redirect(dash);
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)).*)",
  ],
};
