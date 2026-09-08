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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-soft/50 text-teal-deep">
            <IconHandshake width={24} height={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-navy">{rupiah(total, { compact: true })}</p>
            <p className="text-sm text-slate-500">Total Fee Periode Ini</p>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xl font-bold text-emerald-600">{rupiah(dibayar, { compact: true })}</p>
          <p className="text-sm text-slate-500">Sudah Dibayar</p>
        </Card>
        <Card className="p-5">
          <p className="text-xl font-bold text-amber-600">{rupiah(total - dibayar, { compact: true })}</p>
          <p className="text-sm text-slate-500">Pending</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-navy">Riwayat Fee / Komisi — Agustus 2026</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Penerima</th>
                <th className="th">Kontrak / Klien</th>
                <th className="th text-right">Dasar (MF neto)</th>
                <th className="th text-right">Persentase</th>
                <th className="th text-right">Total Fee</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referralFees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={f.recipient} tone="navy" />
                      <span className="font-semibold text-navy">{f.recipient}</span>
                    </div>
                  </td>
                  <td className="td text-slate-600">{f.client.name}</td>
                  <td className="td text-right text-slate-600">{rupiah(f.base)}</td>
                  <td className="td text-right font-semibold">{f.feePct}%</td>
                  <td className="td text-right font-semibold text-navy">{rupiah(f.total)}</td>
                  <td className="td">
                    <StatusPill status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          Rumus: <span className="font-semibold text-navy">Fee = (Management Fee − PPh 23) × persentase</span>.
          Dicatat otomatis per periode dan per kontrak.
        </p>
      </Card>
    </>
  );
}
