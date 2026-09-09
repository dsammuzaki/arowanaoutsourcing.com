"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus } from "lucide-react";
import { Modal } from "./modal";
import { createEmployee } from "@/app/(app)/karyawan/actions";

type ClientOpt = { id: string; name: string };
export type ExportRow = {
  name: string;
  nik: string;
  position: string;
  clientName: string;
  branch: string;
  npwp: string;
  bank_name: string;
  bank_account: string;
  join_date: string;
  status: string;
};

export function KaryawanToolbar({ clients, exportRows }: { clients: ClientOpt[]; exportRows: ExportRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function exportCsv() {
    const headers = ["Nama", "NIK", "Jabatan", "Klien", "Cabang", "NPWP", "Bank", "Rekening", "Bergabung", "Status"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];
    for (const r of exportRows) {
      lines.push([r.name, r.nik, r.position, r.clientName, r.branch, r.npwp, r.bank_name, r.bank_account, r.join_date, r.status].map(esc).join(","));
    }
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data-karyawan.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    const res = await createEmployee(fd);
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setErr(res.error || "Gagal menyimpan.");
    }
  }

  return (
    <>
      <button className="btn-outline" onClick={exportCsv}>
        <Download size={16} /> Ekspor
      </button>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} /> Tambah Karyawan
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah Karyawan"
        subtitle="Data tersimpan ke database Supabase"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setOpen(false)} type="button">
              Batal
            </button>
            <button form="emp-form" type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        }
      >
        <form id="emp-form" onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Nama Lengkap *</label>
              <input name="name" className="input" required placeholder="mis. Budi Santoso" />
            </div>
            <div>
              <label className="label">NIK Internal</label>
              <input name="nik" className="input" placeholder="otomatis bila kosong" />
            </div>
            <div>
              <label className="label">Jabatan</label>
              <input name="position" className="input" placeholder="mis. Security" />
            </div>
            <div>
              <label className="label">Klien / Penempatan</label>
              <select name="client_id" className="input">
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Jenis Kontrak</label>
              <select name="contract_type" className="input" defaultValue="staff">
                <option value="staff">Staff</option>
                <option value="security">Security</option>
                <option value="cleaning">Cleaning</option>
                <option value="driver">Driver</option>
              </select>
            </div>
            <div>
              <label className="label">Cabang / Unit</label>
              <input name="branch" className="input" placeholder="mis. Bekasi" />
            </div>
            <div>
              <label className="label">Jenis Kelamin</label>
              <select name="gender" className="input" defaultValue="L">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="label">Status Kawin</label>
              <select name="marital_status" className="input" defaultValue="TK">
                <option value="TK">TK (Tidak Kawin)</option>
                <option value="K">K (Kawin)</option>
              </select>
            </div>
            <div>
              <label className="label">Tanggungan</label>
              <input name="dependents" type="number" min="0" max="3" className="input" defaultValue={0} />
            </div>
            <div>
              <label className="label">NPWP</label>
              <input name="npwp" className="input" placeholder="- bila belum ada" />
            </div>
            <div>
              <label className="label">Bank</label>
              <input name="bank_name" className="input" placeholder="mis. BCA" />
            </div>
            <div>
              <label className="label">No. Rekening</label>
              <input name="bank_account" className="input" />
            </div>
            <div>
              <label className="label">Tanggal Masuk</label>
              <input name="join_date" type="date" className="input" />
            </div>
            <div>
              <label className="label">Gaji Pokok</label>
              <input name="basic_salary" type="number" min="0" className="input" placeholder="mis. 4500000" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Foto Profil</label>
              <input name="photo" type="file" accept="image/*" className="input file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-white" />
            </div>
          </div>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red dark:bg-red-950/40">{err}</p>}
        </form>
      </Modal>
    </>
  );
}
