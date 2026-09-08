import { PageHeader, Card, Badge } from "@/components/ui";
import { IconClock, IconDownload } from "@/components/icons";
import { employees, clients, attendanceSummary } from "@/lib/data";

type Status = "H" | "I" | "S" | "C" | "A";
const statusMeta: Record<Status, { label: string; cls: string }> = {
  H: { label: "Hadir", cls: "bg-primary/10 text-primary" },
  I: { label: "Izin", cls: "bg-amber-50 text-amber-700" },
  S: { label: "Sakit", cls: "bg-indigo-50 text-indigo-700" },
  C: { label: "Cuti", cls: "bg-muted text-muted-foreground" },
  A: { label: "Alpha", cls: "bg-red-50 text-brand-red" },
};

function seedStatus(i: number, d: number): Status {
  const x = Math.abs(Math.sin((i + 1) * (d + 2) * 3.13));
  if (x > 0.93) return "A";
  if (x > 0.88) return "S";
  if (x > 0.82) return "I";
  if (x > 0.79) return "C";
  return "H";
}

const days = Array.from({ length: 14 }, (_, i) => i + 1);
const shown = employees.filter((e) => e.status === "aktif").slice(0, 12);

export default function AbsensiPage() {
  const cards = [
    { label: "Hadir", value: attendanceSummary.hadir, tone: "teal" },
    { label: "Izin", value: attendanceSummary.izin, tone: "amber" },
    { label: "Sakit", value: attendanceSummary.sakit, tone: "navy" },
    { label: "Alpha", value: attendanceSummary.alpha, tone: "red" },
  ];
  return (
    <>
      <PageHeader
        title="Absensi"
        subtitle="Rekap kehadiran tenaga kerja — 1–14 Agustus 2026"
        actions={
          <>
            <select className="input w-auto">
              <option>Semua Klien</option>
              {clients.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
            <button className="btn-outline">
              <IconDownload width={16} height={16} /> Ekspor
            </button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                c.tone === "red"
                  ? "bg-red-50 text-brand-red"
                  : c.tone === "amber"
                  ? "bg-amber-50 text-amber-700"
                  : c.tone === "navy"
                  ? "bg-navy/10 text-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <IconClock width={20} height={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          {(Object.keys(statusMeta) as Status[]).map((s) => (
            <span key={s} className={`badge ${statusMeta[s].cls}`}>
              {s} · {statusMeta[s].label}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted">
              <tr>
                <th className="th sticky left-0 z-10 bg-muted">Karyawan</th>
                {days.map((d) => (
                  <th key={d} className="th px-2 text-center">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((e, i) => (
                <tr key={e.id} className="hover:bg-muted">
                  <td className="td sticky left-0 z-10 bg-card">
                    <p className="font-semibold text-foreground">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.position}</p>
                  </td>
                  {days.map((d) => {
                    const st = seedStatus(i, d);
                    return (
                      <td key={d} className="px-2 py-2 text-center">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${statusMeta[st].cls}`}
                        >
                          {st}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
