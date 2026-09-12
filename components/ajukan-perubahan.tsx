"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";
import { Modal } from "@/components/modal";
import { requestChange } from "@/app/(app)/persetujuan/actions";

export type EmpEditable = {
  id: string;
  name: string;
  position: string;
  branch: string;
  bankName: string;
  bankAccount: string;
  npwp: string;
  maritalStatus: string;
  dependents: number;
};

// key payload (snake_case) -> nilai awal + label
const FIELDS: { key: string; label: string; get: (e: EmpEditable) => string }[] = [
  { key: "position", label: "Jabatan", get: (e) => e.position },
  { key: "branch", label: "Cabang / Unit", get: (e) => e.branch },
  { key: "bank_name", label: "Bank", get: (e) => e.bankName },
  { key: "bank_account", label: "No. Rekening", get: (e) => e.bankAccount },
  { key: "npwp", label: "NPWP", get: (e) => e.npwp },
];

export function AjukanPerubahanButton({ emp }: { emp: EmpEditable }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const initial = Object.fromEntries(FIELDS.map((f) => [f.key, f.get(emp)]));
  const [form, setForm] = useState<Record<string, string>>(initial);
  const [note, setNote] = useState("");

  async function submit() {
    setErr("");
    const payload: Record<string, string> = {};
    for (const f of FIELDS) if ((form[f.key] ?? "") !== (initial[f.key] ?? "")) payload[f.key] = form[f.key];
    if (Object.keys(payload).length === 0) {
      setErr("Belum ada perubahan.");
      return;
    }
    setBusy(true);
    const res = await requestChange({
      kind: "karyawan",
      targetId: emp.id,
      targetLabel: emp.name,
      payload,
      note,
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else setErr(res.error || "Gagal mengajukan.");
  }

  return (
    <>
      <button className="btn-outline" onClick={() => { setOpen(true); setDone(false); setForm(initial); }}>
        <PencilLine size={16} /> Ajukan Perubahan
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajukan Perubahan Data"
        subtitle={`${emp.name} · perlu persetujuan manajemen`}
        footer={
          done ? (
            <div className="flex justify-end">
              <button className="btn-primary" onClick={() => setOpen(false)}>Tutup</button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</button>
              <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? "Mengirim…" : "Ajukan"}</button>
            </div>
          )
        }
      >
        {done ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            Permintaan perubahan terkirim. Perubahan akan diterapkan setelah disetujui manajemen (menu Persetujuan).
          </div>
        ) : (
          <div className="space-y-3">
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              Ubah nilai yang perlu. Hanya field yang berubah yang diajukan — perlu persetujuan Super Admin / Operation / Director.
            </p>
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input
                  className="input"
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="label">Catatan (opsional)</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Alasan perubahan…" />
            </div>
            {err && <p className="text-sm text-brand-red">{err}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
