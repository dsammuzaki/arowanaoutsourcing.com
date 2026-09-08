import Link from "next/link";
import { PageHeader, Card, StatusPill, Badge } from "@/components/ui";
import { IconArrowUp, IconArrowDown, IconUsers, IconWallet, IconInvoice, IconBank } from "@/components/icons";
import {
  clientComparison,
  invoices,
  attendanceSummary,
  contractTypeLabel,
} from "@/lib/data";
import { rupiah, angka, persen } from "@/lib/format";
import { TrendChart, AttendanceDonut } from "@/components/charts";

const totalPayroll = clientComparison.reduce((s, c) => s + c.payrollNow, 0);
const totalPrev = clientComparison.reduce((s, c) => s + c.payrollPrev, 0);
const totalHc = clientComparison.reduce((s, c) => s + c.headcountNow, 0);
const outstanding = invoices
  .filter((i) => i.status !== "dibayar")
  .reduce((s, i) => s + i.grandTotal, 0);
const invoicedTotal = invoices.reduce((s, i) => s + i.grandTotal, 0);

const stats = [
  {
    label: "Total Gaji Bulan Ini",
    value: rupiah(totalPayroll, { compact: true }),
    delta: ((totalPayroll - totalPrev) / totalPrev) * 100,
    Icon: IconWallet,
    tone: "teal",
  },
  {
    label: "Tenaga Kerja Aktif",
    value: angka(totalHc),
    delta: 2.1,
    Icon: IconUsers,
    tone: "navy",
  },
  {
    label: "Tagihan Klien",
    value: rupiah(invoicedTotal, { compact: true }),
    delta: 4.6,
    Icon: IconInvoice,
    tone: "teal",
  },
  {
    label: "Belum Terbayar",
    value: rupiah(outstanding, { compact: true }),
    delta: -3.2,
    Icon: IconBank,
    tone: "red",
  },
];

const attendanceBars = [
  { label: "Hadir", value: attendanceSummary.hadir, color: "#1a7d9c" },
  { label: "Izin", value: attendanceSummary.izin, color: "#f59e0b" },
  { label: "Sakit", value: attendanceSummary.sakit, color: "#6366f1" },
  { label: "Cuti", value: attendanceSummary.cuti, color: "#94a3b8" },
  { label: "Alpha", value: attendanceSummary.alpha, color: "#c0392b" },
];
const attTotal = attendanceBars.reduce((s, b) => s + b.value, 0);

export default function DashboardPage() {
  const maxPayroll = Math.max(...clientComparison.map((c) => c.payrollNow));
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan operasional & keuangan — Periode Agustus 2026"
        actions={
          <>
            <select className="input w-auto">
              <option>Agustus 2026</option>
              <option>Juli 2026</option>
              <option>Juni 2026</option>
            </select>
            <button className="btn-primary">Unduh Laporan</button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const up = s.delta >= 0;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    s.tone === "red"
                      ? "bg-red-50 text-brand-red"
                      : s.tone === "navy"
                      ? "bg-navy/10 text-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <s.Icon width={22} height={22} />
                </div>
                <span
                  className={`badge ${
                    up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brand-red"
                  }`}
                >
                  {up ? <IconArrowUp width={12} height={12} /> : <IconArrowDown width={12} height={12} />}
                  {persen(s.delta)}
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Trend chart */}
      <Card className="mt-6 p-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground">Tren Gaji vs Tagihan</h2>
            <p className="text-xs text-muted-foreground">6 bulan terakhir (dalam juta Rupiah)</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" /> Gaji
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Tagihan
            </span>
          </div>
        </div>
        <TrendChart />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Per-client comparison — the key PRD insight */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-bold text-foreground">Perbandingan per Klien</h2>
              <p className="text-xs text-muted-foreground">Bulan ini vs bulan lalu</p>
            </div>
            <Link href="/invoice" className="text-sm font-semibold text-primary hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="divide-y divide-border">
            {clientComparison.map((c) => {
              const up = c.growth >= 0;
              return (
                <div key={c.client.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{c.client.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge tone="teal">{contractTypeLabel[c.client.contractType]}</Badge>
                        <span>{angka(c.headcountNow)} org</span>
                        <span
                          className={
                            c.hcDelta > 0
                              ? "text-emerald-600"
                              : c.hcDelta < 0
                              ? "text-brand-red"
                              : "text-muted-foreground"
                          }
                        >
                          {c.hcDelta > 0 ? "+" : ""}
                          {c.hcDelta} org
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{rupiah(c.payrollNow, { compact: true })}</p>
                      <p
                        className={`mt-0.5 inline-flex items-center gap-0.5 text-xs font-semibold ${
                          up ? "text-emerald-600" : "text-brand-red"
                        }`}
                      >
                        {up ? <IconArrowUp width={11} height={11} /> : <IconArrowDown width={11} height={11} />}
                        {persen(c.growth)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${(c.payrollNow / maxPayroll) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Attendance summary */}
        <Card>
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Absensi Hari Ini</h2>
            <p className="text-xs text-muted-foreground">{attTotal} tenaga kerja terjadwal</p>
          </div>
          <div className="p-5">
            <AttendanceDonut data={attendanceBars} />
            <div className="mt-4 space-y-3">
              {attendanceBars.map((b) => (
                <div key={b.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                    {b.label}
                  </span>
                  <span className="font-semibold text-foreground">{b.value}</span>
                </div>
              ))}
            </div>
            <Link href="/absensi" className="btn-outline mt-5 w-full">
              Buka Absensi
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent invoices */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">Invoice Terbaru</h2>
          <Link href="/invoice" className="text-sm font-semibold text-primary hover:underline">
            Semua invoice
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="th">No. Invoice</th>
                <th className="th">Klien</th>
                <th className="th">Badan Usaha</th>
                <th className="th text-right">Grand Total</th>
                <th className="th">Jatuh Tempo</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted">
                  <td className="td font-semibold">{inv.number}</td>
                  <td className="td">{inv.client.name}</td>
                  <td className="td text-muted-foreground">{inv.entity.invoicePrefix}</td>
                  <td className="td text-right font-semibold">{rupiah(inv.grandTotal)}</td>
                  <td className="td text-muted-foreground">{inv.dueDate}</td>
                  <td className="td">
                    <StatusPill status={inv.status} />
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
