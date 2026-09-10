import { cookies } from "next/headers";
import { PageHeader, Card } from "@/components/ui";
import { Clock, CheckCircle2, XCircle, CalendarRange } from "lucide-react";
import { AjukanCutiButton, LeaveTable, type LeaveRow } from "@/components/cuti-ui";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { leaveApplications as mockLeaves, employeeById, employees as mockEmployees, leaveBalances } from "@/lib/data";

async function getData(): Promise<{ rows: LeaveRow[]; employees: { id: string; name: string }[] }> {
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const [{ data: leaves }, { data: emps }] = await Promise.all([
        sb
          .from("leave_applications")
          .select("id,type,start_date,end_date,days,reason,status,employees(name)")
          .order("start_date", { ascending: false }),
        sb.from("employees").select("id,name").order("name"),
      ]);
      if (leaves && emps) {
        const rows: LeaveRow[] = leaves.map((l) => {
          const emp = l.employees as { name?: string } | { name?: string }[] | null;
          const name = Array.isArray(emp) ? emp[0]?.name : emp?.name;
          return {
            id: String(l.id),
            employee_name: name ?? "-",
            type: l.type ?? "-",
            start_date: l.start_date,
            end_date: l.end_date,
            days: l.days ?? 1,
            reason: l.reason ?? "",
            status: l.status ?? "pending",
          };
        });
        return { rows, employees: emps };
      }
    } catch {
      /* fallback */
    }
  }
  const rows: LeaveRow[] = mockLeaves.map((l) => ({
    id: l.id,
    employee_name: employeeById(l.employeeId)?.name ?? "-",
    type: l.type,
    start_date: l.start,
    end_date: l.end,
    days: l.days,
    reason: l.reason,
    status: l.status,
  }));
  return { rows, employees: mockEmployees.filter((e) => e.status === "aktif").map((e) => ({ id: e.id, name: e.name })) };
}

export default async function CutiPage() {
  const { rows, employees } = await getData();
  const stat = {
    pending: rows.filter((r) => r.status === "pending").length,
    disetujui: rows.filter((r) => r.status === "disetujui").length,
    ditolak: rows.filter((r) => r.status === "ditolak").length,
    totalHari: rows.reduce((s, r) => s + r.days, 0),
  };
  const stats = [
    { label: "Menunggu Persetujuan", value: stat.pending, Icon: Clock, tone: "amber" },
    { label: "Disetujui", value: stat.disetujui, Icon: CheckCircle2, tone: "teal" },
    { label: "Ditolak", value: stat.ditolak, Icon: XCircle, tone: "red" },
    { label: "Total Hari Cuti", value: stat.totalHari, Icon: CalendarRange, tone: "navy" },
  ];

  return (
    <>
      <PageHeader
        title="Manajemen Cuti"
        subtitle="Pengajuan cuti/izin, persetujuan, dan saldo cuti karyawan"
        actions={<AjukanCutiButton employees={employees} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                s.tone === "red"
                  ? "bg-red-50 text-brand-red dark:bg-red-950/40"
                  : s.tone === "amber"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  : s.tone === "navy"
                  ? "bg-navy/10 text-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <s.Icon size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Pengajuan Cuti</h2>
          </div>
          <LeaveTable rows={rows} />
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Saldo Cuti Tahunan</h2>
            <p className="text-xs text-muted-foreground">Kuota 12 hari / tahun</p>
          </div>
          <div className="divide-y divide-border">
            {leaveBalances.map((b) => (
              <div key={b.employee.id} className="px-5 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{b.employee.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {b.remaining}/{b.quota} sisa
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${(b.used / b.quota) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
