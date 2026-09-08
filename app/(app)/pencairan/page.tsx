import { PageHeader, Card, Badge } from "@/components/ui";
import { IconBank, IconWallet, IconDownload, IconCheck, IconPrint } from "@/components/icons";
import { employees, calcPayroll } from "@/lib/data";
import { rupiah } from "@/lib/format";

const lines = employees.filter((e) => e.status === "aktif").map((e) => calcPayroll(e));
const transfer = lines.filter((l) => l.method === "transfer");
const tunai = lines.filter((l) => l.method === "tunai");

// Group transfer by bank
const byBank = transfer.reduce<Record<string, { count: number; total: number }>>((acc, l) => {
  const b = l.employee.bankName;
  acc[b] = acc[b] || { count: 0, total: 0 };
  acc[b].count++;
  acc[b].total += l.takeHome;
  return acc;
}, {});

const totalTransfer = transfer.reduce((s, l) => s + l.takeHome, 0);
const totalTunai = tunai.reduce((s, l) => s + l.takeHome, 0);

export default function PencairanPage() {
  return (
    <>
      <PageHeader
        title="Pencairan Gaji"
        subtitle="Batch transfer bank & pembayaran tunai — Periode Agustus 2026"
        actions={
          <button className="btn-primary">
            <IconCheck width={16} height={16} /> Proses Pencairan
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-soft/50 text-teal-deep">
            <IconBank width={24} height={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-navy">{rupiah(totalTransfer, { compact: true })}</p>
            <p className="text-sm text-slate-500">Transfer Bank · {transfer.length} orang</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <IconWallet width={24} height={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-navy">{rupiah(totalTunai, { compact: true })}</p>
            <p className="text-sm text-slate-500">Tunai / Amplop · {tunai.length} orang</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/10 text-navy">
            <IconCheck width={24} height={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-navy">
              {rupiah(totalTransfer + totalTunai, { compact: true })}
            </p>
            <p className="text-sm text-slate-500">Total Pencairan</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Transfer batches per bank */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-navy">Batch Transfer per Bank</h2>
              <p className="text-xs text-slate-500">Siap unggah ke internet banking</p>
            </div>
            <button className="btn-outline px-3 py-1.5 text-xs">
              <IconDownload width={14} height={14} /> Unduh .csv
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {Object.entries(byBank).map(([bank, d]) => (
              <div key={bank} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-navy">
                    {bank}
                  </div>
                  <div>
                    <p className="font-semibold text-navy">Bank {bank}</p>
                    <p className="text-xs text-slate-500">{d.count} karyawan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-navy">{rupiah(d.total)}</p>
                  <Badge tone="teal">Siap kirim</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cash receipts / Tanda Terima */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-navy">Tanda Terima Tunai</h2>
              <p className="text-xs text-slate-500">Bukti serah terima bertanda tangan</p>
            </div>
            <button className="btn-outline px-3 py-1.5 text-xs">
              <IconPrint width={14} height={14} /> Cetak Semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Karyawan</th>
                  <th className="th text-right">Jumlah</th>
                  <th className="th">Tanda Tangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tunai.map((l, i) => (
                  <tr key={l.employee.id} className="hover:bg-slate-50">
                    <td className="td">
                      <p className="font-semibold text-navy">{l.employee.name}</p>
                      <p className="text-xs text-slate-400">{l.employee.position}</p>
                    </td>
                    <td className="td text-right font-semibold">{rupiah(l.takeHome)}</td>
                    <td className="td">
                      {i % 3 === 0 ? (
                        <Badge tone="slate">Menunggu</Badge>
                      ) : (
                        <Badge tone="green">
                          <IconCheck width={12} height={12} /> Ditandatangani
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {tunai.length === 0 && (
                  <tr>
                    <td className="td text-slate-400" colSpan={3}>
                      Tidak ada pembayaran tunai periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
