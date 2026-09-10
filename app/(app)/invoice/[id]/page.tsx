import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Card, StatusPill, Badge } from "@/components/ui";
import { Logo } from "@/components/logo";
import { IconPrint, IconDownload, IconTruck, IconDoc } from "@/components/icons";
import { invoices, legalEntities, contractTypeLabel, type ContractType } from "@/lib/data";
import { rupiah, tanggal } from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

type InvoiceView = (typeof invoices)[number];

// Ambil invoice dari database (fallback data contoh).
async function getInvoice(id: string): Promise<InvoiceView | null> {
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const { data: v } = await sb.from("invoices").select("*").eq("id", id).single();
      if (v) {
        const { data: c } = v.client_id
          ? await sb.from("clients").select("*").eq("id", v.client_id).single()
          : { data: null };
        const entity =
          legalEntities.find((e) => e.invoicePrefix === v.entity_prefix) ??
          legalEntities.find((e) => e.id === c?.entity_id) ??
          legalEntities[0];
        const view = {
          id: v.id,
          number: v.number,
          period: v.period ?? "",
          dueDate: v.due_date ?? "",
          status: v.status ?? "draft",
          salarySubtotal: Number(v.salary_subtotal) || 0,
          bpjsClient: Number(v.bpjs_client) || 0,
          managementFee: Number(v.management_fee) || 0,
          dpp: Number(v.dpp) || 0,
          ppn: Number(v.ppn) || 0,
          total: Number(v.total) || 0,
          pph23: Number(v.pph23) || 0,
          grandTotal: Number(v.grand_total) || 0,
          entity,
          client: {
            id: c?.id ?? "",
            name: c?.name ?? "-",
            entityId: c?.entity_id ?? entity.id,
            contractType: (c?.contract_type ?? "staff") as ContractType,
            headcount: c?.headcount ?? 0,
            managementFeePct: Number(c?.management_fee_pct) || 0,
            ppnPct: Number(c?.ppn_pct) || 12,
            pph23Pct: Number(c?.pph23_pct) || 2,
            spkNumber: c?.spk_number ?? "-",
          },
        };
        return view as unknown as InvoiceView;
      }
    } catch {
      /* fallback ke data contoh */
    }
  }
  return invoices.find((i) => i.id === id) ?? null;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getInvoice(id);
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
      <span className={bold ? "font-semibold text-foreground" : "text-muted-foreground"}>
        {label} {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </span>
      <span className={`${bold ? "font-bold text-foreground" : minus ? "text-brand-red" : "text-foreground"}`}>
        {minus ? "− " : ""}
        {value}
      </span>
    </div>
  );

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/invoice" className="text-sm font-semibold text-primary hover:underline">
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
          <div className="flex items-start justify-between gap-4 border-b border-border p-6">
            <div className="flex items-center gap-3">
              <Logo size={44} />
              <div>
                <p className="font-bold text-foreground">{inv.entity.name}</p>
                <p className="text-xs text-muted-foreground">NPWP {inv.entity.npwp}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ruko The East Point No.13, Tambun Selatan, Bekasi 17510
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">INVOICE</p>
              <p className="text-sm font-semibold text-primary">{inv.number}</p>
              <div className="mt-1">
                <StatusPill status={inv.status} />
              </div>
            </div>
          </div>

          {/* Bill to */}
          <div className="grid grid-cols-2 gap-4 border-b border-border p-6 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Ditagihkan kepada</p>
              <p className="font-semibold text-foreground">{inv.client.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">No. SPK/PO: {inv.client.spkNumber}</p>
              <Badge tone="teal">{contractTypeLabel[inv.client.contractType]}</Badge>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Periode</p>
              <p className="font-semibold text-foreground">{inv.period}</p>
              <p className="mt-1 text-xs text-muted-foreground">Jatuh tempo</p>
              <p className="font-semibold text-foreground">{tanggal(inv.dueDate)}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="p-6">
            <div className="divide-y divide-border">
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
            <h3 className="mb-3 font-bold text-foreground">Dokumen Pendamping</h3>
            <div className="space-y-2">
              {[
                { icon: IconTruck, label: "Surat Jalan", desc: "Pengiriman invoice fisik" },
                { icon: IconDoc, label: "Internal Memo", desc: "Nota internal penagihan" },
                { icon: IconDoc, label: "Rekap Absensi", desc: "Lampiran kehadiran" },
              ].map((d) => (
                <button
                  key={d.label}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <d.icon width={18} height={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-bold text-foreground">Ringkasan Pajak</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PPN dipungut</span>
                <span className="font-semibold text-foreground">{rupiah(inv.ppn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PPh 23 dipotong</span>
                <span className="font-semibold text-brand-red">{rupiah(inv.pph23)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Management Fee neto</span>
                <span className="font-semibold text-foreground">
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
