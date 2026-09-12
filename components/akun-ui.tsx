"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, X, ShieldCheck, Pencil, KeyRound, Eye, EyeOff, RefreshCw, Copy } from "lucide-react";
import { Badge } from "@/components/ui";
import { Modal } from "@/components/modal";
import { Mail } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { createAccount, updateRole, deleteAccount, updateAccount, resetPassword } from "@/app/(app)/akun/actions";

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

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
  const [editRow, setEditRow] = useState<AccountRow | null>(null);
  const [pwRow, setPwRow] = useState<AccountRow | null>(null);

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
                  <div className="flex justify-end gap-1">
                    <button
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Edit akun"
                      onClick={() => setEditRow(r)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      title="Reset password"
                      onClick={() => setPwRow(r)}
                    >
                      <KeyRound size={16} />
                    </button>
                    <button
                      className="rounded-lg p-2 text-muted-foreground hover:bg-brand-red/10 hover:text-brand-red disabled:opacity-40"
                      disabled={isMe || busyId === r.id}
                      title={isMe ? "Tidak bisa hapus akun sendiri" : "Hapus akun"}
                      onClick={() => onDelete(r.id, r.fullName)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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

      {editRow && <EditAccountModal row={editRow} isMe={editRow.id === meId} onClose={() => setEditRow(null)} onDone={() => { setEditRow(null); router.refresh(); }} />}
      {pwRow && <ResetPasswordModal row={pwRow} onClose={() => setPwRow(null)} />}
    </div>
  );
}

function EditAccountModal({
  row,
  isMe,
  onClose,
  onDone,
}: {
  row: AccountRow;
  isMe: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [fullName, setFullName] = useState(row.fullName);
  const [role, setRole] = useState(row.role);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setBusy(true);
    setErr("");
    const res = await updateAccount(row.id, { fullName, role });
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error || "Gagal menyimpan.");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Akun"
      subtitle={row.email}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Batal</button>
          <button className="btn-primary" onClick={save} disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Nama Lengkap</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">Role / Hak Akses</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)} disabled={isMe}>
            {roleOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {isMe && <p className="mt-1 text-xs text-muted-foreground">Role akun sendiri tidak bisa diubah.</p>}
        </div>
        <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          Email tidak diubah di sini. Untuk ganti password, gunakan tombol Reset Password.
        </p>
        {err && <p className="text-sm text-brand-red">{err}</p>}
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ row, onClose }: { row: AccountRow; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function sendResetEmail() {
    setErr("");
    setEmailing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(row.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setErr(error.message);
      else setEmailSent(true);
    } catch {
      setErr("Gagal mengirim email.");
    }
    setEmailing(false);
  }

  async function save() {
    if (pw.length < 8) {
      setErr("Password minimal 8 karakter.");
      return;
    }
    setBusy(true);
    setErr("");
    const res = await resetPassword(row.id, pw);
    setBusy(false);
    if (res.ok) setDone(true);
    else setErr(res.error || "Gagal reset password.");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Reset Password"
      subtitle={`${row.fullName} · ${row.email}`}
      footer={
        done ? (
          <div className="flex justify-end">
            <button className="btn-primary" onClick={onClose}>Selesai</button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={onClose} disabled={busy}>Batal</button>
            <button className="btn-primary" onClick={save} disabled={busy}>{busy ? "Menyimpan…" : "Simpan Password"}</button>
          </div>
        )
      }
    >
      {done ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            Password berhasil diperbarui. Bagikan password baru berikut ke pengguna:
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <code className="flex-1 truncate font-mono text-sm text-foreground">{pw}</code>
            <button
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Salin"
              onClick={() => { navigator.clipboard?.writeText(pw); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            >
              <Copy size={15} />
            </button>
          </div>
          {copied && <p className="text-xs text-primary">Tersalin.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            Password lama <b>tidak bisa dilihat</b> — tersimpan sebagai hash terenkripsi. Yang bisa dilakukan adalah menyetel password baru di bawah ini.
          </div>
          <div>
            <label className="label">Password Baru (min. 8 karakter)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className="input pr-9"
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Ketik atau Generate"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShow((s) => !s)}
                  title={show ? "Sembunyikan" : "Lihat"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="button" className="btn-outline whitespace-nowrap" onClick={() => { setPw(genPassword()); setShow(true); }}>
                <RefreshCw size={15} /> Generate
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">atau</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          {emailSent ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              Tautan reset dikirim ke <b>{row.email}</b>. Pengguna dapat menyetel password sendiri lewat email.
            </p>
          ) : (
            <button type="button" className="btn-outline w-full justify-center" onClick={sendResetEmail} disabled={emailing}>
              <Mail size={15} /> {emailing ? "Mengirim…" : "Kirim tautan reset ke email pengguna"}
            </button>
          )}

          {err && <p className="text-sm text-brand-red">{err}</p>}
        </div>
      )}
    </Modal>
  );
}
