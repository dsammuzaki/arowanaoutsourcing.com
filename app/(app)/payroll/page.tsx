import { PageHeader } from "@/components/ui";
import { calcPayroll, clients, contractTypeLabel } from "@/lib/data";
import { getEmployees } from "@/lib/server-data";
import { PayrollClient, type PayrollLineDTO } from "@/components/payroll-client";

export const dynamic = "force-dynamic";

const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

export default async function PayrollPage() {
  const employees = await getEmployees();
  const lines: PayrollLineDTO[] = employees
    .filter((e) => e.status === "aktif")
    .map((e) => {
      const p = calcPayroll(e);
      const client = clients.find((c) => c.id === e.clientId);
      return {
        id: e.id,
        name: e.name,
        clientId: e.clientId,
        clientName: client?.name ?? "-",
        contractType: e.contractType,
        contractLabel: contractTypeLabel[e.contractType] ?? e.contractType,
        ptkp: `${e.maritalStatus}/${e.dependents}`,
        gross: p.gross,
        bpjs: p.bpjsEmployee,
        pph21: p.pph21,
        takeHome: p.takeHome,
        method: p.method,
      };
    });

  return (
    <>
      <PageHeader
        title="Payroll & Slip Gaji"
        subtitle="Kalkulasi otomatis PPh 21, BPJS, dan komponen gaji — pilih periode, proyek, dan karyawan"
      />
      <PayrollClient lines={lines} clients={clientOptions} />
    </>
  );
}
