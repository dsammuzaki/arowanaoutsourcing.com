import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell, type ShellUser } from "@/components/app-shell";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: ShellUser = null;

  if (isSupabaseConfigured()) {
    const supabase = createClient(await cookies());
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Belum login -> ke halaman login
    if (!authUser) redirect("/");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", authUser.id)
      .single();

    user = {
      email: authUser.email ?? "",
      name: profile?.full_name || authUser.email?.split("@")[0] || "Pengguna",
      role: profile?.role || "operation",
    };
  }

  return <AppShell user={user}>{children}</AppShell>;
}
