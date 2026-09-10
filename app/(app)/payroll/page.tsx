import { PageHeader } from "@/components/ui";
import { employees, calcPayroll, clients, contractTypeLabel } from "@/lib/data";
import { PayrollClient, type PayrollLineDTO } from "@/components/payroll-client";

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
      contractLabel: contractTypeLabel[e.contractType],
      ptkp: `${e.maritalStatus}/${e.dependents}`,
      gross: p.gross,
      bpjs: p.bpjsEmployee,
      pph21: p.pph21,
      takeHome: p.takeHome,
      method: p.method,
    };
  });

const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

export default function PayrollPage() {
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
