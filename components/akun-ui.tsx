"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, X, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import { createAccount, updateRole, deleteAccount } from "@/app/(app)/akun/actions";

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "operation", label: "Operation" },
  { value: "director", label: "Director" },
  { value: "finance", label: "Finance" },
  { value: "hr_pic", label: "HR / PIC" },
  { value: "customer", label: "Customer" },
];

const roleTone: Record<string, "teal" | "green" | "amber" | "slate" | "navy" | "gold"> = {
  super_admin: "amber",
  operation: "teal",
  director: "green",
  finance: "slate",
  hr_pic: "navy",
  customer: "gold",
};

export type AccountRow = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
};

export function TambahAkunButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "operation" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await createAccount(form);
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setForm({ fullName: "", email: "", password: "", role: "operation" });
      router.refresh();
    } else {
      setErr(res.error || "Gagal membuat akun.");
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <UserPlus size={16} /> Tambah Akun
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60" onClick={() => !busy && setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Tambah Akun Baru</h2>
              <button onClick={() => !busy && setOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Nama Lengkap</label>
                <input
                  className="input"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="mis. Budi Santoso"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="budi@arowana.co.id"
                />
              </div>
              <div>
                <label className="label">Password (min. 8 karakter)</label>
                <input
                  className="input"
                  type="text"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password awal untuk login"
                />
              </div>
              <div>
                <label className="label">Role / Hak Akses</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {err && <p className="text-sm text-brand-red">{err}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Menyimpan…" : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function AccountsTable({ rows, meId }: { rows: AccountRow[]; meId: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");

  async function onRole(id: string, role: string) {
    setBusyId(id);
    const res = await updateRole(id, role);
    setBusyId("");
    if (!res.ok) alert(res.error || "Gagal mengubah role.");
    else router.refresh();
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Hapus akun "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusyId(id);
    const res = await deleteAccount(id);
    setBusyId("");
    if (!res.ok) alert(res.error || "Gagal menghapus akun.");
    else router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="th">Nama</th>
            <th className="th">Email</th>
            <th className="th">Role</th>
            <th className="th">Dibuat</th>
            <th className="th text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            const isMe = r.id === meId;
            return (
              <tr key={r.id} className="hover:bg-muted">
                <td className="td font-semibold">
                  {r.fullName}
                  {isMe && <span className="ml-2 text-xs text-muted-foreground">(Anda)</span>}
                </td>
                <td className="td text-muted-foreground">{r.email}</td>
                <td className="td">
                  {isMe ? (
                    <Badge tone={roleTone[r.role] ?? "slate"}>
                      <ShieldCheck size={12} className="mr-1 inline" />
                      {roleOptions.find((o) => o.value === r.role)?.label ?? r.role}
                    </Badge>
                  ) : (
                    <select
                      className="input h-8 py-0 text-sm"
                      value={r.role}
                      disabled={busyId === r.id}
                      onChange={(e) => onRole(r.id, e.target.value)}
                    >
                      {roleOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="td text-muted-foreground">{r.createdAt}</td>
                <td className="td text-right">
                  <button
                    className="rounded-lg p-2 text-muted-foreground hover:bg-brand-red/10 hover:text-brand-red disabled:opacity-40"
                    disabled={isMe || busyId === r.id}
                    title={isMe ? "Tidak bisa hapus akun sendiri" : "Hapus akun"}
                    onClick={() => onDelete(r.id, r.fullName)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td className="td text-center text-muted-foreground" colSpan={5}>
                Belum ada akun.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
