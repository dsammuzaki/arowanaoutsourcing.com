import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, Card } from "@/components/ui";
import { Building2, Users2, HandCoins, ShieldAlert } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { legalEntities } from "@/lib/data";
import { TambahPelangganButton, CustomerTable, type CustomerRow } from "@/components/pelanggan-ui";

export const dynamic = "force-dynamic";

const MANAGER_ROLES = ["super_admin", "operation", "director"];

async function load() {
  if (!isSupabaseConfigured()) return { state: "no-db" as const };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!MANAGER_ROLES.includes(me?.role ?? "")) return { state: "forbidden" as const };

  const { data } = await supabase
    .from("clients")
    .select("id,name,entity_id,contract_type,headcount,management_fee_pct,ppn_pct,pph23_pct,spk_number,period_start,period_end")
    .order("name");

  const rows: CustomerRow[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    entityId: c.entity_id ?? "",
    contractType: c.contract_type ?? "staff",
    headcount: c.headcount ?? 0,
    managementFeePct: Number(c.management_fee_pct ?? 0),
    ppnPct: Number(c.ppn_pct ?? 12),
    pph23Pct: Number(c.pph23_pct ?? 2),
    spkNumber: c.spk_number ?? "",
    periodStart: c.period_start ?? "",
    periodEnd: c.period_end ?? "",
  }));
  return { state: "ok" as const, rows };
}

export default async function PelangganPage() {
  const res = await load();
  const entities = legalEntities.map((e) => ({ id: e.id, name: e.name }));

  if (res.state === "forbidden") {
    return (
      <>
        <PageHeader title="Data Pelanggan" subtitle="Akses terbatas" />
        <Card className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Khusus Manajer</p>
            <p className="text-sm text-muted-foreground">
              Halaman ini hanya untuk role Super Admin, Operation, atau Director.
            </p>
          </div>
        </Card>
      </>
    );
  }

  if (res.state === "no-db") {
    return (
      <>
        <PageHeader title="Data Pelanggan" subtitle="Kelola perusahaan pelanggan/klien" />
        <Card className="p-6 text-sm text-muted-foreground">
          Supabase belum aktif — manajemen pelanggan membutuhkan koneksi database.
        </Card>
      </>
    );
  }

  const rows = res.rows;
  const totalHeadcount = rows.reduce((a, r) => a + (r.headcount || 0), 0);
  const avgFee = rows.length ? (rows.reduce((a, r) => a + (r.managementFeePct || 0), 0) / rows.length).toFixed(1) : "0";
  const stats = [
    { label: "Total Pelanggan", value: rows.length, Icon: Building2 },
    { label: "Total Headcount", value: totalHeadcount, Icon: Users2 },
    { label: "Rata-rata Mgmt Fee", value: `${avgFee}%`, Icon: HandCoins },
  ];

  return (
    <>
      <PageHeader
        title="Data Pelanggan"
        subtitle="Tambah, ubah, atau hapus perusahaan pelanggan (klien) BSU"
        actions={<TambahPelangganButton entities={entities} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
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

      <CustomerTable rows={rows} entities={entities} />
    </>
  );
}
