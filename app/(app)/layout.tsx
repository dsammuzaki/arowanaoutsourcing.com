import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell, type ShellUser } from "@/components/app-shell";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";
import type { SearchItem } from "@/components/global-search";
import type { NotifItem } from "@/components/notifications-bell";
import { employees as mockEmployees, clients as mockClients, invoices as mockInvoices, deriveContract } from "@/lib/data";
import { getEmployees } from "@/lib/server-data";

async function buildNotifs(role: string): Promise<NotifItem[]> {
  const out: NotifItem[] = [];
  const isManager = ["super_admin", "operation", "director"].includes(role);
  try {
    const emps = await getEmployees(); // ter-scope RLS
    const expiring = emps
      .filter((e) => e.status === "aktif")
      .map((e) => deriveContract(e))
      .filter((c) => c.status === "segera_berakhir" || c.status === "berakhir").length;
    if (expiring > 0)
      out.push({ id: "kontrak", title: "Kontrak segera berakhir", desc: `${expiring} kontrak perlu tindakan`, href: "/kontrak", kind: "kontrak", tone: "amber", time: "Perlu ditinjau" });
  } catch {
    /* abaikan */
  }
  if (isManager) {
    try {
      const sb = createClient(await cookies());
      const [{ count: pApprove }, { count: pLeave }] = await Promise.all([
        sb.from("change_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        sb.from("leave_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      if (pApprove)
        out.push({ id: "approval", title: "Persetujuan menunggu", desc: `${pApprove} permintaan perubahan`, href: "/persetujuan", kind: "approval", tone: "teal", time: "Menunggu" });
      if (pLeave)
        out.push({ id: "cuti", title: "Cuti menunggu persetujuan", desc: `${pLeave} pengajuan`, href: "/cuti", kind: "cuti", tone: "teal", time: "Menunggu" });
    } catch {
      /* tabel mungkin belum ada */
    }
  }
  return out;
}

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

    let role = profile?.role;
    let name = profile?.full_name;

    // Pendaftar baru (self sign-up) belum punya profil → buat dengan role terbatas 'customer'
    if (!profile) {
      const meta = (authUser.user_metadata ?? {}) as { full_name?: string };
      name = meta.full_name || authUser.email?.split("@")[0] || "Pengguna";
      role = "customer";
      if (hasAdmin()) {
        try {
          await createAdminClient()
            .from("profiles")
            .upsert({ id: authUser.id, full_name: name, role: "customer" }, { onConflict: "id" });
        } catch {
          /* abaikan */
        }
      }
    }

    user = {
      email: authUser.email ?? "",
      name: name || authUser.email?.split("@")[0] || "Pengguna",
      role: role || "customer",
    };
  }

  const searchIndex = await buildSearchIndex();
  const notifs = user ? await buildNotifs(user.role) : [];

  return (
    <AppShell user={user} searchIndex={searchIndex} notifs={notifs}>
      {children}
    </AppShell>
  );
}
