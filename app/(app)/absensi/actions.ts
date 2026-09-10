"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

// Ambang keamanan
const MAX_ACCURACY_M = 100; // GPS lebih buruk dari ini = tidak akurat
const MAX_POSITION_AGE_MS = 60_000; // posisi harus < 60 detik (anti replay)

export type AttendanceInput = {
  employeeId: string;
  employeeName: string;
  kind: "masuk" | "pulang";
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt?: string; // ISO waktu perangkat
  address?: string;
  selfie: string; // data URL image/jpeg
  userAgent?: string;
  clientFlags?: string[]; // sinyal anti-mock dari klien
};

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`,
      {
        headers: { "User-Agent": "ABP-Outsourcing-Attendance/1.0" },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { display_name?: string };
    return j.display_name ?? null;
  } catch {
    return null;
  }
}

export async function recordAttendance(
  input: AttendanceInput
): Promise<{
  ok: boolean;
  status?: string;
  address?: string | null;
  siteName?: string | null;
  distance?: number | null;
  error?: string;
}> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Silakan login ulang." };
  if (!hasAdmin()) return { ok: false, error: "Server belum dikonfigurasi (secret key)." };

  // --- Validasi dasar (server tidak percaya klien) ---
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  const acc = Number(input.accuracy);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return { ok: false, error: "Lokasi GPS tidak terbaca. Pastikan GPS menyala dan izinkan lokasi." };
  if (!input.selfie || !input.selfie.startsWith("data:image"))
    return { ok: false, error: "Foto selfie wajib diambil langsung." };
  if (!input.employeeId) return { ok: false, error: "Pilih karyawan terlebih dahulu." };

  const admin = createAdminClient();

  // --- Geofence: cari lokasi kerja terdekat ---
  const { data: sites } = await admin.from("attendance_sites").select("*");
  let nearest: { id: string; name: string; radius_m: number } | null = null;
  let nearestDist = Infinity;
  for (const s of sites ?? []) {
    const d = haversineMeters(lat, lng, Number(s.lat), Number(s.lng));
    if (d < nearestDist) {
      nearestDist = d;
      nearest = { id: s.id, name: s.name, radius_m: Number(s.radius_m) || 200 };
    }
  }

  // --- Penilaian keamanan (server-authoritative) ---
  const flags: string[] = [];
  let status = "valid";

  const capMs = input.capturedAt ? Date.parse(input.capturedAt) : Date.now();
  if (Number.isFinite(capMs) && Date.now() - capMs > MAX_POSITION_AGE_MS) {
    flags.push("posisi_kadaluarsa");
    status = "mencurigakan";
  }
  if (!Number.isFinite(acc) || acc <= 0) {
    flags.push("akurasi_tidak_wajar");
    status = "mencurigakan";
  } else if (acc > MAX_ACCURACY_M) {
    flags.push("akurasi_rendah");
    if (status === "valid") status = "akurasi_rendah";
  }
  for (const f of input.clientFlags ?? []) if (typeof f === "string") flags.push(f);
  if (flags.includes("geolokasi_dimodifikasi") || flags.includes("mock_terdeteksi")) status = "mencurigakan";

  if (!nearest || nearestDist > nearest.radius_m) {
    flags.push("diluar_area");
    if (status === "valid" || status === "akurasi_rendah") status = "diluar_area";
  }

  // --- Cegah duplikat (satu 'masuk' & satu 'pulang' per hari per karyawan, WIB) ---
  const nowJak = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const startJak = new Date(nowJak);
  startJak.setHours(0, 0, 0, 0);
  const startUtcIso = new Date(startJak.getTime() - 7 * 3600 * 1000).toISOString(); // WIB→UTC
  const { data: todays } = await admin
    .from("attendance")
    .select("kind")
    .eq("employee_id", input.employeeId)
    .gte("created_at", startUtcIso);
  const already = (todays ?? []).some((t) => t.kind === input.kind);
  if (already)
    return {
      ok: false,
      error: input.kind === "masuk" ? "Karyawan sudah absen masuk hari ini." : "Karyawan sudah absen pulang hari ini.",
    };
  if (input.kind === "pulang" && !(todays ?? []).some((t) => t.kind === "masuk"))
    return { ok: false, error: "Belum ada absen masuk hari ini." };

  // --- Upload selfie ke storage (bucket privat 'absensi') ---
  let selfieUrl: string | null = null;
  try {
    await admin.storage.createBucket("absensi", { public: true }).catch(() => {});
    const b64 = input.selfie.split(",").pop() ?? "";
    const buf = Buffer.from(b64, "base64");
    if (buf.length > 6_000_000) return { ok: false, error: "Ukuran foto terlalu besar." };
    const path = `${input.employeeId}/${Date.now()}.jpg`;
    const { error: upErr } = await admin.storage
      .from("absensi")
      .upload(path, buf, { contentType: "image/jpeg", upsert: true });
    if (!upErr) selfieUrl = admin.storage.from("absensi").getPublicUrl(path).data.publicUrl;
  } catch {
    /* foto gagal — absensi tetap dicatat */
  }

  // --- Alamat lengkap (dari klien; bila kosong, coba dari server) ---
  let address = input.address?.trim() || null;
  if (!address) address = await reverseGeocode(lat, lng);

  const { error } = await admin.from("attendance").insert({
    employee_id: input.employeeId,
    employee_name: input.employeeName || null,
    recorded_by: user.id,
    kind: input.kind === "pulang" ? "pulang" : "masuk",
    captured_at: input.capturedAt || null,
    lat,
    lng,
    accuracy: Number.isFinite(acc) ? acc : null,
    address,
    selfie_url: selfieUrl,
    site_id: nearest?.id ?? null,
    distance_m: Number.isFinite(nearestDist) ? Math.round(nearestDist) : null,
    status,
    flags,
    user_agent: input.userAgent || null,
  });
  if (error) {
    if (/relation .* does not exist/i.test(error.message))
      return { ok: false, error: "Tabel absensi belum dibuat. Jalankan supabase/schema-3.sql dulu." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/absensi");
  return {
    ok: true,
    status,
    address,
    siteName: nearest?.name ?? null,
    distance: Number.isFinite(nearestDist) ? Math.round(nearestDist) : null,
  };
}
