"use client";

import { useState } from "react";
import { StatusPill, Avatar } from "@/components/ui";
import { Modal } from "@/components/modal";
import { rupiah } from "@/lib/format";

export type FeeRow = {
  id: string;
  recipient: string;
  clientName: string;
  base: number;
  feePct: number;
  total: number;
  status: string;
};

export function FeeTable({ rows }: { rows: FeeRow[] }) {
  const [sel, setSel] = useState<FeeRow | null>(null);
  const pph23 = sel ? Math.round(sel.base * 0.02) : 0; // ilustrasi PPh 23 (2%)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="th">Penerima</th>
              <th className="th">Kontrak / Klien</th>
              <th className="th text-right">Dasar (MF neto)</th>
              <th className="th text-right">Persentase</th>
              <th className="th text-right">Total Fee</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td className="td text-muted-foreground" colSpan={6}>
                  Belum ada catatan fee.
                </td>
              </tr>
            )}
            {rows.map((f) => (
              <tr
                key={f.id}
                className="cursor-pointer hover:bg-muted"
                onClick={() => setSel(f)}
              >
                <td className="td">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.recipient} tone="navy" />
                    <span className="font-semibold text-foreground hover:text-primary">{f.recipient}</span>
                  </div>
                </td>
                <td className="td text-muted-foreground">{f.clientName}</td>
                <td className="td text-right text-muted-foreground">{rupiah(f.base)}</td>
                <td className="td text-right font-semibold">{f.feePct}%</td>
                <td className="td text-right font-semibold text-foreground">{rupiah(f.total)}</td>
                <td className="td">
                  <StatusPill status={f.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel ? `Fee — ${sel.recipient}` : ""}
        subtitle={sel?.clientName}
        size="md"
      >
        {sel && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
              <div>
                <p className="text-xs text-primary">Total Fee</p>
                <p className="text-[11px] text-muted-foreground">{sel.feePct}% dari MF neto</p>
              </div>
              <p className="text-xl font-bold text-foreground">{rupiah(sel.total)}</p>
            </div>
            <dl className="divide-y divide-border text-sm">
              {[
                { l: "Penerima", v: sel.recipient },
                { l: "Kontrak / Klien", v: sel.clientName },
                { l: "Dasar (Management Fee neto)", v: rupiah(sel.base) },
                { l: "Estimasi PPh 23 (2%)", v: rupiah(pph23) },
                { l: "Persentase Fee", v: `${sel.feePct}%` },
              ].map((x) => (
                <div key={x.l} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{x.l}</dt>
                  <dd className="text-right font-medium text-foreground">{x.v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusPill status={sel.status} />
                </dd>
              </div>
            </dl>
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              Rumus: <span className="font-semibold text-foreground">Fee = (Management Fee − PPh 23) × persentase</span>.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
