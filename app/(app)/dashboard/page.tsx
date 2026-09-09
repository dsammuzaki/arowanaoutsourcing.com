import Link from "next/link";
import { Card, StatusPill, Avatar } from "@/components/ui";
import {
  Wallet,
  Users,
  Building2,
  Clock,
  CalendarDays,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  PartyPopper,
  Bell,
  CalendarClock,
  Package,
  ChartColumn,
  UserPlus,
  ChevronRight,
  Settings,
} from "lucide-react";
import {
  dashboardKpis,
  dashboardBirthdays,
  dashboardOnLeave,
  weeklyAttendance,
  leaveOverviewData,
  hiringTrend,
  payrollTrendMonthly,
  assetStatusData,
  candidatePipelineData,
  dashboardAnnouncements,
  dashboardMeetings,
  leaveApplications,
  candidates,
  employeeById,
  presentToday,
} from "@/lib/data";
import {
  WeeklyBars,
  AttendanceDonut,
  HiringBars,
  PayrollArea,
} from "@/components/charts";
import { rupiah, tanggal, initials } from "@/lib/format";

const k = dashboardKpis;

interface Tile {
  label: string;
  value: string;
  sub?: string;
  progress?: number;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  tint: string;
  up?: boolean;
}

const tiles: Tile[] = [
  {
    label: "Payroll Bulan Ini",
    value: rupiah(k.totalPayrollThisMonth, { compact: true }),
    sub: `${k.payrollRuns} batch selesai`,
    Icon: Wallet,
    href: "/payroll",
    tint: "teal",
  },
  {
    label: "Tenaga Kerja Aktif",
    value: String(k.totalEmployees),
    sub: `+${k.newThisMonth} bulan ini`,
    Icon: Users,
    href: "/karyawan",
    tint: "blue",
    up: true,
  },
  {
    label: "Klien",
    value: String(k.totalClients),
    sub: "4 jenis kontrak",
    Icon: Building2,
    href: "/invoice",
    tint: "emerald",
  },
  {
    label: "Tingkat Kehadiran",
    value: k.attendanceRate + "%",
    progress: k.attendanceRate,
    Icon: Clock,
    tint: "violet",
  },
  {
    label: "Cuti Pending",
    value: String(k.pendingLeaves),
    sub: `${k.onLeaveToday} cuti hari ini`,
    Icon: CalendarDays,
    href: "/cuti",
    tint: "amber",
  },
  {
    label: "Lowongan Aktif",
    value: String(k.activeJobs),
    sub: `+${k.jobsThisMonth} bulan ini`,
    Icon: Briefcase,
    href: "/rekrutmen",
    tint: "gold",
    up: true,
  },
];

const tintMap: Record<string, string> = {
  teal: "border-teal/30 bg-teal-soft/40 dark:bg-teal/10",
  blue: "border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/30",
  emerald: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
  violet: "border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30",
  amber: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
  gold: "border-gold/30 bg-gold-soft/50 dark:bg-gold/10",
};
const iconTint: Record<string, string> = {
  teal: "bg-teal/15 text-teal-dark dark:text-teal",
  blue: "bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
  gold: "bg-gold/15 text-gold-dark dark:text-gold-light",
};

