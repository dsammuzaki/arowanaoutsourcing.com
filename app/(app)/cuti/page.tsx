import { PageHeader, Card, Badge, StatusPill, Avatar } from "@/components/ui";
import { Clock, CheckCircle2, XCircle, CalendarRange, Plus, Check, X } from "lucide-react";
import {
  leaveApplications,
  leaveBalances,
  leaveStats,
  employeeById,
} from "@/lib/data";
import { tanggal } from "@/lib/format";

const typeTone: Record<string, string> = {
  Tahunan: "teal",
  Sakit: "amber",
  Melahirkan: "gold",
  Izin: "slate",
  Penting: "navy",
};

export default function CutiPage() {
  const stats = [
    { label: "Menunggu Persetujuan", value: leaveStats.pending, Icon: Clock, tone: "amber" },
    { label: "Disetujui", value: leaveStats.disetujui, Icon: CheckCircle2, tone: "teal" },
    { label: "Ditolak", value: leaveStats.ditolak, Icon: XCircle, tone: "red" },
    { label: "Total Hari Cuti", value: leaveStats.totalHari, Icon: CalendarRange, tone: "navy" },
  ];
  return (
    <>
      <PageHeader
        title="Manajemen Cuti"
        subtitle="Pengajuan cuti/izin, persetujuan, dan saldo cuti karyawan"
        actions={
          <button className="btn-primary">
            <Plus size={16} /> Ajukan Cuti
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                s.tone === "red"
                  ? "bg-red-50 text-brand-red"
                  : s.tone === "amber"
                  ? "bg-amber-50 text-amber-700"
                  : s.tone === "navy"
                  ? "bg-navy/10 text-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <s.Icon size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Applications */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Pengajuan Cuti</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="th">Karyawan</th>
                  <th className="th">Jenis</th>
                  <th className="th">Tanggal</th>
                  <th className="th text-right">Hari</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaveApplications.map((l) => {
                  const emp = employeeById(l.employeeId);
                  return (
                    <tr key={l.id} className="hover:bg-muted">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp?.name ?? "?"} tone="navy" />
                          <div>
                            <p className="font-semibold text-foreground">{emp?.name}</p>
                            <p className="text-xs text-muted-foreground">{l.reason}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <Badge tone={typeTone[l.type]}>{l.type}</Badge>
                      </td>
                      <td className="td text-muted-foreground">
                        {tanggal(l.start)} – {tanggal(l.end)}
                      </td>
                      <td className="td text-right font-semibold">{l.days}</td>
                      <td className="td">
                        <StatusPill status={l.status} />
                      </td>
                      <td className="td text-right">
                        {l.status === "pending" ? (
                          <div className="flex justify-end gap-1">
                            <button className="rounded-md bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100" title="Setujui">
                              <Check size={15} />
                            </button>
                            <button className="rounded-md bg-red-50 p-1.5 text-brand-red hover:bg-red-100" title="Tolak">
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Leave balances */}
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Saldo Cuti Tahunan</h2>
            <p className="text-xs text-muted-foreground">Kuota 12 hari / tahun</p>
          </div>
          <div className="divide-y divide-border">
            {leaveBalances.map((b) => (
              <div key={b.employee.id} className="px-5 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{b.employee.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {b.remaining}/{b.quota} sisa
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${(b.used / b.quota) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
