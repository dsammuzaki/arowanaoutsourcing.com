import { PageHeader } from "@/components/ui";
import { calcPayroll, calcRecap, contractTypeLabel } from "@/lib/data";
import { getEmployees, getClients, getRecapComponents } from "@/lib/server-data";
import { getPayrollConfig } from "@/lib/settings";
import { PayrollClient, type PayrollLineDTO, type RecapLineDTO } from "@/components/payroll-client";

export const dynamic = "force-dynamic";

const RECAP_PERIOD = "2026-08"; // periode data rekap yang diimpor (Agustus 2026)

export default async function PayrollPage() {
  const [employees, clients, cfg, components] = await Promise.all([
    getEmployees(),
    getClients(),
    getPayrollConfig(),
    getRecapComponents(RECAP_PERIOD),
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

  // Rekapitulasi pendapatan (invoice recap) — memakai tarif fee per-klien.
  const recap: RecapLineDTO[] = active.map((e) => {
    const client = clients.find((c) => c.id === e.clientId);
    const r = calcRecap(
      e,
      {
        managementFeePct: client?.managementFeePct ?? 7,
        ppnPct: client?.ppnPct ?? 12,
        pph23Pct: client?.pph23Pct ?? 2,
      },
      cfg,
      components[e.id]
    );
    return {
      id: e.id,
      name: e.name,
      clientId: e.clientId,
      clientName: client?.name ?? "-",
      position: r.position,
      basicSalary: r.basicSalary,
      days: r.days,
      upahMasuk: r.upahMasuk,
      tambahan: r.tambahan,
      kompensasi: r.kompensasi,
      rapel: r.rapel,
      potKedukaan: r.potKedukaan,
      potKoperasi: r.potKoperasi,
      iph: r.iph,
      tunjJabatan: r.tunjJabatan,
      tunjKehadiran: r.tunjKehadiran,
      salaryThisMonth: r.salaryThisMonth,
      bpjsTK: r.bpjsTK,
      jp: r.jp,
      bpjsKes: r.bpjsKes,
      tunjEquipment: r.tunjEquipment,
      subTotal: r.subTotal,
      mgmtFee: r.mgmtFee,
      total1: r.total1,
      ppn: r.ppn,
      pph23: r.pph23,
      grandTotal: r.grandTotal,
    };
  });

  return (
    <>
      <PageHeader
        title="Payroll & Slip Gaji"
        subtitle="Kalkulasi otomatis PPh 21, BPJS, komponen gaji, dan rekapitulasi pendapatan"
      />
      <PayrollClient lines={lines} recap={recap} clients={clientOptions} />
    </>
  );
}
