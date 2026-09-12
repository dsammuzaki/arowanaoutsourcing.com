"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { Logo } from "./logo";
import { IconTruck, IconDoc, IconPrint, IconDownload } from "./icons";
import { ClipboardList } from "lucide-react";
import { rupiah, tanggal } from "@/lib/format";
import { printElementById } from "@/lib/print";

const ADDRESS = "Ruko The East Point No.13, Tambun Selatan, Bekasi 17510";

export type InvoiceDoc = {
  number: string;
  period: string;
  dueDate: string;
  status: string;
  entityName: string;
  entityNpwp: string;
  clientName: string;
  spkNumber: string;
  grandTotal: number;
};

export type RekapRow = {
  name: string;
  position: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  rate: number;
};

function DocHeader({ inv, title }: { inv: InvoiceDoc; title: string }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 border-b-2 border-navy pb-4">
      <div className="flex items-center gap-3">
        <Logo size={46} />
        <div>
          <p className="text-base font-bold text-navy">{inv.entityName}</p>
          <p className="text-[11px] text-gray-500">NPWP {inv.entityNpwp}</p>
          <p className="text-[11px] text-gray-500">{ADDRESS}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-extrabold uppercase tracking-wide text-navy">{title}</p>
        <p className="text-sm font-semibold text-primary">{inv.number}</p>
        <p className="text-[11px] text-gray-500">Periode {inv.period}</p>
      </div>
    </div>
  );
}

const signature = (
  <div className="mt-8 flex justify-end">
    <div className="text-center text-sm">
      <p className="text-gray-600">Hormat kami,</p>
      <div className="h-16" />
      <p className="font-semibold text-navy">PT. Barata Sakti Utama</p>
      <p className="text-xs text-gray-500">Finance & Administration</p>
    </div>
  </div>
);

