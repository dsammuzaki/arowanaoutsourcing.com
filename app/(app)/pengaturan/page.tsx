import { PageHeader, Card, Badge } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { ptkpTable, pph21Brackets, bpjsRates, legalEntities } from "@/lib/data";
import { rupiah } from "@/lib/format";

export default function PengaturanPage() {
  return (
    <>
      <PageHeader
        title="Pengaturan Rate Pajak & BPJS"
        subtitle="Ubah tarif PTKP, PPh 21, dan BPJS tanpa perlu deploy ulang aplikasi"
        actions={
          <button className="btn-primary">
            <IconCheck width={16} height={16} /> Simpan Perubahan
          </button>
        }
      />

      <div className="mb-4 rounded-lg border border-teal/30 bg-teal-soft/30 px-4 py-3 text-sm text-teal-deep">
        Perubahan rate berlaku untuk perhitungan payroll periode berikutnya. Riwayat rate
        lama tetap tersimpan (berdasarkan tanggal berlaku).
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PTKP */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-navy">Tabel PTKP (setahun)</h2>
            <p className="text-xs text-slate-500">Penghasilan Tidak Kena Pajak per status</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            {Object.entries(ptkpTable).map(([key, val]) => (
              <div key={key}>
                <label className="label">{key}</label>
                <input className="input" defaultValue={rupiah(val)} />
              </div>
            ))}
          </div>
        </Card>

        {/* PPh 21 brackets */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-navy">Tarif PPh 21 Progresif</h2>
            <p className="text-xs text-slate-500">Lapisan penghasilan kena pajak</p>
          </div>
          <div className="divide-y divide-slate-100">
            {pph21Brackets.map((b, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-sm text-slate-600">
                  {i === 0
                    ? "s/d "
                    : rupiah(pph21Brackets[i - 1].upTo, { compact: true }) + " – "}
                  {b.upTo === Infinity ? "ke atas" : rupiah(b.upTo, { compact: true })}
                </span>
                <div className="flex items-center gap-1">
                  <input className="input w-20 text-right" defaultValue={b.rate} />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* BPJS employee */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-navy">BPJS — Potongan Karyawan</h2>
            <p className="text-xs text-slate-500">Dipotong dari gaji karyawan</p>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
            {[
              { label: "JHT (%)", val: bpjsRates.jhtEmployee },
              { label: "Jaminan Pensiun (%)", val: bpjsRates.jpEmployee },
              { label: "Kesehatan (%)", val: bpjsRates.kesehatanEmployee },
            ].map((f) => (
              <div key={f.label}>
                <label className="label">{f.label}</label>
                <input className="input" defaultValue={f.val} />
              </div>
            ))}
          </div>
          <p className="px-5 pb-4 text-xs text-slate-400">
            Biaya Jabatan: {bpjsRates.biayaJabatanPct}% (maks Rp 500.000/bln) — pengurang PPh 21.
          </p>
        </Card>

        {/* BPJS client */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-navy">BPJS — Bagian Tagihan Klien</h2>
            <p className="text-xs text-slate-500">Dibebankan ke invoice klien</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            {[
              { label: "JHT (%)", val: bpjsRates.jhtClient },
              { label: "JKK (%)", val: bpjsRates.jkkClient },
              { label: "JKM (%)", val: bpjsRates.jkmClient },
              { label: "Jaminan Pensiun (%)", val: bpjsRates.jpClient },
              { label: "Kesehatan (%)", val: bpjsRates.kesehatanClient },
            ].map((f) => (
              <div key={f.label}>
                <label className="label">{f.label}</label>
                <input className="input" defaultValue={f.val} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Legal entities */}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-navy">Badan Usaha (Multi-Entitas)</h2>
          <p className="text-xs text-slate-500">Badan usaha penagih dalam grup usaha</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Nama Badan Usaha</th>
                <th className="th">NPWP</th>
                <th className="th">Prefix Invoice</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {legalEntities.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="td font-semibold">{e.name}</td>
                  <td className="td text-slate-500">{e.npwp}</td>
                  <td className="td">
                    <Badge tone="teal">{e.invoicePrefix}</Badge>
                  </td>
                  <td className="td">
                    <Badge tone="green">Aktif</Badge>
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
