"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Camera, ExternalLink, Trash2, ShieldCheck } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { deleteAttendance } from "@/app/(app)/absensi/actions";

export type LogRow = {
  id: string;
  employee_id?: string | null;
  employee_name: string | null;
  kind: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  address: string | null;
  selfie_url: string | null;
  distance_m: number | null;
  status: string;
};

const attStatusMeta: Record<string, { label: string; tone: "green" | "red" | "amber" | "slate" }> = {
  valid: { label: "Valid", tone: "green" },
  diluar_area: { label: "Di luar area", tone: "red" },
  akurasi_rendah: { label: "Akurasi rendah", tone: "amber" },
  mencurigakan: { label: "Mencurigakan", tone: "red" },
};

function fmtWaktu(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AttendanceLog({ rows, canDelete }: { rows: LogRow[]; canDelete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function onDelete(r: LogRow) {
    if (!confirm(`Hapus absen ${r.employee_name ?? ""} (${fmtWaktu(r.created_at)})? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusy(r.id);
    const res = await deleteAttendance(r.id);
    setBusy(null);
    if (!res.ok) alert(res.error || "Gagal menghapus.");
    else router.refresh();
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-bold text-foreground">Log Absensi (Realtime)</h2>
          <p className="text-xs text-muted-foreground">Titik lokasi, alamat, foto selfie, dan status keamanan tiap absen</p>
        </div>
        <ShieldCheck size={18} className="text-primary" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="th">Karyawan</th>
              <th className="th">Waktu (WIB)</th>
              <th className="th">Jenis</th>
              <th className="th">Lokasi & Alamat</th>
              <th className="th text-center">Foto</th>
              <th className="th">Status</th>
              {canDelete && <th className="th text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td className="td text-muted-foreground" colSpan={canDelete ? 7 : 6}>
                  Belum ada data absen. Gunakan tombol “Absen Masuk” di atas.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="td font-semibold">{r.employee_name ?? "—"}</td>
                <td className="td text-muted-foreground">{fmtWaktu(r.created_at)}</td>
                <td className="td">
                  <Badge tone={r.kind === "masuk" ? "teal" : "slate"}>{r.kind === "masuk" ? "Masuk" : "Pulang"}</Badge>
                </td>
                <td className="td max-w-xs">
                  <p className="truncate text-xs text-muted-foreground" title={r.address ?? ""}>
                    {r.address ?? "Alamat tidak tersedia"}
                  </p>
                  {r.lat != null && r.lng != null && (
                    <a
                      href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <MapPin size={11} /> {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                      {r.accuracy != null ? ` · ±${Math.round(r.accuracy)}m` : ""}
                      <ExternalLink size={10} />
                    </a>
                  )}
                </td>
                <td className="td text-center">
                  {r.selfie_url ? (
                    <a href={r.selfie_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.selfie_url} alt="selfie" className="mx-auto h-10 w-10 rounded-lg object-cover" />
                    </a>
                  ) : (
                    <Camera size={16} className="mx-auto text-muted-foreground/50" />
                  )}
                </td>
                <td className="td">
                  <Badge tone={attStatusMeta[r.status]?.tone ?? "slate"}>
                    {attStatusMeta[r.status]?.label ?? r.status}
                  </Badge>
                  {r.distance_m != null && <p className="mt-0.5 text-[10px] text-muted-foreground">{r.distance_m} m dari lokasi</p>}
                </td>
                {canDelete && (
                  <td className="td text-right">
                    <button
                      onClick={() => onDelete(r)}
                      disabled={busy === r.id}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-brand-red/10 hover:text-brand-red disabled:opacity-40"
                      title="Hapus absensi"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
