"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import type { PayrollConfig } from "@/lib/data";
import { rupiah } from "@/lib/format";
import { saveSettings } from "@/app/(app)/pengaturan/actions";

export function PengaturanForm({ config }: { config: PayrollConfig }) {
  const router = useRouter();
  const [ptkp, setPtkp] = useState<Record<string, number>>({ ...config.ptkpTable });
  const [brackets, setBrackets] = useState(config.pph21Brackets.map((b) => ({ ...b })));
  const [rates, setRates] = useState({ ...config.bpjsRates });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function num(v: string) {
    return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await saveSettings({ ptkpTable: ptkp, pph21Brackets: brackets, bpjsRates: rates });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Tersimpan. Perhitungan payroll akan memakai tarif ini." });
      router.refresh();
    } else setMsg({ ok: false, text: res.error || "Gagal menyimpan." });
  }

  const empField = (label: string, key: keyof typeof rates) => (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        step="0.01"
        value={rates[key]}
        onChange={(e) => setRates((s) => ({ ...s, [key]: num(e.target.value) }))}
      />
    </div>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal/30 bg-teal-soft/30 px-4 py-3 text-sm text-primary">
        <span>Perubahan berlaku untuk perhitungan payroll & BPJS berikutnya, dan tersimpan permanen.</span>
        <button className="btn-primary" onClick={save} disabled={busy}>
          <IconCheck width={16} height={16} /> {busy ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </div>
      {msg && (
        <div
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
            msg.ok
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-red-50 text-brand-red dark:bg-red-950/40"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PTKP */}
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Tabel PTKP (setahun)</h2>
            <p className="text-xs text-muted-foreground">Penghasilan Tidak Kena Pajak per status</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            {Object.keys(ptkp).map((key) => (
              <div key={key}>
                <label className="label">{key}</label>
                <input
                  className="input"
                  type="number"
                  value={ptkp[key]}
                  onChange={(e) => setPtkp((s) => ({ ...s, [key]: num(e.target.value) }))}
                />
                <p className="mt-0.5 text-[11px] text-muted-foreground">{rupiah(ptkp[key])}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* PPh 21 brackets */}
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Tarif PPh 21 Progresif</h2>
            <p className="text-xs text-muted-foreground">Lapisan penghasilan kena pajak</p>
          </div>
          <div className="divide-y divide-border">
            {brackets.map((b, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-sm text-muted-foreground">
                  {i === 0 ? "s/d " : rupiah(brackets[i - 1].upTo, { compact: true }) + " – "}
                  {b.upTo === Infinity || b.upTo >= 5000000000 ? "ke atas" : rupiah(b.upTo, { compact: true })}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    className="input w-20 text-right"
                    type="number"
                    value={b.rate}
                    onChange={(e) =>
                      setBrackets((s) => s.map((x, xi) => (xi === i ? { ...x, rate: num(e.target.value) } : x)))
                    }
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* BPJS employee */}
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">BPJS — Potongan Karyawan</h2>
            <p className="text-xs text-muted-foreground">Dipotong dari gaji karyawan</p>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
            {empField("JHT (%)", "jhtEmployee")}
            {empField("Jaminan Pensiun (%)", "jpEmployee")}
            {empField("Kesehatan (%)", "kesehatanEmployee")}
          </div>
          <div className="px-5 pb-4">{empField("Biaya Jabatan (%)", "biayaJabatanPct")}</div>
        </Card>

        {/* BPJS client */}
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">BPJS — Bagian Tagihan Klien</h2>
            <p className="text-xs text-muted-foreground">Dibebankan ke invoice klien</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            {empField("JHT (%)", "jhtClient")}
            {empField("JKK (%)", "jkkClient")}
            {empField("JKM (%)", "jkmClient")}
            {empField("Jaminan Pensiun (%)", "jpClient")}
            {empField("Kesehatan (%)", "kesehatanClient")}
          </div>
        </Card>
      </div>
    </>
  );
}
