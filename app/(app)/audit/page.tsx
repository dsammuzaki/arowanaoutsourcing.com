import { cookies } from "next/headers";
import { PageHeader, Card, Badge } from "@/components/ui";
import { ShieldAlert, History } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const VIEW_ROLES = ["super_admin", "director"];

type Row = {
  id: string;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  target: string | null;
  detail: string | null;
  created_at: string;
};

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  operation: "Operation",
  director: "Director",
  finance: "Finance",
  hr_pic: "HR / PIC",
  customer: "Customer",
};

async function load() {
  if (!isSupabaseConfigured()) return { state: "no-db" as const };
  const sb = createClient(await cookies());
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { state: "forbidden" as const };
  const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (!VIEW_ROLES.includes(p?.role ?? "")) return { state: "forbidden" as const };
  const { data, error } = await sb.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  if (error && /schema cache|does not exist|PGRST205/i.test(error.message)) return { state: "no-table" as const };
  return { state: "ok" as const, rows: (data ?? []) as Row[] };
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function AuditPage() {
  const res = await load();

  if (res.state === "forbidden")
    return (
      <>
        <PageHeader title="Log Aktivitas" subtitle="Akses terbatas" />
        <Card className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
            <ShieldAlert size={24} />
          </div>
          <p className="text-sm text-muted-foreground">Halaman ini hanya untuk Super Admin & Director.</p>
        </Card>
      </>
    );

  if (res.state === "no-db" || res.state === "no-table")
    return (
      <>
        <PageHeader title="Log Aktivitas" subtitle="Audit perubahan penting" />
        <Card className="p-6 text-sm text-muted-foreground">
          {res.state === "no-db" ? "Supabase belum aktif." : "Tabel audit_log belum dibuat — jalankan schema-6.sql."}
        </Card>
      </>
    );

  return (
    <>
      <PageHeader title="Log Aktivitas" subtitle="Jejak audit perubahan penting oleh pengguna" />
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <History size={18} className="text-primary" />
          <h2 className="font-bold text-foreground">Aktivitas Terbaru</h2>
          <span className="ml-auto text-xs text-muted-foreground">{res.rows.length} entri</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="th">Waktu (WIB)</th>
                <th className="th">Pengguna</th>
                <th className="th">Aksi</th>
                <th className="th">Objek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {res.rows.length === 0 && (
                <tr>
                  <td className="td text-muted-foreground" colSpan={4}>
                    Belum ada aktivitas tercatat.
                  </td>
                </tr>
              )}
              {res.rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="td whitespace-nowrap text-muted-foreground">{fmt(r.created_at)}</td>
                  <td className="td">
                    <p className="font-semibold text-foreground">{r.actor_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel[r.actor_role ?? ""] ?? r.actor_role}</p>
                  </td>
                  <td className="td">
                    <Badge tone="teal">{r.action}</Badge>
                  </td>
                  <td className="td text-muted-foreground">
                    {r.target}
                    {r.detail && <span className="block text-xs text-muted-foreground/70">{r.detail}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
