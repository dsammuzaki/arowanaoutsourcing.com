"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { Card, Badge, Avatar } from "@/components/ui";
import { Modal } from "@/components/modal";
import { IconWallet, IconCheck, IconPrint } from "@/components/icons";
import { CalendarDays, Users, Building2, Download, Pencil, Upload } from "lucide-react";
import { rupiah } from "@/lib/format";
import { printElementById } from "@/lib/print";
import { recapValues, type RecapNumbers, type RecapInput } from "@/lib/data";
import {
  saveRecapComponent,
  saveRecapComponentsBulk,
  type RecapBulkItem,
  type RecapComponentInput,
} from "@/app/(app)/payroll/actions";

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

// Data dasar per karyawan; komponen & perhitungan dilakukan di client.
export type RecapBaseDTO = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  position: string;
  basicSalary: number;
  managementFeePct: number;
  ppnPct: number;
  pph23Pct: number;
};

export type RecapComponentsMap = Record<string, Record<string, Partial<RecapInput>>>;
type BpjsPct = { tkPct: number; jpPct: number; kesPct: number };

// Komponen yang bisa diedit manual (urutan input di modal)
const COMP_FIELDS: { key: keyof RecapInput; label: string }[] = [
  { key: "days", label: "Hari Kerja" },
  { key: "tambahan", label: "Tambahan" },
  { key: "kompensasi", label: "Kompensasi" },
  { key: "rapel", label: "Rapel Gaji" },
  { key: "potKedukaan", label: "Potongan Kedukaan" },
  { key: "potKoperasi", label: "Potongan Koperasi" },
  { key: "iph", label: "IPH / Pot. Perusahaan" },
  { key: "tunjJabatan", label: "Tunjangan Jabatan" },
  { key: "tunjKehadiran", label: "Tunjangan Kehadiran" },
  { key: "tunjEquipment", label: "Tunjangan Equipment" },
];

