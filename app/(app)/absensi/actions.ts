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
        headers: { "User-Agent": "BSU-Outsourcing-Attendance/1.0" },
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

const MANAGE_ROLES = ["super_admin", "operation", "director"];

export async function deleteAttendance(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!MANAGE_ROLES.includes(p?.role ?? ""))
    return { ok: false, error: "Hanya Super Admin / Operation / Director yang boleh menghapus absensi." };
  if (!hasAdmin()) return { ok: false, error: "Server belum dikonfigurasi." };

  const admin = createAdminClient();
  // hapus foto selfie (best-effort)
  try {
    const { data: row } = await admin.from("attendance").select("selfie_url").eq("id", id).single();
    const url: string | undefined = row?.selfie_url ?? undefined;
    if (url) {
      const marker = "/absensi/";
      const idx = url.indexOf(marker);
      if (idx >= 0) await admin.storage.from("absensi").remove([url.slice(idx + marker.length)]);
    }
  } catch {
    /* abaikan */
  }
  const { error } = await admin.from("attendance").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/absensi");
  return { ok: true };
}

// ---- Rekap harian per bulan (dari absen nyata + cuti disetujui) ----
export type RecapCell = "" | "H" | "I" | "S" | "C";
export type RecapRow = { id: string; name: string; position: string; cells: RecapCell[] };
export type RecapResult = {
  ok: boolean;
  error?: string;
  days: number;
  rows: RecapRow[];
  counts: { H: number; I: number; S: number; C: number };
};

function leaveCode(type: string | null): RecapCell {
  const t = (type ?? "").toLowerCase();
  if (t.includes("sakit")) return "S";
  if (t.includes("izin")) return "I";
  return "C"; // Tahunan / Penting / Melahirkan / lainnya
}

export async function getMonthlyRecap(year: number, month: number): Promise<RecapResult> {
  const empty = { ok: false, days: 30, rows: [], counts: { H: 0, I: 0, S: 0, C: 0 } };
  if (!isSupabaseConfigured()) return { ...empty, error: "Supabase belum aktif." };
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...empty, error: "Sesi habis." };

  const sb = hasAdmin() ? createAdminClient() : supabase;
  const daysInMonth = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, "0");
  const firstDay = `${year}-${mm}-01`;
  const lastDay = `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}`;
  const startIso = `${year}-${mm}-01T00:00:00+07:00`;
  const end = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const endIso = `${end.y}-${String(end.m).padStart(2, "0")}-01T00:00:00+07:00`;

  const [{ data: emps }, { data: att }, { data: leaves }] = await Promise.all([
    sb.from("employees").select("id,name,position").eq("status", "aktif").order("name").limit(80),
    sb.from("attendance").select("employee_id,created_at,kind").eq("kind", "masuk").gte("created_at", startIso).lt("created_at", endIso),
    sb.from("leave_applications").select("employee_id,type,start_date,end_date,status").lte("start_date", lastDay).gte("end_date", firstDay),
  ]);

  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
  const presence: Record<string, Set<number>> = {};
  for (const a of att ?? []) {
    if (!a.employee_id) continue;
    const s = fmt.format(new Date(a.created_at as string)); // YYYY-MM-DD (WIB)
    if (s.slice(0, 7) !== `${year}-${mm}`) continue;
    const day = Number(s.slice(8, 10));
    (presence[a.employee_id] ||= new Set()).add(day);
  }

  const leaveMap: Record<string, Record<number, RecapCell>> = {};
  for (const l of leaves ?? []) {
    if (!l.employee_id) continue;
    const st = String(l.status ?? "").toLowerCase();
    if (st === "ditolak" || st === "pending") continue; // hanya cuti disetujui
    const code = leaveCode(l.type as string | null);
    const s = new Date(l.start_date as string);
    const e = new Date(l.end_date as string);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        (leaveMap[l.employee_id] ||= {})[d.getDate()] = code;
      }
    }
  }

  const counts = { H: 0, I: 0, S: 0, C: 0 };
  const rows: RecapRow[] = (emps ?? []).map((e) => {
    const cells: RecapCell[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      let cell: RecapCell = "";
      if (presence[e.id]?.has(day)) cell = "H";
      else if (leaveMap[e.id]?.[day]) cell = leaveMap[e.id][day];
      cells.push(cell);
      if (cell) counts[cell as "H" | "I" | "S" | "C"]++;
    }
    return { id: e.id, name: e.name, position: e.position ?? "", cells };
  });

  return { ok: true, days: daysInMonth, rows, counts };
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

  const tableMissing = (msg?: string) =>
    !!msg && /schema cache|does not exist|could not find the table|PGRST205/i.test(msg);

  // --- Geofence: cari lokasi kerja terdekat ---
  const { data: sites, error: sitesErr } = await admin.from("attendance_sites").select("*");
  if (tableMissing(sitesErr?.message))
    return {
      ok: false,
      error: "Database absensi belum disiapkan. Jalankan skema SQL (attendance_sites & attendance) di Supabase terlebih dahulu.",
    };
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
    if (tableMissing(error.message))
      return {
        ok: false,
        error: "Database absensi belum disiapkan. Jalankan skema SQL (attendance_sites & attendance) di Supabase terlebih dahulu.",
      };
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
