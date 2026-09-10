import { cookies } from "next/headers";
import { PageHeader, Card } from "@/components/ui";
import { IconHandshake } from "@/components/icons";
import { CatatFeeButton } from "@/components/create-forms";
import { FeeTable, type FeeRow } from "@/components/fee-table";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { referralFees as mockFees, clients as mockClients } from "@/lib/data";
import { rupiah } from "@/lib/format";

async function getData(): Promise<{ rows: FeeRow[]; clients: { id: string; name: string }[] }> {
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const [{ data: fees }, { data: cls }] = await Promise.all([
        sb.from("referral_fees").select("id,recipient,base,fee_pct,total,status,clients(name)").order("created_at", { ascending: false }),
        sb.from("clients").select("id,name"),
      ]);
      if (fees) {
        const rows: FeeRow[] = fees.map((f) => {
          const c = f.clients as { name?: string } | { name?: string }[] | null;
          return {
            id: String(f.id),
            recipient: f.recipient,
            clientName: (Array.isArray(c) ? c[0]?.name : c?.name) ?? "-",
            base: Number(f.base) || 0,
            feePct: Number(f.fee_pct) || 0,
            total: Number(f.total) || 0,
            status: f.status ?? "pending",
          };
        });
        return { rows, clients: cls ?? [] };
      }
    } catch {
      /* fallback */
    }
  }
  const rows: FeeRow[] = mockFees.map((f) => ({
    id: f.id,
    recipient: f.recipient,
    clientName: f.client.name,
    base: f.base,
    feePct: f.feePct,
    total: f.total,
    status: f.status,
  }));
  return { rows, clients: mockClients.map((c) => ({ id: c.id, name: c.name })) };
}

export default async function FeePage() {
  const { rows, clients } = await getData();
  const total = rows.reduce((s, f) => s + f.total, 0);
  const dibayar = rows.filter((f) => f.status === "dibayar").reduce((s, f) => s + f.total, 0);

  return (
    <>
      <PageHeader
        title="Laporan Fee / Komisi"
        subtitle="Komisi pihak ketiga — dihitung dari Management Fee neto (setelah PPh 23)"
        actions={<CatatFeeButton clients={clients} />}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconHandshake width={24} height={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{rupiah(total, { compact: true })}</p>
            <p className="text-sm text-muted-foreground">Total Fee Periode Ini</p>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xl font-bold text-emerald-600">{rupiah(dibayar, { compact: true })}</p>
          <p className="text-sm text-muted-foreground">Sudah Dibayar</p>
        </Card>
        <Card className="p-5">
          <p className="text-xl font-bold text-amber-600">{rupiah(total - dibayar, { compact: true })}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">Riwayat Fee / Komisi</h2>
          <span className="text-xs text-muted-foreground">Klik baris untuk detail</span>
        </div>
        <FeeTable rows={rows} />
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Rumus: <span className="font-semibold text-foreground">Fee = (Management Fee − PPh 23) × persentase</span>.
        </p>
      </Card>
    </>
  );
}
