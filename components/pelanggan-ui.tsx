"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { createCustomer, updateCustomer, deleteCustomer, type CustomerInput } from "@/app/(app)/pelanggan/actions";

export type EntityOpt = { id: string; name: string };
export type CustomerRow = {
  id: string;
  name: string;
  entityId: string;
  contractType: string;
  headcount: number;
  managementFeePct: number;
  ppnPct: number;
  pph23Pct: number;
  spkNumber: string;
  periodStart: string;
  periodEnd: string;
};

const CT_LABEL: Record<string, string> = {
  staff: "Staff / Office",
  security: "Security",
  cleaning: "Cleaning",
  driver: "Driver",
};

const empty: CustomerInput = {
  name: "",
  entityId: "",
  contractType: "staff",
  headcount: 0,
  managementFeePct: 7,
  ppnPct: 12,
  pph23Pct: 2,
  spkNumber: "",
  periodStart: "",
  periodEnd: "",
};

function fmtDate(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(+d) ? s : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function TambahPelangganButton({ entities }: { entities: EntityOpt[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} /> Pelanggan
      </button>
      {open && <CustomerModal entities={entities} onClose={() => setOpen(false)} />}
    </>
  );
}

export function CustomerTable({ rows, entities }: { rows: CustomerRow[]; entities: EntityOpt[] }) {
  const router = useRouter();
  const [editRow, setEditRow] = useState<CustomerRow | null>(null);
  const [busyId, setBusyId] = useState("");
  const entityName = (id: string) => entities.find((e) => e.id === id)?.name ?? "—";

  async function onDelete(r: CustomerRow) {
    if (!confirm(`Hapus pelanggan "${r.name}"? Karyawan yang terhubung tidak ikut terhapus, tetapi keterkaitannya dilepas.`)) return;
    setBusyId(r.id);
    const res = await deleteCustomer(r.id, r.name);
    setBusyId("");
    if (!res.ok) alert(res.error || "Gagal menghapus.");
    else router.refresh();
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Belum ada pelanggan. Klik <span className="font-semibold text-foreground">+ Pelanggan</span> untuk menambah.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="bg-muted/60">
              <th className="th">Nama Pelanggan</th>
              <th className="th">Badan Usaha</th>
              <th className="th text-center">Jenis</th>
              <th className="th text-center">Headcount</th>
              <th className="th text-center">Mgmt Fee</th>
              <th className="th">Periode Kontrak</th>
              <th className="th text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="bg-card hover:bg-muted/40">
                <td className="td">
                  <span className="font-medium text-foreground">{r.name}</span>
                  {r.spkNumber && <span className="block text-[11px] text-muted-foreground">SPK: {r.spkNumber}</span>}
                </td>
                <td className="td text-muted-foreground">{entityName(r.entityId)}</td>
                <td className="td text-center">
                  <span className="badge bg-primary/10 text-primary">{CT_LABEL[r.contractType] ?? r.contractType}</span>
                </td>
                <td className="td text-center tabular-nums">{r.headcount}</td>
                <td className="td text-center tabular-nums">{r.managementFeePct}%</td>
                <td className="td text-muted-foreground">
                  {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
                </td>
                <td className="td">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                      onClick={() => setEditRow(r)}
                      aria-label={`Edit ${r.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="rounded-lg p-2 text-muted-foreground hover:bg-brand-red/10 hover:text-brand-red disabled:opacity-50"
                      onClick={() => onDelete(r)}
                      disabled={busyId === r.id}
                      aria-label={`Hapus ${r.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editRow && <CustomerModal entities={entities} row={editRow} onClose={() => setEditRow(null)} />}
    </>
  );
}

function CustomerModal({
  entities,
  row,
  onClose,
}: {
  entities: EntityOpt[];
  row?: CustomerRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CustomerInput>(
    row
      ? {
          name: row.name,
          entityId: row.entityId,
          contractType: row.contractType,
          headcount: row.headcount,
          managementFeePct: row.managementFeePct,
          ppnPct: row.ppnPct,
          pph23Pct: row.pph23Pct,
          spkNumber: row.spkNumber,
          periodStart: row.periodStart,
          periodEnd: row.periodEnd,
        }
      : { ...empty, entityId: entities[0]?.id ?? "" }
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof CustomerInput, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr("");
    if (!form.name.trim()) {
      setErr("Nama pelanggan wajib diisi.");
      return;
    }
    setBusy(true);
    const res = row ? await updateCustomer(row.id, form) : await createCustomer(form);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || "Gagal menyimpan.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={row ? "Edit Pelanggan" : "Pelanggan Baru"}
      subtitle={row ? row.name : "Tambah perusahaan pelanggan/klien"}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Nama Pelanggan</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="mis. PT. Armas Logistic Service"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Badan Usaha (penerbit invoice)</label>
            <select className="input" value={form.entityId} onChange={(e) => set("entityId", e.target.value)}>
              {entities.map((en) => (
                <option key={en.id} value={en.id}>
                  {en.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Jenis Tenaga Kerja</label>
            <select className="input" value={form.contractType} onChange={(e) => set("contractType", e.target.value)}>
              <option value="staff">Staff / Office</option>
              <option value="security">Security</option>
              <option value="cleaning">Cleaning</option>
              <option value="driver">Driver</option>
            </select>
          </div>
          <div>
            <label className="label">Jumlah Tenaga Kerja (headcount)</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.headcount}
              onChange={(e) => set("headcount", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Management Fee (%)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              className="input"
              value={form.managementFeePct}
              onChange={(e) => set("managementFeePct", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">PPN (%)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              className="input"
              value={form.ppnPct}
              onChange={(e) => set("ppnPct", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">PPh 23 (%)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              className="input"
              value={form.pph23Pct}
              onChange={(e) => set("pph23Pct", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">No. SPK</label>
            <input className="input" value={form.spkNumber} onChange={(e) => set("spkNumber", e.target.value)} placeholder="SPK/…/2026/…" />
          </div>
          <div className="hidden sm:block" />
          <div>
            <label className="label">Periode Mulai</label>
            <input type="date" className="input" value={form.periodStart} onChange={(e) => set("periodStart", e.target.value)} />
          </div>
          <div>
            <label className="label">Periode Selesai</label>
            <input type="date" className="input" value={form.periodEnd} onChange={(e) => set("periodEnd", e.target.value)} />
          </div>
        </div>
        {err && (
          <p className="flex items-center gap-1.5 rounded-lg bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
            <Building2 size={15} /> {err}
          </p>
        )}
      </div>
    </Modal>
  );
}
