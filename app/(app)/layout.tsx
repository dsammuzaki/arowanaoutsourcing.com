import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell, type ShellUser } from "@/components/app-shell";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import type { SearchItem } from "@/components/global-search";
import { employees as mockEmployees, clients as mockClients, invoices as mockInvoices } from "@/lib/data";

const PAGES: SearchItem[] = [
  { label: "Dashboard", href: "/dashboard", kind: "halaman" },
  { label: "Data Karyawan", href: "/karyawan", kind: "halaman" },
  { label: "Absensi", href: "/absensi", kind: "halaman" },
  { label: "Rekrutmen & Onboarding", href: "/rekrutmen", kind: "halaman" },
  { label: "Monitoring Kontrak", href: "/kontrak", kind: "halaman" },
  { label: "Manajemen Proyek", href: "/proyek", kind: "halaman" },
  { label: "Manajemen Cuti", href: "/cuti", kind: "halaman" },
  { label: "Kinerja & KPI", href: "/kinerja", kind: "halaman" },
  { label: "Payroll & Slip Gaji", href: "/payroll", kind: "halaman" },
  { label: "Pencairan Gaji", href: "/pencairan", kind: "halaman" },
  { label: "Invoice Klien", href: "/invoice", kind: "halaman" },
  { label: "Fee / Komisi", href: "/fee", kind: "halaman" },
  { label: "Tentang BSU", href: "/about", kind: "halaman" },
  { label: "Pengaturan", href: "/pengaturan", kind: "halaman" },
];

async function buildSearchIndex(): Promise<SearchItem[]> {
  let empItems: SearchItem[] = [];
  let clientItems: SearchItem[] = [];
  let invoiceItems: SearchItem[] = [];

  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const [{ data: emps }, { data: cls }, { data: invs }] = await Promise.all([
        sb.from("employees").select("id,name,position").order("name"),
        sb.from("clients").select("id,name"),
        sb.from("invoices").select("id,number,client_id").order("created_at", { ascending: false }),
      ]);
      if (emps) empItems = emps.map((e) => ({ label: e.name, sub: e.position ?? "", href: `/kontrak/${e.id}`, kind: "karyawan" }));
      if (cls) clientItems = cls.map((c) => ({ label: c.name, href: "/invoice", kind: "klien" }));
      if (invs) invoiceItems = invs.map((v) => ({ label: v.number, href: `/invoice/${v.id}`, kind: "invoice" }));
    } catch {
      /* fallback ke data contoh */
    }
  }
  if (empItems.length === 0)
    empItems = mockEmployees.map((e) => ({ label: e.name, sub: e.position, href: `/kontrak/${e.id}`, kind: "karyawan" }));
  if (clientItems.length === 0)
    clientItems = mockClients.map((c) => ({ label: c.name, href: "/invoice", kind: "klien" }));
  if (invoiceItems.length === 0)
    invoiceItems = mockInvoices.map((v) => ({ label: v.number, sub: v.client.name, href: `/invoice/${v.id}`, kind: "invoice" }));

  return [...PAGES, ...empItems, ...clientItems, ...invoiceItems];
}

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

  const searchIndex = await buildSearchIndex();

  return (
    <AppShell user={user} searchIndex={searchIndex}>
      {children}
    </AppShell>
  );
}
