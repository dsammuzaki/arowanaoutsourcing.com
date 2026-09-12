import { PageHeader, Card, Badge } from "@/components/ui";
import { HeartPulse, ShieldCheck, Building2 } from "lucide-react";
import { employees, calcPayroll, clients, bpjsRates } from "@/lib/data";
import { rupiah } from "@/lib/format";

const CLIENT_RATE = bpjsRates.jhtClient + bpjsRates.jkkClient + bpjsRates.jkmClient + bpjsRates.jpClient + bpjsRates.kesehatanClient;

function bpjsNo(prefix: string, id: string) {
  const n = id.split("-")[1] ?? "0";
  return `${prefix}${String(2020 + (Number(n) % 6))}${String(n).padStart(8, "0").slice(-8)}`;
}

const rows = employees
  .filter((e) => e.status === "aktif")
  .map((e) => {
    const p = calcPayroll(e);
    const iuranPerusahaan = Math.round((p.gross * CLIENT_RATE) / 100);
    return {
      id: e.id,
      name: e.name,
      position: e.position,
      clientName: clients.find((c) => c.id === e.clientId)?.name ?? "-",
      kesNo: bpjsNo("00", e.id),
      tkNo: bpjsNo("2", e.id),
      iuranKaryawan: p.bpjsEmployee,
      iuranPerusahaan,
    };
  });

export default function BpjsPage() {
  const totalKaryawan = rows.reduce((s, r) => s + r.iuranKaryawan, 0);
  const totalPerusahaan = rows.reduce((s, r) => s + r.iuranPerusahaan, 0);
  const stats = [
    { label: "Peserta Aktif", value: String(rows.length), Icon: ShieldCheck },
    { label: "Iuran Karyawan / bln", value: rupiah(totalKaryawan, { compact: true }), Icon: HeartPulse },
    { label: "Iuran Perusahaan / bln", value: rupiah(totalPerusahaan, { compact: true }), Icon: Building2 },
    { label: "Total Iuran / bln", value: rupiah(totalKaryawan + totalPerusahaan, { compact: true }), Icon: HeartPulse },
  ];

  return (
    <>
      <PageHeader
        title="BPJS Ketenagakerjaan & Kesehatan"
        subtitle="Kepesertaan dan iuran BPJS tenaga kerja per bulan"
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.Icon size={22} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">Kepesertaan BPJS</h2>
          <span className="text-xs text-muted-foreground">
            Iuran perusahaan {CLIENT_RATE.toFixed(2)}% · karyawan {(bpjsRates.jhtEmployee + bpjsRates.jpEmployee + bpjsRates.kesehatanEmployee)}%
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="th">Karyawan</th>
                <th className="th">Penempatan</th>
                <th className="th">No. BPJS Kesehatan</th>
                <th className="th">No. BPJS TK</th>
                <th className="th text-right">Iuran Karyawan</th>
                <th className="th text-right">Iuran Perusahaan</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted">
                  <td className="td">
                    <p className="font-semibold text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.position}</p>
                  </td>
                  <td className="td text-muted-foreground">{r.clientName}</td>
                  <td className="td font-mono text-xs text-muted-foreground">{r.kesNo}</td>
                  <td className="td font-mono text-xs text-muted-foreground">{r.tkNo}</td>
                  <td className="td text-right">{rupiah(r.iuranKaryawan)}</td>
                  <td className="td text-right text-muted-foreground">{rupiah(r.iuranPerusahaan)}</td>
                  <td className="td">
                    <Badge tone="green">Aktif</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Iuran perusahaan mencakup JHT, JKK, JKM, Jaminan Pensiun, dan Kesehatan sesuai regulasi.
        </p>
      </Card>
    </>
  );
}
