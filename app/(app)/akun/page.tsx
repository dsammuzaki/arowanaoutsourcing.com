import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, Card } from "@/components/ui";
import { ShieldAlert, Users2, ShieldCheck, Building2, Wallet } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";
import { TambahAkunButton, AccountsTable, type AccountRow } from "@/components/akun-ui";

export const dynamic = "force-dynamic";

async function load() {
  if (!isSupabaseConfigured()) return { state: "no-db" as const };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "super_admin") return { state: "forbidden" as const };
  if (!hasAdmin()) return { state: "no-admin" as const, meId: user.id };

  const admin = createAdminClient();
  const [{ data: profiles }, listRes] = await Promise.all([
    admin.from("profiles").select("id, full_name, role, created_at").order("created_at"),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);
  const emailById = new Map((listRes.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const rows: AccountRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? "—",
    fullName: p.full_name || "(tanpa nama)",
    role: p.role,
    createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—",
  }));
  return { state: "ok" as const, rows, meId: user.id };
}

export default async function AkunPage() {
  const res = await load();

  if (res.state === "forbidden") {
    return (
      <>
        <PageHeader title="Manajemen Akun" subtitle="Akses terbatas" />
        <Card className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Hanya Super Admin</p>
            <p className="text-sm text-muted-foreground">
              Halaman ini hanya dapat diakses oleh akun dengan role Super Admin.
            </p>
          </div>
        </Card>
      </>
    );
  }

  if (res.state === "no-db" || res.state === "no-admin") {
    return (
      <>
        <PageHeader title="Manajemen Akun" subtitle="Kelola akun & hak akses pengguna" />
        <Card className="p-6 text-sm text-muted-foreground">
          {res.state === "no-db"
            ? "Supabase belum aktif — manajemen akun membutuhkan koneksi database."
            : "SUPABASE_SECRET_KEY belum diset di server, sehingga akun tidak dapat dikelola dari sini."}
        </Card>
      </>
    );
  }

  const rows = res.rows;
  const count = (r: string) => rows.filter((x) => x.role === r).length;
  const stats = [
    { label: "Total Akun", value: rows.length, Icon: Users2 },
    { label: "Super Admin", value: count("super_admin"), Icon: ShieldCheck },
    { label: "Operation", value: count("operation"), Icon: Building2 },
    { label: "Director / Finance", value: count("director") + count("finance"), Icon: Wallet },
  ];

  return (
    <>
      <PageHeader
        title="Manajemen Akun"
        subtitle="Buat, ubah role, atau hapus akun pengguna sistem"
        actions={<TambahAkunButton />}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">Daftar Akun</h2>
          <p className="text-xs text-muted-foreground">
            Ubah role langsung dari dropdown. Akun sendiri tidak bisa diubah/dihapus untuk keamanan.
          </p>
        </div>
        <AccountsTable rows={rows} meId={res.meId} />
      </Card>
    </>
  );
}
