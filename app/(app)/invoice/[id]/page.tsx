import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, StatusPill, Badge } from "@/components/ui";
import { Logo } from "@/components/logo";
import { IconPrint, IconDownload, IconTruck, IconDoc } from "@/components/icons";
import { invoices, contractTypeLabel } from "@/lib/data";
import { rupiah, tanggal } from "@/lib/format";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = invoices.find((i) => i.id === id);
  if (!inv) notFound();

  const Row = ({
    label,
    value,
    sub,
    bold,
    minus,
  }: {
    label: string;
    value: string;
    sub?: string;
    bold?: boolean;
    minus?: boolean;
  }) => (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className={bold ? "font-semibold text-navy" : "text-slate-600"}>
        {label} {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </span>
      <span className={`${bold ? "font-bold text-navy" : minus ? "text-brand-red" : "text-navy"}`}>
        {minus ? "− " : ""}
        {value}
      </span>
    </div>
  );

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/invoice" className="text-sm font-semibold text-teal-dark hover:underline">
          ← Kembali ke Invoice
        </Link>
        <div className="flex gap-2">
          <button className="btn-outline">
            <IconTruck width={16} height={16} /> Surat Jalan
          </button>
          <button className="btn-outline">
            <IconDoc width={16} height={16} /> Internal Memo
          </button>
          <button className="btn-outline">
            <IconPrint width={16} height={16} /> Cetak
          </button>
          <button className="btn-primary">
            <IconDownload width={16} height={16} /> Unduh PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <Logo size={44} />
              <div>
                <p className="font-bold text-navy">{inv.entity.name}</p>
                <p className="text-xs text-slate-500">NPWP {inv.entity.npwp}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Ruko The East Point No.13, Tambun Selatan, Bekasi 17510
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-navy">INVOICE</p>
              <p className="text-sm font-semibold text-teal-dark">{inv.number}</p>
              <div className="mt-1">
                <StatusPill status={inv.status} />
              </div>
            </div>
          </div>

          {/* Bill to */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 p-6 text-sm">
            <div>
              <p className="text-xs text-slate-400">Ditagihkan kepada</p>
              <p className="font-semibold text-navy">{inv.client.name}</p>
              <p className="mt-1 text-xs text-slate-500">No. SPK/PO: {inv.client.spkNumber}</p>
              <Badge tone="teal">{contractTypeLabel[inv.client.contractType]}</Badge>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Periode</p>
              <p className="font-semibold text-navy">{inv.period}</p>
              <p className="mt-1 text-xs text-slate-400">Jatuh tempo</p>
              <p className="font-semibold text-navy">{tanggal(inv.dueDate)}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="p-6">
            <div className="divide-y divide-slate-100">
              <Row label="Subtotal Gaji Karyawan" value={rupiah(inv.salarySubtotal)} />
              <Row label="BPJS (bagian tagihan klien)" value={rupiah(inv.bpjsClient)} />
              <Row
                label="Management Fee"
                sub={`(${inv.client.managementFeePct}%)`}
                value={rupiah(inv.managementFee)}
              />
              <Row label="DPP (Dasar Pengenaan Pajak)" value={rupiah(inv.dpp)} bold />
              <Row label="PPN" sub={`(${inv.client.ppnPct}%)`} value={rupiah(inv.ppn)} />
              <Row label="Total" value={rupiah(inv.total)} bold />
              <Row
                label="PPh 23"
                sub={`(${inv.client.pph23Pct}% — dipotong klien)`}
                value={rupiah(inv.pph23)}
                minus
              />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-navy px-5 py-4 text-white">
              <div>
                <p className="text-sm text-teal-soft">GRAND TOTAL DITERIMA</p>
                <p className="text-xs text-white/50">Setelah dipotong PPh 23 oleh klien</p>
              </div>
              <p className="text-2xl font-bold">{rupiah(inv.grandTotal)}</p>
            </div>
          </div>
        </Card>

        {/* Side: documents & summary */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-bold text-navy">Dokumen Pendamping</h3>
            <div className="space-y-2">
              {[
                { icon: IconTruck, label: "Surat Jalan", desc: "Pengiriman invoice fisik" },
                { icon: IconDoc, label: "Internal Memo", desc: "Nota internal penagihan" },
                { icon: IconDoc, label: "Rekap Absensi", desc: "Lampiran kehadiran" },
              ].map((d) => (
                <button
                  key={d.label}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-soft/50 text-teal-deep">
                    <d.icon width={18} height={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{d.label}</p>
                    <p className="text-xs text-slate-500">{d.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-bold text-navy">Ringkasan Pajak</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">PPN dipungut</span>
                <span className="font-semibold text-navy">{rupiah(inv.ppn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PPh 23 dipotong</span>
                <span className="font-semibold text-brand-red">{rupiah(inv.pph23)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Management Fee neto</span>
                <span className="font-semibold text-navy">
                  {rupiah(inv.managementFee - inv.pph23)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
