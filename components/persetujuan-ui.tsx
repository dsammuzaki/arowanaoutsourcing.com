"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { reviewChange } from "@/app/(app)/persetujuan/actions";

export type ChangeRow = {
  id: string;
  requester_name: string | null;
  requester_role: string | null;
  kind: string;
  target_label: string | null;
  payload: Record<string, unknown> | null;
  note: string | null;
  status: string;
  created_at: string;
};

const FIELD_LABEL: Record<string, string> = {
  position: "Jabatan",
  branch: "Cabang/Unit",
  bank_name: "Bank",
  bank_account: "No. Rekening",
  npwp: "NPWP",
  marital_status: "Status Kawin",
  dependents: "Tanggungan",
};

const roleLabel: Record<string, string> = {
  hr_pic: "HR / PIC",
  customer: "Customer",
  super_admin: "Super Admin",
  operation: "Operation",
  director: "Director",
  finance: "Finance",
};

const statusTone: Record<string, "amber" | "green" | "red" | "slate"> = {
  pending: "amber",
  disetujui: "green",
  ditolak: "red",
};

function fmt(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function PersetujuanList({ rows, canReview }: { rows: ChangeRow[]; canReview: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "disetujui" | "ditolak") {
    if (action === "ditolak" && !confirm("Tolak permintaan perubahan ini?")) return;
    setBusy(id);
    const res = await reviewChange(id, action);
    setBusy(null);
    if (!res.ok) alert(res.error || "Gagal memproses.");
    else router.refresh();
  }

  if (rows.length === 0)
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center">
        <Clock size={28} className="text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Tidak ada permintaan perubahan.</p>
      </Card>
    );

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">{r.target_label ?? r.kind}</span>
                <Badge tone="teal">{r.kind}</Badge>
                <Badge tone={statusTone[r.status] ?? "slate"}>{r.status}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Diajukan {roleLabel[r.requester_role ?? ""] ?? r.requester_role} · {r.requester_name} · {fmt(r.created_at)}
              </p>
            </div>
            {canReview && r.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => act(r.id, "disetujui")}
                  disabled={busy === r.id}
                  className="btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check size={15} /> Setujui
                </button>
                <button
                  onClick={() => act(r.id, "ditolak")}
                  disabled={busy === r.id}
                  className="btn bg-brand-red text-white hover:bg-brand-reddark disabled:opacity-50"
                >
                  <X size={15} /> Tolak
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 grid gap-2 rounded-lg bg-muted/50 p-3 sm:grid-cols-2">
            {Object.entries(r.payload ?? {}).map(([k, v]) => (
              <div key={k} className="text-sm">
                <span className="text-xs text-muted-foreground">{FIELD_LABEL[k] ?? k}</span>
                <p className="font-medium text-foreground">{String(v)}</p>
              </div>
            ))}
          </div>
          {r.note && <p className="mt-2 text-xs text-muted-foreground">Catatan: {r.note}</p>}
        </Card>
      ))}
    </div>
  );
}
