"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { saveContract } from "@/app/(app)/kontrak/actions";

const TYPES = [
  { value: "staff", label: "Staff" },
  { value: "security", label: "Security" },
  { value: "cleaning", label: "Cleaning" },
  { value: "driver", label: "Driver" },
];

export function AturKontrakButton({
  employeeId,
  defaultType,
}: {
  employeeId: string;
  defaultType?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ type: defaultType || "staff", startDate: today, termMonths: 12 });

  async function submit() {
    setBusy(true);
    setErr("");
    const res = await saveContract({
      employeeId,
      type: form.type,
      startDate: form.startDate,
      termMonths: Number(form.termMonths) || 12,
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else setErr(res.error || "Gagal menyimpan kontrak.");
  }

  return (
    <>
      <button className="btn-outline" onClick={() => setOpen(true)}>
        <FilePlus2 size={16} /> Atur / Perpanjang Kontrak
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Atur / Perpanjang Kontrak"
        subtitle="Tanggal berakhir dihitung otomatis dari durasi"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</button>
            <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? "Menyimpan…" : "Simpan Kontrak"}</button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jenis Kontrak</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Durasi (bulan)</label>
              <select className="input" value={form.termMonths} onChange={(e) => setForm({ ...form, termMonths: Number(e.target.value) })}>
                {[3, 6, 12, 18, 24].map((m) => (
                  <option key={m} value={m}>{m} bulan</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tanggal Mulai</label>
            <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          {err && <p className="text-sm text-brand-red">{err}</p>}
          <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            Menyimpan akan membuat kontrak baru (perpanjangan). Monitoring memakai kontrak terbaru.
          </p>
        </div>
      </Modal>
    </>
  );
}
