import Link from "next/link";
import { PageHeader, Card, StatusPill, Badge } from "@/components/ui";
import { IconInvoice, IconPlus } from "@/components/icons";
import { invoices, contractTypeLabel } from "@/lib/data";
import { rupiah, tanggal } from "@/lib/format";

const totalTagihan = invoices.reduce((s, i) => s + i.grandTotal, 0);
const totalMf = invoices.reduce((s, i) => s + i.managementFee, 0);
const totalPpn = invoices.reduce((s, i) => s + i.ppn, 0);
const belum = invoices.filter((i) => i.status !== "dibayar").reduce((s, i) => s + i.grandTotal, 0);

export default function InvoicePage() {
  const stats = [
    { label: "Total Tagihan", value: rupiah(totalTagihan, { compact: true }) },
    { label: "Management Fee", value: rupiah(totalMf, { compact: true }) },
    { label: "PPN Terkumpul", value: rupiah(totalPpn, { compact: true }) },
    { label: "Belum Terbayar", value: rupiah(belum, { compact: true }) },
  ];
  return (
    <>
      <PageHeader
        title="Invoice Klien"
        subtitle="Penagihan otomatis dengan Management Fee, PPN 12%, dan PPh 23"
        actions={
          <button className="btn-primary">
            <IconPlus width={16} height={16} /> Buat Invoice
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-teal-soft/50 text-teal-deep">
              <IconInvoice width={18} height={18} />
            </div>
            <p className="text-xl font-bold text-navy">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">No. Invoice</th>
                <th className="th">Klien / Kontrak</th>
                <th className="th">Badan Usaha</th>
                <th className="th text-right">Gaji + BPJS</th>
                <th className="th text-right">Mgmt Fee</th>
                <th className="th text-right">Grand Total</th>
                <th className="th">Jatuh Tempo</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="td font-semibold">{inv.number}</td>
                  <td className="td">
                    <p>{inv.client.name}</p>
                    <Badge tone="teal">{contractTypeLabel[inv.client.contractType]}</Badge>
                  </td>
                  <td className="td text-slate-500">{inv.entity.invoicePrefix}</td>
                  <td className="td text-right text-slate-600">
                    {rupiah(inv.salarySubtotal + inv.bpjsClient)}
                  </td>
                  <td className="td text-right text-slate-600">{rupiah(inv.managementFee)}</td>
                  <td className="td text-right font-semibold text-navy">{rupiah(inv.grandTotal)}</td>
                  <td className="td text-slate-500">{tanggal(inv.dueDate)}</td>
                  <td className="td">
                    <StatusPill status={inv.status} />
                  </td>
                  <td className="td text-right">
                    <Link
                      href={`/invoice/${inv.id}`}
                      className="font-semibold text-teal-dark hover:underline"
                    >
                      Detail
                    </Link>
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
