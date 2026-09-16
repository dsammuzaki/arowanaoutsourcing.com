"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Logo } from "./logo";
import { createClient } from "@/utils/supabase/client";
import { OnboardingQuest } from "./onboarding-quest";
import { NotificationsBell, type NotifItem } from "./notifications-bell";
import { GlobalSearch, type SearchItem } from "./global-search";
import { UserMenu } from "./user-menu";
import { PageTransition } from "./page-transition";
import { ChatWidget } from "./chat-widget";
import type { Member as ChatMember } from "./chat-client";

export type ShellUser = { email: string; name: string; role: string } | null;

// Role terbatas: hanya boleh melihat halaman tertentu
const ROLE_PAGES: Record<string, string[]> = {
  hr_pic: ["/dashboard", "/tutorial", "/karyawan", "/absensi", "/proyek", "/chat"],
  customer: ["/dashboard", "/tutorial", "/absensi", "/karyawan", "/bpjs", "/payroll", "/chat"],
};
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  Banknote,
  FileText,
  Settings,
  UserPlus,
  CalendarDays,
  Target,
  FileClock,
  Info,
  SquareKanban,
  ShieldCheck,
  HeartPulse,
  ClipboardCheck,
  History,
  Building2,
  BookOpen,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; Icon: LucideIcon; roles?: string[] };
type NavSection = { group: string; items: NavItem[] };

const nav: NavSection[] = [
  {
    group: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { href: "/tutorial", label: "Panduan", Icon: BookOpen },
    ],
  },
  {
    group: "Operasional",
    items: [
      { href: "/karyawan", label: "Data Karyawan", Icon: Users },
      { href: "/pelanggan", label: "Data Pelanggan", Icon: Building2, roles: ["super_admin", "operation", "director"] },
      { href: "/absensi", label: "Absensi", Icon: CalendarCheck },
    ],
  },
  {
    group: "SDM",
    items: [
      { href: "/rekrutmen", label: "Rekrutmen", Icon: UserPlus },
      { href: "/kontrak", label: "Monitoring Kontrak", Icon: FileClock },
      { href: "/proyek", label: "Task", Icon: SquareKanban },
      { href: "/cuti", label: "Manajemen Cuti", Icon: CalendarDays },
      { href: "/kinerja", label: "Kinerja & KPI", Icon: Target },
    ],
  },
  {
    group: "Keuangan",
    items: [
      { href: "/payroll", label: "Payroll & Slip Gaji", Icon: Wallet },
      { href: "/pencairan", label: "Pencairan Gaji", Icon: Banknote },
      { href: "/bpjs", label: "BPJS", Icon: HeartPulse },
      { href: "/invoice", label: "Invoice Klien", Icon: FileText },
    ],
  },
  {
    group: "Sistem",
    items: [
      { href: "/akun", label: "Manajemen Akun", Icon: ShieldCheck, roles: ["super_admin"] },
      { href: "/persetujuan", label: "Persetujuan", Icon: ClipboardCheck, roles: ["super_admin", "operation", "director"] },
      { href: "/audit", label: "Log Aktivitas", Icon: History, roles: ["super_admin", "director"] },
      { href: "/about", label: "Tentang BSU", Icon: Info },
      { href: "/pengaturan", label: "Pengaturan", Icon: Settings },
    ],
  },
];

