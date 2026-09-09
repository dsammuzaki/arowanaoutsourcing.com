import { PageHeader, Card, Badge, StatusPill, Avatar } from "@/components/ui";
import { FileClock, AlertTriangle, CheckCircle2, CalendarX2, Search, Download } from "lucide-react";
import {
  employeeContracts,
  kontrakStats,
  contractStatusLabel,
  contractTypeLabel,
  formatDurasi,
  clientById,
  clients,
  REF_DATE,
} from "@/lib/data";
import { tanggal } from "@/lib/format";

// urutan: paling mendesak dulu (sisa hari terkecil), lalu yang panjang
const rows = [...employeeContracts].sort((a, b) => a.remainingDays - b.remainingDays);

function barColor(status: string) {
  if (status === "berakhir") return "#c0392b";
  if (status === "segera_berakhir") return "#c69a34";
  return "#1a7d9c";
}

export default function KontrakPage() {
  const stats = [
    { label: "Total Kontrak", value: kontrakStats.total, Icon: FileClock, tone: "teal" },
    { label: "Aktif", value: kontrakStats.aktif, Icon: CheckCircle2, tone: "teal" },
    { label: "Segera Berakhir", value: kontrakStats.segeraBerakhir, Icon: AlertTriangle, tone: "amber" },
    { label: "Berakhir", value: kontrakStats.berakhir, Icon: CalendarX2, tone: "red" },
  ];

  return (
    <>
      <PageHeader
        title="Monitoring Kontrak"
        subtitle={`Masa & sisa kontrak tenaga kerja — per ${tanggal(REF_DATE)}`}
        actions={
          <button className="btn-outline">
            <Download size={16} /> Ekspor
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                s.tone === "red"
                  ? "bg-red-50 text-brand-red dark:bg-red-950/40"
                  : s.tone === "amber"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <s.Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {kontrakStats.segeraBerakhir + kontrakStats.berakhir > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">{kontrakStats.segeraBerakhir} kontrak</span> akan berakhir dalam 60 hari
            {kontrakStats.berakhir > 0 && (
              <>
                {" "}dan <span className="font-semibold">{kontrakStats.berakhir} kontrak</span> sudah lewat masa berlaku
              </>
            )}
            . Segera proses perpanjangan atau offboarding.
          </p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="input pl-9" placeholder="Cari nama karyawan…" />
          </div>
          <select className="input w-full sm:w-48">
            <option>Semua Klien</option>
            {clients.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="input w-full sm:w-44">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Segera Berakhir</option>
            <option>Berakhir</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="th">Karyawan</th>
                <th className="th">Klien / Kontrak</th>
                <th className="th">Mulai</th>
                <th className="th">Berakhir</th>
                <th className="th">Durasi</th>
                <th className="th w-56">Masa Berjalan</th>
                <th className="th">Sisa</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.employee.id} className="hover:bg-muted/60">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.employee.name} tone={c.status === "berakhir" ? "navy" : "teal"} />
                      <div>
                        <p className="font-semibold text-foreground">{c.employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.employee.position} · masa kerja {formatDurasi(c.masaKerjaMonths * 30)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <p className="text-muted-foreground">{clientById(c.employee.clientId)?.name}</p>
                    <Badge tone="teal">{contractTypeLabel[c.contractType]}</Badge>
                  </td>
                  <td className="td text-muted-foreground">{tanggal(c.start)}</td>
                  <td className="td text-muted-foreground">{tanggal(c.end)}</td>
                  <td className="td font-medium">{formatDurasi(c.totalDays)}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-36 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.progressPct}%`, background: barColor(c.status) }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{c.progressPct}%</span>
                    </div>
                  </td>
                  <td className="td">
                    {c.remainingDays < 0 ? (
                      <span className="font-semibold text-brand-red">
                        lewat {formatDurasi(c.remainingDays)}
                      </span>
                    ) : (
                      <span
                        className={`font-semibold ${
                          c.status === "segera_berakhir" ? "text-amber-600" : "text-foreground"
                        }`}
                      >
                        {formatDurasi(c.remainingDays)}
                      </span>
                    )}
                  </td>
                  <td className="td">
                    <StatusPill status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Ambang <span className="font-semibold text-foreground">Segera Berakhir</span> = sisa ≤ 60 hari. Label{" "}
          {contractStatusLabel.berakhir} muncul saat tanggal berakhir sudah terlewati.
        </p>
      </Card>
    </>
  );
}
