"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X } from "lucide-react";
import { Modal } from "./modal";
import { StatusPill, Badge, Avatar } from "./ui";
import { createLeave, updateLeaveStatus } from "@/app/(app)/cuti/actions";
import { tanggal } from "@/lib/format";

type EmpOpt = { id: string; name: string };
const LEAVE_TYPES = ["Tahunan", "Sakit", "Izin", "Penting", "Melahirkan"];
const typeTone: Record<string, string> = {
  Tahunan: "teal",
  Sakit: "amber",
  Melahirkan: "gold",
  Izin: "slate",
  Penting: "navy",
};

export function AjukanCutiButton({ employees }: { employees: EmpOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const res = await createLeave(new FormData(e.currentTarget));
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else setErr(res.error || "Gagal mengajukan.");
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} /> Ajukan Cuti
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajukan Cuti / Izin"
        subtitle="Pengajuan tersimpan ke database"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button form="cuti-form" type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Mengirim…" : "Ajukan"}
            </button>
          </div>
        }
      >
        <form id="cuti-form" onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Karyawan *</label>
            <select name="employee_id" className="input" required defaultValue="">
              <option value="" disabled>
                Pilih karyawan…
              </option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jenis</label>
              <select name="type" className="input" defaultValue="Tahunan">
                {LEAVE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div />
            <div>
              <label className="label">Mulai *</label>
              <input name="start_date" type="date" className="input" required />
            </div>
            <div>
              <label className="label">Selesai *</label>
              <input name="end_date" type="date" className="input" required />
            </div>
          </div>
          <div>
            <label className="label">Alasan</label>
            <input name="reason" className="input" placeholder="mis. Keperluan keluarga" />
          </div>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red dark:bg-red-950/40">{err}</p>}
        </form>
      </Modal>
    </>
  );
}

export type LeaveRow = {
  id: string;
  employee_name: string;
  type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: string;
};

export function LeaveTable({ rows }: { rows: LeaveRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, status: "disetujui" | "ditolak") {
    setBusy(id);
    const res = await updateLeaveStatus(id, status);
    setBusy(null);
    if (res.ok) router.refresh();
    else alert(res.error || "Gagal.");
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="th">Karyawan</th>
            <th className="th">Jenis</th>
            <th className="th">Tanggal</th>
            <th className="th text-right">Hari</th>
            <th className="th">Status</th>
            <th className="th text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 && (
            <tr>
              <td className="td text-muted-foreground" colSpan={6}>
                Belum ada pengajuan cuti.
              </td>
            </tr>
          )}
          {rows.map((l) => (
            <tr key={l.id} className="hover:bg-muted">
              <td className="td">
                <div className="flex items-center gap-3">
                  <Avatar name={l.employee_name} tone="navy" />
                  <div>
                    <p className="font-semibold text-foreground">{l.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{l.reason}</p>
                  </div>
                </div>
              </td>
              <td className="td">
                <Badge tone={typeTone[l.type] ?? "slate"}>{l.type}</Badge>
              </td>
              <td className="td text-muted-foreground">
                {tanggal(l.start_date)} – {tanggal(l.end_date)}
              </td>
              <td className="td text-right font-semibold">{l.days}</td>
              <td className="td">
                <StatusPill status={l.status} />
              </td>
              <td className="td text-right">
                {l.status === "pending" ? (
                  <div className="flex justify-end gap-1">
                    <button
                      disabled={busy === l.id}
                      onClick={() => act(l.id, "disetujui")}
                      className="rounded-md bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                      title="Setujui"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      disabled={busy === l.id}
                      onClick={() => act(l.id, "ditolak")}
                      className="rounded-md bg-red-50 p-1.5 text-brand-red hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/40"
                      title="Tolak"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
