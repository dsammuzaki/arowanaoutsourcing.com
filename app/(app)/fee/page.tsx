import { PageHeader, Card, StatusPill, Avatar } from "@/components/ui";
import { IconHandshake, IconPlus } from "@/components/icons";
import { referralFees } from "@/lib/data";
import { rupiah } from "@/lib/format";

const total = referralFees.reduce((s, f) => s + f.total, 0);
const dibayar = referralFees.filter((f) => f.status === "dibayar").reduce((s, f) => s + f.total, 0);

export default function FeePage() {
  return (
    <>
      <PageHeader
        title="Laporan Fee / Komisi"
        subtitle="Komisi pihak ketiga — dihitung dari Management Fee neto (setelah PPh 23)"
        actions={
          <button className="btn-primary">
            <IconPlus width={16} height={16} /> Catat Fee
          </button>
        }
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
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">Riwayat Fee / Komisi — Agustus 2026</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="th">Penerima</th>
                <th className="th">Kontrak / Klien</th>
                <th className="th text-right">Dasar (MF neto)</th>
                <th className="th text-right">Persentase</th>
                <th className="th text-right">Total Fee</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {referralFees.map((f) => (
                <tr key={f.id} className="hover:bg-muted">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={f.recipient} tone="navy" />
                      <span className="font-semibold text-foreground">{f.recipient}</span>
                    </div>
                  </td>
                  <td className="td text-muted-foreground">{f.client.name}</td>
                  <td className="td text-right text-muted-foreground">{rupiah(f.base)}</td>
                  <td className="td text-right font-semibold">{f.feePct}%</td>
                  <td className="td text-right font-semibold text-foreground">{rupiah(f.total)}</td>
                  <td className="td">
                    <StatusPill status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Rumus: <span className="font-semibold text-foreground">Fee = (Management Fee − PPh 23) × persentase</span>.
          Dicatat otomatis per periode dan per kontrak.
        </p>
      </Card>
    </>
  );
}