function SectionCard({
  title,
  subtitle,
  href,
  children,
  accent = "border-border",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card className={`overflow-hidden ${accent}`}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:gap-1.5">
            Lihat semua <ChevronRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

function DonutCard({
  title,
  subtitle,
  Icon,
  data,
}: {
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon size={16} />
        </div>
      </div>
      <div className="flex items-center gap-4 p-5">
        <div className="w-1/2">
          <AttendanceDonut data={data} />
        </div>
        <div className="flex-1 space-y-2.5">
          {data.map((d) => (
            <div key={d.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                {d.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{d.value}</span>
                <span className="text-[10px] text-muted-foreground">
                  {total ? Math.round((d.value / total) * 100) : 0}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-navy px-6 py-6 text-white">
        <span className="hero-anim pointer-events-none absolute inset-0 opacity-45" />
        <span
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(420px circle at 15% 15%, rgba(230,196,110,0.5), transparent 60%), radial-gradient(420px circle at 85% 90%, rgba(26,125,156,0.5), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/60">Selamat datang kembali,</p>
            <h2 className="mt-0.5 text-2xl font-bold">Agus Hidayatulloh 👋</h2>
            <p className="mt-1 text-sm text-white/60">
              Berikut ringkasan operasional PT. Arowana Bintang Perdana hari ini.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-400" /> {presentToday} hadir hari ini
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Rekrutmen", Icon: Briefcase, href: "/rekrutmen" },
              { label: "Kandidat", Icon: UserPlus, href: "/rekrutmen" },
              { label: "Pengaturan", Icon: Settings, href: "/pengaturan" },
            ].map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-4 py-2.5 text-center transition-colors hover:bg-white/15"
              >
                <q.Icon size={18} className="text-teal-soft" />
                <span className="text-[11px] text-white/70">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => {
          const inner = (
            <div className={`h-full rounded-xl border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft ${tintMap[t.tint]}`}>
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${iconTint[t.tint]}`}>
                  <t.Icon size={20} />
                </div>
                {t.href && <ArrowUpRight size={16} className="text-muted-foreground/50" />}
              </div>
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t.value}</p>
              {t.progress != null ? (
                <div className="mt-2 h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10">
                  <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${t.progress}%` }} />
                </div>
              ) : (
                <p className="mt-1.5 flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  {t.up && <TrendingUp size={12} className="text-emerald-600" />}
                  {t.sub}
                </p>
              )}
            </div>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="group">
              {inner}
            </Link>
          ) : (
            <div key={t.label}>{inner}</div>
          );
        })}
      </div>

      {/* Birthdays + On leave */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Ulang Tahun Hari Ini" subtitle="Rayakan bersama tim">
          <div>
            {dashboardBirthdays.map((b) => (
              <div key={b.name} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
                <Avatar name={b.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.role}</p>
                </div>
                <PartyPopper size={16} className="ml-auto text-gold" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Cuti Hari Ini" subtitle="Tenaga kerja yang sedang cuti">
          <div>
            {dashboardOnLeave.map((l, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
                <Avatar name={l.name} tone="navy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{l.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.role}</p>
                </div>
                <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  {l.type}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Attendance + Leave overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-3.5">
            <h3 className="text-base font-semibold text-foreground">Kehadiran — 7 Hari Terakhir</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Hadir / cuti / alpha per hari</p>
          </div>
          <div className="p-4 pt-5">
            <WeeklyBars data={weeklyAttendance} />
            <div className="mt-3 flex items-center justify-center gap-4">
              {[
                { l: "Hadir", c: "#1a7d9c" },
                { l: "Cuti", c: "#c69a34" },
                { l: "Alpha", c: "#c0392b" },
              ].map((x) => (
                <span key={x.l} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: x.c }} /> {x.l}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <DonutCard
          title="Ringkasan Cuti"
          subtitle="Pengajuan bulan ini per status"
          Icon={CalendarDays}
          data={leaveOverviewData}
        />
      </div>

      {/* Hiring trend */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Tren Rekrutmen</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Jumlah rekrut per bulan — 2026</p>
          </div>
          <span className="badge bg-gold-soft/70 text-gold-dark">
            {hiringTrend.reduce((s, h) => s + h.hires, 0)} total
          </span>
        </div>
        <div className="p-4 pt-5">
          <HiringBars data={hiringTrend} />
        </div>
      </Card>

      {/* Payroll trend */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Tren Payroll</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Net pay per bulan — 2026 (juta Rupiah)</p>
          </div>
          <span className="badge bg-teal-soft/60 text-teal-deep">
            {rupiah(payrollTrendMonthly.reduce((s, p) => s + p.net, 0) * 1_000_000, { compact: true })}
          </span>
        </div>
        <div className="p-4 pt-5">
          <PayrollArea data={payrollTrendMonthly} />
        </div>
      </Card>

      {/* Recent leaves + candidates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Pengajuan Cuti Terbaru" subtitle="Permintaan cuti terakhir" href="/cuti">
          <div>
            {leaveApplications.slice(0, 5).map((l) => {
              const e = employeeById(l.employeeId);
              return (
                <div key={l.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
                  <Avatar name={e?.name ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{e?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.type} • {tanggal(l.start)}
                    </p>
                  </div>
                  <StatusPill status={l.status} />
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Kandidat Terbaru" subtitle="Pelamar terakhir di pipeline" href="/rekrutmen">
          <div>
            {candidates.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-soft text-xs font-bold text-gold-dark">
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.position} • {tanggal(c.appliedAt)}
                  </p>
                </div>
                <span className="badge bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400">
                  {c.stage}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Announcements + meetings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Pengumuman Terbaru" subtitle="Informasi terkini perusahaan">
          <div>
            {dashboardAnnouncements.map((a) => (
              <div key={a.title} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50">
                <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                  <Bell size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-foreground">{a.title}</p>
                    {a.urgent && (
                      <span className="shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-red dark:bg-red-950/40">
                        Penting
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.category} • {tanggal(a.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Jadwal Rapat" subtitle="Agenda mulai hari ini">
          <div>
            {dashboardMeetings.map((m) => (
              <div key={m.title} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
                <div className="rounded-xl bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                  <CalendarClock size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {tanggal(m.date)} • {m.time}
                  </p>
                </div>
                <StatusPill status={m.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Asset status + pipeline donuts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DonutCard title="Status Aset" subtitle="Distribusi berdasarkan status" Icon={Package} data={assetStatusData} />
        <DonutCard title="Pipeline Kandidat" subtitle="Kandidat per tahap" Icon={ChartColumn} data={candidatePipelineData} />
      </div>
    </div>
  );
}
