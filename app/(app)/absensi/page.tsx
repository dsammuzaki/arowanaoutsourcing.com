import { cookies } from "next/headers";
import { PageHeader, Card, Badge } from "@/components/ui";
import { IconClock } from "@/components/icons";
import { MapPin, Camera, ExternalLink, ShieldCheck } from "lucide-react";
import { employees as mockEmployees, clients, attendanceSummary } from "@/lib/data";
import { LiveAttendance } from "@/components/live-attendance";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Status = "H" | "I" | "S" | "C" | "A";
const statusMeta: Record<Status, { label: string; cls: string }> = {
  H: { label: "Hadir", cls: "bg-primary/10 text-primary" },
  I: { label: "Izin", cls: "bg-amber-50 text-amber-700" },
  S: { label: "Sakit", cls: "bg-indigo-50 text-indigo-700" },
  C: { label: "Cuti", cls: "bg-muted text-muted-foreground" },
  A: { label: "Alpha", cls: "bg-red-50 text-brand-red" },
};

const attStatusMeta: Record<string, { label: string; tone: "green" | "red" | "amber" | "slate" }> = {
  valid: { label: "Valid", tone: "green" },
  diluar_area: { label: "Di luar area", tone: "red" },
  akurasi_rendah: { label: "Akurasi rendah", tone: "amber" },
  mencurigakan: { label: "Mencurigakan", tone: "red" },
};

function seedStatus(i: number, d: number): Status {
  const x = Math.abs(Math.sin((i + 1) * (d + 2) * 3.13));
  if (x > 0.93) return "A";
  if (x > 0.88) return "S";
  if (x > 0.82) return "I";
  if (x > 0.79) return "C";
  return "H";
}

const days = Array.from({ length: 14 }, (_, i) => i + 1);
const shown = mockEmployees.filter((e) => e.status === "aktif").slice(0, 12);

type LogRow = {
  id: string;
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

type SiteRow = { id: string; name: string; lat: number; lng: number; radius_m: number };

async function getData() {
  let empOptions = mockEmployees.filter((e) => e.status === "aktif").map((e) => ({ id: e.id, name: e.name }));
  let log: LogRow[] = [];
  let sites: SiteRow[] = [];
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const [{ data: emps }, { data: rows }, { data: siteRows }] = await Promise.all([
        sb.from("employees").select("id,name").eq("status", "aktif").order("name"),
        sb.from("attendance").select("*").order("created_at", { ascending: false }).limit(50),
        sb.from("attendance_sites").select("id,name,lat,lng,radius_m"),
      ]);
      if (emps && emps.length) empOptions = emps.map((e) => ({ id: e.id, name: e.name }));
      if (rows) log = rows as LogRow[];
      if (siteRows) sites = siteRows as SiteRow[];
    } catch {
      /* fallback */
    }
  }
  return { empOptions, log, sites };
}

function fmtWaktu(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function AbsensiPage() {
  const { empOptions, log, sites } = await getData();
  const cards = [
    { label: "Hadir", value: attendanceSummary.hadir, tone: "teal" },
    { label: "Izin", value: attendanceSummary.izin, tone: "amber" },
    { label: "Sakit", value: attendanceSummary.sakit, tone: "navy" },
    { label: "Alpha", value: attendanceSummary.alpha, tone: "red" },
  ];

  return (
    <>
      <PageHeader
        title="Absensi"
        subtitle="Alat absen karyawan berbasis GPS + selfie — anti lokasi palsu"
        actions={
          <select className="input w-auto">
            <option>Semua Klien</option>
            {clients.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
        }
      />

      <LiveAttendance employees={empOptions} sites={sites} />

      {/* Log absensi realtime dari database */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {log.length === 0 && (
                <tr>
                  <td className="td text-muted-foreground" colSpan={6}>
                    Belum ada data absen. Gunakan tombol “Absen Masuk” di atas. (Pastikan tabel absensi sudah dibuat.)
                  </td>
                </tr>
              )}
              {log.map((r) => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="td font-semibold">{r.employee_name ?? "—"}</td>
                  <td className="td text-muted-foreground">{fmtWaktu(r.created_at)}</td>
                  <td className="td">
                    <Badge tone={r.kind === "masuk" ? "teal" : "slate"}>
                      {r.kind === "masuk" ? "Masuk" : "Pulang"}
                    </Badge>
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
                    {r.distance_m != null && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{r.distance_m} m dari lokasi</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                c.tone === "red"
                  ? "bg-red-50 text-brand-red"
                  : c.tone === "amber"
                  ? "bg-amber-50 text-amber-700"
                  : c.tone === "navy"
                  ? "bg-navy/10 text-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <IconClock width={20} height={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <span className="mr-2 text-sm font-semibold text-foreground">Rekap Bulanan (contoh)</span>
          {(Object.keys(statusMeta) as Status[]).map((s) => (
            <span key={s} className={`badge ${statusMeta[s].cls}`}>
              {s} · {statusMeta[s].label}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted">
              <tr>
                <th className="th sticky left-0 z-10 bg-muted">Karyawan</th>
                {days.map((d) => (
                  <th key={d} className="th px-2 text-center">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((e, i) => (
                <tr key={e.id} className="hover:bg-muted">
                  <td className="td sticky left-0 z-10 bg-card">
                    <p className="font-semibold text-foreground">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.position}</p>
                  </td>
                  {days.map((d) => {
                    const st = seedStatus(i, d);
                    return (
                      <td key={d} className="px-2 py-2 text-center">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${statusMeta[st].cls}`}
                        >
                          {st}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
