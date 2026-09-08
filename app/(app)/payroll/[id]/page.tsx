import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Badge } from "@/components/ui";
import { Logo } from "@/components/logo";
import { IconPrint, IconDownload } from "@/components/icons";
import { employeeById, calcPayroll, clients, legalEntities, contractTypeLabel } from "@/lib/data";
import { rupiah } from "@/lib/format";

export default async function SlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const emp = employeeById(id);
  if (!emp) notFound();
  const l = calcPayroll(emp);
  const client = clients.find((c) => c.id === emp.clientId);
  const entity = legalEntities.find((e) => e.id === client?.entityId);

  const Row = ({ label, value, bold, red }: { label: string; value: string; bold?: boolean; red?: boolean }) => (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={bold ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={`${bold ? "font-bold" : ""} ${red ? "text-brand-red" : "text-foreground"}`}>{value}</span>
    </div>
  );

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/payroll" className="text-sm font-semibold text-primary hover:underline">
          ← Kembali ke Payroll
        </Link>
        <div className="flex gap-2">
          <button className="btn-outline">
            <IconPrint width={16} height={16} /> Cetak
          </button>
          <button className="btn-primary">
            <IconDownload width={16} height={16} /> Unduh PDF
          </button>
        </div>
      </div>

      <Card className="mx-auto max-w-3xl overflow-hidden">
        {/* Slip header */}
        <div className="flex items-start justify-between gap-4 border-b border-border bg-navy p-6 text-white">
          <div className="flex items-center gap-3">
            <Logo size={44} />
            <div>
              <p className="font-bold">{entity?.name}</p>
              <p className="text-xs text-teal-soft">NPWP {entity?.npwp}</p>
              <p className="mt-1 text-xs text-white/60">
                Ruko The East Point No.13, Tambun Selatan, Bekasi
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">SLIP GAJI</p>
            <p className="text-xs text-white/70">Periode Agustus 2026</p>
          </div>
        </div>

        {/* Employee info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-b border-border p-6 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Nama</p>
            <p className="font-semibold text-foreground">{emp.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">NIK</p>
            <p className="font-semibold text-foreground">{emp.nik}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Jabatan</p>
            <p className="font-semibold text-foreground">{emp.position}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status Pajak</p>
            <p className="font-semibold text-foreground">
              {emp.maritalStatus}/{emp.dependents}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Penempatan</p>
            <p className="font-semibold text-foreground">{client?.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Jenis Kontrak</p>
            <Badge tone="teal">{contractTypeLabel[emp.contractType]}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bank</p>
            <p className="font-semibold text-foreground">{emp.bankName} · {emp.bankAccount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">NPWP</p>
            <p className="font-semibold text-foreground">{emp.npwp}</p>
          </div>
        </div>

        {/* Earnings / Deductions */}
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
              Penghasilan
            </p>
            <div className="divide-y divide-border">
              {l.earnings.map((e) => (
                <Row key={e.label} label={e.label} value={rupiah(e.amount)} />
              ))}
            </div>
            <div className="mt-2 border-t-2 border-border pt-2">
              <Row label="Total Bruto" value={rupiah(l.gross)} bold />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-red">
              Potongan
            </p>
            <div className="divide-y divide-border">
              <Row label="BPJS TK + JP + Kesehatan" value={rupiah(l.bpjsEmployee)} />
              <Row label="PPh 21" value={rupiah(l.pph21)} red />
              {l.otherDeductions.map((d) => (
                <Row key={d.label} label={d.label} value={rupiah(d.amount)} />
              ))}
            </div>
            <div className="mt-2 border-t-2 border-border pt-2">
              <Row label="Total Potongan" value={rupiah(l.totalDeduction)} bold red />
            </div>
          </div>
        </div>

        {/* Tax basis note */}
        <div className="mx-6 mb-6 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-muted-foreground">Dasar Perhitungan PPh 21</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <span>Biaya Jabatan (5%): {rupiah(l.biayaJabatan)}</span>
            <span>PTKP setahun: {rupiah(l.ptkp)}</span>
            <span>PKP setahun: {rupiah(l.pkp)}</span>
            <span>PPh 21/bulan: {rupiah(l.pph21)}</span>
          </div>
        </div>

        {/* Take home */}
        <div className="flex items-center justify-between bg-primary/10 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-primary">GAJI DITERIMA (Take-Home Pay)</p>
            <p className="text-xs text-muted-foreground">
              Dibayarkan via {l.method === "tunai" ? "Tunai / Amplop" : `Transfer ${emp.bankName}`}
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">{rupiah(l.takeHome)}</p>
        </div>
      </Card>
    </>
  );
}
