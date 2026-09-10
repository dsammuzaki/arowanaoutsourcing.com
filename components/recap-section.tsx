"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { CalendarRange, Loader2 } from "lucide-react";
import { getMonthlyRecap, type RecapResult, type RecapCell } from "@/app/(app)/absensi/actions";

const cellMeta: Record<Exclude<RecapCell, "">, { label: string; cls: string }> = {
  H: { label: "Hadir", cls: "bg-primary/10 text-primary" },
  I: { label: "Izin", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  S: { label: "Sakit", cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400" },
  C: { label: "Cuti", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
};

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function RecapSection({ initialYear, initialMonth }: { initialYear: number; initialMonth: number }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth); // 1-12
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RecapResult | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMonthlyRecap(year, month)
      .then((r) => active && setData(r))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [year, month]);

  const days = data?.days ?? new Date(year, month, 0).getDate();
  const dayList = Array.from({ length: days }, (_, i) => i + 1);
  const counts = data?.counts ?? { H: 0, I: 0, S: 0, C: 0 };
  const years = [initialYear - 1, initialYear, initialYear + 1];

  const summary = [
    { label: "Hadir", value: counts.H, cls: "bg-primary/10 text-primary" },
    { label: "Izin", value: counts.I, cls: "bg-amber-50 text-amber-700" },
    { label: "Sakit", value: counts.S, cls: "bg-indigo-50 text-indigo-700" },
    { label: "Cuti", value: counts.C, cls: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <>
      {/* Pemilih bulan */}
      <Card className="mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <CalendarRange size={16} className="text-primary" /> Rekap Kehadiran Harian
          </div>
          <p className="text-xs text-muted-foreground">
            Pilih bulan — absen nyata otomatis masuk sebagai Hadir (H); cuti disetujui tampil otomatis.
          </p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select className="input w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Ringkasan bulan terpilih */}
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${s.cls}`}>
              {s.label[0]}
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Grid rekap harian */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <span className="mr-2 text-sm font-semibold text-foreground">
            {MONTHS[month - 1]} {year} · {days} hari
          </span>
          {(Object.keys(cellMeta) as Exclude<RecapCell, "">[]).map((k) => (
            <span key={k} className={`badge ${cellMeta[k].cls}`}>
              {k} · {cellMeta[k].label}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 size={18} className="animate-spin" /> Memuat rekap…
          </div>
        ) : !data?.ok ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {data?.error ?? "Data rekap belum tersedia."}
          </div>
        ) : data.rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Belum ada karyawan aktif.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="th sticky left-0 z-10 bg-muted">Karyawan</th>
                  {dayList.map((d) => (
                    <th key={d} className="th px-1.5 text-center text-[11px]">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted">
                    <td className="td sticky left-0 z-10 bg-card">
                      <p className="whitespace-nowrap font-semibold text-foreground">{row.name}</p>
                      <p className="whitespace-nowrap text-xs text-muted-foreground">{row.position}</p>
                    </td>
                    {row.cells.map((c, i) => (
                      <td key={i} className="px-1 py-1.5 text-center">
                        {c ? (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${cellMeta[c].cls}`}
                            title={cellMeta[c].label}
                          >
                            {c}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">·</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
