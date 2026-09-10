"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Badge, Avatar } from "@/components/ui";
import { IconWallet, IconDoc, IconCheck } from "@/components/icons";
import { CalendarDays, Users, Building2 } from "lucide-react";
import { rupiah } from "@/lib/format";

export type PayrollLineDTO = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  contractType: string;
  contractLabel: string;
  ptkp: string;
  gross: number;
  bpjs: number;
  pph21: number;
  takeHome: number;
  method: string;
};

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Daftar periode 12 bulan (tahun berjalan) + jumlah hari tepat per bulan.
function buildPeriods(year: number) {
  return MONTHS.map((m, i) => ({
    key: `${year}-${i}`,
    label: `${m} ${year}`,
    days: new Date(year, i + 1, 0).getDate(), // 28/29/30/31
  }));
}

export function PayrollClient({
  lines,
  clients,
}: {
  lines: PayrollLineDTO[];
  clients: { id: string; name: string }[];
}) {
  const year = 2026;
  const periods = useMemo(() => buildPeriods(year), []);
  const [periodKey, setPeriodKey] = useState(`${year}-7`); // Agustus
  const [projectId, setProjectId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [daysWorked, setDaysWorked] = useState<Record<string, number>>({});

  const period = periods.find((p) => p.key === periodKey) ?? periods[7];
  const daysInMonth = period.days;

  const filtered = useMemo(
    () =>
      lines.filter(
        (l) =>
          (projectId === "all" || l.clientId === projectId) &&
          (employeeId === "all" || l.id === employeeId)
      ),
    [lines, projectId, employeeId]
  );

  // Prorata linier berdasarkan hari kerja / jumlah hari bulan.
  const prorate = (val: number, id: string) => {
    const d = daysWorked[id] ?? daysInMonth;
    return Math.round((val * d) / daysInMonth);
  };
  const effDays = (id: string) => daysWorked[id] ?? daysInMonth;

  const totals = filtered.reduce(
    (acc, l) => {
      acc.gross += prorate(l.gross, l.id);
      acc.pph += prorate(l.pph21, l.id);
      acc.bpjs += prorate(l.bpjs, l.id);
      acc.thp += prorate(l.takeHome, l.id);
      return acc;
    },
    { gross: 0, pph: 0, bpjs: 0, thp: 0 }
  );

  const stats = [
    { label: "Total Bruto", value: rupiah(totals.gross, { compact: true }) },
    { label: "Total PPh 21", value: rupiah(totals.pph, { compact: true }) },
    { label: "Total BPJS (karyawan)", value: rupiah(totals.bpjs, { compact: true }) },
    { label: "Total Take-Home", value: rupiah(totals.thp, { compact: true }) },
  ];

  // Karyawan sesuai filter proyek (untuk dropdown karyawan)
  const empOptions = lines.filter((l) => projectId === "all" || l.clientId === projectId);

  return (
    <>
      {/* Filter bar */}
      <Card className="mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[9rem] flex-1">
          <label className="label flex items-center gap-1.5">
            <CalendarDays size={13} /> Periode
          </label>
          <select
            className="input"
            value={periodKey}
            onChange={(e) => {
              setPeriodKey(e.target.value);
              setDaysWorked({}); // reset hari kerja saat ganti periode
            }}
          >
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label} · {p.days} hari
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[9rem] flex-1">
          <label className="label flex items-center gap-1.5">
            <Building2 size={13} /> Proyek / Klien
          </label>
          <select
            className="input"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setEmployeeId("all");
            }}
          >
            <option value="all">Semua Proyek</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[9rem] flex-1">
          <label className="label flex items-center gap-1.5">
            <Users size={13} /> Karyawan
          </label>
          <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="all">Semua Karyawan</option>
            {empOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline whitespace-nowrap">
            <IconDoc width={16} height={16} /> Slip Massal
          </button>
          <button className="btn-primary whitespace-nowrap">
            <IconCheck width={16} height={16} /> Finalisasi
          </button>
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconWallet width={18} height={18} />
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">Rincian Gaji per Karyawan</h2>
          <span className="text-sm text-muted-foreground">
            {period.label} · {daysInMonth} hari · {filtered.length} karyawan
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="th">Karyawan</th>
                <th className="th text-center">Hari Kerja</th>
                <th className="th text-right">Bruto</th>
                <th className="th text-right">BPJS</th>
                <th className="th text-right">PPh 21</th>
                <th className="th text-right">Take-Home</th>
                <th className="th">Metode</th>
                <th className="th text-right">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td className="td text-muted-foreground" colSpan={8}>
                    Tidak ada karyawan untuk filter ini.
                  </td>
                </tr>
              )}
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-muted">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={l.name} tone="navy" />
                      <div>
                        <p className="font-semibold text-foreground">{l.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.clientName} · {l.contractLabel}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="td text-center">
                    <input
                      type="number"
                      min={0}
                      max={daysInMonth}
                      value={effDays(l.id)}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(daysInMonth, Number(e.target.value) || 0));
                        setDaysWorked((d) => ({ ...d, [l.id]: v }));
                      }}
                      className="input h-8 w-16 py-0 text-center text-sm"
                    />
                    <span className="ml-1 text-xs text-muted-foreground">/{daysInMonth}</span>
                  </td>
                  <td className="td text-right">{rupiah(prorate(l.gross, l.id))}</td>
                  <td className="td text-right text-muted-foreground">{rupiah(prorate(l.bpjs, l.id))}</td>
                  <td className="td text-right text-brand-red">{rupiah(prorate(l.pph21, l.id))}</td>
                  <td className="td text-right font-semibold text-foreground">{rupiah(prorate(l.takeHome, l.id))}</td>
                  <td className="td">
                    <Badge tone={l.method === "tunai" ? "amber" : "teal"}>
                      {l.method === "tunai" ? "Tunai" : "Transfer"}
                    </Badge>
                  </td>
                  <td className="td text-right">
                    <Link href={`/payroll/${l.id}`} className="font-semibold text-primary hover:underline">
                      Lihat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Nilai diprorata linier: <span className="font-semibold text-foreground">nilai bulanan × (hari kerja ÷ {daysInMonth} hari)</span>.
          Ubah kolom Hari Kerja untuk menghitung gaji sesuai kehadiran.
        </p>
      </Card>
    </>
  );
}
