import { cookies } from "next/headers";
import { PageHeader } from "@/components/ui";
import { employees as mockEmployees, clients } from "@/lib/data";
import { LiveAttendance } from "@/components/live-attendance";
import { AttendanceLog, type LogRow } from "@/components/attendance-log";
import { RecapSection } from "@/components/recap-section";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const MANAGE_ROLES = ["super_admin", "operation", "director"];

type SiteRow = { id: string; name: string; lat: number; lng: number; radius_m: number };

async function getData() {
  let empOptions = mockEmployees.filter((e) => e.status === "aktif").map((e) => ({ id: e.id, name: e.name }));
  let log: LogRow[] = [];
  let sites: SiteRow[] = [];
  let canDelete = false;
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const {
        data: { user },
      } = await sb.auth.getUser();
      const [{ data: emps }, { data: rows }, { data: siteRows }, prof] = await Promise.all([
        sb.from("employees").select("id,name").eq("status", "aktif").order("name"),
        sb.from("attendance").select("*").order("created_at", { ascending: false }).limit(50),
        sb.from("attendance_sites").select("id,name,lat,lng,radius_m"),
        user ? sb.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
      ]);
      const role = (prof.data as { role?: string } | null)?.role ?? "";
      if (emps) empOptions = emps.map((e) => ({ id: e.id, name: e.name }));
      let logRows = (rows as LogRow[]) ?? [];
      // Customer hanya melihat absensi karyawan kliennya
      if (role === "customer") {
        const allowed = new Set((emps ?? []).map((e) => e.id));
        logRows = logRows.filter((r) => !!r.employee_id && allowed.has(r.employee_id));
      }
      log = logRows;
      if (siteRows) sites = siteRows as SiteRow[];
      canDelete = MANAGE_ROLES.includes(role);
    } catch {
      /* fallback */
    }
  }
  return { empOptions, log, sites, canDelete };
}

export default async function AbsensiPage() {
  const { empOptions, log, sites, canDelete } = await getData();
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Absensi"
        subtitle="Alat absen karyawan berbasis GPS + selfie — masuk otomatis ke rekap"
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

      <AttendanceLog rows={log} canDelete={canDelete} />

      <RecapSection initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} />
    </>
  );
}
