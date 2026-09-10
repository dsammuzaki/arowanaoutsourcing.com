import { PageHeader, Card, StatusPill } from "@/components/ui";
import { Gauge, Target, ClipboardCheck, Award } from "lucide-react";
import {
  goals,
  reviewCycles,
  kpiIndicators,
  awards,
  kinerjaStats,
  employeeById,
  employees,
} from "@/lib/data";
import { KinerjaGoals, type GoalDTO } from "@/components/kinerja-goals";

function scoreTone(v: number) {
  if (v >= 85) return "text-emerald-600";
  if (v >= 70) return "text-amber-600";
  return "text-brand-red";
}
function barColor(v: number) {
  if (v >= 85) return "#1a7d9c";
  if (v >= 60) return "#c69a34";
  return "#c0392b";
}

const goalDtos: GoalDTO[] = goals.map((g) => ({
  id: g.id,
  title: g.title,
  employeeName: employeeById(g.employeeId)?.name ?? "?",
  due: g.due,
  progress: g.progress,
}));
const empNames = employees.filter((e) => e.status === "aktif").map((e) => e.name);

export default function KinerjaPage() {
  const stats = [
    { label: "Skor KPI Rata-rata", value: kinerjaStats.skorRata, Icon: Gauge, suffix: "" },
    { label: "Goal Aktif", value: kinerjaStats.goalAktif, Icon: Target, suffix: "" },
    { label: "Goal Selesai", value: kinerjaStats.goalSelesai, Icon: ClipboardCheck, suffix: "" },
    { label: "Review Berjalan", value: kinerjaStats.reviewBerjalan, Icon: Award, suffix: "" },
  ];
  return (
    <>
      <PageHeader
        title="Kinerja & KPI"
        subtitle="Goal karyawan, siklus review, indikator KPI, dan penghargaan"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* KPI indicators */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold text-foreground">Indikator KPI</h2>
          <div className="space-y-4">
            {kpiIndicators.map((k) => (
              <div key={k.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {k.name}{" "}
                    <span className="ml-1 text-xs text-muted-foreground">· bobot {k.weight}%</span>
                  </span>
                  <span className={`font-bold ${scoreTone(k.score)}`}>{k.score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${k.score}%`, background: barColor(k.score) }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
            <span className="text-sm font-semibold text-primary">Skor KPI Tertimbang</span>
            <span className="text-xl font-bold text-foreground">{kinerjaStats.skorRata}/100</span>
          </div>
        </Card>

        {/* Review cycles */}
        <Card className="p-5">
          <h2 className="mb-4 font-bold text-foreground">Siklus Review</h2>
          <div className="space-y-4">
            {reviewCycles.map((r) => (
              <div key={r.name} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{r.name}</span>
                  <StatusPill status={r.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.period}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${r.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Goals */}
        <Card className="overflow-hidden lg:col-span-2">
          <KinerjaGoals goals={goalDtos} employees={empNames} />
        </Card>

        {/* Awards */}
        <Card className="p-5">
          <h2 className="mb-4 font-bold text-foreground">Penghargaan Bulan Ini</h2>
          <div className="space-y-3">
            {awards.map((a) => (
              <div key={a.award} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-gold-dark">
                  <Award size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{a.award}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.employee.name}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