export function InvoiceDocsToolbar({
  inv,
  rekap,
  variant = "toolbar",
}: {
  inv: InvoiceDoc;
  rekap: RekapRow[];
  variant?: "toolbar" | "panel";
}) {
  const [doc, setDoc] = useState<null | "surat" | "memo" | "rekap">(null);
  const docId =
    doc === "surat" ? "doc-surat-jalan" : doc === "memo" ? "doc-internal-memo" : "doc-rekap-absensi";
  const docTitle =
    doc === "surat" ? "Surat Jalan" : doc === "memo" ? "Internal Memo" : "Rekap Absensi";

  const totalHadir = rekap.reduce((s, r) => s + r.hadir, 0);
  const avgRate = rekap.length ? Math.round(rekap.reduce((s, r) => s + r.rate, 0) / rekap.length) : 0;

  const panelDocs = [
    { key: "surat" as const, Icon: IconTruck, label: "Surat Jalan", desc: "Dokumen serah terima" },
    { key: "memo" as const, Icon: IconDoc, label: "Internal Memo", desc: "Nota internal penagihan" },
    { key: "rekap" as const, Icon: IconDoc, label: "Rekap Absensi", desc: "Lampiran kehadiran" },
  ];

  return (
    <>
      {variant === "toolbar" ? (
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={() => setDoc("surat")}>
            <IconTruck width={16} height={16} /> Surat Jalan
          </button>
          <button className="btn-outline" onClick={() => setDoc("memo")}>
            <IconDoc width={16} height={16} /> Internal Memo
          </button>
          <button className="btn-outline" onClick={() => setDoc("rekap")}>
            <ClipboardList size={16} /> Rekap Absensi
          </button>
          <button className="btn-outline" onClick={() => printElementById("doc-invoice")}>
            <IconPrint width={16} height={16} /> Cetak
          </button>
          <button className="btn-primary" onClick={() => printElementById("doc-invoice")}>
            <IconDownload width={16} height={16} /> Unduh PDF
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {panelDocs.map((d) => (
            <button
              key={d.key}
              onClick={() => setDoc(d.key)}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <d.Icon width={18} height={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={!!doc}
        onClose={() => setDoc(null)}
        title={docTitle}
        subtitle={`${inv.number} · ${inv.clientName}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setDoc(null)}>
              Tutup
            </button>
            <button className="btn-primary" onClick={() => printElementById(docId)}>
              <IconDownload width={16} height={16} /> Cetak / Simpan PDF
            </button>
          </div>
        }
      >
        {/* SURAT JALAN */}
        {doc === "surat" && (
          <div id="doc-surat-jalan" className="rounded-lg bg-white p-6 text-gray-800">
            <DocHeader inv={inv} title="Surat Jalan" />
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Kepada</p>
                <p className="font-semibold text-navy">{inv.clientName}</p>
                <p className="text-xs text-gray-500">No. SPK/PO: {inv.spkNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Tanggal</p>
                <p className="font-semibold text-navy">{tanggal(inv.dueDate)}</p>
              </div>
            </div>
            <p className="mb-3 text-sm text-gray-700">
              Bersama surat ini kami sampaikan dokumen penagihan beserta lampirannya untuk periode{" "}
              <span className="font-semibold">{inv.period}</span>:
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="border border-gray-300 px-3 py-2 text-left">No.</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Dokumen</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {[
                  `Invoice ${inv.number}`,
                  "Rekapitulasi Absensi",
                  "Faktur Pajak (PPN)",
                  "Internal Memo Penagihan",
                ].map((d, i) => (
                  <tr key={d}>
                    <td className="border border-gray-300 px-3 py-2">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">{d}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">1 berkas</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-gray-500">
              Mohon dokumen diterima dan ditandatangani sebagai bukti serah terima.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-8 text-center text-sm">
              <div>
                <p className="text-gray-600">Diserahkan oleh,</p>
                <div className="h-16" />
                <p className="border-t border-gray-400 pt-1 font-semibold text-navy">PT. Barata Sakti Utama</p>
              </div>
              <div>
                <p className="text-gray-600">Diterima oleh,</p>
                <div className="h-16" />
                <p className="border-t border-gray-400 pt-1 font-semibold text-navy">{inv.clientName}</p>
              </div>
            </div>
          </div>
        )}

        {/* INTERNAL MEMO */}
        {doc === "memo" && (
          <div id="doc-internal-memo" className="rounded-lg bg-white p-6 text-gray-800">
            <DocHeader inv={inv} title="Internal Memo" />
            <table className="mb-4 w-full text-sm">
              <tbody>
                {[
                  ["Kepada", "Divisi Keuangan"],
                  ["Dari", "Divisi Penagihan / Administrasi"],
                  ["Perihal", `Penagihan Invoice ${inv.number}`],
                  ["Tanggal", tanggal(inv.dueDate)],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="w-28 py-1 align-top text-gray-500">{k}</td>
                    <td className="py-1 font-medium text-navy">: {v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mb-3 text-sm leading-relaxed text-gray-700">
              Dengan ini kami sampaikan bahwa invoice untuk klien{" "}
              <span className="font-semibold">{inv.clientName}</span> periode{" "}
              <span className="font-semibold">{inv.period}</span> telah diterbitkan dengan nilai
              tagihan sebagai berikut:
            </p>
            <div className="mb-3 flex items-center justify-between rounded-lg bg-navy px-5 py-3 text-white">
              <span className="text-sm">Grand Total Tagihan</span>
              <span className="text-xl font-bold">{rupiah(inv.grandTotal)}</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">
              Mohon agar dapat diproses sesuai prosedur penagihan dan dilakukan pemantauan hingga
              pembayaran diterima. Jatuh tempo pembayaran pada{" "}
              <span className="font-semibold">{tanggal(inv.dueDate)}</span>.
            </p>
            {signature}
          </div>
        )}

        {/* REKAP ABSENSI */}
        {doc === "rekap" && (
          <div id="doc-rekap-absensi" className="rounded-lg bg-white p-6 text-gray-800">
            <DocHeader inv={inv} title="Rekap Absensi" />
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Klien</p>
                <p className="font-semibold text-navy">{inv.clientName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Rata-rata kehadiran</p>
                <p className="font-semibold text-navy">{avgRate}% · {rekap.length} tenaga kerja</p>
              </div>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="border border-gray-300 px-2 py-2 text-left">Nama</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Jabatan</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">H</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">I</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">S</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">A</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {rekap.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 px-2 py-3 text-center text-gray-500">
                      Tidak ada data tenaga kerja untuk klien ini.
                    </td>
                  </tr>
                )}
                {rekap.map((r) => (
                  <tr key={r.name}>
                    <td className="border border-gray-300 px-2 py-1.5 font-medium">{r.name}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{r.position}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{r.hadir}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{r.izin}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{r.sakit}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{r.alpha}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center font-semibold">{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td className="border border-gray-300 px-2 py-1.5" colSpan={2}>
                    Total Hari Hadir
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center" colSpan={4}>
                    {totalHadir} hari-orang
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{avgRate}%</td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-3 text-[11px] text-gray-500">Keterangan: H = Hadir, I = Izin, S = Sakit, A = Alpha.</p>
            {signature}
          </div>
        )}
      </Modal>
    </>
  );
}