// Kolom rekap (urutan sesuai spreadsheet Rekap BSU-ALS)
const RECAP_COLS: { key: keyof RecapNumbers; label: string; strong?: boolean }[] = [
  { key: "basicSalary", label: "Basic Salary" },
  { key: "upahMasuk", label: "Upah Masuk" },
  { key: "tambahan", label: "Tambahan" },
  { key: "kompensasi", label: "Kompensasi" },
  { key: "rapel", label: "Rapel Gaji" },
  { key: "potKedukaan", label: "Pot. Kedukaan" },
  { key: "potKoperasi", label: "Pot. Koperasi" },
  { key: "iph", label: "IPH / Pot. Perush." },
  { key: "tunjJabatan", label: "Tunj. Jabatan" },
  { key: "tunjKehadiran", label: "Tunj. Kehadiran" },
  { key: "salaryThisMonth", label: "Salary This Month", strong: true },
  { key: "bpjsTK", label: "BPJS TK 4,24%" },
  { key: "jp", label: "Jaminan Pensiun 2%" },
  { key: "bpjsKes", label: "BPJS Kesehatan 4%" },
  { key: "tunjEquipment", label: "Tunj. Equipment" },
  { key: "subTotal", label: "SUB TOTAL", strong: true },
  { key: "mgmtFee", label: "Management Fee" },
  { key: "total1", label: "TOTAL 1", strong: true },
  { key: "ppn", label: "PPN" },
  { key: "pph23", label: "PPh 23 2%" },
  { key: "grandTotal", label: "Grand Total", strong: true },
];

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
  recapBase = [],
  components = {},
  bpjs = { tkPct: 4.24, jpPct: 2, kesPct: 4 },
  clients,
}: {
  lines: PayrollLineDTO[];
  recapBase?: RecapBaseDTO[];
  components?: RecapComponentsMap;
  bpjs?: BpjsPct;
  clients: { id: string; name: string }[];
}) {
  const year = 2026;
  const periods = useMemo(() => buildPeriods(year), []);
  const [periodKey, setPeriodKey] = useState(`${year}-7`); // Agustus
  const [projectId, setProjectId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [daysWorked, setDaysWorked] = useState<Record<string, number>>({});
  const [view, setView] = useState<"slip" | "rekap">("slip");
  // Komponen rekap dalam state agar bisa diedit tanpa reload penuh.
  const [comps, setComps] = useState<RecapComponentsMap>(components);

  const [finalized, setFinalized] = useState(false);
  const period = periods.find((p) => p.key === periodKey) ?? periods[7];
  const daysInMonth = period.days;
  // Periode dalam format "YYYY-MM" (mis. Agustus -> "2026-08") untuk komponen rekap.
  const monthIndex = Number(periodKey.split("-")[1]);
  const recapPeriod = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const filtered = useMemo(
    () =>
      lines.filter(
        (l) =>
          (projectId === "all" || l.clientId === projectId) &&
          (employeeId === "all" || l.id === employeeId)
      ),
    [lines, projectId, employeeId]
  );

  const recapBaseFiltered = useMemo(
    () =>
      recapBase.filter(
        (l) =>
          (projectId === "all" || l.clientId === projectId) &&
          (employeeId === "all" || l.id === employeeId)
      ),
    [recapBase, projectId, employeeId]
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

  function exportPayrollCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Nama", "Klien", "Kontrak", "Hari Kerja", "Bruto", "BPJS", "PPh21", "TakeHome", "Metode"];
    const body = filtered.map((l) =>
      [
        l.name,
        l.clientName,
        l.contractLabel,
        `${effDays(l.id)}/${daysInMonth}`,
        prorate(l.gross, l.id),
        prorate(l.bpjs, l.id),
        prorate(l.pph21, l.id),
        prorate(l.takeHome, l.id),
        l.method,
      ]
        .map(esc)
        .join(",")
    );
    const blob = new Blob(["﻿" + head.map(esc).join(",") + "\n" + body.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${period.label.replace(" ", "-").toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

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
        <div className="flex flex-wrap gap-2">
          {view === "slip" && (
            <>
              <button className="btn-outline whitespace-nowrap" onClick={exportPayrollCsv}>
                <Download size={16} /> Excel (.csv)
              </button>
              <button className="btn-outline whitespace-nowrap" onClick={() => printElementById("doc-payroll")}>
                <IconPrint width={16} height={16} /> Cetak / PDF
              </button>
            </>
          )}
          <button
            className={`btn-primary whitespace-nowrap ${finalized ? "opacity-70" : ""}`}
            onClick={() => {
              if (finalized) return;
              if (confirm(`Finalisasi payroll ${period.label} untuk ${filtered.length} karyawan? Nilai akan dikunci.`))
                setFinalized(true);
            }}
          >
            <IconCheck width={16} height={16} /> {finalized ? "Terfinalisasi" : "Finalisasi"}
          </button>
        </div>
      </Card>

      {/* Toggle tampilan */}
      <div className="mb-5 inline-flex rounded-lg border border-border bg-card p-0.5">
        <button
          onClick={() => setView("slip")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            view === "slip" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Slip Gaji
        </button>
        <button
          onClick={() => setView("rekap")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            view === "rekap" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Rekapitulasi Pendapatan
        </button>
      </div>

      {view === "rekap" ? (
        <RecapView
          base={recapBaseFiltered}
          components={comps[recapPeriod] ?? {}}
          bpjs={bpjs}
          period={recapPeriod}
          periodLabel={period.label}
          onSaved={(empId, input) =>
            setComps((prev) => ({
              ...prev,
              [recapPeriod]: { ...(prev[recapPeriod] ?? {}), [empId]: input },
            }))
          }
          onBulkSaved={(map) =>
            setComps((prev) => ({
              ...prev,
              [recapPeriod]: { ...(prev[recapPeriod] ?? {}), ...map },
            }))
          }
        />
      ) : (
      <>
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

      <Card id="doc-payroll" className="overflow-hidden">
        {/* Kop cetak */}
        <div className="hidden border-b-2 border-navy px-5 py-4 print:block">
          <p className="text-base font-bold text-navy">PT. Barata Sakti Utama</p>
          <p className="text-[11px] text-gray-500">Laporan Payroll · {period.label}</p>
        </div>
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
      )}
    </>
  );
}

// ---- Rekapitulasi Pendapatan (invoice recap ARMAS) ----
type RecapRow = RecapNumbers & { id: string; name: string; clientName: string };

function RecapView({
  base,
  components,
  bpjs,
  period,
  periodLabel,
  onSaved,
  onBulkSaved,
}: {
  base: RecapBaseDTO[];
  components: Record<string, Partial<RecapInput>>;
  bpjs: BpjsPct;
  period: string;
  periodLabel: string;
  onSaved: (empId: string, input: Partial<RecapInput>) => void;
  onBulkSaved: (map: Record<string, Partial<RecapInput>>) => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows: RecapRow[] = base.map((b) => ({
    id: b.id,
    name: b.name,
    clientName: b.clientName,
    ...recapValues(
      b.basicSalary,
      b.position,
      { managementFeePct: b.managementFeePct, ppnPct: b.ppnPct, pph23Pct: b.pph23Pct },
      bpjs,
      components[b.id]
    ),
  }));

  const totals = rows.reduce((acc, r) => {
    for (const c of RECAP_COLS) acc[c.key as string] = (acc[c.key as string] ?? 0) + (r[c.key] as number);
    return acc;
  }, {} as Record<string, number>);

  function exportRecapCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Nama", "Jabatan", "Klien", "Hari", ...RECAP_COLS.map((c) => c.label)];
    const body = rows.map((r) =>
      [r.name, r.position, r.clientName, r.days, ...RECAP_COLS.map((c) => r[c.key])].map(esc).join(",")
    );
    const foot = ["TOTAL", "", "", "", ...RECAP_COLS.map((c) => totals[c.key as string] ?? 0)].map(esc).join(",");
    const blob = new Blob(["﻿" + [head.map(esc).join(","), ...body, foot].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-pendapatan-${period}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const money = (n: number) => (n === 0 ? "–" : rupiah(n));
  const editRow = base.find((b) => b.id === editId) ?? null;

  // ---- Import / Export data mentah (komponen) ----
  const RAW_COLS = [
    "hari_kerja",
    "tambahan",
    "kompensasi",
    "rapel",
    "pot_kedukaan",
    "pot_koperasi",
    "iph_pot_perusahaan",
    "tunj_jabatan",
    "tunj_kehadiran",
    "tunj_equipment",
  ]; // urutannya sama dengan COMP_FIELDS

  const compOf = (id: string): Record<string, number> => {
    const c = components[id] ?? {};
    const o: Record<string, number> = {};
    for (const f of COMP_FIELDS) o[f.key] = Number(c[f.key] ?? (f.key === "days" ? 21 : 0));
    return o;
  };

  function download(name: string, csv: string) {
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportRawCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["id", "nama", "jabatan", ...RAW_COLS];
    const body = base.map((b) => {
      const cc = compOf(b.id);
      return [b.id, b.name, b.position, ...COMP_FIELDS.map((f) => cc[f.key])].map(esc).join(",");
    });
    download(`komponen-rekap-${period}.csv`, [head.map(esc).join(","), ...body].join("\n"));
  }

  function parseCsv(text: string): string[][] {
    const out: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
        } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); out.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); out.push(row); }
    return out;
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const text = (await file.text()).replace(/^﻿/, "");
      const grid = parseCsv(text).filter((r) => r.some((x) => x.trim() !== ""));
      if (grid.length < 2) { alert("File tidak berisi data."); return; }
      const header = grid[0].map((h) => h.trim().toLowerCase());
      const idIdx = header.indexOf("id") >= 0 ? header.indexOf("id") : 0;
      const num = (v: unknown) => {
        const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
        return Number.isFinite(n) ? n : 0;
      };
      const items: RecapBulkItem[] = [];
      const map: Record<string, Partial<RecapInput>> = {};
      for (const r of grid.slice(1)) {
        const id = (r[idIdx] ?? "").trim();
        if (!id) continue;
        const input: RecapComponentInput = {
          days: 21,
          tambahan: 0,
          kompensasi: 0,
          rapel: 0,
          potKedukaan: 0,
          potKoperasi: 0,
          iph: 0,
          tunjJabatan: 0,
          tunjKehadiran: 0,
          tunjEquipment: 0,
        };
        COMP_FIELDS.forEach((f, i) => {
          const byName = header.indexOf(RAW_COLS[i]);
          const col = byName >= 0 ? byName : 3 + i;
          (input as Record<string, number>)[f.key] = num(r[col]);
        });
        items.push({ employeeId: id, ...input });
        map[id] = { ...input };
      }
      if (!items.length) { alert("Tidak ada baris valid (kolom id kosong?)."); return; }
      const res = await saveRecapComponentsBulk(period, items);
      if (!res.ok) { alert(res.error || "Gagal mengimpor."); return; }
      onBulkSaved(map);
      alert(`Impor berhasil: ${res.count} baris komponen untuk periode ${periodLabel}.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal membaca file.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card id="doc-recap" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-bold text-foreground">Rekapitulasi Pendapatan</h2>
          <p className="text-xs text-muted-foreground">
            Periode {periodLabel} · {rows.length} karyawan · klik <Pencil size={11} className="inline" /> untuk mengisi komponen
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
            }}
          />
          <button
            className="btn-outline whitespace-nowrap"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            title="Impor komponen dari CSV (format sama dengan Ekspor Mentah)"
          >
            <Upload size={16} /> {importing ? "Mengimpor…" : "Import"}
          </button>
          <button className="btn-outline whitespace-nowrap" onClick={exportRawCsv} title="Ekspor data mentah (komponen) untuk diedit di Excel lalu diimpor kembali">
            <Download size={16} /> Data Mentah
          </button>
          <button className="btn-outline whitespace-nowrap" onClick={exportRecapCsv}>
            <Download size={16} /> Rekap (.csv)
          </button>
          <button className="btn-outline whitespace-nowrap" onClick={() => printElementById("doc-recap")}>
            <IconPrint width={16} height={16} /> Cetak / PDF
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1680px] text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="th sticky left-0 z-10 bg-muted">Karyawan</th>
              <th className="th text-center">Hari</th>
              {RECAP_COLS.map((c) => (
                <th key={c.key} className={`th text-right ${c.strong ? "text-foreground" : ""}`}>
                  {c.label}
                </th>
              ))}
              <th className="th text-center print:hidden">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td className="td text-muted-foreground" colSpan={RECAP_COLS.length + 3}>
                  Tidak ada karyawan untuk filter ini.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted">
                <td className="td sticky left-0 z-10 bg-card">
                  <p className="whitespace-nowrap font-semibold text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.position}</p>
                </td>
                <td className="td text-center text-muted-foreground">{r.days}</td>
                {RECAP_COLS.map((c) => (
                  <td
                    key={c.key}
                    className={`td whitespace-nowrap text-right ${
                      c.strong ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {money(r[c.key] as number)}
                  </td>
                ))}
                <td className="td text-center print:hidden">
                  <button
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                    onClick={() => setEditId(r.id)}
                    aria-label={`Edit komponen ${r.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60 font-semibold">
                <td className="td sticky left-0 z-10 bg-muted/60 text-foreground">TOTAL</td>
                <td className="td"></td>
                {RECAP_COLS.map((c) => (
                  <td key={c.key} className="td whitespace-nowrap text-right text-foreground">
                    {money(totals[c.key as string] ?? 0)}
                  </td>
                ))}
                <td className="td print:hidden"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        Rumus mengikuti spreadsheet Rekap BSU-ALS: BPJS TK/JP/Kesehatan dari <b>Basic Salary</b>; Management Fee = fee% ×{" "}
        <b>Upah Masuk</b>; PPN &amp; PPh 23 dari <b>Management Fee</b>; Grand Total = TOTAL 1 + PPN − PPh 23. Tanda “–” = 0.
      </p>

      {editRow && (
        <EditComponentModal
          name={editRow.name}
          periodLabel={periodLabel}
          initial={components[editRow.id]}
          onClose={() => setEditId(null)}
          onSave={async (input) => {
            const res = await saveRecapComponent(editRow.id, period, input as RecapInput);
            if (!res.ok) return res.error || "Gagal menyimpan.";
            onSaved(editRow.id, input);
            setEditId(null);
            return null;
          }}
        />
      )}
    </Card>
  );
}

function EditComponentModal({
  name,
  periodLabel,
  initial,
  onClose,
  onSave,
}: {
  name: string;
  periodLabel: string;
  initial?: Partial<RecapInput>;
  onClose: () => void;
  onSave: (input: Partial<RecapInput>) => Promise<string | null>;
}) {
  const [form, setForm] = useState<Record<string, number>>(() => {
    const f: Record<string, number> = {};
    for (const c of COMP_FIELDS) f[c.key] = Number(initial?.[c.key] ?? (c.key === "days" ? 21 : 0));
    return f;
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    const msg = await onSave(form as Partial<RecapInput>);
    setBusy(false);
    if (msg) setErr(msg);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Komponen Rekap"
      subtitle={`${name} · ${periodLabel}`}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {COMP_FIELDS.map((c) => (
          <div key={c.key}>
            <label className="label">{c.label}</label>
            <input
              type="number"
              className="input"
              value={form[c.key]}
              onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value === "" ? 0 : Number(e.target.value) }))}
            />
          </div>
        ))}
      </div>
      {err && <p className="mt-3 text-sm text-brand-red">{err}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        Nilai ini dipakai menghitung Salary This Month, SUB TOTAL, hingga Grand Total untuk periode {periodLabel}.
      </p>
    </Modal>
  );
}
