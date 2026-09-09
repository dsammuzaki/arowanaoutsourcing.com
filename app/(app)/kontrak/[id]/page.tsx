import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Badge, StatusPill } from "@/components/ui";
import {
  ArrowLeft,
  FileText,
  CalendarClock,
  Wallet,
  ClipboardList,
  Printer,
  Building2,
  CreditCard,
  IdCard,
  MapPin,
} from "lucide-react";
import {
  employeeById,
  contractByEmployeeId,
  contractNumber,
  attendanceSummaryFor,
  calcPayroll,
  leaveApplications,
  clientById,
  legalEntities,
  contractTypeLabel,
  formatDurasi,
} from "@/lib/data";
import { rupiah, tanggal, initials } from "@/lib/format";
import { PrintButton } from "@/components/print-button";

const attColor: Record<string, string> = {
  H: "bg-primary/15 text-primary",
  I: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  S: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  A: "bg-red-50 text-brand-red dark:bg-red-950/40",
};

export default async function KaryawanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const emp = employeeById(id);
  if (!emp) notFound();
  const contract = contractByEmployeeId(id);
  const client = clientById(emp.clientId);
  const entity = legalEntities.find((e) => e.id === client?.entityId);
  const att = attendanceSummaryFor(id);
  const pay = calcPayroll(emp);
  const leaves = leaveApplications.filter((l) => l.employeeId === id);

  const info = [
    { label: "NIK Internal", value: emp.nik, Icon: IdCard },
    { label: "NPWP", value: emp.npwp, Icon: FileText },
    { label: "Penempatan", value: client?.name ?? "-", Icon: Building2 },
    { label: "Cabang / Unit", value: emp.branch, Icon: MapPin },
    { label: "Rekening", value: `${emp.bankName} · ${emp.bankAccount}`, Icon: CreditCard },
    {
      label: "Status Pajak",
      value: `${emp.maritalStatus}/${emp.dependents} · ${emp.gender === "L" ? "Laki-laki" : "Perempuan"}`,
      Icon: IdCard,
    },
  ];

  const timeline = [
    { label: "Bergabung", date: emp.joinDate, tone: "teal" },
    ...(contract ? [{ label: "Kontrak mulai", date: contract.start, tone: "teal" }] : []),
    ...(contract ? [{ label: "Kontrak berakhir", date: contract.end, tone: contract.status === "berakhir" ? "red" : "gold" }] : []),
  ];

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/kontrak" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> Kembali ke Monitoring Kontrak
        </Link>
        <PrintButton className="btn-outline">
          <Printer size={16} /> Cetak Profil
        </PrintButton>
      </div>

      {/* Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border bg-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal text-xl font-bold">
              {initials(emp.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{emp.name}</h1>
              <p className="text-sm text-white/70">
                {emp.position} · {client?.name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="gold">{contractTypeLabel[emp.contractType]}</Badge>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70">
                  {emp.nik}
                </span>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-white/50">Status Kontrak</p>
            <div className="mt-1">{contract ? <StatusPill status={contract.status} /> : <Badge tone="slate">—</Badge>}</div>
            <p className="mt-2 text-xs text-white/50">No. Kontrak</p>
            <p className="font-semibold">{contractNumber(emp)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-3">
          {info.map((f) => (
            <div key={f.label} className="flex items-start gap-2.5">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary">
                <f.Icon size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="truncate text-sm font-semibold text-foreground">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kontrak */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">Informasi Kontrak</h2>
          </div>
          {contract ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { l: "Mulai", v: tanggal(contract.start) },
                  { l: "Berakhir", v: tanggal(contract.end) },
                  { l: "Durasi", v: formatDurasi(contract.totalDays) },
                  {
                    l: "Sisa",
                    v: contract.remainingDays < 0 ? `lewat ${formatDurasi(contract.remainingDays)}` : formatDurasi(contract.remainingDays),
                  },
                ].map((x) => (
                  <div key={x.l}>
                    <p className="text-xs text-muted-foreground">{x.l}</p>
                    <p className="text-sm font-semibold text-foreground">{x.v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Masa kontrak berjalan</span>
                  <span className="font-semibold text-foreground">{contract.progressPct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${contract.progressPct}%`,
                      background: contract.status === "berakhir" ? "#c0392b" : contract.status === "segera_berakhir" ? "#c69a34" : "#1a7d9c",
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                Badan usaha penagih: <span className="font-semibold text-foreground">{entity?.name}</span> ·
                No. SPK/PO klien: <span className="font-semibold text-foreground">{client?.spkNumber}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Karyawan ini tidak memiliki kontrak aktif.</p>
          )}
        </Card>

        {/* Timeline */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">Riwayat</h2>
          </div>
          <div className="space-y-4">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: t.tone === "red" ? "#c0392b" : t.tone === "gold" ? "#c69a34" : "#1a7d9c" }}
                  />
                  {i < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                </div>
                <div className="-mt-0.5">
                  <p className="text-sm font-semibold text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{tanggal(t.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Absensi + Payroll */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-foreground">Absensi 30 Hari</h2>
            <Badge tone="teal">Kehadiran {att.rate}%</Badge>
          </div>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {[
              { l: "Hadir", v: att.hadir, c: "text-primary" },
              { l: "Izin", v: att.izin, c: "text-amber-600" },
              { l: "Sakit", v: att.sakit, c: "text-indigo-600" },
              { l: "Alpha", v: att.alpha, c: "text-brand-red" },
            ].map((x) => (
              <div key={x.l} className="rounded-lg bg-muted/60 p-2.5 text-center">
                <p className={`text-lg font-bold ${x.c}`}>{x.v}</p>
                <p className="text-[11px] text-muted-foreground">{x.l}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-10 gap-1">
            {att.days.map((d) => (
              <span
                key={d.day}
                title={`Tgl ${d.day}: ${d.status}`}
                className={`flex h-6 items-center justify-center rounded text-[10px] font-bold ${attColor[d.status]}`}
              >
                {d.status}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">Ringkasan Gaji (Agustus 2026)</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gaji Bruto</span>
              <span className="font-semibold text-foreground">{rupiah(pay.gross)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BPJS (karyawan)</span>
              <span className="text-foreground">{rupiah(pay.bpjsEmployee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PPh 21</span>
              <span className="text-brand-red">{rupiah(pay.pph21)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Total Potongan</span>
              <span className="font-semibold text-foreground">{rupiah(pay.totalDeduction)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
            <div>
              <p className="text-xs text-primary">Take-Home Pay</p>
              <p className="text-[11px] text-muted-foreground">
                via {pay.method === "tunai" ? "Tunai / Amplop" : `Transfer ${emp.bankName}`}
              </p>
            </div>
            <p className="text-xl font-bold text-foreground">{rupiah(pay.takeHome)}</p>
          </div>
          <Link href={`/payroll/${emp.id}`} className="btn-outline mt-3 w-full">
            Lihat Slip Gaji
          </Link>
        </Card>
      </div>

      {/* Riwayat cuti */}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">Riwayat Cuti / Izin</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="th">Jenis</th>
                <th className="th">Tanggal</th>
                <th className="th text-right">Hari</th>
                <th className="th">Alasan</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaves.length === 0 && (
                <tr>
                  <td className="td text-muted-foreground" colSpan={5}>
                    Belum ada riwayat cuti/izin.
                  </td>
                </tr>
              )}
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-muted/60">
                  <td className="td font-medium">{l.type}</td>
                  <td className="td text-muted-foreground">
                    {tanggal(l.start)} – {tanggal(l.end)}
                  </td>
                  <td className="td text-right">{l.days}</td>
                  <td className="td text-muted-foreground">{l.reason}</td>
                  <td className="td">
                    <StatusPill status={l.status} />
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
