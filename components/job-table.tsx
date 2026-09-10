"use client";

import { useState } from "react";
import { MapPin, Users, Target as TargetIcon } from "lucide-react";
import { Badge, StatusPill } from "@/components/ui";
import { Modal } from "@/components/modal";
import { contractTypeLabel } from "@/lib/data";

export type JobRow = {
  id: string;
  title: string;
  client_id: string | null;
  type: string | null;
  location: string | null;
  applicants: number;
  target: number;
  status: string;
};

function typeLabel(t: string | null) {
  if (!t) return null;
  return contractTypeLabel[t as keyof typeof contractTypeLabel] ?? t;
}

export function JobTable({ jobs, clientMap }: { jobs: JobRow[]; clientMap: Record<string, string> }) {
  const [sel, setSel] = useState<JobRow | null>(null);
  const pct = sel && sel.target > 0 ? Math.min(100, Math.round((sel.applicants / sel.target) * 100)) : 0;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="th">Posisi</th>
              <th className="th">Klien</th>
              <th className="th">Lokasi</th>
              <th className="th text-right">Pelamar</th>
              <th className="th text-right">Target</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.length === 0 && (
              <tr>
                <td className="td text-muted-foreground" colSpan={6}>
                  Belum ada lowongan.
                </td>
              </tr>
            )}
            {jobs.map((j) => (
              <tr key={j.id} className="cursor-pointer hover:bg-muted" onClick={() => setSel(j)}>
                <td className="td">
                  <p className="font-semibold text-foreground hover:text-primary">{j.title}</p>
                  {j.type && <Badge tone="teal">{typeLabel(j.type)}</Badge>}
                </td>
                <td className="td text-muted-foreground">{j.client_id ? clientMap[j.client_id] ?? "-" : "-"}</td>
                <td className="td">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin size={13} /> {j.location}
                  </span>
                </td>
                <td className="td text-right font-semibold">{j.applicants}</td>
                <td className="td text-right text-muted-foreground">{j.target}</td>
                <td className="td">
                  <StatusPill status={j.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.title ?? ""}
        subtitle={sel ? (sel.client_id ? clientMap[sel.client_id] : "Umum") : ""}
        size="md"
      >
        {sel && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {sel.type && <Badge tone="teal">{typeLabel(sel.type)}</Badge>}
              <StatusPill status={sel.status} />
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={14} /> {sel.location}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/60 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users size={13} /> Pelamar
                </div>
                <p className="text-2xl font-bold text-foreground">{sel.applicants}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TargetIcon size={13} /> Target
                </div>
                <p className="text-2xl font-bold text-foreground">{sel.target}</p>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Pemenuhan target</span>
                <span className="font-semibold text-foreground">{pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              Kelola pipeline kandidat di papan Pipeline Kandidat pada halaman ini. Ubah status lowongan
              saat target pelamar terpenuhi.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