function NavLinks({
  pathname,
  role,
  onNavigate,
}: {
  pathname: string;
  role?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {nav.map((section) => {
        const allowed = role ? ROLE_PAGES[role] : undefined;
        const items = section.items.filter((it) => {
          if (it.roles) return role ? it.roles.includes(role) : false; // gate eksplisit (akun, persetujuan)
          if (allowed) return allowed.includes(it.href); // role terbatas: hanya allowlist
          return true; // role penuh: semua
        });
        if (items.length === 0) return null;
        return (
        <div key={section.group}>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
            {section.group}
          </p>
          <div className="space-y-1">
            {items.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-teal to-teal-dark text-white shadow-[0_8px_20px_-6px_rgba(26,125,156,0.65)]"
                      : "text-white/60 hover:translate-x-0.5 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {active && (
                    <span className="absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gold-light shadow-[0_0_8px_rgba(230,196,110,0.7)]" />
                  )}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white/[0.05] text-white/55 group-hover:bg-white/10 group-hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  role,
  onNavigate,
  onLogout,
}: {
  role?: string;
  onNavigate?: () => void;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="safe-top relative flex h-full flex-col overflow-hidden bg-sidebar">
      {/* Cahaya latar (teal atas, emas bawah) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(560px circle at 50% -8%, rgba(26,125,156,0.30), transparent 60%), radial-gradient(420px circle at 50% 112%, rgba(198,154,52,0.14), transparent 55%)",
        }}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      <div className="relative flex h-full flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="relative">
            <span className="absolute -inset-2 rounded-full bg-teal/25 blur-lg" />
            <Logo size={40} className="relative" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="whitespace-nowrap text-[12px] font-bold leading-tight tracking-tight text-white">
              Barata Sakti Utama
            </p>
            <p className="whitespace-nowrap text-[10px] font-medium tracking-wide text-teal-soft/80">
              Outsourcing System
            </p>
          </div>
        </div>
        <div className="mx-4 mb-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <NavLinks pathname={pathname} role={role} onNavigate={onNavigate} />

        {/* Footer */}
        <div className="mt-auto p-3">
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/5">
            <span className="pulse-dot h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-white/55">Sistem aktif · BSU v1.0</span>
          </div>
          <button
            onClick={onLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-brand-red/15 hover:text-white"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] transition-colors group-hover:bg-brand-red/30">
              <LogOut size={16} />
            </span>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Dock navigasi bawah (mobile) — pola aplikasi native ----
const DOCK_ORDER = ["/dashboard", "/proyek", "/karyawan", "/absensi", "/payroll", "/kontrak"];

function MobileDock({ role, onOpenMenu }: { role?: string; onOpenMenu: () => void }) {
  const pathname = usePathname();
  const byHref = new Map<string, NavItem>();
  nav.forEach((s) => s.items.forEach((it) => byHref.set(it.href, it)));

  const allowed = role ? ROLE_PAGES[role] : undefined;
  const items = DOCK_ORDER.map((href) => byHref.get(href))
    .filter((it): it is NavItem => {
      if (!it) return false;
      if (it.roles) return role ? it.roles.includes(role) : false;
      if (allowed) return allowed.includes(it.href);
      return true;
    })
    .slice(0, 4);

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/85 backdrop-blur-xl lg:hidden"
      aria-label="Navigasi cepat"
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 pb-1.5 pt-2 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground active:bg-muted"
              }`}
            >
              {active && (
                <span className="absolute -top-1 h-0.5 w-8 rounded-full bg-primary" />
              )}
              <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={onOpenMenu}
          aria-label="Buka semua menu"
          className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 pb-1.5 pt-2 text-[10px] font-medium text-muted-foreground transition-colors active:bg-muted"
        >
          <Menu size={21} strokeWidth={1.9} />
          <span className="w-full truncate text-center">Menu</span>
        </button>
      </div>
    </nav>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
      aria-label="Ganti tema"
    >
      {mounted ? dark ? <Sun size={20} /> : <Moon size={20} /> : <span className="block h-5 w-5" />}
    </button>
  );
}

export function AppShell({
  children,
  user,
  searchIndex = [],
  notifs = [],
  chat,
}: {
  children: React.ReactNode;
  user?: ShellUser;
  searchIndex?: SearchItem[];
  notifs?: NotifItem[];
  chat?: { me: { id: string; name: string }; members: ChatMember[]; dbReady: boolean };
}) {
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        await createClient().auth.signOut();
      } catch {}
    }
    window.location.href = "/";
  }

  const displayName = user?.name || "Pengguna";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed h-screen w-64">
          <SidebarInner role={user?.role} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/70" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <SidebarInner role={user?.role} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.25rem+var(--safe-bottom))] lg:pb-0">
        {/* Topbar */}
        <header className="safe-top sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
            <button
              className="-ml-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted active:bg-muted lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={20} />
            </button>
            <GlobalSearch index={searchIndex} className="hidden max-w-md flex-1 sm:block" />
            <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
              <ThemeToggle />
              <NotificationsBell items={notifs} />
              <UserMenu name={displayName} email={user?.email ?? ""} role={user?.role ?? ""} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        <main className="w-full flex-1 overflow-x-clip px-4 py-6 sm:px-6 lg:px-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <footer className="border-t border-border bg-card/60 px-4 py-4 sm:px-6 lg:px-8 lg:pb-[calc(1rem+var(--safe-bottom))]">
          <div className="flex w-full flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-2">
              <Logo size={22} />
              <span className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} <span className="font-semibold text-foreground">PT. Barata Sakti Utama</span>. Hak cipta dilindungi.
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Sistem Manajemen Outsourcing · BSU</span>
          </div>
        </footer>
      </div>

      <MobileDock role={user?.role} onOpenMenu={() => setOpen(true)} />

      {chat && <ChatWidget me={chat.me} members={chat.members} dbReady={chat.dbReady} />}

      <OnboardingQuest />
    </div>
  );
}
