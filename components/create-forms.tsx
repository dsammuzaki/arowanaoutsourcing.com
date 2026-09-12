"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "./modal";
import { createJobPosting } from "@/app/(app)/rekrutmen/actions";
import { createInvoice } from "@/app/(app)/invoice/actions";

type ClientOpt = { id: string; name: string };

function useSubmit(action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const res = await action(new FormData(e.currentTarget));
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else setErr(res.error || "Gagal menyimpan.");
  }
  return { open, setOpen, loading, err, onSubmit };
}

function ErrLine({ err }: { err: string }) {
  if (!err) return null;
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red dark:bg-red-950/40">{err}</p>;
}

export function BuatLowonganButton({ clients }: { clients: ClientOpt[] }) {
  const s = useSubmit(createJobPosting);
  return (
    <>
      <button className="btn-primary" onClick={() => s.setOpen(true)}>
        <Plus size={16} /> Buat Lowongan
      </button>
      <Modal
        open={s.open}
        onClose={() => s.setOpen(false)}
        title="Buat Lowongan"
        subtitle="Tersimpan ke database"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" type="button" onClick={() => s.setOpen(false)}>Batal</button>
            <button form="lowongan-form" type="submit" className="btn-primary" disabled={s.loading}>
              {s.loading ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        }
      >
        <form id="lowongan-form" onSubmit={s.onSubmit} className="space-y-3">
          <div>
            <label className="label">Judul Lowongan *</label>
            <input name="title" className="input" required placeholder="mis. Security / Anggota" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Klien</label>
              <select name="client_id" className="input">
                <option value="">—</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Jenis</label>
              <select name="type" className="input" defaultValue="staff">
                <option value="staff">Staff</option>
                <option value="security">Security</option>
                <option value="cleaning">Cleaning</option>
                <option value="driver">Driver</option>
              </select>
            </div>
            <div>
              <label className="label">Lokasi</label>
              <input name="location" className="input" placeholder="mis. Bekasi" />
            </div>
            <div>
              <label className="label">Target (orang)</label>
              <input name="target" type="number" min="1" className="input" defaultValue={1} />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input" defaultValue="dibuka">
                <option value="dibuka">Dibuka</option>
                <option value="draft">Draft</option>
                <option value="ditutup">Ditutup</option>
              </select>
            </div>
          </div>
          <ErrLine err={s.err} />
        </form>
      </Modal>
    </>
  );
}

export function BuatInvoiceButton({ clients }: { clients: ClientOpt[] }) {
  const s = useSubmit(createInvoice);
  return (
    <>
      <button className="btn-primary" onClick={() => s.setOpen(true)}>
        <Plus size={16} /> Buat Invoice
      </button>
      <Modal
        open={s.open}
        onClose={() => s.setOpen(false)}
        title="Buat Invoice"
        subtitle="Mgmt Fee, PPN & PPh 23 dihitung otomatis"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" type="button" onClick={() => s.setOpen(false)}>Batal</button>
            <button form="invoice-form" type="submit" className="btn-primary" disabled={s.loading}>
              {s.loading ? "Menyimpan…" : "Buat"}
            </button>
          </div>
        }
      >
        <form id="invoice-form" onSubmit={s.onSubmit} className="space-y-3">
          <div>
            <label className="label">Klien *</label>
            <select name="client_id" className="input" required defaultValue="">
              <option value="" disabled>Pilih klien…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Periode</label>
              <input name="period" className="input" defaultValue="Agustus 2026" />
            </div>
            <div>
              <label className="label">Jatuh Tempo</label>
              <input name="due_date" type="date" className="input" defaultValue="2026-09-25" />
            </div>
          </div>
          <div>
            <label className="label">Subtotal Gaji Karyawan (Rp) *</label>
            <input name="salary_subtotal" type="number" min="0" className="input" required placeholder="mis. 120000000" />
          </div>
          <p className="text-xs text-muted-foreground">
            BPJS bagian klien, Management Fee, PPN, dan PPh 23 akan dihitung otomatis sesuai kontrak klien.
          </p>
          <ErrLine err={s.err} />
        </form>
      </Modal>
    </>
  );
}
