"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { Modal } from "@/components/modal";
import {
  Clock3,
  MapPin,
  Camera,
  LogIn,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { recordAttendance } from "@/app/(app)/absensi/actions";

const WIB = "Asia/Jakarta";

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: WIB, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d);
}
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: WIB, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`,
      { headers: { Accept: "application/json" } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    return j.display_name ?? null;
  } catch {
    return null;
  }
}

type Emp = { id: string; name: string };
type Site = { id: string; name: string; lat: number; lng: number; radius_m: number };
type Result = { status: string; address: string | null; siteName: string | null; distance: number | null; kind: string; photo?: string };

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else cur = t;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  // potong bila kepanjangan
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxW && last.length > 1) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}

// Tempelkan waktu, koordinat, alamat, dan status geofence ke atas foto.
function stampPhoto(
  frame: HTMLCanvasElement,
  info: {
    dateStr: string;
    timeStr: string;
    lat: number;
    lng: number;
    accuracy: number;
    address: string | null;
    site: Site | null;
    distance: number | null;
    within: boolean;
  }
): string {
  const ctx = frame.getContext("2d");
  if (!ctx) return frame.toDataURL("image/jpeg", 0.85);
  const W = frame.width;
  const H = frame.height;
  const pad = Math.round(W * 0.035);
  const fs = Math.max(12, Math.round(W * 0.03));
  const fsB = Math.max(13, Math.round(W * 0.036));
  const lh = Math.round(fs * 1.4);

  ctx.font = `400 ${fs}px system-ui, -apple-system, sans-serif`;
  const addrLines = wrapText(ctx, info.address || "Alamat tidak tersedia", W - 2 * pad - Math.round(W * 0.02), 3);

  const lines: { t: string; b?: boolean; c?: string }[] = [
    { t: `${info.dateStr}, ${info.timeStr} WIB`, b: true },
    { t: `Koordinat: ${info.lat.toFixed(6)}, ${info.lng.toFixed(6)}  (±${Math.round(info.accuracy)}m)` },
    ...addrLines.map((t) => ({ t })),
  ];
  if (info.site)
    lines.push({
      t: `${info.site.name} · ${info.distance} m · ${info.within ? "DALAM AREA" : "LUAR AREA"}`,
      c: info.within ? "#6ee7b7" : "#fca5a5",
    });

  const bandH = pad * 2 + lines.length * lh;
  const top = H - bandH;
  const grad = ctx.createLinearGradient(0, top - 24, 0, H);
  grad.addColorStop(0, "rgba(4,16,26,0)");
  grad.addColorStop(0.3, "rgba(4,16,26,0.55)");
  grad.addColorStop(1, "rgba(4,16,26,0.9)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, top - 24, W, bandH + 24);
  // aksen teal
  ctx.fillStyle = "#1a7d9c";
  ctx.fillRect(0, top, Math.max(3, Math.round(W * 0.012)), bandH);

  const x = pad + Math.round(W * 0.02);
  let y = top + pad;
  ctx.textBaseline = "top";
  for (const ln of lines) {
    const size = ln.b ? fsB : fs;
    ctx.font = `${ln.b ? "700" : "400"} ${size}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText(ln.t, x + 1, y + 1);
    ctx.fillStyle = ln.c || (ln.b ? "#e7fbff" : "#ffffff");
    ctx.fillText(ln.t, x, y);
    y += lh;
  }

  // watermark kiri-atas
  ctx.font = `700 ${fsB}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillText("BSU · Absensi", pad + 1, pad + 1);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("BSU · Absensi", pad, pad);

  return frame.toDataURL("image/jpeg", 0.85);
}

const statusMeta: Record<string, { label: string; cls: string; ok: boolean }> = {
  valid: { label: "Valid", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", ok: true },
  diluar_area: { label: "Di luar area kerja", cls: "bg-red-50 text-brand-red dark:bg-red-950/40", ok: false },
  akurasi_rendah: { label: "Akurasi GPS rendah", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", ok: false },
  mencurigakan: { label: "Mencurigakan", cls: "bg-red-50 text-brand-red dark:bg-red-950/40", ok: false },
};

export function LiveAttendance({ employees, sites = [] }: { employees: Emp[]; sites?: Site[] }) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [empId, setEmpId] = useState(employees[0]?.id ?? "");
  const [kind, setKind] = useState<"masuk" | "pulang">("masuk");

  const [camOpen, setCamOpen] = useState(false);
  const [phase, setPhase] = useState<"kamera" | "lokasi" | "kirim">("kamera");
  const [busyMsg, setBusyMsg] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    setNow(new Date());
    return () => clearInterval(id);
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  useEffect(() => () => stopCamera(), []);

  async function openCamera() {
    setError("");
    setResult(null);
    setPhase("kamera");
    setCamOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setError("Tidak bisa mengakses kamera. Izinkan kamera untuk absen selfie.");
    }
  }

  function closeCamera() {
    stopCamera();
    setCamOpen(false);
    setBusyMsg("");
  }

  function grabFrame(): HTMLCanvasElement | null {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const w = 720;
    const h = Math.round((v.videoHeight / v.videoWidth) * w);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, w, h);
    return canvas;
  }

  function getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) return reject(new Error("Perangkat tidak mendukung GPS."));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      });
    });
  }

  async function submit() {
    if (!empId) {
      setError("Pilih karyawan dulu.");
      return;
    }
    setError("");
    // 1) bekukan frame foto pada saat klik
    const frame = grabFrame();
    if (!frame) {
      setError("Gagal mengambil foto. Coba lagi.");
      return;
    }

    // 2) sinyal anti-mock (klien)
    const clientFlags: string[] = [];
    try {
      if (!navigator.geolocation.getCurrentPosition.toString().includes("[native code]"))
        clientFlags.push("geolokasi_dimodifikasi");
    } catch {}

    // 3) ambil lokasi GPS (WAJIB)
    setPhase("lokasi");
    setBusyMsg("Mengambil titik lokasi GPS…");
    let pos: GeolocationPosition;
    try {
      pos = await getPosition();
    } catch (e: unknown) {
      const err = e as GeolocationPositionError;
      const msg =
        err?.code === 1
          ? "Izin lokasi ditolak. Nyalakan & izinkan GPS untuk absen."
          : err?.code === 3
          ? "GPS timeout. Pastikan sinyal GPS baik lalu coba lagi."
          : "Lokasi tidak terbaca. Pastikan GPS menyala.";
      setError(msg);
      setPhase("kamera");
      return;
    }
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    if (accuracy != null && (accuracy <= 0 || accuracy > 1000)) clientFlags.push("mock_terdeteksi");

    // 4) alamat lengkap (best-effort) + geofence terdekat
    setBusyMsg("Menentukan alamat lokasi…");
    const address = await reverseGeocode(lat, lng);
    let nearest: Site | null = null;
    let nearestDist = Infinity;
    for (const s of sites) {
      const d = haversineMeters(lat, lng, s.lat, s.lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = s;
      }
    }
    const within = !!nearest && nearestDist <= nearest.radius_m;

    // 5) tempelkan info ke foto
    const now2 = new Date();
    const selfie = stampPhoto(frame, {
      dateStr: fmtDate(now2),
      timeStr: fmtTime(now2),
      lat,
      lng,
      accuracy: accuracy ?? 0,
      address,
      site: nearest,
      distance: nearest ? Math.round(nearestDist) : null,
      within,
    });
    stopCamera();

    // 6) kirim ke server (server yang menilai keabsahan)
    setPhase("kirim");
    setBusyMsg("Menyimpan absensi…");
    const emp = employees.find((e) => e.id === empId);
    const res = await recordAttendance({
      employeeId: empId,
      employeeName: emp?.name ?? "",
      kind,
      lat,
      lng,
      accuracy: accuracy ?? 0,
      capturedAt: new Date(pos.timestamp).toISOString(),
      address: address ?? undefined,
      selfie,
      userAgent: navigator.userAgent,
      clientFlags,
    });

    if (!res.ok) {
      setError(res.error || "Gagal menyimpan absensi.");
      setPhase("kamera");
      openCamera();
      return;
    }
    setResult({
      status: res.status ?? "valid",
      address: res.address ?? address,
      siteName: res.siteName ?? null,
      distance: res.distance ?? null,
      kind,
      photo: selfie,
    });
    setCamOpen(false);
    router.refresh();
  }

  const timeStr = now ? fmtTime(now) : "--:--:--";
  const dateStr = now ? fmtDate(now) : "";
  const busy = !!busyMsg && phase !== "kamera";

  return (
    <Card className="mb-5 overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        {/* Jam realtime */}
        <div className="relative flex flex-col justify-center gap-1 bg-navy p-6 text-white">
          <span className="hero-anim pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2 text-teal-soft">
              <Clock3 size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">Waktu Sekarang · WIB</span>
              <span className="pulse-dot ml-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <p className="font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{timeStr}</p>
            <p className="mt-1 text-sm text-white/70">{dateStr || "Memuat…"}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-white/60">
              <ShieldCheck size={12} /> Absen wajib GPS aktif + foto selfie langsung
            </p>
          </div>
        </div>

        {/* Panel absen */}
        <div className="flex flex-col justify-center gap-3 p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Karyawan</label>
              <select className="input" value={empId} onChange={(e) => setEmpId(e.target.value)}>
                {employees.length === 0 && <option value="">(tidak ada data)</option>}
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Jenis</label>
              <div className="inline-flex w-full rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setKind("masuk")}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium ${
                    kind === "masuk" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <LogIn size={15} /> Masuk
                </button>
                <button
                  onClick={() => setKind("pulang")}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium ${
                    kind === "pulang" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <LogOut size={15} /> Pulang
                </button>
              </div>
            </div>
          </div>

          <button className="btn-primary justify-center" onClick={openCamera} disabled={!empId}>
            <Camera size={16} /> Absen {kind === "masuk" ? "Masuk" : "Pulang"} (Selfie + GPS)
          </button>

          {error && !camOpen && (
            <p className="flex items-center gap-1.5 text-sm text-brand-red">
              <ShieldAlert size={14} /> {error}
            </p>
          )}

          {result && (
            <div className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Absen {result.kind === "masuk" ? "Masuk" : "Pulang"} tercatat
                </span>
                <span className={`badge ${statusMeta[result.status]?.cls ?? statusMeta.valid.cls}`}>
                  {statusMeta[result.status]?.label ?? result.status}
                </span>
              </div>
              {result.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.photo} alt="Foto absen bertitik lokasi" className="mb-2 w-full rounded-lg" />
              )}
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin size={13} className="mt-0.5 shrink-0 text-primary" />
                {result.address ?? "Alamat tidak tersedia (koordinat tersimpan)"}
              </p>
              {result.siteName && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Lokasi terdekat: {result.siteName}
                  {result.distance != null ? ` · ${result.distance} m` : ""}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal kamera + proses */}
      <Modal open={camOpen} onClose={closeCamera} title="Absen Selfie" subtitle="Wajahkan ke kamera, pastikan GPS menyala">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "4 / 3" }}>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy/70 text-white">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm">{busyMsg}</p>
              </div>
            )}
          </div>

          {error && camOpen && (
            <p className="flex items-center gap-1.5 text-sm text-brand-red">
              <ShieldAlert size={14} /> {error}
            </p>
          )}

          <div className="flex gap-2">
            <button className="btn-ghost flex-1 justify-center" onClick={closeCamera} disabled={busy}>
              <X size={16} /> Batal
            </button>
            {error && (
              <button className="btn-outline justify-center" onClick={openCamera} disabled={busy}>
                <RefreshCw size={16} /> Ulang
              </button>
            )}
            <button className="btn-primary flex-[2] justify-center" onClick={submit} disabled={busy}>
              <Camera size={16} /> Ambil Foto & Absen
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Sistem merekam titik koordinat, alamat, foto, dan waktu server. Lokasi di luar area kerja atau GPS palsu akan ditandai.
          </p>
        </div>
      </Modal>
    </Card>
  );
}
