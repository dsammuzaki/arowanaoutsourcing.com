import { PageHeader } from "@/components/ui";
import { calcPayroll, bpjsClientPct, contractTypeLabel } from "@/lib/data";
import { getEmployees, getClients, getAllRecapComponents } from "@/lib/server-data";
import { getPayrollConfig } from "@/lib/settings";
import {
  PayrollClient,
  type PayrollLineDTO,
  type RecapBaseDTO,
  type RecapComponentsMap,
} from "@/components/payroll-client";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  const [employees, clients, cfg, components] = await Promise.all([
    getEmployees(),
    getClients(),
    getPayrollConfig(),
    getAllRecapComponents(),
  ]);
  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));
  const active = employees.filter((e) => e.status === "aktif");

  const lines: PayrollLineDTO[] = active.map((e) => {
    const p = calcPayroll(e, 0, cfg);
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

  // Data dasar rekap; perhitungan & pemilihan periode dilakukan di client.
  const recapBase: RecapBaseDTO[] = active.map((e) => {
    const client = clients.find((c) => c.id === e.clientId);
    return {
      id: e.id,
      name: e.name,
      clientId: e.clientId,
      clientName: client?.name ?? "-",
      position: e.position,
      basicSalary: e.basicSalary,
      managementFeePct: client?.managementFeePct ?? 7,
      ppnPct: client?.ppnPct ?? 12,
      pph23Pct: client?.pph23Pct ?? 2,
    };
  });

  const components2: RecapComponentsMap = components;

  return (
    <>
      <PageHeader
        title="Payroll & Slip Gaji"
        subtitle="Kalkulasi otomatis PPh 21, BPJS, komponen gaji, dan rekapitulasi pendapatan"
      />
      <PayrollClient
        lines={lines}
        recapBase={recapBase}
        components={components2}
        bpjs={bpjsClientPct(cfg)}
        clients={clientOptions}
      />
    </>
  );
}
