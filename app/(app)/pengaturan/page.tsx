import { PageHeader, Card, Badge } from "@/components/ui";
import { legalEntities } from "@/lib/data";
import { getPayrollConfig } from "@/lib/settings";
import { PengaturanForm } from "@/components/pengaturan-form";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const config = await getPayrollConfig();
  return (
    <>
      <PageHeader
        title="Pengaturan Rate Pajak & BPJS"
        subtitle="Ubah tarif PTKP, PPh 21, dan BPJS — tersimpan & langsung dipakai di payroll"
      />

      <PengaturanForm config={config} />

      {/* Legal entities */}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">Badan Usaha (Multi-Entitas)</h2>
          <p className="text-xs text-muted-foreground">Badan usaha penagih dalam grup usaha</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="th">Nama Badan Usaha</th>
                <th className="th">NPWP</th>
                <th className="th">Prefix Invoice</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {legalEntities.map((e) => (
                <tr key={e.id} className="hover:bg-muted">
                  <td className="td font-semibold">{e.name}</td>
                  <td className="td text-muted-foreground">{e.npwp}</td>
                  <td className="td">
                    <Badge tone="teal">{e.invoicePrefix}</Badge>
                  </td>
                  <td className="td">
                    <Badge tone="green">Aktif</Badge>
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
