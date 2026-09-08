import Link from "next/link";
import { PageHeader, Card, Badge, Avatar } from "@/components/ui";
import { IconWallet, IconDoc, IconCheck } from "@/components/icons";
import { employees, calcPayroll, clients, contractTypeLabel } from "@/lib/data";
import { rupiah } from "@/lib/format";

const lines = employees
  .filter((e) => e.status === "aktif")
  .map((e) => calcPayroll(e));

const totalGross = lines.reduce((s, l) => s + l.gross, 0);
const totalPph = lines.reduce((s, l) => s + l.pph21, 0);
const totalBpjs = lines.reduce((s, l) => s + l.bpjsEmployee, 0);
const totalThp = lines.reduce((s, l) => s + l.takeHome, 0);

export default function PayrollPage() {
  const stats = [
    { label: "Total Bruto", value: rupiah(totalGross, { compact: true }) },
    { label: "Total PPh 21", value: rupiah(totalPph, { compact: true }) },
    { label: "Total BPJS (karyawan)", value: rupiah(totalBpjs, { compact: true }) },
    { label: "Total Take-Home", value: rupiah(totalThp, { compact: true }) },
  ];
  return (
    <>
      <PageHeader
        title="Payroll & Slip Gaji"
        subtitle="Kalkulasi otomatis PPh 21, BPJS, dan komponen gaji — Periode Agustus 2026"
        actions={
          <>
            <select className="input w-auto">
              <option>Agustus 2026</option>
              <option>Juli 2026</option>
            </select>
            <button className="btn-outline">
              <IconDoc width={16} height={16} /> Slip Massal
            </button>
            <button className="btn-primary">
              <IconCheck width={16} height={16} /> Finalisasi Payroll
            </button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={s.label} className="p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-teal-soft/50 text-teal-deep">
              <IconWallet width={18} height={18} />
            </div>
            <p className="text-xl font-bold text-navy">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-navy">Rincian Gaji per Karyawan</h2>
          <span className="text-sm text-slate-500">{lines.length} karyawan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Karyawan</th>
                <th className="th">PTKP</th>
                <th className="th text-right">Bruto</th>
                <th className="th text-right">BPJS</th>
                <th className="th text-right">PPh 21</th>
                <th className="th text-right">Take-Home</th>
                <th className="th">Metode</th>
                <th className="th text-right">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((l) => {
                const client = clients.find((c) => c.id === l.employee.clientId);
                return (
                  <tr key={l.employee.id} className="hover:bg-slate-50">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={l.employee.name} tone="navy" />
                        <div>
                          <p className="font-semibold text-navy">{l.employee.name}</p>
                          <p className="text-xs text-slate-500">
                            {client?.name} · {contractTypeLabel[l.employee.contractType]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <Badge tone="slate">
                        {l.employee.maritalStatus}/{l.employee.dependents}
                      </Badge>
                    </td>
                    <td className="td text-right">{rupiah(l.gross)}</td>
                    <td className="td text-right text-slate-500">{rupiah(l.bpjsEmployee)}</td>
                    <td className="td text-right text-brand-red">{rupiah(l.pph21)}</td>
                    <td className="td text-right font-semibold text-navy">{rupiah(l.takeHome)}</td>
                    <td className="td">
                      <Badge tone={l.method === "tunai" ? "amber" : "teal"}>
                        {l.method === "tunai" ? "Tunai" : "Transfer"}
                      </Badge>
                    </td>
                    <td className="td text-right">
                      <Link
                        href={`/payroll/${l.employee.id}`}
                        className="font-semibold text-teal-dark hover:underline"
                      >
                        Lihat
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
