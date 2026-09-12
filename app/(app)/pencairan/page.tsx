import { PageHeader, Card, Badge } from "@/components/ui";
import { IconBank, IconWallet, IconCheck, IconPrint } from "@/components/icons";
import { Logo } from "@/components/logo";
import { calcPayroll } from "@/lib/data";
import { getEmployees } from "@/lib/server-data";
import { rupiah } from "@/lib/format";
import { ExportButton } from "@/components/export-button";
import { PrintButton } from "@/components/print-button";
import { ProsesPencairanButton } from "@/components/pencairan-actions";

export const dynamic = "force-dynamic";

export default async function PencairanPage() {
  const employees = await getEmployees();
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

  return (
    <>
      <PageHeader
        title="Pencairan Gaji"
        subtitle="Batch transfer bank & pembayaran tunai — Periode Agustus 2026"
        actions={<ProsesPencairanButton />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconBank width={24} height={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{rupiah(totalTransfer, { compact: true })}</p>
            <p className="text-sm text-muted-foreground">Transfer Bank · {transfer.length} orang</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <IconWallet width={24} height={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{rupiah(totalTunai, { compact: true })}</p>
            <p className="text-sm text-muted-foreground">Tunai / Amplop · {tunai.length} orang</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/10 text-foreground">
            <IconCheck width={24} height={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">
              {rupiah(totalTransfer + totalTunai, { compact: true })}
            </p>
            <p className="text-sm text-muted-foreground">Total Pencairan</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Transfer batches per bank */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-bold text-foreground">Batch Transfer per Bank</h2>
              <p className="text-xs text-muted-foreground">Siap unggah ke internet banking</p>
            </div>
            <ExportButton
              className="btn-outline px-3 py-1.5 text-xs"
              label="Unduh .csv"
              filename="batch-transfer-bank.csv"
              columns={[
                { key: "nama", label: "Nama" },
                { key: "bank", label: "Bank" },
                { key: "rekening", label: "No. Rekening" },
                { key: "jumlah", label: "Jumlah (Rp)" },
              ]}
              rows={transfer.map((l) => ({
                nama: l.employee.name,
                bank: l.employee.bankName,
                rekening: l.employee.bankAccount,
                jumlah: l.takeHome,
              }))}
            />
          </div>
          <div className="divide-y divide-border">
            {Object.entries(byBank).map(([bank, d]) => (
              <div key={bank} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">
                    {bank}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Bank {bank}</p>
                    <p className="text-xs text-muted-foreground">{d.count} karyawan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{rupiah(d.total)}</p>
                  <Badge tone="teal">Siap kirim</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cash receipts / Tanda Terima */}
        <Card id="doc-tanda-terima" className="overflow-hidden">
          {/* Kop cetak */}
          <div className="hidden items-center gap-3 border-b-2 border-navy px-5 py-4 print:flex">
            <Logo size={40} />
            <div>
              <p className="text-base font-bold text-navy">PT. Barata Sakti Utama</p>
              <p className="text-[11px] text-gray-500">Tanda Terima Pembayaran Gaji Tunai · Periode Agustus 2026</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-bold text-foreground">Tanda Terima Tunai</h2>
              <p className="text-xs text-muted-foreground">Bukti serah terima bertanda tangan</p>
            </div>
            <PrintButton className="btn-outline px-3 py-1.5 text-xs" targetId="doc-tanda-terima">
              <IconPrint width={14} height={14} /> Cetak Semua
            </PrintButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="th">Karyawan</th>
                  <th className="th text-right">Jumlah</th>
                  <th className="th">Tanda Tangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tunai.map((l, i) => (
                  <tr key={l.employee.id} className="hover:bg-muted">
                    <td className="td">
                      <p className="font-semibold text-foreground">{l.employee.name}</p>
                      <p className="text-xs text-muted-foreground">{l.employee.position}</p>
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
                    <td className="td text-muted-foreground" colSpan={3}>
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
