import Link from "next/link";
import { cookies } from "next/headers";
import { PageHeader, Card, StatusPill, Badge } from "@/components/ui";
import { IconInvoice } from "@/components/icons";
import { BuatInvoiceButton } from "@/components/create-forms";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { invoices as mockInvoices, clients as mockClients, contractTypeLabel } from "@/lib/data";
import { rupiah, tanggal } from "@/lib/format";

type InvRow = {
  id: string;
  number: string;
  clientName: string;
  contractType: string | null;
  entityPrefix: string;
  salarySubtotal: number;
  bpjsClient: number;
  managementFee: number;
  ppn: number;
  grandTotal: number;
  status: string;
  dueDate: string;
};

async function getData(): Promise<{ rows: InvRow[]; clients: { id: string; name: string }[] }> {
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const [{ data: inv }, { data: cls }] = await Promise.all([
        sb.from("invoices").select("*, clients(name, contract_type)").order("created_at", { ascending: false }),
        sb.from("clients").select("id,name"),
      ]);
      if (inv) {
        const rows: InvRow[] = inv.map((v) => {
          const c = v.clients as { name?: string; contract_type?: string } | { name?: string; contract_type?: string }[] | null;
          const cc = Array.isArray(c) ? c[0] : c;
          return {
            id: v.id,
            number: v.number,
            clientName: cc?.name ?? "-",
            contractType: cc?.contract_type ?? null,
            entityPrefix: v.entity_prefix ?? "",
            salarySubtotal: Number(v.salary_subtotal) || 0,
            bpjsClient: Number(v.bpjs_client) || 0,
            managementFee: Number(v.management_fee) || 0,
            ppn: Number(v.ppn) || 0,
            grandTotal: Number(v.grand_total) || 0,
            status: v.status ?? "draft",
            dueDate: v.due_date ?? "",
          };
        });
        return { rows, clients: cls ?? [] };
      }
    } catch {
      /* fallback */
    }
  }
  const rows: InvRow[] = mockInvoices.map((v) => ({
    id: v.id,
    number: v.number,
    clientName: v.client.name,
    contractType: v.client.contractType,
    entityPrefix: v.entity.invoicePrefix,
    salarySubtotal: v.salarySubtotal,
    bpjsClient: v.bpjsClient,
    managementFee: v.managementFee,
    ppn: v.ppn,
    grandTotal: v.grandTotal,
    status: v.status,
    dueDate: v.dueDate,
  }));
  return { rows, clients: mockClients.map((c) => ({ id: c.id, name: c.name })) };
}

export default async function InvoicePage() {
  const { rows, clients } = await getData();
  const stats = [
    { label: "Total Tagihan", value: rupiah(rows.reduce((s, i) => s + i.grandTotal, 0), { compact: true }) },
    { label: "Management Fee", value: rupiah(rows.reduce((s, i) => s + i.managementFee, 0), { compact: true }) },
    { label: "PPN Terkumpul", value: rupiah(rows.reduce((s, i) => s + i.ppn, 0), { compact: true }) },
    { label: "Belum Terbayar", value: rupiah(rows.filter((i) => i.status !== "dibayar").reduce((s, i) => s + i.grandTotal, 0), { compact: true }) },
  ];
  return (
    <>
      <PageHeader
        title="Invoice Klien"
        subtitle="Penagihan otomatis dengan Management Fee, PPN 12%, dan PPh 23"
        actions={<BuatInvoiceButton clients={clients} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconInvoice width={18} height={18} />
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
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
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td className="td text-muted-foreground" colSpan={9}>Belum ada invoice.</td>
                </tr>
              )}
              {rows.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted">
                  <td className="td font-semibold">{inv.number}</td>
                  <td className="td">
                    <p>{inv.clientName}</p>
                    {inv.contractType && (
                      <Badge tone="teal">
                        {contractTypeLabel[inv.contractType as keyof typeof contractTypeLabel] ?? inv.contractType}
                      </Badge>
                    )}
                  </td>
                  <td className="td text-muted-foreground">{inv.entityPrefix}</td>
                  <td className="td text-right text-muted-foreground">{rupiah(inv.salarySubtotal + inv.bpjsClient)}</td>
                  <td className="td text-right text-muted-foreground">{rupiah(inv.managementFee)}</td>
                  <td className="td text-right font-semibold text-foreground">{rupiah(inv.grandTotal)}</td>
                  <td className="td text-muted-foreground">{inv.dueDate ? tanggal(inv.dueDate) : "-"}</td>
                  <td className="td">
                    <StatusPill status={inv.status} />
                  </td>
                  <td className="td text-right">
                    <Link href={`/invoice/${inv.id}`} className="font-semibold text-primary hover:underline">
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
